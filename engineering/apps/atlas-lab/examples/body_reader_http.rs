//! Real loopback HTTP transport with retained public bytes; not a provider test.
#[path = "../src/public_http.rs"]
mod public_http;
#[path = "../../../experiments/body-reader-lab/reader.rs"]
mod reader;
use atlas_lab::{build_identity::sha256_hex, collection_failure::safe_message};
use public_http::read_json_response;
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    time::{Duration, Instant},
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
fn configure_fixture_socket(socket: &TcpStream) -> std::io::Result<()> {
    // Accepted socket mode is platform-dependent; timeouts need blocking I/O.
    socket.set_nonblocking(false)?;
    socket.set_write_timeout(Some(Duration::from_secs(1)))?;
    socket.set_read_timeout(Some(Duration::from_secs(1)))
}

fn fixture(
    body: &[u8],
    mode: &'static str,
) -> Result<(reqwest::blocking::Response, std::thread::JoinHandle<()>)> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    listener.set_nonblocking(true)?;
    let bytes = body.to_vec();
    let worker = std::thread::spawn(move || {
        let start = Instant::now();
        let mut socket = loop {
            match listener.accept() {
                Ok((s, _)) => break s,
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    assert!(start.elapsed() < Duration::from_secs(2));
                    std::thread::sleep(Duration::from_millis(2));
                }
                Err(e) => panic!("Fixture listener: {e}"),
            }
        };
        configure_fixture_socket(&socket).unwrap();
        // Consume the bounded fixture request before closing the response.
        // Closing with unread request bytes can reset chunked responses.
        let mut request = Vec::new();
        while !request.ends_with(b"\r\n\r\n") {
            assert!(request.len() < 8192, "Fixture request budget");
            let mut byte = [0];
            socket.read_exact(&mut byte).unwrap();
            request.push(byte[0]);
        }
        assert!(request.starts_with(b"GET /fixture HTTP/1.1\r\n"));
        let declared = if matches!(mode, "truncated" | "stalled") {
            bytes.len() + 100
        } else {
            bytes.len()
        };
        let kind = if mode == "wrong-type" {
            "text/html"
        } else {
            "application/json; charset=utf-8"
        };
        if mode == "chunked" {
            socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: {kind}\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n").as_bytes()).unwrap();
            for chunk in bytes.chunks(31) {
                socket
                    .write_all(format!("{:x}\r\n", chunk.len()).as_bytes())
                    .unwrap();
                socket.write_all(chunk).unwrap();
                socket.write_all(b"\r\n").unwrap();
            }
            socket.write_all(b"0\r\n\r\n").unwrap();
        } else {
            socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: {kind}\r\nContent-Length: {declared}\r\nConnection: close\r\n\r\n").as_bytes()).unwrap();
            socket.write_all(&bytes).unwrap();
            if mode == "stalled" {
                std::thread::sleep(Duration::from_millis(500));
            }
        }
    });
    let response = reqwest::blocking::Client::builder()
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_millis(250))
        .build()?
        .get(format!("http://{address}/fixture"))
        .send()?;
    Ok((response, worker))
}
fn candidate(response: reqwest::blocking::Response, max: u64) -> Result<Vec<u8>> {
    let kind = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if !kind
        .split(';')
        .next()
        .unwrap_or("")
        .trim()
        .eq_ignore_ascii_case("application/json")
    {
        return Err("Expected a JSON response".into());
    }
    let size = response.content_length();
    reader::adaptive(response, max, size)
}
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 2 {
        return Err("Supply retained public response path".into());
    }
    let mut body = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut body)?;
    if body.is_empty() || body.len() > 2 * 1024 * 1024 {
        return Err("Input budget".into());
    }
    // Keep alternative implementations linked and reviewable without timing them here.
    let _ = reader::baseline(&b""[..], 0, None)?;
    let _ = reader::reserved(&b""[..], 0, None)?;
    let mut rows = Vec::new();
    for mode in [
        "known",
        "chunked",
        "truncated",
        "stalled",
        "wrong-type",
        "over-budget",
    ] {
        let mut outcomes = Vec::new();
        for lane in ["baseline", "adaptive"] {
            let (response, worker) = fixture(&body, mode)?;
            let max = if mode == "over-budget" {
                body.len() as u64 - 1
            } else {
                2 * 1024 * 1024
            };
            let result = if lane == "baseline" {
                read_json_response(response, max)
            } else {
                candidate(response, max)
            };
            worker.join().map_err(|_| "Fixture thread failed")?;
            let success = matches!(mode, "known" | "chunked");
            if result.is_ok() != success {
                eprintln!(
                    "Unexpected state: mode={mode}, lane={lane}, accepted={}, safe_error={:?}",
                    result.is_ok(),
                    result.as_ref().err().map(|e| safe_message(e.as_ref()))
                );
                return Err("Unexpected acceptance state".into());
            }
            let message = match result {
                Ok(bytes) => {
                    if bytes != body {
                        return Err("Full body differs".into());
                    }
                    None
                }
                Err(error) => Some(safe_message(error.as_ref())),
            };
            outcomes.push(message);
            rows.push(serde_json::json!({"mode":mode,"lane":lane,"accepted":success,"complete_bytes_equal":success,"safe_error":message}));
        }
        if outcomes[0] != outcomes[1] {
            return Err("Rejection diagnostics differ".into());
        }
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"compiler":env!("ATLAS_RUSTC_VERSION"),"profile":env!("ATLAS_BUILD_PROFILE"),"target":env!("ATLAS_BUILD_TARGET"),"lock_sha256":sha256_hex(include_bytes!("../Cargo.lock")),"schema_version":1,"complete":rows.len()==12,"input_sha256":sha256_hex(&body),"input_bytes":body.len(),"samples":rows,"baseline_reader_sha256":sha256_hex(include_bytes!("../src/public_http.rs")),"reader_sha256":sha256_hex(include_bytes!("../../../experiments/body-reader-lab/reader.rs")),"harness_sha256":sha256_hex(include_bytes!("body_reader_http.rs")),"scope":"Actual reqwest blocking transport on owned loopback fixtures; baseline uses actual app shared JSON reader; not live provider, latency or API permission acceptance"})
        )?
    );
    Ok(())
}

#[cfg(test)]
mod budget_tests {
    use super::*;
    #[test]
    fn accepted_nonblocking_socket_waits_for_delayed_request_bytes() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let mut client = TcpStream::connect(listener.local_addr().unwrap()).unwrap();
        let (mut server, _) = listener.accept().unwrap();
        // Model platforms where accept inherits nonblocking mode explicitly.
        server.set_nonblocking(true).unwrap();
        configure_fixture_socket(&server).unwrap();
        let worker = std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(50));
            client.write_all(b"G").unwrap();
        });
        let mut byte = [0];
        let result = server.read_exact(&mut byte);
        worker.join().unwrap();
        result.unwrap();
        assert_eq!(&byte, b"G");
        assert_eq!(server.read_timeout().unwrap(), Some(Duration::from_secs(1)));
        assert_eq!(
            server.write_timeout().unwrap(),
            Some(Duration::from_secs(1))
        );
    }

    #[test]
    fn impossible_budget_is_rejected_without_empty_success() {
        let (response, worker) = fixture(b"{}", "known").unwrap();
        let result = read_json_response(response, u64::MAX);
        worker.join().unwrap();
        assert!(
            result.is_err(),
            "Impossible budget must not succeed with an empty body"
        );
    }
}
