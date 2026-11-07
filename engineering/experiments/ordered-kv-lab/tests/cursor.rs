use redb::{Database, ReadableDatabase, ReadableTableMetadata, TableDefinition};
use std::ops::Bound;
const T: TableDefinition<u64, &[u8]> = TableDefinition::new("t");
#[test]
fn cursor_rejects_duplicate_and_out_of_order_without_loss() {
    let db = Database::builder()
        .create_with_backend(redb::backends::InMemoryBackend::new())
        .unwrap();
    let tx = db.begin_write().unwrap();
    {
        let mut t = tx.open_table(T).unwrap();
        let mut c = t.lower_bound_mut(Bound::<u64>::Unbounded).unwrap();
        c.insert_before(2, [2u8].as_slice()).unwrap();
        assert!(matches!(
            c.insert_before(2, [99u8].as_slice()),
            Err(redb::CursorError::UnorderedKey)
        ));
        assert!(matches!(
            c.insert_before(1, [99u8].as_slice()),
            Err(redb::CursorError::UnorderedKey)
        ));
        c.insert_before(3, [3u8].as_slice()).unwrap();
    }
    tx.commit().unwrap();
    let tx = db.begin_read().unwrap();
    let t = tx.open_table(T).unwrap();
    assert_eq!(t.len().unwrap(), 2);
    assert_eq!(t.get(2).unwrap().unwrap().value(), [2]);
    assert_eq!(t.get(3).unwrap().unwrap().value(), [3]);
}
