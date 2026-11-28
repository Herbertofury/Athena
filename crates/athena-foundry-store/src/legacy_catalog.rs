//! Inert recovery of catalog records deliberately skipped by the legacy importer.
use crate::{Result, open_standalone_legacy, require_ordinary_table};
use rusqlite::types::ValueRef;
use serde::Serialize;
use serde_json::Value;
use std::{collections::BTreeMap, path::Path};

const MAX_ROWS: usize = 5000;
const MAX_FIELD: usize = 256 * 1024;
const MAX_RAW: usize = 4 * 1024 * 1024;
pub const MAX_ARCHIVE: usize = 12 * 1024 * 1024;

struct Family {
    name: &'static str,
    fields: &'static [&'static str],
}
const CATALOG: &[Family] = &[
    Family {
        name: "theme_packages",
        fields: &[
            "id",
            "name",
            "package_version",
            "approved",
            "world_name",
            "material_language",
            "motion",
            "raw_json",
        ],
    },
    Family {
        name: "rooms",
        fields: &[
            "id",
            "theme_id",
            "district_id",
            "name",
            "lineage",
            "raw_json",
        ],
    },
    Family {
        name: "ecology_objects",
        fields: &[
            "id",
            "theme_id",
            "name",
            "role",
            "material",
            "shape",
            "affordances_json",
            "behavior_json",
            "raw_json",
        ],
    },
];
#[derive(Serialize)]
struct Catalog {
    schema: u32,
    format: &'static str,
    families: Vec<CatalogFamily>,
}
#[derive(Serialize)]
struct CatalogFamily {
    name: &'static str,
    rows: Option<Vec<CatalogRow>>,
}
#[derive(Serialize)]
struct CatalogRow {
    original_fields: BTreeMap<&'static str, Value>,
    original_json_sha256: String,
}
pub fn archive_catalog(path: &Path) -> Result<Vec<u8>> {
    let db = open_standalone_legacy(path)?;
    let mut families = Vec::new();
    let (mut seen, mut size) = (0_usize, 0_usize);
    for family in CATALOG {
        let present: bool = db.query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE name=?1)",
            [family.name],
            |r| r.get(0),
        )?;
        if !present && family.name == "ecology_objects" {
            families.push(CatalogFamily {
                name: family.name,
                rows: None,
            });
            continue;
        }
        require_ordinary_table(&db, family.name)?;
        // All query identifiers are compiled constants from the reviewed v24 writer.
        let sql = format!(
            "SELECT {} FROM {} ORDER BY id COLLATE BINARY",
            family.fields.join(","),
            family.name
        );
        let mut statement = db.prepare(&sql)?;
        let mut rows = statement.query([])?;
        let mut family_rows = Vec::new();
        let mut prior = String::new();
        while let Some(row) = rows.next()? {
            seen += 1;
            if seen > MAX_ROWS {
                return Err(
                    "Legacy catalog exceeds the archive row limit; no partial export".into(),
                );
            }
            let mut original_fields = BTreeMap::new();
            let mut fingerprint = String::new();
            for (i, field) in family.fields.iter().copied().enumerate() {
                let item = match (field, row.get_ref(i)?) {
                    ("approved", ValueRef::Integer(value)) if matches!(value, 0 | 1) => {
                        Value::from(value)
                    }
                    ("approved", _) => return Err("Invalid original catalog approval value".into()),
                    (_, ValueRef::Text(raw)) => {
                        size = size
                            .checked_add(raw.len())
                            .ok_or("Legacy catalog size overflow")?;
                        if raw.len() > MAX_FIELD || size > MAX_RAW {
                            return Err(
                                "Legacy catalog exceeds the archive byte limit; no partial export"
                                    .into(),
                            );
                        }
                        let text = std::str::from_utf8(raw)?;
                        if field == "id" {
                            if text.trim().is_empty() || text == prior {
                                return Err("Ambiguous original catalog identity".into());
                            }
                            prior.clear();
                            prior.push_str(text);
                        }
                        if field.ends_with("_json")
                            && serde_json::from_str::<serde::de::IgnoredAny>(text).is_err()
                        {
                            return Err("Invalid original catalog JSON; no partial export".into());
                        }
                        if field == "raw_json" {
                            fingerprint = crate::history::digest_hex(text);
                        }
                        Value::String(text.to_owned())
                    }
                    _ => return Err("Unexpected original catalog field type".into()),
                };
                original_fields.insert(field, item);
            }
            family_rows.push(CatalogRow {
                original_fields,
                original_json_sha256: fingerprint,
            });
        }
        families.push(CatalogFamily {
            name: family.name,
            rows: Some(family_rows),
        });
    }
    let archive = serde_json::to_vec(&Catalog {
        schema: 1,
        format: "feature-foundry-v24-catalog",
        families,
    })?;
    if archive.len() > MAX_ARCHIVE {
        return Err("Legacy catalog serialized archive exceeds its limits".into());
    }
    Ok(archive)
}
