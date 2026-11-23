//! FIFO admission for this process's SnapshotStore writers, before SQLite begins.
//! SQLite still arbitrates external writers. No SQL operation is retried.
use std::collections::VecDeque;
use std::sync::{Arc, Condvar, Mutex, OnceLock, Weak};
use std::time::{Duration, Instant};

#[derive(Default)]
struct State {
    active: bool,
    waiting: VecDeque<Arc<()>>,
}
#[derive(Default)]
pub(crate) struct Admission {
    state: Mutex<State>,
    changed: Condvar,
}
pub(crate) struct Permit<'a>(&'a Admission);
fn busy(message: &str) -> rusqlite::Error {
    rusqlite::Error::SqliteFailure(
        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_BUSY),
        Some(message.into()),
    )
}
impl Admission {
    pub(crate) fn enter(&self) -> rusqlite::Result<Permit<'_>> {
        self.enter_for(Duration::from_secs(5))
    }
    fn enter_for(&self, budget: Duration) -> rusqlite::Result<Permit<'_>> {
        let deadline = Instant::now() + budget;
        let ticket = Arc::new(());
        // No caller code runs under this mutex. Recovering poison only restores
        // queue bookkeeping; SQLite transactions are always outside this lock.
        let mut state = self.state.lock().unwrap_or_else(|e| e.into_inner());
        if state.waiting.len() >= 256 {
            return Err(busy("snapshot writer admission queue full"));
        }
        state.waiting.push_back(ticket.clone());
        let mut waited = false;
        loop {
            // A wakeup must not turn an expired wait into a successful grant.
            // An uncontended zero-budget call still acts as a nonblocking try.
            if waited && Instant::now() >= deadline {
                state.waiting.retain(|t| !Arc::ptr_eq(t, &ticket));
                self.changed.notify_all();
                return Err(busy(
                    "snapshot writer admission timed out before transaction",
                ));
            }
            if !state.active
                && state
                    .waiting
                    .front()
                    .is_some_and(|t| Arc::ptr_eq(t, &ticket))
            {
                state.waiting.pop_front();
                state.active = true;
                return Ok(Permit(self));
            }
            let remaining = deadline.saturating_duration_since(Instant::now());
            if remaining.is_zero() {
                state.waiting.retain(|t| !Arc::ptr_eq(t, &ticket));
                self.changed.notify_all();
                return Err(busy(
                    "snapshot writer admission timed out before transaction",
                ));
            }
            waited = true;
            state = self
                .changed
                .wait_timeout(state, remaining)
                .unwrap_or_else(|e| e.into_inner())
                .0;
        }
    }
}
impl Drop for Permit<'_> {
    fn drop(&mut self) {
        self.0
            .state
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .active = false;
        self.0.changed.notify_all();
    }
}
// Do not open a second file descriptor for identity: closing any descriptor for
// a SQLite file can release this process's POSIX record locks.
#[cfg(unix)]
type Identity = (u64, u64);
#[cfg(not(unix))]
type Identity = std::path::PathBuf;
fn identity(path: &str) -> std::io::Result<Identity> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let metadata = std::fs::metadata(path)?;
        Ok((metadata.dev(), metadata.ino()))
    }
    #[cfg(not(unix))]
    {
        std::fs::canonicalize(path)
    }
}
type Registry = Vec<(Identity, Weak<Admission>)>;
pub(crate) fn for_connection(c: &rusqlite::Connection) -> rusqlite::Result<Arc<Admission>> {
    let Some(path) = c.path().filter(|p| !p.is_empty()) else {
        return Ok(Arc::new(Admission::default()));
    };
    let handle = identity(path).map_err(|_| rusqlite::Error::InvalidPath(path.into()))?;
    static REGISTRY: OnceLock<Mutex<Registry>> = OnceLock::new();
    let mut registry = REGISTRY
        .get_or_init(Mutex::default)
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    registry.retain(|(_, gate)| gate.strong_count() > 0);
    for (identity, gate) in registry.iter() {
        if identity == &handle
            && let Some(gate) = gate.upgrade()
        {
            return Ok(gate);
        }
    }
    let gate = Arc::new(Admission::default());
    registry.push((handle, Arc::downgrade(&gate)));
    Ok(gate)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn timeout_removes_ticket_and_panic_releases_permit() {
        let gate = Admission::default();
        let held = gate.enter().unwrap();
        assert!(gate.enter_for(Duration::from_millis(10)).is_err());
        assert!(gate.state.lock().unwrap().waiting.is_empty());
        drop(held);
        let panic = std::panic::catch_unwind(|| {
            let _permit = gate.enter().unwrap();
            panic!("synthetic owner panic");
        });
        assert!(panic.is_err());
        assert!(gate.enter().is_ok());
    }
    #[test]
    fn expired_waiter_is_not_admitted_when_owner_releases_late() {
        let gate = Arc::new(Admission::default());
        let held = gate.enter().unwrap();
        std::thread::scope(|scope| {
            let waiting = gate.clone();
            let worker =
                scope.spawn(move || waiting.enter_for(Duration::from_millis(500)).is_err());
            let watchdog = Instant::now() + Duration::from_secs(5);
            loop {
                let state = gate.state.lock().unwrap();
                if !state.waiting.is_empty() {
                    // Prevent the timed-out waiter reacquiring bookkeeping until
                    // after both its deadline and a simulated owner release.
                    let mut state = state;
                    std::thread::sleep(Duration::from_millis(700));
                    state.active = false;
                    gate.changed.notify_all();
                    drop(state);
                    break;
                }
                drop(state);
                assert!(Instant::now() < watchdog);
                std::thread::yield_now();
            }
            assert!(worker.join().unwrap());
            assert!(gate.state.lock().unwrap().waiting.is_empty());
        });
        drop(held);
        assert!(gate.enter_for(Duration::ZERO).is_ok());
    }
    #[test]
    fn queued_writer_precedes_previous_owner_reentry() {
        let gate = Arc::new(Admission::default());
        let held = gate.enter().unwrap();
        std::thread::scope(|scope| {
            let waiting = gate.clone();
            let (tx, rx) = std::sync::mpsc::channel();
            scope.spawn(move || {
                let _permit = waiting.enter().unwrap();
                tx.send(()).unwrap();
            });
            let deadline = Instant::now() + Duration::from_secs(2);
            while gate.state.lock().unwrap().waiting.is_empty() {
                assert!(Instant::now() < deadline);
                std::thread::yield_now();
            }
            drop(held);
            let _reentry = gate.enter().unwrap();
            rx.try_recv().unwrap();
        });
    }
    #[cfg(unix)]
    #[test]
    fn external_lock_probe() {
        let Some(path) = std::env::var_os("ATHENA_ADMISSION_LOCK_PROBE") else {
            return;
        };
        let connection = rusqlite::Connection::open(path).unwrap();
        connection.busy_timeout(Duration::ZERO).unwrap();
        let error = connection.execute_batch("BEGIN IMMEDIATE").unwrap_err();
        assert_eq!(
            error.sqlite_error_code(),
            Some(rusqlite::ErrorCode::DatabaseBusy)
        );
    }
    #[cfg(unix)]
    #[test]
    fn identity_lookup_preserves_external_sqlite_lock() {
        let path = std::env::temp_dir().join(format!(
            "snapshot-admission-lock-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        {
            let connection = rusqlite::Connection::open(&path).unwrap();
            connection
                .execute_batch("CREATE TABLE fixture(value); BEGIN IMMEDIATE")
                .unwrap();
            let first = for_connection(&connection).unwrap();
            let second = for_connection(&connection).unwrap();
            assert!(Arc::ptr_eq(&first, &second));
            // A fresh process must still observe the original SQLite write lock.
            let status = std::process::Command::new(std::env::current_exe().unwrap())
                .args(["--exact", "snapshot_admission::tests::external_lock_probe"])
                .env("ATHENA_ADMISSION_LOCK_PROBE", &path)
                .status()
                .unwrap();
            assert!(status.success());
            connection.execute_batch("ROLLBACK").unwrap();
        }
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn queue_capacity_rejects_without_adding_a_ticket() {
        let gate = Admission::default();
        let held = gate.enter().unwrap();
        gate.state.lock().unwrap().waiting = (0..256).map(|_| Arc::new(())).collect();
        let error = gate.enter_for(Duration::ZERO).err().unwrap();
        assert_eq!(
            error.sqlite_error_code(),
            Some(rusqlite::ErrorCode::DatabaseBusy)
        );
        assert_eq!(gate.state.lock().unwrap().waiting.len(), 256);
        gate.state.lock().unwrap().waiting.clear();
        drop(held);
        assert!(gate.enter_for(Duration::ZERO).is_ok());
    }
    #[test]
    fn same_file_connections_share_gate_but_other_files_do_not() {
        let root = std::env::temp_dir().join(format!(
            "snapshot-admission-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&root).unwrap();
        {
            let a = rusqlite::Connection::open(root.join("a.sqlite")).unwrap();
            let b = rusqlite::Connection::open(root.join("a.sqlite")).unwrap();
            let c = rusqlite::Connection::open(root.join("b.sqlite")).unwrap();
            let first = for_connection(&a).unwrap();
            assert!(Arc::ptr_eq(&first, &for_connection(&b).unwrap()));
            assert!(!Arc::ptr_eq(&first, &for_connection(&c).unwrap()));
        }
        std::fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn unrelated_databases_and_private_memory_do_not_share_gates() {
        let a = rusqlite::Connection::open_in_memory().unwrap();
        let b = rusqlite::Connection::open_in_memory().unwrap();
        let first = for_connection(&a).unwrap();
        let second = for_connection(&b).unwrap();
        let _held = first.enter().unwrap();
        assert!(second.enter_for(Duration::ZERO).is_ok());
    }
}
