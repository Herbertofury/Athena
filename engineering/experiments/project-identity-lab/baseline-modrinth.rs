//! Read-only public project metadata. Not a complete catalogue, download client or account integration.
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    time::{Duration, Instant},
};

const MAX_BODY: u64 = 2 * 1024 * 1024;
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub description: String,
    /// Exact long description text. None means absent/legacy, not verified empty.
    #[serde(default)]
    pub body: Option<String>,
    pub project_type: String,
    pub versions: Vec<String>,
    #[serde(default)]
    pub icon_url: Option<String>,
    #[serde(default)]
    pub gallery: Option<Vec<GalleryMedia>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalleryMedia {
    pub url: String,
    pub raw_url: Option<String>,
    pub featured: bool,
    pub title: Option<String>,
    pub description: Option<String>,
    pub created: String,
    pub ordering: i64,
}

pub fn project_url(id: &str) -> Result<String, &'static str> {
    if id.is_empty()
        || id.len() > 128
        || !id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err("Expected a Modrinth project ID or slug, not a URL or path");
    }
    Ok(format!("https://api.modrinth.com/v2/project/{id}"))
}

pub fn parse_project(body: &[u8]) -> Result<Project, Box<dyn std::error::Error>> {
    if body.len() as u64 > MAX_BODY {
        return Err("Response exceeds size budget".into());
    }
    let project: Project = serde_json::from_slice(body)?;
    validate_project(&project)?;
    Ok(project)
}

fn validate_project(project: &Project) -> Result<(), Box<dyn std::error::Error>> {
    if project.id.len() != 8 || !project.id.bytes().all(|b| b.is_ascii_alphanumeric()) {
        return Err("Invalid canonical project identifier".into());
    }
    project_url(&project.slug)?;
    if project.title.trim().is_empty() {
        return Err("Missing project title".into());
    }
    Ok(())
}

/// Bounded canonical-ID lane. Missing projects are explicit, never successful empty snapshots.
#[derive(Debug, Serialize)]
pub struct ProjectBatch {
    pub requested_ids: Vec<String>,
    pub projects: Vec<Project>,
    pub missing_ids: Vec<String>,
}

pub fn projects_url(ids: &[String]) -> Result<String, Box<dyn std::error::Error>> {
    if ids.is_empty() || ids.len() > 20 {
        return Err("Batch requires 1..=20 canonical project IDs".into());
    }
    let mut unique = HashSet::new();
    for id in ids {
        if id.len() != 8 || !id.bytes().all(|b| b.is_ascii_alphanumeric()) || !unique.insert(id) {
            return Err("Batch IDs must be unique eight-character canonical IDs".into());
        }
    }
    let mut url = reqwest::Url::parse("https://api.modrinth.com/v2/projects")?;
    url.query_pairs_mut()
        .append_pair("ids", &serde_json::to_string(ids)?);
    Ok(url.into())
}

pub fn parse_projects(
    body: &[u8],
    ids: &[String],
) -> Result<ProjectBatch, Box<dyn std::error::Error>> {
    projects_url(ids)?;
    if body.len() as u64 > MAX_BODY {
        return Err("Response exceeds size budget; no partial snapshot accepted".into());
    }
    let projects: Vec<Project> = serde_json::from_slice(body)?;
    let mut by_id = HashMap::new();
    for project in projects {
        validate_project(&project)?;
        if !ids.contains(&project.id) || by_id.contains_key(&project.id) {
            return Err("Unexpected or duplicate project in batch response".into());
        }
        by_id.insert(project.id.clone(), project);
    }
    let mut result = ProjectBatch {
        requested_ids: ids.to_vec(),
        projects: Vec::new(),
        missing_ids: Vec::new(),
    };
    for id in ids {
        if let Some(project) = by_id.remove(id) {
            result.projects.push(project);
        } else {
            result.missing_ids.push(id.clone());
        }
    }
    Ok(result)
}

pub struct PublicClient {
    client: reqwest::blocking::Client,
    next_request: Instant,
}
impl PublicClient {
    pub fn new() -> Result<Self, reqwest::Error> {
        Ok(Self {client: reqwest::blocking::Client::builder()
            .user_agent("Herbertofury/Engineering-Atlas/0.1.0 (https://github.com/Herbertofury/Engineering-Atlas)")
            .https_only(true).redirect(reqwest::redirect::Policy::none())
            .connect_timeout(Duration::from_secs(10)).timeout(Duration::from_secs(30))
            .build()?, next_request: Instant::now()})
    }
    pub fn project(&mut self, id: &str) -> Result<Project, Box<dyn std::error::Error>> {
        let url = project_url(id)?;
        parse_project(&self.request_json(&url)?)
    }
    pub fn projects(&mut self, ids: &[String]) -> Result<ProjectBatch, Box<dyn std::error::Error>> {
        let url = projects_url(ids)?;
        parse_projects(&self.request_json(&url)?, ids)
    }
    pub fn versions(
        &mut self,
        ids: &[String],
    ) -> Result<crate::modrinth_versions::VersionBatch, Box<dyn std::error::Error>> {
        let url = crate::modrinth_versions::versions_url(ids)?;
        crate::modrinth_versions::parse_versions(&self.request_json(&url)?, ids)
    }
    pub fn cooldown_remaining(&self) -> Duration {
        self.next_request.saturating_duration_since(Instant::now())
    }
    fn request_json(&mut self, url: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        if Instant::now() < self.next_request {
            return Err("Provider cooldown active; retry later".into());
        }
        // Serial client caps request initiation at one per second, below the documented nominal limit.
        self.next_request = Instant::now() + Duration::from_secs(1);
        let response = self.client.get(url).send()?;
        let status = response.status();
        if status.as_u16() == 429 {
            let seconds = response
                .headers()
                .get("x-ratelimit-reset")
                .and_then(|h| h.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(60);
            self.next_request = Instant::now() + Duration::from_secs(seconds.clamp(1, 86400));
            return Err("Provider rate limited the request; no snapshot changed".into());
        }
        if !status.is_success() {
            return Err(format!(
                "Provider returned HTTP {}; no snapshot changed",
                status.as_u16()
            )
            .into());
        }
        crate::public_http::read_json_response(response, MAX_BODY)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn long_body_is_retained_exactly_without_executing_markup() {
        let text =
            "# Fixture\n![image](https://example.invalid/a.png)\n<script>not executed</script>\n"
                .repeat(1000);
        let mut value = batch_fixture("AANobbMI");
        value["body"] = text.clone().into();
        let bytes = serde_json::to_vec(&value).unwrap();
        let project = parse_project(&bytes).unwrap();
        assert_eq!(project.body.as_deref(), Some(text.as_str()));
        let batch = parse_projects(
            &serde_json::to_vec(&vec![value]).unwrap(),
            &["AANobbMI".into()],
        )
        .unwrap();
        assert_eq!(batch.projects[0].body, project.body);
        let roundtrip: Project =
            serde_json::from_slice(&serde_json::to_vec(&project).unwrap()).unwrap();
        assert_eq!(roundtrip.body, project.body);
    }
    #[test]
    fn absent_body_is_distinct_from_empty_and_invalid_body_is_rejected() {
        let mut value = batch_fixture("AANobbMI");
        assert!(
            parse_project(&serde_json::to_vec(&value).unwrap())
                .unwrap()
                .body
                .is_none()
        );
        value["body"] = "".into();
        assert_eq!(
            parse_project(&serde_json::to_vec(&value).unwrap())
                .unwrap()
                .body
                .as_deref(),
            Some("")
        );
        value["body"] = serde_json::json!({"unexpected":"object"});
        assert!(parse_project(&serde_json::to_vec(&value).unwrap()).is_err());
    }
    #[test]
    fn an_immediate_second_call_is_rejected_before_transport() {
        let mut client = PublicClient::new().unwrap();
        client.next_request = Instant::now() + Duration::from_secs(1);
        let error = client.project("sodium").unwrap_err().to_string();
        assert!(error.contains("cooldown active"));
        assert!(!client.cooldown_remaining().is_zero());
    }

    fn batch_fixture(id: &str) -> serde_json::Value {
        serde_json::json!({"id":id,"slug":format!("fixture-{id}"),"title":"Fixture","description":"Complete fixture","project_type":"mod","versions":["version1"],"gallery":[]})
    }
    #[test]
    fn batch_preserves_request_order_and_explicit_missing() {
        let ids = vec!["AANobbMI".into(), "P7dR8mSH".into(), "abcdefgh".into()];
        let body = serde_json::to_vec(&vec![batch_fixture("P7dR8mSH"), batch_fixture("AANobbMI")])
            .unwrap();
        let batch = parse_projects(&body, &ids).unwrap();
        assert_eq!(
            batch
                .projects
                .iter()
                .map(|p| p.id.as_str())
                .collect::<Vec<_>>(),
            vec!["AANobbMI", "P7dR8mSH"]
        );
        assert_eq!(batch.missing_ids, vec!["abcdefgh"]);
        assert_eq!(batch.requested_ids, ids);
        for p in batch.projects {
            assert_eq!(p.versions, vec!["version1"]);
            assert_eq!(p.gallery.unwrap().len(), 0);
        }
    }
    #[test]
    fn batch_rejects_duplicates_unknown_ids_and_invalid_later_records() {
        let ids = vec!["AANobbMI".into()];
        for values in [
            vec![batch_fixture("P7dR8mSH")],
            vec![batch_fixture("AANobbMI"), batch_fixture("AANobbMI")],
            vec![
                batch_fixture("AANobbMI"),
                serde_json::json!({"id":"P7dR8mSH"}),
            ],
        ] {
            assert!(parse_projects(&serde_json::to_vec(&values).unwrap(), &ids).is_err());
        }
    }
    #[test]
    fn thousand_batch_permutations_preserve_complete_project_projection() {
        for case in 0..1000 {
            let count = case % 20 + 1;
            let ids: Vec<String> = (0..count)
                .map(|i| format!("{:08}", case * 20 + i))
                .collect();
            let values: Vec<serde_json::Value> = ids
                .iter()
                .enumerate()
                .filter(|(i, _)| (i + case) % 3 != 0)
                .map(|(_, id)| batch_fixture(id))
                .collect();
            let expected: Vec<serde_json::Value> = values
                .iter()
                .map(|v| {
                    serde_json::to_value(parse_project(&serde_json::to_vec(v).unwrap()).unwrap())
                        .unwrap()
                })
                .collect();
            let reversed: Vec<_> = values.into_iter().rev().collect();
            let batch = parse_projects(&serde_json::to_vec(&reversed).unwrap(), &ids).unwrap();
            assert_eq!(
                serde_json::to_value(&batch.projects).unwrap(),
                serde_json::to_value(expected).unwrap()
            );
            assert_eq!(batch.projects.len() + batch.missing_ids.len(), ids.len());
        }
    }
    #[test]
    fn batch_limits_and_query_are_unambiguous() {
        for ids in [
            vec![],
            vec!["sodium".into()],
            vec!["AANobbMI".into(), "AANobbMI".into()],
            vec!["AANobbMI".into(); 21],
            vec!["../x?a=b".into()],
        ] {
            assert!(projects_url(&ids).is_err());
        }
        let ids = vec!["AANobbMI".into(), "P7dR8mSH".into()];
        let url = reqwest::Url::parse(&projects_url(&ids).unwrap()).unwrap();
        assert_eq!(url.host_str(), Some("api.modrinth.com"));
        assert_eq!(url.path(), "/v2/projects");
        assert_eq!(
            url.query_pairs().collect::<Vec<_>>(),
            vec![("ids".into(), serde_json::to_string(&ids).unwrap().into())]
        );
        assert!(parse_projects(&vec![b' '; MAX_BODY as usize + 1], &ids).is_err());
        assert_eq!(parse_projects(b"[]", &ids).unwrap().missing_ids, ids);
    }
    #[test]
    fn rejects_url_path_query_and_unicode_injection() {
        for id in [
            "",
            "../secret",
            "https://example.org",
            "a?b",
            "a#b",
            "%2f",
            "a\\b",
            "café",
        ] {
            assert!(project_url(id).is_err(), "{id}");
        }
    }
    #[test]
    fn gallery_is_not_silently_capped_at_eight() {
        let gallery: Vec<serde_json::Value> = (0..12).map(|i|serde_json::json!({"url":format!("https://cdn.modrinth.com/data/AANobbMI/{i}.webp"),"raw_url":format!("https://cdn.modrinth.com/data/AANobbMI/{i}.png"),"featured":false,"title":format!("Image {i}"),"description":null,"created":"2026-10-26T00:00:00Z","ordering":i})).collect();
        let body=serde_json::to_vec(&serde_json::json!({"id":"AANobbMI","slug":"sodium","title":"Fixture","description":"fixture","project_type":"mod","versions":[],"gallery":gallery})).unwrap();
        let p = parse_project(&body).unwrap();
        assert_eq!(p.gallery.as_ref().unwrap().len(), 12);
        assert_eq!(p.gallery.as_ref().unwrap()[11].ordering, 11);
        assert!(
            p.gallery.as_ref().unwrap()[11]
                .raw_url
                .as_ref()
                .unwrap()
                .ends_with("11.png")
        );
    }
    #[test]
    fn missing_gallery_is_unknown_not_verified_empty() {
        let mut value = serde_json::json!({"id":"AANobbMI","slug":"sodium","title":"Fixture","description":"fixture","project_type":"mod","versions":[]});
        assert!(
            parse_project(&serde_json::to_vec(&value).unwrap())
                .unwrap()
                .gallery
                .is_none()
        );
        value["gallery"] = serde_json::json!([]);
        assert!(
            parse_project(&serde_json::to_vec(&value).unwrap())
                .unwrap()
                .gallery
                .unwrap()
                .is_empty()
        );
    }
    #[test]
    fn accepts_id_or_slug() {
        assert_eq!(
            project_url("sodium").unwrap(),
            "https://api.modrinth.com/v2/project/sodium"
        );
    }
    #[test]
    fn requires_complete_typed_metadata() {
        assert!(parse_project(br#"{"id":"AANobbMI"}"#).is_err());
        let p=parse_project(br#"{"id":"AANobbMI","slug":"sodium","title":"Sodium","description":"fixture","project_type":"mod","versions":[],"additional_field":"forward-compatible"}"#).unwrap();
        assert_eq!(p.id, "AANobbMI");
    }
    #[test]
    fn limits_body_before_json_parse() {
        assert!(parse_project(&vec![b' '; MAX_BODY as usize + 1]).is_err());
    }
}
