use athena_foundry_store::backup;
use serde_json::{Value, json};
#[test]
fn utf16_boundary_preserves_unicode_compatibility() {
    let mut value: Value =
        serde_json::from_str(include_str!("fixtures/js-workspace.json")).unwrap();
    value["savedLayouts"] = json!([{"name":"夜🌙","layout":value["active"].clone()}]);
    let text = value.to_string();
    let padded = format!(
        "{}{}",
        text,
        " ".repeat(1_000_000 - text.encode_utf16().count())
    );
    assert!(padded.len() > 1_000_000);
    assert!(backup::normalize(&padded).is_ok());
    assert!(backup::normalize(&(padded + " ")).is_err());
}
#[test]
fn normalization_cannot_expand_backup_past_its_own_read_limit() {
    let catalog: Value = serde_json::from_str(include_str!("../catalog.json")).unwrap();
    let base: Value = serde_json::from_str(include_str!("fixtures/js-blends.json")).unwrap();
    let template = base["active"]["placements"]
        .as_object()
        .unwrap()
        .values()
        .next()
        .unwrap();
    let mut layouts = serde_json::Map::new();
    let mut active = Value::Null;
    for theme in catalog["themes"].as_array().unwrap() {
        for room in theme["rooms"].as_array().unwrap() {
            let mut placement = template.clone();
            placement["objectId"] = theme["objects"][0]["id"].clone();
            let mut placements = serde_json::Map::new();
            for i in 0..100 {
                placements.insert(
                    format!("instance-00000000-0000-4000-8000-{i:012}"),
                    placement.clone(),
                );
            }
            let mut layout = base["active"].clone();
            layout["themeId"] = theme["id"].clone();
            layout["roomId"] = room["id"].clone();
            layout["placements"] = Value::Object(placements);
            if active.is_null() {
                active = layout.clone();
            }
            layouts.insert(room["id"].as_str().unwrap().to_owned(), layout);
        }
    }
    layouts.remove(active["roomId"].as_str().unwrap());
    let mut value = json!({"version":11,"active":active,"layouts":layouts,"view":base["view"],"savedLayouts":[]});
    while value.to_string().len() > 999_500 {
        let layouts = value["layouts"].as_object_mut().unwrap();
        let layout = layouts
            .values_mut()
            .rev()
            .find(|v| !v["placements"].as_object().unwrap().is_empty())
            .unwrap();
        let placements = layout["placements"].as_object_mut().unwrap();
        let key = placements.keys().next().unwrap().clone();
        placements.remove(&key);
    }
    let text = value.to_string();
    assert!(text.len() < 1_000_000);
    assert!(
        backup::normalize(&text)
            .unwrap_err()
            .to_string()
            .contains("Normalized workspace")
    );
}
