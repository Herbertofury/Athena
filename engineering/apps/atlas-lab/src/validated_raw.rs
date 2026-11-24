//! Experimental checked JSON forwarding. Never uses unchecked RawValue construction.
//! Preserve the ordinary Value parser's number, Unicode and recursion checks without a value tree.
use serde::de::{self, Deserialize, Deserializer, MapAccess, SeqAccess, Visitor};
use serde_json::value::RawValue;
use std::fmt;
struct CheckedValue;
struct CheckedKey;
struct KeyVisitor;
impl<'de> Visitor<'de> for KeyVisitor {
    type Value = CheckedKey;
    fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("a valid decoded JSON object key")
    }
    fn visit_str<E: de::Error>(self, _: &str) -> Result<CheckedKey, E> {
        Ok(CheckedKey)
    }
}
impl<'de> Deserialize<'de> for CheckedKey {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        d.deserialize_str(KeyVisitor)
    }
}
struct CheckVisitor;
impl<'de> Visitor<'de> for CheckVisitor {
    type Value = CheckedValue;
    fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("ordinary serde_json Value-compatible JSON")
    }
    fn visit_unit<E: de::Error>(self) -> Result<CheckedValue, E> {
        Ok(CheckedValue)
    }
    fn visit_bool<E: de::Error>(self, _: bool) -> Result<CheckedValue, E> {
        Ok(CheckedValue)
    }
    fn visit_i64<E: de::Error>(self, _: i64) -> Result<CheckedValue, E> {
        Ok(CheckedValue)
    }
    fn visit_u64<E: de::Error>(self, _: u64) -> Result<CheckedValue, E> {
        Ok(CheckedValue)
    }
    fn visit_f64<E: de::Error>(self, v: f64) -> Result<CheckedValue, E> {
        if v.is_finite() {
            Ok(CheckedValue)
        } else {
            Err(E::custom("Non-finite JSON number"))
        }
    }
    fn visit_str<E: de::Error>(self, _: &str) -> Result<CheckedValue, E> {
        Ok(CheckedValue)
    }
    fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<CheckedValue, A::Error> {
        while seq.next_element::<CheckedValue>()?.is_some() {}
        Ok(CheckedValue)
    }
    fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<CheckedValue, A::Error> {
        while map.next_key::<CheckedKey>()?.is_some() {
            map.next_value::<CheckedValue>()?;
        }
        Ok(CheckedValue)
    }
}
impl<'de> Deserialize<'de> for CheckedValue {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        d.deserialize_any(CheckVisitor)
    }
}
/// Validate the complete borrowed text without constructing a Value tree or trimmed RawValue.
/// The caller retains ownership and is responsible for preserving its original bytes.
pub fn validate_json(json: &str) -> serde_json::Result<()> {
    serde_json::from_str::<CheckedValue>(json)?;
    Ok(())
}
pub fn validate_and_preserve(json: String) -> serde_json::Result<Box<RawValue>> {
    validate_json(&json)?;
    RawValue::from_string(json)
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{Value, json};
    fn equivalent(input: &str) {
        let baseline = serde_json::from_str::<Value>(input);
        let candidate = validate_and_preserve(input.to_string());
        assert_eq!(baseline.is_ok(), candidate.is_ok(), "{input:.100}");
        if let (Ok(a), Ok(b)) = (baseline, candidate) {
            assert_eq!(a, serde_json::from_str::<Value>(b.get()).unwrap());
        }
    }
    #[test]
    fn repairs_raw_only_validation_gaps() {
        for value in [
            "1e400",
            r#""\uD800""#,
            r#"{"\uD800":1}"#,
            &format!("{}0{}", "[".repeat(140), "]".repeat(140)),
        ] {
            assert!(RawValue::from_string(value.to_string()).is_ok());
            assert!(validate_and_preserve(value.to_string()).is_err());
        }
    }
    #[test]
    fn matches_depth_boundaries_and_malformed_json() {
        for depth in 0..180 {
            equivalent(&format!("{}0{}", "[".repeat(depth), "]".repeat(depth)));
        }
        for value in [
            "{} []",
            "NaN",
            "null",
            "-0",
            "18446744073709551617",
            "1e-400",
            r#"{"a":1,"a":2}"#,
            r#""\uD83D\uDE00""#,
            r#""café""#,
            r#"{"a":true,}"#,
        ] {
            equivalent(value);
        }
    }
    #[test]
    fn ten_thousand_structured_cases_and_mutations_match() {
        for i in 0..10000 {
            let input=serde_json::to_string(&json!({"id":format!("item-{i}"),"values":[i,-i,true,serde_json::Value::Null],"text":"café 🎮 \\ \"","nested":{"x":i as f64/7.0}})).unwrap();
            equivalent(&input);
            equivalent(&input[..input.len() - 1]);
            equivalent(&(input + " trailing"));
        }
    }
    #[test]
    fn preserves_every_original_byte_in_valid_value() {
        let original = "{ \"a\" : [1, 2], \"text\":\"café\" }";
        assert_eq!(
            validate_and_preserve(original.into()).unwrap().get(),
            original
        );
    }
}
