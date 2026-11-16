//! Isolated candidate. Reuses the checked JSON validator, preserving original outer whitespace separately.
pub use atlas_lab::upstream_reviews::{MAX_BODY, Source};
use serde::Deserialize;
use std::error::Error;
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
    atlas_lab::validated_raw::validate_json(std::str::from_utf8(bytes)?)?;
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
