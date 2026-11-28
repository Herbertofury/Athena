//! Explicit metadata-only projection. Never reads provider resources or mutates the live app.
use crate::{
    build_identity::sha256_hex,
    constellation_review::{decode_export, read_export_file, review_bytes},
};
use serde::Deserialize;
use serde_json::{Value, json, value::RawValue};
use std::{
    collections::{HashMap, HashSet},
    fs::OpenOptions,
    io::Write,
    path::Path,
};

const ERROR: &str = "Invalid, ambiguous or unsupported project input";
const MAX_RECIPE_BYTES: usize = 32 * 1024;
const JS_SAFE_INTEGER: u64 = 9_007_199_254_740_991;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Recipe {
    schema: u32,
    source_sha256: String,
    destination_sha256: String,
    namespace: String,
    selected: Vec<Selection>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Selection {
    id: String,
    stage: String,
    ownership: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Legacy<'a> {
    #[serde(borrow)]
    projects: Vec<&'a RawValue>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Project {
    id: String,
    source_type: Option<String>,
    provider_id: Option<String>,
    name: Option<String>,
    archived: Option<bool>,
    deleted_at: Option<u64>,
    updated_at: Option<u64>,
}
impl Project {
    fn workspace_metadata(&self) -> Option<(&str, u64)> {
        if self.source_type.as_deref() != Some("workspace")
            || self.provider_id.as_deref() != Some("")
            || self.archived != Some(false)
            || self.deleted_at.unwrap_or(0) != 0
        {
            return None;
        }
        let name = self.name.as_deref().filter(|n| {
            !n.trim().is_empty()
                && n.encode_utf16().count() <= 200
                && !n.chars().any(char::is_control)
        })?;
        let at = self
            .updated_at
            .filter(|n| (1..=JS_SAFE_INTEGER).contains(n))?;
        Some((name, at))
    }
}
const REVIEW_LIMIT: usize = 128;
pub(crate) const MAX_SEARCH_FRAME: usize = 2 + 512 + crate::constellation_review::LIMIT as usize;

pub(crate) fn search_projects(frame: &[u8]) -> Result<Value, &'static str> {
    let header = frame.get(..2).ok_or(ERROR)?;
    let len = u16::from_be_bytes([header[0], header[1]]) as usize;
    if !(1..=512).contains(&len) || frame.len() <= 2 + len {
        return Err(ERROR);
    }
    let query = std::str::from_utf8(&frame[2..2 + len])
        .map_err(|_| ERROR)?
        .trim();
    if query.is_empty() || query.chars().any(char::is_control) {
        return Err(ERROR);
    }
    review_projects(&frame[2 + len..], query)
}

pub(crate) fn review_projects(source: &[u8], query: &str) -> Result<Value, &'static str> {
    let query = query.to_lowercase();
    let decoded = decode_export(source)?;
    review_bytes(&decoded, false)?;
    let legacy: Legacy<'_> = serde_json::from_slice(&decoded).map_err(|_| ERROR)?;
    let mut seen = HashSet::new();
    let mut rows = Vec::new();
    let mut eligible = 0;
    let mut omitted = 0;
    let mut matches = 0;
    for raw in legacy.projects {
        let project: Project = serde_json::from_str(raw.get()).map_err(|_| ERROR)?;
        if project.id.trim().is_empty()
            || project.id.len() > 4096
            || !seen.insert(project.id.clone())
        {
            return Err(ERROR);
        }
        let Some((name, at)) = project.workspace_metadata() else {
            omitted += 1;
            continue;
        };
        eligible += 1;
        if !query.is_empty() && !name.to_lowercase().contains(&query) {
            continue;
        }
        matches += 1;
        if rows.len() < REVIEW_LIMIT {
            rows.push(json!({"id":project.id,"name":name,"at":at}));
        }
    }
    Ok(
        json!({"schema":"athena-constellation-project-selection-v1","sourceSha256":sha256_hex(source),
        "eligible":eligible,"notEligible":omitted,"matches":matches,"projects":rows}),
    )
}
#[derive(Deserialize)]
struct Destination<'a> {
    schema: u32,
    #[serde(borrow)]
    entries: Vec<&'a RawValue>,
}
#[derive(Deserialize)]
struct DestinationId {
    id: String,
}

fn build(source: &[u8], recipe: &[u8], destination: &[u8]) -> Result<Vec<u8>, &'static str> {
    if recipe.len() > MAX_RECIPE_BYTES {
        return Err("Recipe exceeds its 32 KiB budget");
    }
    let plan: Recipe = serde_json::from_slice(recipe).map_err(|_| ERROR)?;
    if plan.schema != 1
        || plan.selected.is_empty()
        || plan.selected.len() > 24
        || plan.namespace.is_empty()
        || plan.namespace.len() > 64
        || !plan
            .namespace
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err(ERROR);
    }
    if sha256_hex(source) != plan.source_sha256
        || sha256_hex(destination) != plan.destination_sha256
    {
        return Err("Source or destination roster changed; stop and review the new inputs");
    }
    let decoded = decode_export(source)?;
    review_bytes(&decoded, false)?;
    let legacy: Legacy<'_> = serde_json::from_slice(&decoded).map_err(|_| ERROR)?;
    let current: Destination<'_> = serde_json::from_slice(destination).map_err(|_| ERROR)?;
    if current.schema != 1 || current.entries.len().saturating_add(plan.selected.len()) > 100 {
        return Err(
            "Current Athena Projects roster and selection exceed the admitted import scope",
        );
    }

    let mut seen = HashSet::new();
    for row in current.entries {
        let project: DestinationId = serde_json::from_str(row.get()).map_err(|_| ERROR)?;
        if project.id.trim().is_empty()
            || project.id.encode_utf16().count() > 100
            || !seen.insert(project.id)
        {
            return Err(ERROR);
        }
    }
    let mut projects = HashMap::new();
    for raw in legacy.projects {
        let project: Project = serde_json::from_str(raw.get()).map_err(|_| ERROR)?;
        if project.id.trim().is_empty()
            || project.id.len() > 4096
            || projects.insert(project.id.clone(), project).is_some()
        {
            return Err(ERROR);
        }
    }
    let mut result = Vec::new();
    for choice in plan.selected {
        let selected = projects.get(&choice.id).ok_or(ERROR)?;
        // Provider-mirrored projects, archived or deleted rows, and unclassified
        // records are not reinterpreted as user-owned workspaces.
        if !matches!(
            choice.stage.as_str(),
            "idea" | "research" | "building" | "testing" | "released" | "paused"
        ) || !matches!(choice.ownership.as_str(), "own" | "followed")
        {
            return Err(ERROR);
        }
        let (name, at) = selected.workspace_metadata().ok_or(ERROR)?;
        let id = format!(
            "constellation-v7-{}",
            sha256_hex(format!("{}\0{}", plan.namespace, selected.id).as_bytes())
        );
        if !seen.insert(id.clone()) {
            return Err(
                "An identical project identity already exists or was selected twice; no candidate created",
            );
        }
        result.push(json!({"id":id,"archived":false,"revisions":[{
            "name":name,"ownership":choice.ownership,"stage":choice.stage,"at":at,
            "goal":"","next":"","blockers":"","decisions":"","resources":"","source":"","version":"","release":""
        }]}));
    }
    serde_json::to_vec_pretty(&json!({"schema":1,"entries":result,"athenaConstellationStage":{"schema":1,"destinationSha256":plan.destination_sha256}})).map_err(|_| ERROR)
}

pub fn stage(
    source: &Path,
    recipe: &Path,
    destination: &Path,
    output: &Path,
) -> Result<Value, &'static str> {
    // The operator selects local stopped copies. Nothing is persisted during admission.
    let source = read_export_file(source)?;
    let recipe_size =
        std::fs::symlink_metadata(recipe).map_err(|_| "Could not inspect selected recipe")?;
    if !recipe_size.is_file() || recipe_size.len() > MAX_RECIPE_BYTES as u64 {
        return Err("Choose a regular recipe within the 32 KiB review budget");
    }
    let recipe = read_export_file(recipe)?;
    let destination = read_export_file(destination)?;
    let candidate = build(&source, &recipe, &destination)?;
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(output)
        .map_err(|_| "Could not create a new candidate; an existing file is never overwritten")?;
    file.write_all(&candidate)
        .and_then(|_| file.sync_all())
        .map_err(
            |_| "Could not complete the new private candidate; a partial new file may remain",
        )?;
    drop(file);
    if read_export_file(output)? != candidate {
        return Err("Candidate bytes did not verify; do not import the new file");
    }
    Ok(
        json!({"schema":"athena-constellation-project-stage-v1","bytes":candidate.len(),"candidateWritten":true,
        "applied":false,"scope":"Selected workspace names and timestamps only, with explicitly chosen stage and ownership. Keep all originals."}),
    )
}

// An in-memory request uses a fixed magic, then three big-endian lengths.
// File names, caller-supplied paths and trailing bytes are never accepted.
const FRAME_HEADER: usize = 16;
const FRAME_MAGIC: &[u8; 4] = b"ACP1";
const MAX_EXPORT: usize = crate::constellation_review::LIMIT as usize;
pub(crate) const MAX_FRAME_BYTES: usize = FRAME_HEADER + 2 * MAX_EXPORT + MAX_RECIPE_BYTES;
const FRAME_ERROR: &str = "Invalid or oversized local project candidate request";

type StageParts<'a> = (&'a [u8], &'a [u8], &'a [u8]);
fn frame_parts(frame: &[u8]) -> Result<StageParts<'_>, &'static str> {
    if frame.len() < FRAME_HEADER || frame.len() > MAX_FRAME_BYTES || &frame[..4] != FRAME_MAGIC {
        return Err(FRAME_ERROR);
    }
    let sizes = [4, 8, 12].map(|offset| {
        u32::from_be_bytes([
            frame[offset],
            frame[offset + 1],
            frame[offset + 2],
            frame[offset + 3],
        ]) as usize
    });
    if sizes.contains(&0)
        || sizes[0] > MAX_EXPORT
        || sizes[1] > MAX_RECIPE_BYTES
        || sizes[2] > MAX_EXPORT
    {
        return Err(FRAME_ERROR);
    }
    let source_end = FRAME_HEADER + sizes[0];
    let recipe_end = source_end + sizes[1];
    if frame.len() != recipe_end + sizes[2] {
        return Err(FRAME_ERROR);
    }
    Ok((
        &frame[FRAME_HEADER..source_end],
        &frame[source_end..recipe_end],
        &frame[recipe_end..],
    ))
}
pub(crate) fn build_candidate_frame(frame: &[u8]) -> Result<Vec<u8>, &'static str> {
    let (source, recipe, destination) = frame_parts(frame)?;
    build(source, recipe, destination)
}

#[cfg(test)]
mod framed_tests {
    use super::*;

    fn make(sizes: [u32; 3], payload: &[u8]) -> Vec<u8> {
        let mut bytes = FRAME_MAGIC.to_vec();
        for size in sizes {
            bytes.extend_from_slice(&size.to_be_bytes());
        }
        bytes.extend_from_slice(payload);
        bytes
    }

    #[test]
    fn reads_only_exact_bounded_frames() {
        let good = make([2, 3, 4], b"123456789");
        assert_eq!(
            frame_parts(&good),
            Ok((b"12".as_slice(), b"345".as_slice(), b"6789".as_slice()))
        );
        for length in 0..good.len() {
            assert_eq!(frame_parts(&good[..length]), Err(FRAME_ERROR));
        }
        let mut extra = good.clone();
        extra.push(0);
        assert_eq!(frame_parts(&extra), Err(FRAME_ERROR));
        for sizes in [
            [0, 3, 4],
            [2, u32::MAX, 4],
            [u32::MAX, 3, 4],
            [2, 3, u32::MAX],
        ] {
            assert_eq!(frame_parts(&make(sizes, b"123456789")), Err(FRAME_ERROR));
        }
        let mut unknown = good;
        unknown[3] = b'2';
        assert_eq!(frame_parts(&unknown), Err(FRAME_ERROR));
    }
}
