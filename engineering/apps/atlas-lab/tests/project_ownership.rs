use atlas_lab::modrinth::{parse_project_record, parse_project_record_owned};
fn body() -> Vec<u8> {
    br#" {"id":"AANobbMI","slug":"sodium","title":"Fixture","description":"fixture","project_type":"mod","versions":[],"future":{"exact":18446744073709551617,"nothing":null,"empty":[]}} "#.to_vec()
}
#[test]
fn owned_input_retains_all_bytes_and_the_original_allocation() {
    let bytes = body();
    let original = bytes.clone();
    let pointer = bytes.as_ptr();
    let baseline = parse_project_record(&bytes, "SODIUM").unwrap();
    let owned = parse_project_record_owned(bytes, "SODIUM").unwrap();
    assert_eq!(owned.raw_json().as_ptr(), pointer);
    assert_eq!(owned.raw_json().as_bytes(), original);
    assert_eq!(owned.raw_json(), baseline.raw_json());
    assert_eq!(
        serde_json::to_value(owned.project()).unwrap(),
        serde_json::to_value(baseline.project()).unwrap()
    );
}
#[test]
fn owned_input_keeps_identical_rejections() {
    let mut cases = vec![
        (body(), "other"),
        (body(), "https://invalid/"),
        (b"[]".to_vec(), "sodium"),
        (b"null".to_vec(), "sodium"),
        (b"{broken".to_vec(), "sodium"),
        (vec![255], "sodium"),
        (vec![b' '; 2 * 1024 * 1024 + 1], "sodium"),
    ];
    let missing = String::from_utf8(body())
        .unwrap()
        .replace("\"title\":\"Fixture\"", "\"title\":\"\"");
    cases.push((missing.into_bytes(), "sodium"));
    for (bytes, request) in cases {
        let a = parse_project_record(&bytes, request)
            .unwrap_err()
            .to_string();
        let b = parse_project_record_owned(bytes, request)
            .unwrap_err()
            .to_string();
        assert_eq!(a, b);
    }
}
#[test]
fn owned_string_storage_path_keeps_utf8_and_unknown_values() {
    let text = String::from_utf8(body())
        .unwrap()
        .replace("Fixture", "Snow ❄ 雪");
    let pointer = text.as_ptr();
    let expected = text.clone();
    let r = parse_project_record_owned(text.into_bytes(), "AANobbMI").unwrap();
    assert_eq!(r.raw_json(), expected);
    assert_eq!(r.raw_json().as_ptr(), pointer);
}
