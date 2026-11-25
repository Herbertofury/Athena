//! Count-only comparison of exact keys and selected fields; never migrates raw catalog data.
use crate::{Catalog, Result, require_ordinary_table};
use rusqlite::{Connection, Row};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::hash::Hash;

#[derive(Debug, Serialize)]
pub struct Comparison {
    source: usize,
    athena: usize,
    matching_ids: usize,
    exact_selected_fields: usize,
    changed_selected_fields: usize,
    only_in_source: usize,
    only_in_athena: usize,
}

#[derive(Debug, Serialize)]
pub struct CatalogComparison {
    theme_names: Comparison,
    room_names: Comparison,
    ecology_name_shape_role: Option<Comparison>,
    scope: &'static str,
}

fn compare<K: Eq + Hash + Clone, V: PartialEq>(
    db: &Connection,
    sql: &str,
    mut native: HashMap<K, V>,
    decode: impl FnMut(&Row<'_>) -> rusqlite::Result<(K, V)>,
) -> Result<Comparison> {
    let mut result = Comparison {
        source: 0,
        athena: native.len(),
        matching_ids: 0,
        exact_selected_fields: 0,
        changed_selected_fields: 0,
        only_in_source: 0,
        only_in_athena: 0,
    };
    let mut seen = HashSet::new();
    for pair in db.prepare(sql)?.query_map([], decode)? {
        let (key, payload) = pair?;
        result.source += 1;
        if result.source > 10_000 || !seen.insert(key.clone()) {
            return Err("Legacy catalog comparison exceeds row limit or has duplicate IDs".into());
        }
        if let Some(expected) = native.remove(&key) {
            result.matching_ids += 1;
            if expected == payload {
                result.exact_selected_fields += 1;
            } else {
                result.changed_selected_fields += 1;
            }
        } else {
            result.only_in_source += 1;
        }
    }
    result.only_in_athena = native.len();
    Ok(result)
}

pub(crate) fn catalog_comparison(db: &Connection, catalog: &Catalog) -> Result<CatalogComparison> {
    // Physical authoring data and source JSON are not read or copied by this comparison.
    let theme_names = compare(
        db,
        "SELECT id,name FROM theme_packages",
        catalog
            .themes
            .iter()
            .map(|t| (t.id.clone(), t.name.clone()))
            .collect(),
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    let room_names = compare(
        db,
        "SELECT theme_id,id,name FROM rooms",
        catalog
            .themes
            .iter()
            .flat_map(|t| {
                t.rooms
                    .iter()
                    .map(|r| ((t.id.clone(), r.id.clone()), r.name.clone()))
            })
            .collect(),
        |r| Ok(((r.get(0)?, r.get(1)?), r.get(2)?)),
    )?;
    let present: bool = db.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE name='ecology_objects')",
        [],
        |r| r.get(0),
    )?;
    let ecology_name_shape_role = if present {
        require_ordinary_table(db, "ecology_objects")?;
        Some(compare(
            db,
            "SELECT theme_id,id,name,shape,role FROM ecology_objects",
            catalog
                .themes
                .iter()
                .flat_map(|t| {
                    t.objects.iter().map(|o| {
                        (
                            (t.id.clone(), o.id.clone()),
                            (o.name.clone(), o.shape.clone(), o.role.clone()),
                        )
                    })
                })
                .collect(),
            |r| Ok(((r.get(0)?, r.get(1)?), (r.get(2)?, r.get(3)?, r.get(4)?))),
        )?)
    } else {
        None
    };
    Ok(CatalogComparison {
        theme_names,
        room_names,
        ecology_name_shape_role,
        scope: "Exact IDs and selected text only; not asset, environment, raw JSON, behavior, or migration parity",
    })
}
