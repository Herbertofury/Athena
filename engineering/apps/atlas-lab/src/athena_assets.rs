//! Frozen, verified public runtime assets. Never serve a filesystem directory.
use crate::build_identity::sha256_hex;
use serde::Deserialize;
use std::{collections::HashMap, io::Read, path::Path, sync::Arc};

const MAX_MANIFEST: u64 = 2 * 1024 * 1024;
const MAX_FILE: u64 = 16 * 1024 * 1024;
const MAX_TOTAL: u64 = 64 * 1024 * 1024;
#[derive(Deserialize)]
struct Manifest {
    application: String,
    entry: String,
    files: Vec<Entry>,
}
#[derive(Deserialize)]
struct Entry {
    path: String,
    bytes: u64,
    sha256: String,
}
#[derive(Clone)]
pub struct Asset {
    pub bytes: Arc<[u8]>,
    pub sha256: String,
    pub content_type: &'static str,
}
pub struct RuntimeAssets {
    assets: HashMap<String, Asset>,
    pub manifest_sha256: String,
}
fn content_type(path: &str) -> Option<&'static str> {
    Some(match path.rsplit('.').next()? {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json",
        "txt" => "text/plain; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        _ => return None,
    })
}
fn valid_path(path: &str) -> bool {
    !path.is_empty()
        && path.len() <= 512
        && path
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"-_/.".contains(&b))
        && path
            .split('/')
            .all(|p| !p.is_empty() && !p.starts_with('.'))
        && path != "api"
        && !path.starts_with("api/")
        && path != "athena-runtime-manifest.json"
}
fn read_bounded(root: &Path, name: &str, limit: u64) -> Result<Vec<u8>, String> {
    let mut path = root.to_path_buf();
    for component in name.split('/') {
        path.push(component);
        let metadata = std::fs::symlink_metadata(&path).map_err(|_| "Missing runtime asset")?;
        if metadata.file_type().is_symlink() {
            return Err("Runtime symlinks are not accepted".into());
        }
    }
    let file = std::fs::File::open(&path).map_err(|_| "Runtime asset cannot be read")?;
    let metadata = file
        .metadata()
        .map_err(|_| "Runtime metadata unavailable")?;
    if !metadata.is_file() || metadata.len() > limit {
        return Err("Runtime asset is not a bounded file".into());
    }
    let mut data = Vec::new();
    file.take(limit + 1)
        .read_to_end(&mut data)
        .map_err(|_| "Runtime read failed")?;
    if data.len() as u64 > limit {
        return Err("Runtime asset grew beyond its budget".into());
    }
    Ok(data)
}
impl RuntimeAssets {
    pub fn load(root: &Path) -> Result<Self, String> {
        let metadata = std::fs::symlink_metadata(root).map_err(|_| "Runtime package is missing")?;
        if !metadata.is_dir() || metadata.file_type().is_symlink() {
            return Err("Runtime package must be a real directory".into());
        }
        let raw = read_bounded(root, "athena-runtime-manifest.json", MAX_MANIFEST)?;
        let manifest: Manifest =
            serde_json::from_slice(&raw).map_err(|_| "Invalid runtime manifest")?;
        if manifest.application != "Athena"
            || manifest.entry != "index.html"
            || manifest.files.len() > 4096
        {
            return Err("Unexpected runtime identity or file count".into());
        }
        let mut assets = HashMap::new();
        let mut total = 0_u64;
        for entry in manifest.files {
            if entry.path == ".nojekyll" && entry.bytes == 0 && entry.sha256 == sha256_hex(b"") {
                continue;
            }
            if !valid_path(&entry.path)
                || entry.bytes > MAX_FILE
                || entry.sha256.len() != 64
                || !entry
                    .sha256
                    .bytes()
                    .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
            {
                return Err("Invalid runtime asset declaration".into());
            }
            total = total
                .checked_add(entry.bytes)
                .ok_or("Runtime total overflow")?;
            if total > MAX_TOTAL {
                return Err("Runtime package exceeds its memory budget".into());
            }
            let mime = content_type(&entry.path).ok_or("Unapproved runtime asset extension")?;
            let bytes = read_bounded(root, &entry.path, entry.bytes)?;
            if bytes.len() as u64 != entry.bytes || sha256_hex(&bytes) != entry.sha256 {
                return Err("Runtime asset hash or size mismatch".into());
            }
            if assets
                .insert(
                    format!("/{}", entry.path),
                    Asset {
                        bytes: bytes.into(),
                        sha256: entry.sha256,
                        content_type: mime,
                    },
                )
                .is_some()
            {
                return Err("Duplicate runtime asset path".into());
            }
        }
        for path in [
            "/index.html",
            "/app.js",
            "/styles.css",
            "/workspaces/engineering/lab/index.mjs",
        ] {
            if !assets.contains_key(path) {
                return Err(format!("Required Athena runtime asset missing: {path}"));
            }
        }
        let manifest_sha256 = sha256_hex(&raw);
        assets.insert(
            "/athena-runtime-manifest.json".into(),
            Asset {
                bytes: raw.into(),
                sha256: manifest_sha256.clone(),
                content_type: "application/json",
            },
        );
        Ok(Self {
            assets,
            manifest_sha256,
        })
    }
    pub fn get(&self, path: &str) -> Option<&Asset> {
        self.assets
            .get(if path == "/" { "/index.html" } else { path })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> std::path::PathBuf {
        let root = std::env::temp_dir().join(format!(
            "athena-assets-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(root.join("workspaces/engineering/lab")).unwrap();
        let files = [
            ("index.html", "<title>Athena</title>"),
            ("app.js", "'use strict';"),
            ("styles.css", "body{}"),
            (
                "workspaces/engineering/lab/index.mjs",
                "export const mount=()=>{};",
            ),
        ];
        let entries:Vec<_>=files.iter().map(|(path,text)|{std::fs::write(root.join(path),text).unwrap();serde_json::json!({"path":path,"bytes":text.len(),"sha256":sha256_hex(text.as_bytes())})}).collect();
        std::fs::write(
            root.join("athena-runtime-manifest.json"),
            serde_json::to_vec(
                &serde_json::json!({"application":"Athena","entry":"index.html","files":entries}),
            )
            .unwrap(),
        )
        .unwrap();
        root
    }
    #[test]
    fn frozen_allowlist_never_serves_unlisted_files_or_later_changes() {
        let root = fixture();
        std::fs::write(root.join("private.sqlite"), b"private").unwrap();
        let loaded = RuntimeAssets::load(&root).unwrap();
        std::fs::write(root.join("app.js"), b"changed").unwrap();
        assert_eq!(&*loaded.get("/app.js").unwrap().bytes, b"'use strict';");
        assert!(loaded.get("/private.sqlite").is_none());
        assert!(loaded.get("/../app.js").is_none());
        assert!(loaded.get("/%61pp.js").is_none());
        assert!(RuntimeAssets::load(&root).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn manifest_rejects_duplicates_reserved_paths_and_bad_hashes() {
        for replacement in [
            "app.js",
            "api/jobs",
            "../secret.txt",
            "/index.html",
            "foo\\bar.js",
            "secret.sqlite",
        ] {
            let root = fixture();
            let p = root.join("athena-runtime-manifest.json");
            let mut v: serde_json::Value =
                serde_json::from_slice(&std::fs::read(&p).unwrap()).unwrap();
            v["files"][0]["path"] = replacement.into();
            std::fs::write(&p, serde_json::to_vec(&v).unwrap()).unwrap();
            assert!(RuntimeAssets::load(&root).is_err(), "{replacement}");
            std::fs::remove_dir_all(root).unwrap();
        }
    }
    #[cfg(unix)]
    #[test]
    fn symlink_assets_are_rejected() {
        let root = fixture();
        std::fs::rename(root.join("app.js"), root.join("other.js")).unwrap();
        std::os::unix::fs::symlink("other.js", root.join("app.js")).unwrap();
        assert!(RuntimeAssets::load(&root).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
}
