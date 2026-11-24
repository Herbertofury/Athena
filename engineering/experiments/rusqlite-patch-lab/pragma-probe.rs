fn main() -> rusqlite::Result<()> {
    let db = rusqlite::Connection::open_in_memory()?;
    let unknown_pragma_rejected = db.pragma_update(None, "atlas_unknown_fixture_pragma", 1).is_err();
    let malformed_pragma_rejected = db.pragma_update(None, "bad;name", 1).is_err();
    let values: (String, Vec<u8>, i64) = db.query_row("SELECT '', x'', 9223372036854775807", [], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))?;
    let exact_values = values.0.is_empty() && values.1.is_empty() && values.2 == i64::MAX;
    println!("{{\"unknown_pragma_rejected\":{},\"malformed_pragma_rejected\":{},\"empty_and_integer_values_exact\":{}}}", unknown_pragma_rejected, malformed_pragma_rejected, exact_values);
    Ok(())
}
