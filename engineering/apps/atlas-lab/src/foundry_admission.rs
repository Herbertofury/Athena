//! Process-local FIFO admission; SQLite remains the cross-process lock authority.
use rusqlite::Connection;
use std::{
    cell::Cell,
    collections::{HashMap, VecDeque},
    path::PathBuf,
    sync::{Arc, Condvar, Mutex, OnceLock, Weak},
    time::{Duration, Instant},
};

const MAX_WAITERS: usize = 64;
#[derive(Default)]
struct State {
    held: bool,
    queue: VecDeque<Arc<()>>,
}
#[derive(Default)]
pub(super) struct Gate {
    state: Mutex<State>,
    changed: Condvar,
}
type Registry = HashMap<PathBuf, Weak<Gate>>;
static REGISTRY: OnceLock<Mutex<Registry>> = OnceLock::new();
fn failure(message: &str) -> rusqlite::Error {
    rusqlite::Error::SqliteFailure(
        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_BUSY),
        Some(message.into()),
    )
}
pub(super) fn for_connection(connection: &Connection) -> rusqlite::Result<Arc<Gate>> {
    let path = connection.path().unwrap_or("");
    if path.is_empty() {
        return Ok(Arc::new(Gate::default()));
    }
    // Open first: relative paths and symlinks resolve even for newly created DBs.
    let key = std::fs::canonicalize(path)
        .map_err(|_| rusqlite::Error::InvalidPath(PathBuf::from(path)))?;
    let mut registry = REGISTRY
        .get_or_init(Mutex::default)
        .lock()
        .map_err(|_| failure("Foundry admission registry poisoned"))?;
    registry.retain(|_, gate| gate.strong_count() != 0);
    if let Some(gate) = registry.get(&key).and_then(Weak::upgrade) {
        return Ok(gate);
    }
    let gate = Arc::new(Gate::default());
    registry.insert(key, Arc::downgrade(&gate));
    Ok(gate)
}
impl Gate {
    #[cfg(test)]
    pub(super) fn waiting(&self) -> usize {
        self.state.lock().unwrap().queue.len()
    }

    pub(super) fn enter(self: &Arc<Self>, deadline: Instant) -> rusqlite::Result<Permit> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| failure("Foundry admission gate poisoned"))?;
        // Zero timeout still permits an uncontended operation, like SQLite.
        if !state.held && state.queue.is_empty() {
            state.held = true;
            return Ok(Permit(self.clone()));
        }
        if state.queue.len() >= MAX_WAITERS {
            return Err(failure("Foundry write admission queue full"));
        }
        let ticket = Arc::new(());
        state.queue.push_back(ticket.clone());
        loop {
            let remaining = deadline.saturating_duration_since(Instant::now());
            if remaining.is_zero() {
                state.queue.retain(|entry| !Arc::ptr_eq(entry, &ticket));
                self.changed.notify_all();
                return Err(failure("Foundry write admission timed out"));
            }
            if !state.held
                && state
                    .queue
                    .front()
                    .is_some_and(|front| Arc::ptr_eq(front, &ticket))
            {
                state.queue.pop_front();
                state.held = true;
                return Ok(Permit(self.clone()));
            }
            state = self
                .changed
                .wait_timeout(state, remaining)
                .map_err(|_| failure("Foundry admission gate poisoned"))?
                .0;
        }
    }
}
pub(super) struct Permit(Arc<Gate>);
impl Drop for Permit {
    fn drop(&mut self) {
        // Never recover poisoned state into service, including during unwinding.
        if let Ok(mut state) = self.0.state.lock() {
            state.held = false;
        }
        self.0.changed.notify_all();
    }
}

thread_local! {
    static DEADLINE: Cell<Option<Instant>> = const { Cell::new(None) };
}
#[cfg(test)]
thread_local! { static BUSY_CALLS: Cell<usize> = const { Cell::new(0) }; }
// SQLite invokes this synchronously on the thread executing the statement.
// No panicking TLS access or arithmetic may cross its C callback boundary.
fn busy_wait(_: i32) -> bool {
    #[cfg(test)]
    let _ = BUSY_CALLS.try_with(|calls| calls.set(calls.get().saturating_add(1)));
    let Some(deadline) = DEADLINE.try_with(Cell::get).ok().flatten() else {
        return false;
    };
    let remaining = deadline.saturating_duration_since(Instant::now());
    if remaining.is_zero() {
        return false;
    }
    std::thread::sleep(remaining.min(Duration::from_millis(1)));
    Instant::now() < deadline
}

/// Drop after the transaction (including its rollback), before the permit.
/// Restoration failure disables future writes, never changes committed success.
pub(super) struct BusyScope<'a> {
    connection: &'a mut Connection,
    healthy: &'a Cell<bool>,
    timeout: Duration,
}
impl<'a> BusyScope<'a> {
    pub(super) fn connection(&self) -> &Connection {
        self.connection
    }

    pub(super) fn install(
        connection: &'a mut Connection,
        healthy: &'a Cell<bool>,
        timeout: Duration,
        deadline: Instant,
    ) -> rusqlite::Result<Self> {
        if !healthy.get() {
            return Err(failure("Foundry connection write state unavailable"));
        }
        let installed = DEADLINE
            .try_with(|slot| {
                if slot.get().is_some() {
                    false
                } else {
                    slot.set(Some(deadline));
                    true
                }
            })
            .unwrap_or(false);
        if !installed {
            return Err(failure("Nested Foundry write scope is unsupported"));
        }
        let scope = Self {
            connection,
            healthy,
            timeout,
        };
        scope.connection.busy_handler(Some(busy_wait))?;
        Ok(scope)
    }
}
impl Drop for BusyScope<'_> {
    fn drop(&mut self) {
        if !self.connection.is_autocommit() {
            self.healthy.set(false);
        }
        if self.connection.busy_timeout(self.timeout).is_err() {
            self.healthy.set(false);
        }
        let _ = DEADLINE.try_with(|slot| slot.set(None));
    }
}

pub(super) fn timeout(connection: &Connection) -> rusqlite::Result<Duration> {
    let ms: u32 = connection.query_row("PRAGMA busy_timeout", [], |row| row.get(0))?;
    Ok(Duration::from_millis(u64::from(ms)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        panic::{AssertUnwindSafe, catch_unwind},
        sync::mpsc,
        thread,
    };

    fn deadline() -> Instant {
        Instant::now() + Duration::from_secs(5)
    }
    fn wait_for_queue(gate: &Gate, count: usize) {
        let until = deadline();
        loop {
            if gate.state.lock().unwrap().queue.len() == count {
                return;
            }
            assert!(Instant::now() < until, "worker did not enqueue");
            thread::yield_now();
        }
    }
    #[test]
    fn fifo_prevents_reacquisition_overtaking() {
        let gate = Arc::new(Gate::default());
        let held = gate.enter(deadline()).unwrap();
        let (sent, received) = mpsc::channel();
        let mut workers = Vec::new();
        for i in 0..4 {
            let g = gate.clone();
            let sent = sent.clone();
            workers.push(thread::spawn(move || {
                let _permit = g.enter(deadline()).unwrap();
                sent.send(i).unwrap();
            }));
            wait_for_queue(&gate, i + 1);
        }
        drop(held);
        // The releasing writer must enqueue behind every already admitted waiter.
        let _again = gate.enter(deadline()).unwrap();
        assert_eq!(
            (0..4)
                .map(|_| received.recv_timeout(Duration::from_secs(5)).unwrap())
                .collect::<Vec<_>>(),
            vec![0, 1, 2, 3]
        );
        for worker in workers {
            worker.join().unwrap();
        }
    }
    #[test]
    fn full_queue_is_bounded_and_expired_ticket_removes_only_itself() {
        let gate = Arc::new(Gate::default());
        let _held = gate.enter(deadline()).unwrap();
        let first = Arc::new(());
        gate.state.lock().unwrap().queue.push_back(first.clone());
        assert!(gate.enter(Instant::now()).is_err());
        let mut state = gate.state.lock().unwrap();
        assert_eq!(state.queue.len(), 1);
        assert!(Arc::ptr_eq(state.queue.front().unwrap(), &first));
        state.queue.extend((1..MAX_WAITERS).map(|_| Arc::new(())));
        drop(state);
        let error = match gate.enter(deadline()) {
            Err(error) => error,
            Ok(_) => panic!("expected queue full"),
        };
        assert!(error.to_string().contains("queue full"));
        assert_eq!(gate.state.lock().unwrap().queue.len(), MAX_WAITERS);
    }
    #[test]
    fn timed_out_head_does_not_strand_later_waiter() {
        let gate = Arc::new(Gate::default());
        let held = gate.enter(deadline()).unwrap();
        assert!(gate.enter(Instant::now()).is_err());
        assert!(gate.state.lock().unwrap().queue.is_empty());
        let g = gate.clone();
        let worker = thread::spawn(move || {
            let _permit = g.enter(deadline()).unwrap();
        });
        wait_for_queue(&gate, 1);
        drop(held);
        worker.join().unwrap();
    }
    #[test]
    fn unwind_releases_and_poison_fails_closed() {
        let gate = Arc::new(Gate::default());
        assert!(
            catch_unwind(AssertUnwindSafe(|| {
                let _held = gate.enter(deadline()).unwrap();
                panic!("synthetic operation unwind");
            }))
            .is_err()
        );
        drop(gate.enter(Instant::now()).unwrap());
        assert!(
            catch_unwind(AssertUnwindSafe(|| {
                let _state = gate.state.lock().unwrap();
                panic!("synthetic gate poison");
            }))
            .is_err()
        );
        assert!(gate.enter(deadline()).is_err());
    }
    #[test]
    fn aliases_share_gate_weak_lifecycle_and_memory_isolation() {
        let root = std::env::temp_dir().join(format!(
            "athena-fifo-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&root).unwrap();
        let path = root.join("synthetic.sqlite");
        let a = Connection::open(&path).unwrap();
        let b = Connection::open(root.join(".").join("synthetic.sqlite")).unwrap();
        let ga = for_connection(&a).unwrap();
        let gb = for_connection(&b).unwrap();
        assert!(Arc::ptr_eq(&ga, &gb));
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&path, root.join("alias.sqlite")).unwrap();
            let alias = Connection::open(root.join("alias.sqlite")).unwrap();
            assert!(Arc::ptr_eq(&ga, &for_connection(&alias).unwrap()));
        }
        let other = Connection::open(root.join("independent.sqlite")).unwrap();
        let go = for_connection(&other).unwrap();
        let _held = ga.enter(deadline()).unwrap();
        drop(go.enter(Instant::now()).unwrap());
        assert!(!Arc::ptr_eq(&ga, &go));
        drop(_held);
        let weak = Arc::downgrade(&ga);
        drop(ga);
        drop(gb);
        assert!(weak.upgrade().is_none());
        let dead_key = root.join("dead-registry-entry");
        REGISTRY
            .get()
            .unwrap()
            .lock()
            .unwrap()
            .insert(dead_key.clone(), Weak::new());
        let _fresh = for_connection(&a).unwrap();
        let registry = REGISTRY.get().unwrap().lock().unwrap();
        assert!(!registry.contains_key(&dead_key));
        drop(registry);
        let m1 = Connection::open_in_memory().unwrap();
        let m2 = Connection::open_in_memory().unwrap();
        assert!(!Arc::ptr_eq(
            &for_connection(&m1).unwrap(),
            &for_connection(&m2).unwrap()
        ));
    }
    #[test]
    fn expired_shared_budget_reaches_real_begin_and_commit_locks() {
        let path = std::env::temp_dir().join(format!(
            "athena-fifo-locks-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let mut writer = Connection::open(&path).unwrap();
        crate::storage_connection::configure(&writer).unwrap();
        writer
            .execute_batch("CREATE TABLE synthetic(value INTEGER);")
            .unwrap();
        let external = Connection::open(&path).unwrap();
        let healthy = Cell::new(true);
        let original = timeout(&writer).unwrap();
        assert_eq!(original, Duration::from_secs(5));
        external.execute_batch("BEGIN IMMEDIATE;").unwrap();
        {
            let scope =
                BusyScope::install(&mut writer, &healthy, original, Instant::now()).unwrap();
            BUSY_CALLS.with(|calls| calls.set(0));
            let result = rusqlite::Transaction::new_unchecked(
                scope.connection(),
                rusqlite::TransactionBehavior::Immediate,
            );
            assert!(
                matches!(result, Err(rusqlite::Error::SqliteFailure(ref error, _)) if error.code == rusqlite::ErrorCode::DatabaseBusy)
            );
            assert!(
                BUSY_CALLS.with(Cell::get) > 0,
                "SQLite BEGIN did not invoke the deadline handler"
            );
        }
        external.execute_batch("ROLLBACK;").unwrap();
        assert!(writer.is_autocommit());
        assert_eq!(timeout(&writer).unwrap(), original);
        external
            .execute_batch("BEGIN; SELECT * FROM synthetic;")
            .unwrap();
        {
            let scope =
                BusyScope::install(&mut writer, &healthy, original, Instant::now()).unwrap();
            let tx = rusqlite::Transaction::new_unchecked(
                scope.connection(),
                rusqlite::TransactionBehavior::Immediate,
            )
            .unwrap();
            tx.execute("INSERT INTO synthetic VALUES(1)", []).unwrap();
            BUSY_CALLS.with(|calls| calls.set(0));
            let result = tx.commit();
            assert!(
                matches!(result, Err(rusqlite::Error::SqliteFailure(ref error, _)) if error.code == rusqlite::ErrorCode::DatabaseBusy)
            );
            assert!(
                BUSY_CALLS.with(Cell::get) > 0,
                "SQLite COMMIT did not invoke the deadline handler"
            );
            assert!(
                scope.connection().is_autocommit(),
                "failed commit must roll back before scope release"
            );
        }
        external.execute_batch("ROLLBACK;").unwrap();
        assert_eq!(timeout(&writer).unwrap(), original);
        assert!(healthy.get());
        assert_eq!(
            writer
                .query_row("SELECT count(*) FROM synthetic", [], |row| row
                    .get::<_, i64>(0))
                .unwrap(),
            0
        );
    }

    #[test]
    fn deadline_callback_fails_closed_and_scope_restores_timeout_on_unwind() {
        assert!(!busy_wait(0));
        let mut connection = Connection::open_in_memory().unwrap();
        connection.busy_timeout(Duration::from_millis(123)).unwrap();
        let healthy = Cell::new(true);
        assert!(
            catch_unwind(AssertUnwindSafe(|| {
                let _scope = BusyScope::install(
                    &mut connection,
                    &healthy,
                    Duration::from_millis(123),
                    Instant::now(),
                )
                .unwrap();
                assert!(
                    !busy_wait(0),
                    "expired shared budget cannot gain another wait"
                );
                let mut nested = Connection::open_in_memory().unwrap();
                assert!(
                    BusyScope::install(&mut nested, &healthy, Duration::ZERO, deadline()).is_err()
                );
                panic!("synthetic scope unwind");
            }))
            .is_err()
        );
        assert_eq!(timeout(&connection).unwrap(), Duration::from_millis(123));
        assert!(healthy.get());
        assert!(!busy_wait(0));
        healthy.set(false);
        assert!(BusyScope::install(&mut connection, &healthy, Duration::ZERO, deadline()).is_err());
    }
}
