//! Bounded official version metadata. File links are retained, never downloaded or executed.
use serde::{Deserialize, Serialize};
use serde_json::{Value, value::RawValue};
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct VersionRecord {
    pub canonical_id: String,
    pub project_id: String,
    /// Original JSON object, including unknown fields and null/absent distinctions.
    pub payload: Box<RawValue>,
}

#[derive(Debug, Serialize)]
pub struct VersionBatch {
    pub requested_ids: Vec<String>,
    pub versions: Vec<VersionRecord>,
    pub missing_ids: Vec<String>,
}

fn canonical(value: &str) -> bool {
    value.len() == 8 && value.bytes().all(|b| b.is_ascii_alphanumeric())
}

pub fn versions_url(ids: &[String]) -> Result<String, Box<dyn std::error::Error>> {
    // Reuse the existing bounded canonical-ID validation, not a parallel transport.
    crate::modrinth::projects_url(ids)?;
    let mut url = reqwest::Url::parse("https://api.modrinth.com/v2/versions")?;
    url.query_pairs_mut()
        .append_pair("ids", &serde_json::to_string(ids)?);
    Ok(url.into())
}

pub fn parse_version(body: &[u8]) -> Result<VersionRecord, Box<dyn std::error::Error>> {
    if body.len() > 2 * 1024 * 1024 {
        return Err("Version response exceeds size budget".into());
    }
    // Validate through the strict Value parser before retaining raw JSON. This
    // rejects non-finite numbers, malformed Unicode and excessive nesting.
    let value: Value = serde_json::from_slice(body)?;
    #[derive(Deserialize)]
    struct Identity {
        id: String,
        project_id: String,
    }
    // A Value map alone silently accepts duplicate keys. Identity binding must
    // not depend on which duplicate a later consumer chooses.
    let identity: Identity = serde_json::from_slice(body)?;
    let object = value.as_object().ok_or("Expected a version object")?;
    let id = object
        .get("id")
        .and_then(Value::as_str)
        .ok_or("Missing version ID")?;
    let project = object
        .get("project_id")
        .and_then(Value::as_str)
        .ok_or("Missing project ID")?;
    if !canonical(id) || !canonical(project) {
        return Err("Invalid canonical version or project identity".into());
    }
    if identity.id != id || identity.project_id != project {
        return Err("Ambiguous version identity".into());
    }
    for key in ["name", "version_number", "date_published"] {
        if object.get(key).and_then(Value::as_str).is_none() {
            return Err("Missing required version text".into());
        }
    }
    for key in ["game_versions", "loaders"] {
        if !object
            .get(key)
            .and_then(Value::as_array)
            .is_some_and(|items| items.iter().all(Value::is_string))
        {
            return Err("Invalid compatibility list".into());
        }
    }
    let files = object
        .get("files")
        .and_then(Value::as_array)
        .ok_or("Missing version files")?;
    let mut primary = 0;
    for file in files {
        if file.get("filename").and_then(Value::as_str).is_none()
            || file.get("url").and_then(Value::as_str).is_none()
            || file.get("size").and_then(Value::as_u64).is_none()
            || file.get("primary").and_then(Value::as_bool).is_none()
            || !file
                .get("hashes")
                .and_then(Value::as_object)
                .is_some_and(|h| h.values().all(Value::is_string))
        {
            return Err("Invalid version file metadata".into());
        }
        primary += usize::from(file["primary"] == true);
    }
    if primary > 1 {
        return Err("Multiple primary files in one version".into());
    }
    if !object
        .get("dependencies")
        .and_then(Value::as_array)
        .is_some_and(|items| items.iter().all(Value::is_object))
    {
        return Err("Invalid version dependency list".into());
    }
    Ok(VersionRecord {
        canonical_id: id.to_owned(),
        project_id: project.to_owned(),
        payload: serde_json::from_slice(body)?,
    })
}

pub fn parse_versions(
    body: &[u8],
    ids: &[String],
) -> Result<VersionBatch, Box<dyn std::error::Error>> {
    versions_url(ids)?;
    if body.len() > 2 * 1024 * 1024 {
        return Err("Version batch exceeds size budget; no partial snapshot accepted".into());
    }
    let raw: Vec<Box<RawValue>> = serde_json::from_slice(body)?;
    let mut by_id = HashMap::new();
    for item in raw {
        let version = parse_version(item.get().as_bytes())?;
        if !ids.contains(&version.canonical_id) || by_id.contains_key(&version.canonical_id) {
            return Err("Unexpected or duplicate version in batch response".into());
        }
        by_id.insert(version.canonical_id.clone(), version);
    }
    let mut result = VersionBatch {
        requested_ids: ids.to_vec(),
        versions: Vec::new(),
        missing_ids: Vec::new(),
    };
    for id in ids {
        match by_id.remove(id) {
            Some(version) => result.versions.push(version),
            None => result.missing_ids.push(id.clone()),
        }
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture(id: &str) -> String {
        format!(
            r#"{{"id":"{id}","project_id":"AANobbMI","name":"Fixture","version_number":"1","date_published":"2026-10-27T00:00:00Z","game_versions":["1.21.1"],"loaders":["fabric"],"dependencies":[{{"project_id":null,"version_id":null,"file_name":"external.jar","dependency_type":"optional"}}],"files":[{{"filename":"fixture.jar","url":"https://cdn.modrinth.com/example.jar","size":42,"primary":true,"hashes":{{"sha1":"fixture-only"}}}}],"changelog":null,"future_field":{{"exact_integer":18446744073709551617}}}}"#
        )
    }
    #[test]
    fn preserves_original_payload_unknown_fields_and_nulls() {
        let body = fixture("abcdefgh");
        let parsed = parse_version(body.as_bytes()).unwrap();
        assert_eq!(parsed.payload.get(), body);
        assert!(
            serde_json::to_string(&parsed)
                .unwrap()
                .contains("18446744073709551617")
        );
    }
    #[test]
    fn orders_requested_ids_and_keeps_missing_explicit() {
        let body = format!("[{},{}]", fixture("ijklmnop"), fixture("abcdefgh"));
        let ids = vec!["abcdefgh".into(), "qrstuvwx".into(), "ijklmnop".into()];
        let batch = parse_versions(body.as_bytes(), &ids).unwrap();
        assert_eq!(
            batch
                .versions
                .iter()
                .map(|v| v.canonical_id.as_str())
                .collect::<Vec<_>>(),
            ["abcdefgh", "ijklmnop"]
        );
        assert_eq!(batch.missing_ids, ["qrstuvwx"]);
    }
    #[test]
    fn rejects_corrupt_oversized_duplicate_and_unrequested_results() {
        let body = fixture("abcdefgh");
        for bad in [
            body.replace("42", "-1"),
            body.replace("42", "1e400"),
            body.replace("Fixture", "\\uD800"),
            body.replace("\"files\":[", "\"files\":null,\"unused\":["),
        ] {
            assert!(parse_version(bad.as_bytes()).is_err());
        }
        assert!(parse_version(&vec![b' '; 2 * 1024 * 1024 + 1]).is_err());
        assert!(
            parse_versions(format!("[{body},{body}]").as_bytes(), &["abcdefgh".into()]).is_err()
        );
        assert!(parse_versions(format!("[{body}]").as_bytes(), &["ijklmnop".into()]).is_err());
        assert!(parse_version(body.replacen("{", "{\"id\":\"ijklmnop\",", 1).as_bytes()).is_err());
    }
}
