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
    groups: Option<usize>,
    smart_collections: Option<usize>,
    integrity_findings: Option<usize>,
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
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArtifactLink<'a> {
    #[serde(borrow)]
    chat_id: Option<std::borrow::Cow<'a, str>>,
    #[serde(borrow)]
    provider_id: Option<std::borrow::Cow<'a, str>>,
    #[serde(borrow)]
    source: Option<std::borrow::Cow<'a, str>>,
}
#[derive(Serialize, Default)]
struct ArtifactLinks {
    linked_to_exported_chat: usize,
    chat_not_in_export: usize,
    provider_download_bucket: usize,
    no_chat_link: usize,
    unrecognized_row: usize,
}
#[derive(Serialize, Default)]
struct ArtifactReferences {
    files: ArtifactLinks,
    output_snapshots: ArtifactLinks,
}
#[derive(Serialize)]
struct LifecycleSlice {
    source_reported_open: Option<usize>,
    open: Option<usize>,
    closed: Option<usize>,
    unrecognized: Option<usize>,
    matches_reported_open: Option<bool>,
}
#[derive(Serialize)]
struct Lifecycle {
    groups: LifecycleSlice,
    smart_collections: LifecycleSlice,
    integrity_findings: LifecycleSlice,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LifecycleMarkers<'a> {
    #[serde(borrow)]
    deleted_at: Option<&'a RawValue>,
    #[serde(borrow)]
    resolved: Option<&'a RawValue>,
}
fn lifecycle(rows: Option<&Rows<'_>>, source: Option<usize>, findings: bool) -> LifecycleSlice {
    let counts = rows.map(|rows| {
        let (mut open, mut closed, mut unrecognized) = (0, 0, 0);
        for row in rows {
            let marker = if row.get().trim_start().starts_with('{') {
                serde_json::from_str::<LifecycleMarkers<'_>>(row.get())
                    .ok()
                    .and_then(|fields| {
                        if findings {
                            match fields.resolved.map(RawValue::get) {
                                None | Some("false") => Some(false),
                                Some("true") => Some(true),
                                _ => None,
                            }
                        } else {
                            match fields.deleted_at.map(RawValue::get) {
                                None => Some(false),
                                Some(value) => value
                                    .parse::<u64>()
                                    .ok()
                                    .filter(|n| *n <= 9_007_199_254_740_991)
                                    .map(|n| n != 0),
                            }
                        }
                    })
            } else {
                None
            };
            match marker {
                Some(true) => closed += 1,
                Some(false) => open += 1,
                None => unrecognized += 1,
            }
        }
        (open, closed, unrecognized)
    });
    LifecycleSlice {
        source_reported_open: source,
        open: counts.map(|c| c.0),
        closed: counts.map(|c| c.1),
        unrecognized: counts.map(|c| c.2),
        matches_reported_open: counts
            .filter(|c| c.2 == 0)
            .zip(source)
            .map(|(c, n)| c.0 == n),
    }
}
#[derive(Serialize)]
pub struct Report {
    schema: &'static str,
    source_schema: u32,
    writer_reviewed_at: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    exact_input_sha256: Option<String>,
    slices: Vec<Slice>,
    references: References,
    artifact_references: ArtifactReferences,
    lifecycle: Lifecycle,
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
fn artifact_links(rows: &[&RawValue], chats: &HashSet<&str>, files: bool) -> ArtifactLinks {
    let mut result = ArtifactLinks::default();
    for raw in rows {
        if !raw.get().trim_start().starts_with('{') {
            result.unrecognized_row += 1;
            continue;
        }
        let Ok(link) = serde_json::from_str::<ArtifactLink<'_>>(raw.get()) else {
            result.unrecognized_row += 1;
            continue;
        };
        match link.chat_id.as_deref().filter(|id| !id.is_empty()) {
            None => result.no_chat_link += 1,
            Some(id) if chats.contains(id) => result.linked_to_exported_chat += 1,
            Some(id)
                if files
                    && link.source.as_deref() == Some("downloads-api")
                    && id.strip_suffix(":downloads").is_some_and(|provider| {
                        !provider.is_empty() && link.provider_id.as_deref() == Some(provider)
                    }) =>
            {
                result.provider_download_bucket += 1;
            }
            Some(_) => result.chat_not_in_export += 1,
        }
    }
    result
}
fn audit(s: &Snapshot<'_>) -> Result<(References, ArtifactReferences), &'static str> {
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
    let artifacts = ArtifactReferences {
        files: artifact_links(&s.files, &chats, true),
        output_snapshots: artifact_links(&s.output_snapshots, &chats, false),
    };
    Ok((result, artifacts))
}
fn review_bytes(bytes: &[u8], fingerprint: bool) -> Result<Report, &'static str> {
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
    let (references, artifact_references) = audit(&s)?;
    Ok(Report {
        schema: "athena-constellation-v7-review",
        source_schema: 7,
        writer_reviewed_at: SOURCE,
        exact_input_sha256: fingerprint.then(|| crate::build_identity::sha256_hex(bytes)),
        slices,
        references,
        artifact_references,
        lifecycle: Lifecycle {
            groups: lifecycle(s.groups.as_ref(), s.summary.groups, false),
            smart_collections: lifecycle(
                s.smart_collections.as_ref(),
                s.summary.smart_collections,
                false,
            ),
            integrity_findings: lifecycle(
                s.integrity_findings.as_ref(),
                s.summary.integrity_findings,
                true,
            ),
        },
        scope: "Read-only counts, basic turn references and artifact-to-chat links. Missing means absent in this export, not missing from the original application. No content validated for restoration, no import, no remote or provider actions, and no retirement decision.",
    })
}

pub fn review_file(path: &Path, fingerprint: bool) -> Result<Report, &'static str> {
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
    review_bytes(&bytes, fingerprint)
}
