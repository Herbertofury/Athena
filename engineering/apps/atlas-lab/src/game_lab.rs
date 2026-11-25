//! Native Athena consumer for the source-pinned, host-neutral game stages.
//! Route assets are compiled in and allowlisted. No iframe, storage, account,
//! arbitrary file reads, or local native jobs are attached to these routes.
use axum::{Router, http::header, response::Html, routing::get};
use std::sync::OnceLock;

macro_rules! survivor {
    ($file:literal) => {
        include_str!(concat!("../../../../engines/roguelite/", $file))
    };
}
macro_rules! city {
    ($file:literal) => {
        include_str!(concat!("../../../../engines/mascot-open-world/", $file))
    };
}

const ARENA: &str = survivor!("preview/arena-template.html");
const CITY: &str = city!("preview/city.html");
static ARENA_HTML: OnceLock<String> = OnceLock::new();
static CITY_HTML: OnceLock<String> = OnceLock::new();
const LABEL: &str = r#"<nav aria-label="Engine Foundry"><a href="/play">Engine Foundry Play Lab</a> · <a href="/#build">Athena Foundry</a></nav>"#;

fn page(template: &str, bundle_marker: &str, script: &str) -> String {
    // The locally served style/module source is the standalone preview
    // source. Remove its standalone CSP and use the parent native CSP.
    let html = template
        .lines()
        .filter(|line| !line.starts_with("<meta http-equiv=\"Content-Security-Policy\""))
        .collect::<Vec<_>>()
        .join("\n");
    let (top, rest) = html.split_once("<style>").expect("pinned preview style");
    let (_, body) = rest.split_once("</style>").expect("pinned preview style");
    let doc = format!("{top}<link rel=\"stylesheet\" href=\"./style.css\">{body}");
    doc.replace("<main>", &format!("<main>{LABEL}")).replace(
        bundle_marker,
        &format!("<script type=\"module\" src=\"{script}\"></script>"),
    )
}
fn style(template: &'static str) -> &'static str {
    template
        .split_once("<style>")
        .and_then(|(_, tail)| tail.split_once("</style>"))
        .expect("pinned preview style")
        .0
}

macro_rules! js {
    ($bytes:expr) => {
        (
            [
                (header::CONTENT_TYPE, "text/javascript; charset=utf-8"),
                (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
            ],
            $bytes,
        )
    };
}
macro_rules! route_modules {
    ($router:expr, $prefix:literal, $intake:ident, [$($file:literal),+ $(,)?]) => {
        $router$(.route(concat!($prefix,$file),get(|| async {js!($intake!($file))})))+
    };
}

pub(crate) fn router() -> Router {
    let router = Router::new()
        .route(
            "/play",
            get(|| async { Html(include_str!("../ui/game-lab.html")) }),
        )
        .route(
            "/play/survivor/",
            get(|| async {
                Html(
                    ARENA_HTML
                        .get_or_init(|| {
                            page(ARENA, "<script>__BUNDLE__</script>", "./preview/host.mjs")
                        })
                        .as_str(),
                )
            }),
        )
        .route(
            "/play/city/",
            get(|| async {
                Html(
                    CITY_HTML
                        .get_or_init(|| {
                            page(CITY, "<script>__CODE__</script>", "./preview/host.mjs")
                        })
                        .as_str(),
                )
            }),
        )
        .route(
            "/play/survivor/style.css",
            get(|| async { ([(header::CONTENT_TYPE, "text/css")], style(ARENA)) }),
        )
        .route(
            "/play/city/style.css",
            get(|| async { ([(header::CONTENT_TYPE, "text/css")], style(CITY)) }),
        )
        .route(
            "/play/survivor/preview/host.mjs",
            get(|| async {
                js!(concat!(
                    "import {createLegacySurvivorRun} from '../src/legacy-survivor-run.mjs';\n",
                    survivor!("preview/arena-browser.js")
                ))
            }),
        )
        .route(
            "/play/city/preview/host.mjs",
            get(|| async {
                js!(concat!(
                    "import {createCityTraversal,authoredCityGeometry} from '../src/city-traversal.mjs';\n",
                    city!("preview/city-browser.js")
                ))
            }),
        );
    let router = route_modules!(
        router,
        "/play/survivor/",
        survivor,
        [
            "src/gamesync-spawn-formulas.mjs",
            "src/gamesync-pickup-formulas.mjs",
            "src/gamesync-movement-formulas.mjs",
            "src/gamesync-upgrade-formulas.mjs",
            "src/upgrade-draft.mjs",
            "src/gamesync-combat-formulas.mjs",
            "src/legacy-survivor-run.mjs"
        ]
    );
    route_modules!(
        router,
        "/play/city/",
        city,
        ["src/gamesync-city-formulas.mjs", "src/city-traversal.mjs"]
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn native_templates_keep_preview_controls_and_use_external_styles_and_modules() {
        for (doc, marker) in [(ARENA, "BUNDLE"), (CITY, "CODE")] {
            let expected = format!("<script>__{marker}__</script>");
            let out = page(doc, &expected, "./preview/host.mjs");
            assert!(out.contains(LABEL));
            assert!(out.contains("rel=\"stylesheet\" href=\"./style.css\""));
            assert!(out.contains("type=\"module\" src=\"./preview/host.mjs\""));
            assert!(!out.contains("<style>") && !out.contains("<iframe"));
            assert!(!out.contains(&expected) && !out.contains("Content-Security-Policy"));
            assert!(style(doc).contains("color-scheme"));
        }
    }
}
