//! Fixed public upstream observations. No credentials, asset downloads or automatic adoption.
use serde::{Deserialize, Serialize};
#[path = "release_tag.rs"]
mod release_tag;
use std::{
    error::Error,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
pub const API_VERSION: &str = "2026-03-10";
pub const MAX_BODY: u64 = 2 * 1024 * 1024;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Source {
    RustSec,
    Hls,
    SerdeJson,
}
impl Source {
    pub fn parse(id: &str) -> Result<Self, &'static str> {
        match id {
            "rustsec" => Ok(Self::RustSec),
            "hls" => Ok(Self::Hls),
            "serde-json" => Ok(Self::SerdeJson),
            _ => Err("Unknown fixed upstream source"),
        }
    }
    pub fn id(self) -> &'static str {
        match self {
            Self::RustSec => "rustsec",
            Self::Hls => "hls",
            Self::SerdeJson => "serde-json",
        }
    }
    pub fn repo(self) -> &'static str {
        match self {
            Self::RustSec => "RustSec/advisory-db",
            Self::Hls => "video-dev/hls.js",
            Self::SerdeJson => "serde-rs/json",
        }
    }
    pub fn endpoint(self) -> String {
        format!(
            "https://api.github.com/repos/{}/{}",
            self.repo(),
            if self == Self::RustSec {
                "commits?per_page=1"
            } else {
                "releases/latest"
            }
        )
    }
}
#[derive(Debug)]
pub struct Record {
    pub revision: String,
    pub source_url: String,
    pub published_at: String,
    pub payload: String,
}
#[derive(Deserialize)]
struct Release {
    tag_name: String,
    html_url: String,
    published_at: String,
    draft: bool,
    prerelease: bool,
}
#[derive(Deserialize)]
struct Commit {
    sha: String,
    html_url: String,
    commit: CommitInfo,
}
#[derive(Deserialize)]
struct CommitInfo {
    committer: CommitTime,
}
#[derive(Deserialize)]
struct CommitTime {
    date: String,
}
fn checked_link(source: Source, revision: &str, value: &str) -> bool {
    let Ok(url) = reqwest::Url::parse(value) else {
        return false;
    };
    let prefix = format!("/{}/", source.repo());
    let tail = if source == Source::RustSec {
        format!("commit/{revision}")
    } else {
        format!("releases/tag/{revision}")
    };
    url.scheme() == "https"
        && url.host_str() == Some("github.com")
        && url.port().is_none()
        && url.username().is_empty()
        && url.password().is_none()
        && url.query().is_none()
        && url.fragment().is_none()
        && url
            .path()
            .get(..prefix.len())
            .is_some_and(|p| p.eq_ignore_ascii_case(&prefix))
        && url.path().get(prefix.len()..) == Some(tail.as_str())
}
pub fn parse_record(source: Source, bytes: &[u8]) -> Result<Record, Box<dyn Error>> {
    if bytes.len() as u64 > MAX_BODY {
        return Err("Response exceeds size budget".into());
    }
    // Keep the normal JSON validation contract; preserve the complete original bytes afterwards.
    let _: serde_json::Value = serde_json::from_slice(bytes)?;
    let (revision, source_url, published_at) = if source == Source::RustSec {
        let list: Vec<Commit> = serde_json::from_slice(bytes)?;
        if list.len() != 1 {
            return Err("Expected exactly one upstream commit".into());
        }
        let c = list.into_iter().next().unwrap();
        if c.sha.len() != 40 || !c.sha.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err("Invalid upstream commit identity".into());
        }
        (c.sha, c.html_url, c.commit.committer.date)
    } else {
        let r: Release = serde_json::from_slice(bytes)?;
        if r.draft
            || r.prerelease
            || r.tag_name.trim().is_empty()
            || r.tag_name.len() > 256
            || r.tag_name.chars().any(char::is_control)
        {
            return Err("Invalid stable release identity".into());
        }
        (r.tag_name, r.html_url, r.published_at)
    };
    if !checked_link(source, &revision, &source_url)
        || published_at.trim().is_empty()
        || published_at.len() > 64
    {
        return Err("Upstream source identity or publication metadata mismatch".into());
    }
    Ok(Record {
        revision,
        source_url,
        published_at,
        payload: String::from_utf8(bytes.to_vec())?,
    })
}
/// Stricter admission for new observations, without rewriting historical data.
pub fn parse_new_record(source: Source, bytes: &[u8]) -> Result<Record, Box<dyn Error>> {
    let record = parse_record(source, bytes)?;
    if source != Source::RustSec && !release_tag::is_stable(&record.revision) {
        return Err("New release observation requires a non-prerelease SemVer tag".into());
    }
    Ok(record)
}
pub fn epoch_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().min(i64::MAX as u64) as i64)
        .unwrap_or(0)
}
#[derive(Debug, Clone, Serialize)]
pub struct ResponseMeta {
    pub status: u16,
    pub api_version_requested: &'static str,
    pub api_version_selected: Option<String>,
    pub remaining: Option<u64>,
    pub next_allowed_epoch: i64,
    pub rate_limited: bool,
}
pub fn response_meta(
    status: u16,
    headers: &reqwest::header::HeaderMap,
    now: i64,
    previous_limits: u32,
) -> ResponseMeta {
    let number = |name: &str| {
        headers
            .get(name)
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
    };
    let remaining = number("x-ratelimit-remaining");
    let limited = status == 403 || status == 429;
    let mut next = now.saturating_add(if status == 200 { 1 } else { 60 });
    if remaining == Some(0) {
        next = next.max(
            number("x-ratelimit-reset")
                .map(|n| n.min(i64::MAX as u64) as i64)
                .unwrap_or(now.saturating_add(3600))
                .saturating_add(1),
        );
    }
    if limited {
        let backoff = 60i64.saturating_mul(1i64 << previous_limits.min(10));
        next = next.max(now.saturating_add(backoff));
        if let Some(seconds) = number("retry-after") {
            next = next.max(now.saturating_add(seconds.min(i64::MAX as u64) as i64));
        }
    }
    ResponseMeta {
        status,
        api_version_requested: API_VERSION,
        api_version_selected: headers
            .get("x-github-api-version-selected")
            .and_then(|v| v.to_str().ok())
            .map(str::to_owned),
        remaining,
        next_allowed_epoch: next,
        rate_limited: limited,
    }
}
pub struct Fetch {
    pub meta: ResponseMeta,
    pub body: Result<Vec<u8>, Box<dyn Error>>,
}
pub struct PublicClient(reqwest::blocking::Client);
impl PublicClient {
    pub fn new() -> Result<Self, reqwest::Error> {
        Ok(Self(
            reqwest::blocking::Client::builder()
                .https_only(true)
                .redirect(reqwest::redirect::Policy::none())
                .connect_timeout(Duration::from_secs(10))
                .timeout(Duration::from_secs(30))
                .user_agent("Herbertofury/Athena/0.1.0 (public upstream review)")
                .build()?,
        ))
    }
    pub fn fetch(&self, source: Source, previous_limits: u32) -> Result<Fetch, reqwest::Error> {
        let response = self
            .0
            .get(source.endpoint())
            .header("Accept", "application/vnd.github+json")
            .header("X-GitHub-Api-Version", API_VERSION)
            .send()?;
        let meta = response_meta(
            response.status().as_u16(),
            response.headers(),
            epoch_seconds(),
            previous_limits,
        );
        let body = if meta.status != 200 {
            Err("Public upstream HTTP response was not successful".into())
        } else if meta
            .api_version_selected
            .as_deref()
            .is_some_and(|v| v != API_VERSION)
        {
            Err("Upstream API version selection mismatch".into())
        } else {
            crate::public_http::read_json_response(response, MAX_BODY)
        };
        Ok(Fetch { meta, body })
    }
}

pub fn review(
    client: &PublicClient,
    source: Source,
    path: &std::path::Path,
) -> Result<(bool, serde_json::Value), &'static str> {
    review_with_cancel(client, source, path, || false)
}
pub fn review_with_cancel(
    client: &PublicClient,
    source: Source,
    path: &std::path::Path,
    mut cancelled: impl FnMut() -> bool,
) -> Result<(bool, serde_json::Value), &'static str> {
    if cancelled() {
        return Err("Upstream review cancelled before request; previous records retained");
    }
    let mut store = crate::snapshots::SnapshotStore::open(path)
        .map_err(|_| "Upstream database could not be opened")?;
    let delay = store
        .upstream_delay(epoch_seconds())
        .map_err(|_| "Upstream request budget could not be read")?;
    if delay > 1 {
        return Ok((
            false,
            serde_json::json!({"source_id":source.id(),"repository":source.repo(),"state":"cooldown","retry_after_seconds":delay.to_string(),"error":"Upstream cooldown or local hourly budget active; no network request made","scope":"Previous observations retained; no fresh observation or adoption"}),
        ));
    }
    if delay > 0 && delay <= 1 {
        let until = std::time::Instant::now() + Duration::from_secs(delay as u64);
        while std::time::Instant::now() < until {
            if cancelled() {
                return Err("Upstream review cancelled before request; previous records retained");
            }
            std::thread::sleep(Duration::from_millis(20));
        }
    }
    if cancelled() {
        return Err("Upstream review cancelled before request; previous records retained");
    }
    let limits=store.reserve_upstream_request(epoch_seconds()).map_err(|e|match e.to_string().as_str(){"Provider cooldown active; retry later"=>"Upstream provider cooldown is active; previous records retained","Local public-upstream hourly request budget reached"=>"Local public-upstream hourly request budget reached; previous records retained","Interrupted upstream request requires cooldown reconciliation before another request"=>"Interrupted upstream request requires manual cooldown reconciliation; no network request made",_=>"Upstream reservation failed; no network request made"})?;
    let fetched = client.fetch(source, limits);
    let (meta, body) = match fetched {
        Ok(f) => (f.meta, f.body),
        Err(e) => (
            ResponseMeta {
                status: 0,
                api_version_requested: API_VERSION,
                api_version_selected: None,
                remaining: None,
                next_allowed_epoch: epoch_seconds().saturating_add(60),
                rate_limited: false,
            },
            Err(Box::new(e) as Box<dyn Error>),
        ),
    };
    store.finish_upstream_request(&meta).map_err(|_|"Upstream cooldown could not be committed; reservation remains blocked for reconciliation")?;
    let failure = match body {
        Ok(bytes) => match store.save_upstream(source, &bytes, &meta) {
            Ok(receipt) => return Ok((true, receipt)),
            Err(error) => {
                if error.is::<rusqlite::Error>() {
                    "Upstream storage commit failed; previous records retained"
                } else {
                    "Upstream identity or schema validation failed; previous records retained"
                }
            }
        },
        Err(error) => {
            if meta.rate_limited {
                "Public GitHub request was rate-limited or denied; cooldown retained, no automatic retry"
            } else {
                crate::collection_failure::safe_message(error.as_ref())
            }
        }
    };
    store.record_upstream_failure(source).map_err(
        |_| "Upstream failure history could not be recorded; previous observations retained",
    )?;
    Ok((
        false,
        serde_json::json!({"source_id":source.id(),"repository":source.repo(),"state":"failed","error":failure,"response":meta,"scope":"Failure receipt only; no new snapshot, asset download, upgrade or security clearance"}),
    ))
}
#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    pub(crate) fn fixture(tag: &str) -> Vec<u8> {
        format!(" {{\"tag_name\":\"{tag}\",\"html_url\":\"https://github.com/video-dev/hls.js/releases/tag/{tag}\",\"published_at\":\"2026-10-27T00:00:00Z\",\"draft\":false,\"prerelease\":false,\"future\":{{\"exact\":18446744073709551617,\"unknown\":null}}}}\n").into_bytes()
    }
    #[test]
    fn fixed_sources_reject_urls_and_unknown_routes() {
        for bad in [
            "",
            "https://api.github.com/repos/private/repo",
            "../file",
            "HLS",
            "new-unreviewed",
        ] {
            assert!(Source::parse(bad).is_err());
        }
        assert_eq!(
            Source::Hls.endpoint(),
            "https://api.github.com/repos/video-dev/hls.js/releases/latest"
        );
    }
    #[test]
    fn exact_body_and_identity_are_preserved() {
        let bytes = fixture("v1.7.3");
        let record = parse_record(Source::Hls, &bytes).unwrap();
        assert_eq!(record.payload.as_bytes(), bytes);
        assert_eq!(record.revision, "v1.7.3");
        assert!(parse_record(Source::SerdeJson, &bytes).is_err());
        let text = String::from_utf8(bytes).unwrap();
        for bad in [
            text.replace("releases/tag/v1.7.3", "releases/tag/wrong"),
            text.replace("\"draft\":false", "\"draft\":true"),
            text.replace("\"prerelease\":false", "\"prerelease\":true"),
            text.replace("\"tag_name\":", "\"tag_name\":\"duplicate\",\"tag_name\":"),
            text.replace("18446744073709551617", "1e400"),
        ] {
            assert!(parse_record(Source::Hls, bad.as_bytes()).is_err());
        }
    }
    #[test]
    fn prerelease_tag_is_refused_even_when_provider_flag_is_false() {
        for tag in ["v3.0.0-alpha.5", "v1.7.5-rc.1", "nightly", "latest"] {
            let bytes = fixture(tag);
            assert!(parse_new_record(Source::Hls, &bytes).is_err());
            assert_eq!(
                parse_record(Source::Hls, &bytes)
                    .unwrap()
                    .payload
                    .as_bytes(),
                bytes
            );
        }
        let bytes = fixture("v1.7.4+build.001");
        assert_eq!(
            parse_new_record(Source::Hls, &bytes)
                .unwrap()
                .payload
                .as_bytes(),
            bytes
        );
    }
    #[test]
    fn commit_checkpoint_is_one_exact_commit() {
        let sha = "a".repeat(40);
        let body = format!(
            r#"[{{"sha":"{sha}","html_url":"https://github.com/RustSec/advisory-db/commit/{sha}","commit":{{"committer":{{"date":"2026-10-27T10:02:42Z"}}}}}}]"#
        );
        assert_eq!(
            parse_record(Source::RustSec, body.as_bytes())
                .unwrap()
                .revision,
            sha
        );
        assert!(parse_record(Source::RustSec, b"[]").is_err());
        assert!(
            parse_record(
                Source::RustSec,
                body.replace("/commit/", "/tree/").as_bytes()
            )
            .is_err()
        );
        assert!(
            parse_record(
                Source::RustSec,
                body.replace("\"sha\":", "\"sha\":\"bad\",\"sha\":")
                    .as_bytes()
            )
            .is_err()
        );
    }
    #[test]
    fn reset_is_epoch_time_and_retry_after_is_seconds() {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert("x-ratelimit-remaining", "0".parse().unwrap());
        h.insert("x-ratelimit-reset", "1000".parse().unwrap());
        assert_eq!(response_meta(200, &h, 100, 0).next_allowed_epoch, 1001);
        h.insert("retry-after", "2000".parse().unwrap());
        assert_eq!(response_meta(429, &h, 100, 0).next_allowed_epoch, 2100);
        let empty = reqwest::header::HeaderMap::new();
        assert_eq!(response_meta(403, &empty, 100, 3).next_allowed_epoch, 580);
        h.insert("retry-after", u64::MAX.to_string().parse().unwrap());
        assert_eq!(response_meta(429, &h, 100, 0).next_allowed_epoch, i64::MAX);
    }
}
