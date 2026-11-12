mod database;

use serde::Serialize;
use std::{fs, io::{BufRead, BufReader, Write}, net::TcpListener, path::PathBuf, thread, time::Duration};
use tauri::{AppHandle, Emitter, Manager};
use url::Url;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeProfile {
    application: &'static str,
    version: &'static str,
    operating_system: &'static str,
    architecture: &'static str,
    logical_cores: usize,
    native_shell: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SpotifyCallback {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
    redirect_uri: String,
}

fn snapshot_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Unable to resolve application data directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create application data directory: {error}"))?;
    Ok(directory.join("living-world-snapshot.json"))
}

#[tauri::command]
fn runtime_profile() -> RuntimeProfile {
    RuntimeProfile {
        application: "Feature Foundry",
        version: env!("CARGO_PKG_VERSION"),
        operating_system: std::env::consts::OS,
        architecture: std::env::consts::ARCH,
        logical_cores: std::thread::available_parallelism()
            .map(usize::from)
            .unwrap_or(1),
        native_shell: true,
    }
}

#[tauri::command]
fn save_world_snapshot(app: AppHandle, state: String) -> Result<String, String> {
    serde_json::from_str::<serde_json::Value>(&state)
        .map_err(|error| format!("World snapshot is not valid JSON: {error}"))?;
    let path = snapshot_path(&app)?;
    fs::write(&path, state)
        .map_err(|error| format!("Unable to save world snapshot: {error}"))?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn load_world_snapshot(app: AppHandle) -> Result<Option<String>, String> {
    let path = snapshot_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path)
        .map(Some)
        .map_err(|error| format!("Unable to load world snapshot: {error}"))
}

#[tauri::command]
fn start_spotify_callback(app: AppHandle) -> Result<String, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|error| format!("Unable to start the Spotify loopback callback: {error}"))?;
    listener.set_nonblocking(true).map_err(|error| error.to_string())?;
    let port = listener.local_addr().map_err(|error| error.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{port}/callback");
    let event_redirect = redirect_uri.clone();
    thread::spawn(move || {
        for _ in 0..3000 {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    let request_line = {
                        let mut reader = BufReader::new(&mut stream);
                        let mut line = String::new();
                        let _ = reader.read_line(&mut line);
                        line
                    };
                    let target = request_line.split_whitespace().nth(1).unwrap_or("/callback?error=invalid_request");
                    let parsed = Url::parse(&format!("http://127.0.0.1:{port}{target}")).ok();
                    let query = |key: &str| parsed.as_ref().and_then(|url| url.query_pairs().find(|(name, _)| name == key).map(|(_, value)| value.into_owned()));
                    let payload = SpotifyCallback {
                        code: query("code"),
                        state: query("state"),
                        error: query("error"),
                        redirect_uri: event_redirect.clone(),
                    };
                    let body = "<!doctype html><meta charset=utf-8><title>Feature Foundry</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#06181c;color:#eafff2;font:16px system-ui}main{padding:32px;border:1px solid #6fd9aa55;border-radius:24px;background:#0c292dcc;text-align:center}b{display:block;font-size:22px;margin-bottom:8px}</style><main><b>Spotify connected to Feature Foundry.</b>You can close this tab and return to the living world.</main>";
                    let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", body.len(), body);
                    let _ = stream.write_all(response.as_bytes());
                    let _ = stream.flush();
                    let _ = app.emit("spotify-oauth-callback", payload);
                    return;
                }
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => thread::sleep(Duration::from_millis(100)),
                Err(_) => return,
            }
        }
    });
    Ok(redirect_uri)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            database::initialize(app.handle())
                .map_err(std::io::Error::other)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            runtime_profile,
            save_world_snapshot,
            load_world_snapshot,
            start_spotify_callback,
            database::catalog_summary,
            database::list_music_routes,
            database::assign_room_soundtrack,
            database::room_soundtrack,
            database::record_native_history
        ])
        .run(tauri::generate_context!())
        .expect("Feature Foundry native runtime failed");
}
