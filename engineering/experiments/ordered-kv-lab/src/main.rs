use redb::{Database, Durability, ReadableDatabase, ReadableTable, TableDefinition};
use rusqlite::{Connection, params};
use std::{error::Error, ops::Bound, path::Path, time::Instant};
type Rows = Vec<(u64, Vec<u8>)>;
const TABLE: TableDefinition<u64, &[u8]> = TableDefinition::new("cards");
fn sql_read(c: &Connection) -> Result<Rows, Box<dyn Error>> {
    let mut s = c.prepare("SELECT id,payload FROM cards ORDER BY id")?;
    Ok(
        s.query_map([], |r| Ok((r.get::<_, i64>(0)? as u64, r.get(1)?)))?
            .collect::<Result<_, _>>()?,
    )
}
fn red_read(db: &Database) -> Result<Rows, Box<dyn Error>> {
    let tx = db.begin_read()?;
    let t = tx.open_table(TABLE)?;
    t.iter()?
        .map(|r| {
            let (k, v) = r?;
            Ok((k.value(), v.value().to_vec()))
        })
        .collect()
}
fn main() -> Result<(), Box<dyn Error>> {
    let a: Vec<_> = std::env::args().collect();
    if a.len() != 5 {
        return Err("lane input-directory public|generated new-output-directory".into());
    }
    let lane = &a[1];
    if !["sqlite", "sqlite-extra", "redb-insert", "redb-cursor"].contains(&lane.as_str()) {
        return Err("invalid lane".into());
    }
    let inputs: Vec<Vec<u8>> = ["AANobbMI", "YL57xq9U", "gvQqBUqZ"]
        .iter()
        .map(|id| std::fs::read(Path::new(&a[2]).join(format!("{id}.json"))))
        .collect::<Result<_, _>>()?;
    if inputs.iter().any(|v| v.is_empty() || v.len() > 65536) {
        return Err("input budget".into());
    }
    let rows: Rows = (0..256u64)
        .map(|i| {
            (
                i,
                if a[3] == "public" {
                    inputs[i as usize % 3].clone()
                } else {
                    (0..65536)
                        .map(|n| ((n * 17 + i as usize * 13) % 251) as u8)
                        .collect()
                },
            )
        })
        .collect();
    if !["public", "generated"].contains(&a[3].as_str()) {
        return Err("invalid workload".into());
    }
    let dir = Path::new(&a[4]);
    std::fs::create_dir(dir)?;
    let path = dir.join("records.db");
    let (write_ns, commit_ns, read_ns, integrity);
    if lane.starts_with("sqlite") {
        let mut c = Connection::open(&path)?;
        c.execute_batch("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA cache_size=-8192; CREATE TABLE cards(id INTEGER PRIMARY KEY,payload BLOB NOT NULL);")?;
        if lane == "sqlite-extra" {
            c.execute_batch("PRAGMA synchronous=EXTRA;")?;
        }
        assert_eq!(
            c.query_row("PRAGMA synchronous", [], |r| r.get::<_, i64>(0))?,
            if lane == "sqlite-extra" { 3 } else { 2 }
        );
        let start = Instant::now();
        let tx = c.transaction()?;
        {
            let mut s = tx.prepare("INSERT INTO cards VALUES(?1,?2)")?;
            for (k, v) in &rows {
                s.execute(params![*k as i64, v])?;
            }
        }
        let commit = Instant::now();
        tx.commit()?;
        commit_ns = commit.elapsed().as_nanos();
        write_ns = start.elapsed().as_nanos();
        let tx = c.transaction()?;
        tx.execute("UPDATE cards SET payload=x'00' WHERE id=0", [])?;
        tx.execute("INSERT INTO cards VALUES(999,x'01')", [])?;
        tx.rollback()?;
        drop(c);
        let c = Connection::open(&path)?;
        c.execute_batch("PRAGMA cache_size=-8192;")?;
        let start = Instant::now();
        let read = sql_read(&c)?;
        read_ns = start.elapsed().as_nanos();
        assert_eq!(read, rows);
        integrity = c.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))? == "ok";
    } else {
        let db = Database::builder()
            .set_cache_size(8 * 1024 * 1024)
            .create(&path)?;
        let mut tx = db.begin_write()?;
        tx.set_durability(Durability::Immediate)?;
        {
            tx.open_table(TABLE)?;
        }
        tx.commit()?;
        let start = Instant::now();
        let mut tx = db.begin_write()?;
        tx.set_durability(Durability::Immediate)?;
        {
            let mut t = tx.open_table(TABLE)?;
            if lane == "redb-cursor" {
                let mut cursor = t.lower_bound_mut(Bound::<u64>::Unbounded)?;
                for (k, v) in &rows {
                    cursor.insert_before(*k, v.as_slice())?;
                }
            } else {
                for (k, v) in &rows {
                    t.insert(*k, v.as_slice())?;
                }
            }
        }
        let commit = Instant::now();
        tx.commit()?;
        commit_ns = commit.elapsed().as_nanos();
        write_ns = start.elapsed().as_nanos();
        let tx = db.begin_write()?;
        {
            let mut t = tx.open_table(TABLE)?;
            t.insert(0, [0u8].as_slice())?;
            t.insert(999, [1u8].as_slice())?;
        }
        tx.abort()?;
        drop(db);
        let mut db = Database::builder()
            .set_cache_size(8 * 1024 * 1024)
            .open(&path)?;
        let start = Instant::now();
        let read = red_read(&db)?;
        read_ns = start.elapsed().as_nanos();
        assert_eq!(read, rows);
        integrity = db.check_integrity()?;
    }
    assert!(integrity);
    println!(
        "{}",
        serde_json::json!({"schema_version":1,"lane":lane,"workload":a[3],"rows":rows.len(),"payload_bytes":rows.iter().map(|(_,v)|v.len()).sum::<usize>(),"write_commit_ns":write_ns,"commit_ns":commit_ns,"read_materialize_ns":read_ns,"database_bytes":std::fs::metadata(path)?.len(),"complete_output_equal":true,"rollback_preserved":true,"integrity":integrity,"sqlite_version":rusqlite::version(),"redb_version":"4.4.0"})
    );
    Ok(())
}
