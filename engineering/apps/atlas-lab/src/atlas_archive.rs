//! Read-only historical evidence. Only specifically reviewed Markdown and JSON are available offline;
//! the manifest also indexes archived files that the runtime does not serve.
use axum::{
    Router,
    extract::Path,
    http::{HeaderMap, StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::get,
};
const BASE: &str = "text/plain; charset=utf-8";
const MANIFEST: &str =
    include_str!("../../../../migration/engineering-atlas/historical-evidence/manifest.json");
macro_rules! documents {
    ($($object:literal => $file:literal),* $(,)?) => {
        const DOCS: &[(&str, &str, &str)] = &[
            $(($object, $file, include_str!(concat!(
                "../../../../migration/engineering-atlas/historical-evidence/", $object, "/", $file
            )))),*
        ];
    };
}
documents! {
    "de2d45eeee54ee45387016404a3c51a150a35e22" => "README.md",
    "04de8ad5002a5c4941f02ef04bbd515f75b06936" => "README.md",
    "c2472667b88a1ff28814b40cd056c861b0cd7e38" => "README.md",
    "c2472667b88a1ff28814b40cd056c861b0cd7e38" => "results-table.md",
    "a4f6547a1a6f03ca16068b4b122b27059ccc982b" => "README.md",
    "a4f6547a1a6f03ca16068b4b122b27059ccc982b" => "results-table.md",
    "2d78181ff6884e546fb3e02a7400a6261681ab30" => "README.md",
    "dfdbcb7ddbf3b705bcece41a19eb5338cab27b3a" => "README.md",
    "314f6c534256378a6ccd09ab29cb5314ddb6146e" => "README.md",
    "b6024f95b71063390b45bc0c43055f8ba276b633" => "README.md",
    "4d3d405f0ec6e3d251f2f6ad21cfcac9da9221ff" => "README.md",
    "38ec3cc8f4e895c2cf840e0223f2799cbf47c0fd" => "README.md",
    "7009b2fecceca31f30036bccc0e9c11ab705956a" => "README.md",
    "e23d0012c2f05ad56d8e08dae4e3dbf5bc465e10" => "README.md",
    "d059ad40926f64cd1919be8e70d4c6c411c81433" => "README.md",
    "169d7630a29c06a74182509f884640466241730e" => "README.md",
    "cd7d25e44fdac724f092df6fff4a859ec8cf4ede" => "README.md",
    "0fc77cfd619dccd21deed7ed0bec60e9ccce2da5" => "README.md",
    "7a0a39656772fdf53d7d997577d6532342436cfc" => "README.md",
    "bab282e3b75965d3391b37b259273658904b78da" => "README.md",
}

const RECEIPTS: &[(&str, &str, &str)] = &[
    (
        "2d78181ff6884e546fb3e02a7400a6261681ab30",
        "verification.json",
        include_str!(
            "../../../../migration/engineering-atlas/historical-evidence/2d78181ff6884e546fb3e02a7400a6261681ab30/verification.json"
        ),
    ),
    (
        "4d3d405f0ec6e3d251f2f6ad21cfcac9da9221ff",
        "final-summary.json",
        include_str!(
            "../../../../migration/engineering-atlas/historical-evidence/4d3d405f0ec6e3d251f2f6ad21cfcac9da9221ff/final-summary.json"
        ),
    ),
    (
        "0fc77cfd619dccd21deed7ed0bec60e9ccce2da5",
        "summary.json",
        include_str!(
            "../../../../migration/engineering-atlas/historical-evidence/0fc77cfd619dccd21deed7ed0bec60e9ccce2da5/summary.json"
        ),
    ),
];

fn document(object: &str, file: &str) -> Option<&'static str> {
    DOCS.iter()
        .chain(RECEIPTS)
        .find(|(id, name, _)| *id == object && *name == file)
        .map(|(_, _, content)| *content)
}

async fn read_document(Path((object, file)): Path<(String, String)>) -> Response {
    let Some(text) = document(&object, &file) else {
        return StatusCode::NOT_FOUND.into_response();
    };
    let headers = [
        (header::CONTENT_TYPE, BASE),
        (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
        (
            header::CONTENT_SECURITY_POLICY,
            "default-src 'none'; sandbox",
        ),
    ];
    (headers, text).into_response()
}

async fn manifest() -> impl IntoResponse {
    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "application/json".parse().unwrap());
    headers.insert(
        "x-athena-snapshot-sha256",
        crate::build_identity::sha256_hex(MANIFEST.as_bytes())
            .parse()
            .unwrap(),
    );
    (headers, MANIFEST)
}

pub(crate) fn router() -> Router {
    Router::new()
        .route(
            "/migration/atlas",
            get(|| async { Html(include_str!("../ui/atlas-archive.html")) }),
        )
        .route(
            "/migration/atlas/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/atlas-archive.js"),
                )
            }),
        )
        .route("/api/migration/atlas", get(manifest))
        .route("/api/migration/atlas/{object}/{file}", get(read_document))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_reviewed_notes_and_exact_receipts_are_embedded() {
        let manifest: serde_json::Value = serde_json::from_str(MANIFEST).unwrap();
        let targets = manifest["targets"].as_array().unwrap();
        assert_eq!(targets.len(), 19);
        let mut count = 0;
        for target in targets {
            let id = target["source_object"].as_str().unwrap();
            for file in target["files"].as_array().unwrap() {
                let name = file["path"].as_str().unwrap();
                let doc = document(id, name);
                if matches!(name, "README.md" | "results-table.md")
                    || RECEIPTS
                        .iter()
                        .any(|(key, file, _)| *key == id && *file == name)
                {
                    let text = doc.expect("manifest document must be available offline");
                    if name.ends_with(".json") {
                        let receipt: serde_json::Value = serde_json::from_str(text).unwrap();
                        assert!(receipt.is_object());
                    }
                    assert!(!text.is_empty());
                    assert!(text.len() <= 64 * 1024);
                    count += 1;
                } else {
                    assert!(doc.is_none(), "{name} should not be served");
                }
            }
        }
        assert_eq!(count, 23);
        assert_eq!(count, DOCS.len() + RECEIPTS.len());
        assert!(document("../../", "README.md").is_none());
    }
}
