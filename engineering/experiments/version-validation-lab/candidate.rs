//! Isolated candidate: validate every byte, retain every field, avoid a full Value tree.
//! The application continues to call its original parser.
use atlas_lab::modrinth_versions::VersionRecord;
use serde::de::{Deserialize, Deserializer, MapAccess, Visitor};
use serde_json::value::RawValue;
use std::{collections::HashMap, fmt};
#[derive(Clone, Copy, serde::Deserialize)]
#[serde(field_identifier)]
enum Key {
    #[serde(rename = "id")]
    Id,
    #[serde(rename = "project_id")]
    Project,
    #[serde(rename = "name")]
    Name,
    #[serde(rename = "version_number")]
    Number,
    #[serde(rename = "date_published")]
    Date,
    #[serde(rename = "game_versions")]
    Games,
    #[serde(rename = "loaders")]
    Loaders,
    #[serde(rename = "files")]
    Files,
    #[serde(rename = "dependencies")]
    Dependencies,
    #[serde(rename = "filename")]
    Filename,
    #[serde(rename = "url")]
    Url,
    #[serde(rename = "size")]
    Size,
    #[serde(rename = "primary")]
    Primary,
    #[serde(rename = "hashes")]
    Hashes,
    #[serde(other)]
    Other,
}
#[derive(Default)]
struct Object<'a> {
    id: Option<&'a RawValue>,
    project: Option<&'a RawValue>,
    name: Option<&'a RawValue>,
    number: Option<&'a RawValue>,
    date: Option<&'a RawValue>,
    games: Option<&'a RawValue>,
    loaders: Option<&'a RawValue>,
    files: Option<&'a RawValue>,
    dependencies: Option<&'a RawValue>,
    filename: Option<&'a RawValue>,
    url: Option<&'a RawValue>,
    size: Option<&'a RawValue>,
    primary: Option<&'a RawValue>,
    hashes: Option<&'a RawValue>,
    duplicate_identity: bool,
}
struct ObjectVisitor;
impl<'de> Visitor<'de> for ObjectVisitor {
    type Value = Object<'de>;
    fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("a JSON object")
    }
    fn visit_map<M: MapAccess<'de>>(self, mut access: M) -> Result<Self::Value, M::Error> {
        let mut object = Object::default();
        while let Some(key) = access.next_key::<Key>()? {
            let value = access.next_value::<&'de RawValue>()?;
            let slot = match key {
                Key::Id => &mut object.id,
                Key::Project => &mut object.project,
                Key::Name => &mut object.name,
                Key::Number => &mut object.number,
                Key::Date => &mut object.date,
                Key::Games => &mut object.games,
                Key::Loaders => &mut object.loaders,
                Key::Files => &mut object.files,
                Key::Dependencies => &mut object.dependencies,
                Key::Filename => &mut object.filename,
                Key::Url => &mut object.url,
                Key::Size => &mut object.size,
                Key::Primary => &mut object.primary,
                Key::Hashes => &mut object.hashes,
                Key::Other => continue,
            };
            let duplicate = slot.replace(value).is_some();
            if duplicate && matches!(key, Key::Id | Key::Project) {
                object.duplicate_identity = true;
            }
        }
        Ok(object)
    }
}
impl<'de> Deserialize<'de> for Object<'de> {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        d.deserialize_map(ObjectVisitor)
    }
}
impl<'a> Object<'a> {
    fn required(&self, key: &str) -> Result<&'a RawValue, Box<dyn std::error::Error>> {
        let value = match key {
            "id" => self.id,
            "project_id" => self.project,
            "name" => self.name,
            "version_number" => self.number,
            "date_published" => self.date,
            "game_versions" => self.games,
            "loaders" => self.loaders,
            "files" => self.files,
            "dependencies" => self.dependencies,
            "filename" => self.filename,
            "url" => self.url,
            "size" => self.size,
            "primary" => self.primary,
            "hashes" => self.hashes,
            _ => None,
        };
        value.ok_or_else(|| {
            match key {
                "id" => "Missing version ID",
                "project_id" => "Missing project ID",
                "name" | "version_number" | "date_published" => "Missing required version text",
                "game_versions" | "loaders" => "Invalid compatibility list",
                "files" => "Missing version files",
                "dependencies" => "Invalid version dependency list",
                _ => "Invalid version file metadata",
            }
            .into()
        })
    }
}
fn string(value: &RawValue) -> bool {
    value.get().trim_start().starts_with('"')
}
fn canonical(id: &str) -> bool {
    id.len() == 8 && id.bytes().all(|b| b.is_ascii_alphanumeric())
}
fn strings(value: &RawValue) -> Result<(), Box<dyn std::error::Error>> {
    let values: Vec<&RawValue> =
        serde_json::from_str(value.get()).map_err(|_| "Invalid compatibility list")?;
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
    let object: Object<'_> =
        serde_json::from_str(payload.get()).map_err(|_| "Expected a version object")?;
    if object.duplicate_identity {
        return Err("Duplicate version identity".into());
    }
    let id: String =
        serde_json::from_str(object.required("id")?.get()).map_err(|_| "Missing version ID")?;
    let project: String = serde_json::from_str(object.required("project_id")?.get())
        .map_err(|_| "Missing project ID")?;
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
    let files: Vec<&RawValue> = serde_json::from_str(object.required("files")?.get())
        .map_err(|_| "Missing version files")?;
    let mut primary = 0;
    for raw in files {
        let file: Object<'_> =
            serde_json::from_str(raw.get()).map_err(|_| "Invalid version file metadata")?;
        if !string(file.required("filename")?) || !string(file.required("url")?) {
            return Err("Invalid version file metadata".into());
        }
        let _: u64 = serde_json::from_str(file.required("size")?.get())
            .map_err(|_| "Invalid version file metadata")?;
        let is_primary: bool = serde_json::from_str(file.required("primary")?.get())
            .map_err(|_| "Invalid version file metadata")?;
        primary += usize::from(is_primary);
        let hashes: HashMap<String, &RawValue> =
            serde_json::from_str(file.required("hashes")?.get())
                .map_err(|_| "Invalid version file metadata")?;
        if !hashes.values().all(|x| string(x)) {
            return Err("Invalid version file metadata".into());
        }
    }
    if primary > 1 {
        return Err("Multiple primary files in one version".into());
    }
    let dependencies: Vec<&RawValue> = serde_json::from_str(object.required("dependencies")?.get())
        .map_err(|_| "Invalid version dependency list")?;
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
