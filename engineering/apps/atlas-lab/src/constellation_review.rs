//! Count-only preview of an explicitly selected Project Constellation v7 export.
//! Discards unsupported data from the *report*, never from the user's file.
use serde::{Deserialize, Serialize};
use serde_json::value::RawValue;
use std::{
    collections::{HashMap, HashSet},
    fs::File,
    io::Read,
    path::Path,
};

pub(crate) const LIMIT: u64 = 16 * 1024 * 1024;
const SOURCE: &str = "f46d7bd7e7fbd8771278e66caa36ff77349e63e6";
type Rows<'a> = Vec<&'a RawValue>;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Summary {
    providers: Option<usize>,
    projects: Option<usize>,
    chats: Option<usize>,
    turns: Option<usize>,
    turn_revisions: Option<usize>,
    output_snapshots: Option<usize>,
    files: Option<usize>,
    knowledge_items: Option<usize>,
    continuity_projects: Option<usize>,
    events: usize,
    checkpoints: usize,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Snapshot<'a> {
    #[serde(borrow)]
    schema: &'a str,
    schema_version: u32,
    summary: Summary,
    #[serde(borrow)]
    providers: Rows<'a>,
    #[serde(borrow)]
    projects: Rows<'a>,
    #[serde(borrow)]
    chats: Vec<Row<'a>>,
    #[serde(borrow)]
    turns: Vec<Row<'a>>,
    #[serde(borrow)]
    turn_revisions: Vec<Row<'a>>,
    #[serde(borrow)]
    output_snapshots: Rows<'a>,
    #[serde(borrow)]
    files: Rows<'a>,
    #[serde(borrow)]
    knowledge_items: Rows<'a>,
    #[serde(borrow)]
    knowledge_sources: Rows<'a>,
    #[serde(borrow)]
    project_continuity: Rows<'a>,
    #[serde(borrow)]
    events: Rows<'a>,
    #[serde(borrow)]
    checkpoints: Rows<'a>,
    #[serde(borrow)]
    sync_receipts: Rows<'a>,
    #[serde(borrow)]
    catalog_runs: Rows<'a>,
    #[serde(default, borrow)]
    groups: Option<Rows<'a>>,
    #[serde(default, borrow)]
    smart_collections: Option<Rows<'a>>,
    #[serde(default, borrow)]
    project_baselines: Option<Rows<'a>>,
    #[serde(default, borrow)]
    integrity_findings: Option<Rows<'a>>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Row<'a> {
    #[serde(borrow)]
    id: std::borrow::Cow<'a, str>,
    chat_id: Option<String>,
    turn_id: Option<String>,
    best_revision_id: Option<String>,
}
#[derive(Serialize)]
struct Slice {
    kind: &'static str,
    retained: Option<usize>,
    export_cap: Option<usize>,
    source_reported: Option<usize>,
    omitted: Option<usize>,
    cap_reached: bool,
}
#[derive(Serialize, Default)]
struct References {
    turns_without_exported_chat: usize,
    revisions_without_exported_turn: usize,
    revisions_with_conflicting_chat: usize,
    best_revision_not_exported: usize,
    best_revision_points_to_other_turn: usize,
}
#[derive(Serialize)]
pub struct Report {
    schema: &'static str,
    source_schema: u32,
    writer_reviewed_at: &'static str,
    exact_input_sha256: String,
    slices: Vec<Slice>,
    references: References,
    scope: &'static str,
}
fn slice(
    kind: &'static str,
    count: Option<usize>,
    cap: Option<usize>,
    total: Option<usize>,
) -> Result<Slice, &'static str> {
    let retained = count.unwrap_or_default();
    if cap.is_some_and(|max| retained > max)
        || total.is_some_and(|reported| retained != reported.min(cap.unwrap_or(usize::MAX)))
    {
        return Err("Source collection does not match its reported total or the v7 export bounds");
    }
    let cap_reached = cap.is_some_and(|max| retained == max);
    let omitted = if let Some(total) = total {
        Some(total - retained)
    } else if cap.is_some() && !cap_reached {
        Some(0)
    } else {
        None
    };
    Ok(Slice {
        kind,
        retained: count,
        export_cap: cap,
        source_reported: total,
        omitted,
        cap_reached,
    })
}

fn unique<'a>(rows: &'a [Row<'_>]) -> Result<HashSet<&'a str>, &'static str> {
    let mut ids = HashSet::with_capacity(rows.len());
    for row in rows {
        if row.id.is_empty() || !ids.insert(row.id.as_ref()) {
            return Err("Empty or duplicate source record ID");
        }
    }
    Ok(ids)
}
fn audit(s: &Snapshot<'_>) -> Result<References, &'static str> {
    let chats = unique(&s.chats)?;
    let mut turns = HashMap::with_capacity(s.turns.len());
    for turn in &s.turns {
        let id = turn.id.as_ref();
        let chat = turn.chat_id.as_deref().filter(|value| !value.is_empty());
        if id.is_empty() || turns.insert(id, chat).is_some() {
            return Err("Empty or duplicate source record ID");
        }
    }
    let mut revisions = HashMap::with_capacity(s.turn_revisions.len());
    let mut result = References::default();
    for row in &s.turn_revisions {
        let id = row.id.as_ref();
        if id.is_empty() || revisions.insert(id, row.turn_id.as_deref()).is_some() {
            return Err("Empty or duplicate source record ID");
        }
        match row.turn_id.as_deref().and_then(|id| turns.get(id)) {
            None => result.revisions_without_exported_turn += 1,
            Some(Some(parent_chat)) => {
                if row
                    .chat_id
                    .as_deref()
                    .is_some_and(|chat| !chat.is_empty() && chat != *parent_chat)
                {
                    result.revisions_with_conflicting_chat += 1;
                }
            }
            Some(None) => {}
        }
    }
    for row in &s.turns {
        if !row.chat_id.as_deref().is_some_and(|id| chats.contains(id)) {
            result.turns_without_exported_chat += 1;
        }
        if let Some(id) = row.best_revision_id.as_deref().filter(|id| !id.is_empty()) {
            match revisions.get(id) {
                None => result.best_revision_not_exported += 1,
                Some(found) if *found != Some(row.id.as_ref()) => {
                    result.best_revision_points_to_other_turn += 1
                }
                Some(_) => {}
            }
        }
    }
    Ok(result)
}
pub fn review_bytes(bytes: &[u8]) -> Result<Report, &'static str> {
    if bytes.len() as u64 > LIMIT {
        return Err("Export exceeds the 16 MiB review budget");
    }
    let s: Snapshot<'_> =
        serde_json::from_slice(bytes).map_err(|_| "Invalid v7 export structure")?;
    if s.schema != "project-constellation" || s.schema_version != 7 {
        return Err("Unrecognized source schema; only Constellation v7 is supported");
    }
    let slices = vec![
        slice(
            "providers",
            Some(s.providers.len()),
            None,
            s.summary.providers,
        )?,
        slice("projects", Some(s.projects.len()), None, s.summary.projects)?,
        slice("chats", Some(s.chats.len()), None, s.summary.chats)?,
        slice("turns", Some(s.turns.len()), None, s.summary.turns)?,
        slice(
            "turnRevisions",
            Some(s.turn_revisions.len()),
            None,
            s.summary.turn_revisions,
        )?,
        slice(
            "outputSnapshots",
            Some(s.output_snapshots.len()),
            None,
            s.summary.output_snapshots,
        )?,
        slice("files", Some(s.files.len()), None, s.summary.files)?,
        slice(
            "knowledgeItems",
            Some(s.knowledge_items.len()),
            None,
            s.summary.knowledge_items,
        )?,
        slice(
            "knowledgeSources",
            Some(s.knowledge_sources.len()),
            None,
            None,
        )?,
        slice(
            "projectContinuity",
            Some(s.project_continuity.len()),
            None,
            s.summary.continuity_projects,
        )?,
        slice(
            "events",
            Some(s.events.len()),
            Some(12_000),
            Some(s.summary.events),
        )?,
        slice(
            "checkpoints",
            Some(s.checkpoints.len()),
            Some(1_000),
            Some(s.summary.checkpoints),
        )?,
        slice(
            "syncReceipts",
            Some(s.sync_receipts.len()),
            Some(2_000),
            None,
        )?,
        slice("catalogRuns", Some(s.catalog_runs.len()), Some(200), None)?,
        slice("groups", s.groups.as_ref().map(Vec::len), None, None)?,
        slice(
            "smartCollections",
            s.smart_collections.as_ref().map(Vec::len),
            None,
            None,
        )?,
        slice(
            "projectBaselines",
            s.project_baselines.as_ref().map(Vec::len),
            None,
            None,
        )?,
        slice(
            "integrityFindings",
            s.integrity_findings.as_ref().map(Vec::len),
            None,
            None,
        )?,
    ];
    Ok(Report {
        schema: "athena-constellation-v7-review",
        source_schema: 7,
        writer_reviewed_at: SOURCE,
        exact_input_sha256: crate::build_identity::sha256_hex(bytes),
        slices,
        references: audit(&s)?,
        scope: "Read-only counts and basic turn references. Missing means absent in this export, not missing from the original application. No content validated for restoration, no import, no remote or provider actions, and no retirement decision.",
    })
}

pub fn review_file(path: &Path) -> Result<Report, &'static str> {
    let info = std::fs::symlink_metadata(path).map_err(|_| "Could not inspect selected export")?;
    if !info.is_file() || info.len() > LIMIT {
        return Err("Choose a regular export file within the 16 MiB review budget");
    }
    let input = File::open(path).map_err(|_| "Could not open selected export")?;
    let opened = input
        .metadata()
        .map_err(|_| "Could not inspect opened export")?;
    if !opened.is_file() || opened.len() > LIMIT {
        return Err("Opened export is not a regular file within budget");
    }
    let mut bytes = Vec::with_capacity(opened.len() as usize);
    input
        .take(LIMIT + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "Could not read selected export")?;
    if bytes.len() as u64 != opened.len() {
        return Err("File length changed during read; choose a quiescent export");
    }
    review_bytes(&bytes)
}
