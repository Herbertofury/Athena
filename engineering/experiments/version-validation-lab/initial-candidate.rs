//! Isolated candidate: validate every byte, retain every field, avoid a full Value tree.
//! The application continues to call its original parser.
use atlas_lab::modrinth_versions::VersionRecord;
use serde::de::{Deserialize, Deserializer, MapAccess, Visitor};
use serde_json::value::RawValue;
use std::{collections::HashMap, fmt};
struct Object<'a> {
    fields: HashMap<String, &'a RawValue>,
    duplicate_identity: bool,
}
struct ObjectVisitor;
impl<'de> Visitor<'de> for ObjectVisitor {
    type Value = Object<'de>;
    fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("a JSON object")
    }
    fn visit_map<M: MapAccess<'de>>(self, mut access: M) -> Result<Self::Value, M::Error> {
        let mut fields = HashMap::new();
        let mut duplicate_identity = false;
        while let Some(key) = access.next_key::<String>()? {
            let value = access.next_value::<&'de RawValue>()?;
            if matches!(key.as_str(), "id" | "project_id") && fields.contains_key(&key) {
                duplicate_identity = true;
            }
            fields.insert(key, value);
        }
        Ok(Object {
            fields,
            duplicate_identity,
        })
    }
}
impl<'de> Deserialize<'de> for Object<'de> {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        d.deserialize_map(ObjectVisitor)
    }
}
impl<'a> Object<'a> {
    fn required(&self, key: &str) -> Result<&'a RawValue, Box<dyn std::error::Error>> {
        self.fields
            .get(key)
            .copied()
            .ok_or_else(|| "Missing required version field".into())
    }
}
fn string(value: &RawValue) -> bool {
    value.get().trim_start().starts_with('"')
}
fn canonical(id: &str) -> bool {
    id.len() == 8 && id.bytes().all(|b| b.is_ascii_alphanumeric())
}
fn strings(value: &RawValue) -> Result<(), Box<dyn std::error::Error>> {
    let values: Vec<&RawValue> = serde_json::from_str(value.get())?;
    if values.iter().all(|x| string(x)) {
        Ok(())
    } else {
        Err("Invalid compatibility list".into())
    }
}
pub fn parse_version(body: &[u8]) -> Result<VersionRecord, Box<dyn std::error::Error>> {
    if body.len() > 2 * 1024 * 1024 {
        return Err("Version response exceeds size budget".into());
    }
    // This existing checked visitor traverses unknown fields too. RawValue alone
    // would accept malformed Unicode and non-finite-number forms; never omit it.
    let payload =
        atlas_lab::validated_raw::validate_and_preserve(String::from_utf8(body.to_vec())?)?;
    let object: Object<'_> = serde_json::from_str(payload.get())?;
    if object.duplicate_identity {
        return Err("Duplicate version identity".into());
    }
    let id: String = serde_json::from_str(object.required("id")?.get())?;
    let project: String = serde_json::from_str(object.required("project_id")?.get())?;
    if !canonical(&id) || !canonical(&project) {
        return Err("Invalid canonical version or project identity".into());
    }
    for key in ["name", "version_number", "date_published"] {
        if !string(object.required(key)?) {
            return Err("Missing required version text".into());
        }
    }
    for key in ["game_versions", "loaders"] {
        strings(object.required(key)?)?;
    }
    let files: Vec<&RawValue> = serde_json::from_str(object.required("files")?.get())?;
    let mut primary = 0;
    for raw in files {
        let file: Object<'_> = serde_json::from_str(raw.get())?;
        if !string(file.required("filename")?) || !string(file.required("url")?) {
            return Err("Invalid version file metadata".into());
        }
        let _: u64 = serde_json::from_str(file.required("size")?.get())?;
        let is_primary: bool = serde_json::from_str(file.required("primary")?.get())?;
        primary += usize::from(is_primary);
        let hashes: Object<'_> = serde_json::from_str(file.required("hashes")?.get())?;
        if !hashes.fields.values().all(|x| string(x)) {
            return Err("Invalid version file hashes".into());
        }
    }
    if primary > 1 {
        return Err("Multiple primary files in one version".into());
    }
    let dependencies: Vec<&RawValue> =
        serde_json::from_str(object.required("dependencies")?.get())?;
    if !dependencies
        .iter()
        .all(|x| x.get().trim_start().starts_with('{'))
    {
        return Err("Invalid version dependency list".into());
    }
    Ok(VersionRecord {
        canonical_id: id,
        project_id: project,
        payload,
    })
}
