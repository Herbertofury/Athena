//! Diagnose validation differences before considering a raw-output optimization.
use serde_json::{Value, json, value::RawValue};
fn main() {
    let deep = format!("{}0{}", "[".repeat(140), "]".repeat(140));
    let cases = vec![
        ("finite", "{\"value\":123}".to_string()),
        ("overflow", "1e400".to_string()),
        ("lone_surrogate", r#""\uD800""#.to_string()),
        ("duplicate_key", r#"{"a":1,"a":2}"#.to_string()),
        ("deep", deep),
        ("trailing", "{} []".to_string()),
    ];
    for (name, input) in cases {
        println!(
            "{}",
            json!({"case":name,"value_accepted":serde_json::from_str::<Value>(&input).is_ok(),"raw_accepted":RawValue::from_string(input).is_ok()})
        );
    }
}
