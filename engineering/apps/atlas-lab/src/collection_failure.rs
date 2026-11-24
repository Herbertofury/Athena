//! Safe collection diagnostics: categories only, never raw URLs, headers or response bodies.
use std::error::Error;

// Blocking response reads wrap reqwest errors in io::Error. Inspect typed
// causes without formatting them. Bound traversal even for cyclic errors.
fn transport_error<'a>(error: &'a (dyn Error + 'static)) -> Option<&'a reqwest::Error> {
    let mut current = Some(error);
    for _ in 0..16 {
        let cause = current?;
        if let Some(transport) = cause.downcast_ref::<reqwest::Error>() {
            return Some(transport);
        }
        current = if let Some(io) = cause.downcast_ref::<std::io::Error>() {
            io.get_ref().map(|inner| inner as &(dyn Error + 'static))
        } else {
            cause.source()
        };
    }
    None
}

pub fn safe_message(error: &(dyn Error + 'static)) -> &'static str {
    if let Some(e) = transport_error(error) {
        if e.is_timeout() {
            return "Collection request timed out; previous results are retained";
        }
        if e.is_dns() {
            return "Collection hostname could not be resolved; previous results are retained";
        }
        if e.is_connect() {
            return "Collection connection failed; previous results are retained";
        }
        if e.is_decode() || e.is_body() {
            return "Collection response transport failed; previous results are retained";
        }
        return "Collection transport failed; previous results are retained";
    }
    if error.is::<serde_json::Error>() {
        return "Collection response was not valid expected JSON; previous results are retained";
    }
    // These strings are only matched, never copied to output. Unknown text stays private.
    match error.to_string().as_str() {
        "Provider cooldown active; retry later"
        | "Provider cooldown active; retry later; previous results retained" => {
            "Provider cooldown active; retry later; previous results are retained"
        }
        "Provider rate limited the request; no snapshot changed" => {
            "Provider rate limited collection; previous results are retained"
        }
        "Collection cancelled before request; previous results retained" => {
            "Collection cancelled before request; previous results are retained"
        }
        "Response exceeds size budget"
        | "Response exceeds size budget; no partial snapshot accepted" => {
            "Collection response exceeded its size budget; previous results are retained"
        }
        _ => "Collection failed validation or provider checks; previous results are retained",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    // A timeout fixture must first receive a complete request. Sending an
    // unsolicited response can race Hyper's idle-connection checks before
    // the client has registered the request, testing the wrong failure stage.
    fn read_fixture_headers(reader: &mut impl std::io::Read) -> std::io::Result<()> {
        let mut header = Vec::with_capacity(512);
        let mut chunk = [0_u8; 512];
        loop {
            let limit = (8192 - header.len()).min(chunk.len());
            if limit == 0 {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "Fixture header budget exceeded",
                ));
            }
            let count = reader.read(&mut chunk[..limit])?;
            if count == 0 {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::UnexpectedEof,
                    "Incomplete fixture request",
                ));
            }
            header.extend_from_slice(&chunk[..count]);
            if header.windows(4).any(|bytes| bytes == b"\r\n\r\n") {
                return Ok(());
            }
        }
    }
    #[test]
    fn fixture_headers_require_terminator_and_bounded_input() {
        let mut incomplete = std::io::Cursor::new(b"GET / HTTP/1.1\r\nHost: fixture");
        assert_eq!(
            read_fixture_headers(&mut incomplete).unwrap_err().kind(),
            std::io::ErrorKind::UnexpectedEof
        );
        let mut oversized = std::io::Cursor::new(vec![b'x'; 8193]);
        assert_eq!(
            read_fixture_headers(&mut oversized).unwrap_err().kind(),
            std::io::ErrorKind::InvalidData
        );
        assert_eq!(
            oversized.position(),
            8192,
            "Do not read past the fixture budget"
        );
    }
    #[test]
    fn fixture_headers_accept_fragmented_complete_request() {
        struct Fragmented(std::io::Cursor<Vec<u8>>);
        impl std::io::Read for Fragmented {
            fn read(&mut self, buffer: &mut [u8]) -> std::io::Result<usize> {
                let limit = buffer.len().min(1);
                std::io::Read::read(&mut self.0, &mut buffer[..limit])
            }
        }
        let mut request = Fragmented(std::io::Cursor::new(
            b"GET / HTTP/1.1\r\nHost: fixture\r\n\r\n".to_vec(),
        ));
        read_fixture_headers(&mut request).unwrap();
    }
    #[test]
    fn body_read_timeout_keeps_safe_timeout_category() {
        use std::{
            io::Write,
            net::TcpListener,
            time::{Duration, Instant},
        };
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        listener.set_nonblocking(true).unwrap();
        let server = std::thread::spawn(move || {
            let start = Instant::now();
            loop {
                match listener.accept() {
                    Ok((mut socket, _)) => {
                        // Do not inherit the polling listener's nonblocking mode.
                        socket.set_nonblocking(false).unwrap();
                        socket
                            .set_read_timeout(Some(Duration::from_secs(1)))
                            .unwrap();
                        read_fixture_headers(&mut socket).unwrap();
                        socket
                            .set_write_timeout(Some(Duration::from_secs(1)))
                            .unwrap();
                        socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 100\r\nConnection: close\r\n\r\n{").unwrap();
                        std::thread::sleep(Duration::from_millis(500));
                        return;
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        assert!(start.elapsed() < Duration::from_secs(2));
                        std::thread::sleep(Duration::from_millis(5));
                    }
                    Err(e) => panic!("Fixture listener failed: {e}"),
                }
            }
        });
        let response = reqwest::blocking::Client::builder()
            .no_proxy()
            .timeout(Duration::from_millis(200))
            .build()
            .unwrap()
            .get(format!("http://{address}/?private=DO_NOT_DISCLOSE"))
            .send()
            .unwrap();
        let error = crate::public_http::read_json_response(response, 1024).unwrap_err();
        server.join().unwrap();
        assert_eq!(
            safe_message(error.as_ref()),
            "Collection request timed out; previous results are retained"
        );
    }
    #[test]
    fn transport_error_does_not_expose_attached_url() {
        let error = reqwest::blocking::Client::new()
            .get("not a URL")
            .build()
            .unwrap_err()
            .with_url(
                reqwest::Url::parse("https://example.invalid/?secret=DO_NOT_DISCLOSE").unwrap(),
            );
        let message = safe_message(&error);
        assert_eq!(
            message,
            "Collection transport failed; previous results are retained"
        );
        assert!(!message.contains("DO_NOT_DISCLOSE"));
        assert!(!message.contains("example.invalid"));
    }
    #[test]
    fn wrapped_transport_and_cyclic_causes_are_bounded_and_private() {
        let error = reqwest::blocking::Client::new()
            .get("not a URL")
            .build()
            .unwrap_err()
            .with_url(
                reqwest::Url::parse("https://example.invalid/?secret=DO_NOT_DISCLOSE").unwrap(),
            );
        let wrapped = std::io::Error::other(std::io::Error::other(error));
        assert_eq!(
            safe_message(&wrapped),
            "Collection transport failed; previous results are retained"
        );
        #[derive(Debug)]
        struct Cycle;
        impl std::fmt::Display for Cycle {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.write_str("private=DO_NOT_DISCLOSE")
            }
        }
        impl Error for Cycle {
            fn source(&self) -> Option<&(dyn Error + 'static)> {
                Some(self)
            }
        }
        assert!(transport_error(&Cycle).is_none());
        assert_eq!(
            safe_message(&Cycle),
            "Collection failed validation or provider checks; previous results are retained"
        );
    }
    #[test]
    fn malformed_json_and_unknown_details_are_not_echoed() {
        let error =
            serde_json::from_str::<serde_json::Value>("private invalid payload").unwrap_err();
        assert_eq!(
            safe_message(&error),
            "Collection response was not valid expected JSON; previous results are retained"
        );
        let unknown: Box<dyn Error> = "password=DO_NOT_DISCLOSE".into();
        assert_eq!(
            safe_message(unknown.as_ref()),
            "Collection failed validation or provider checks; previous results are retained"
        );
    }
    #[test]
    fn controlled_failures_keep_distinct_categories() {
        for (input, expected) in [
            (
                "Provider cooldown active; retry later",
                "Provider cooldown active; retry later; previous results are retained",
            ),
            (
                "Provider rate limited the request; no snapshot changed",
                "Provider rate limited collection; previous results are retained",
            ),
            (
                "Collection cancelled before request; previous results retained",
                "Collection cancelled before request; previous results are retained",
            ),
            (
                "Response exceeds size budget",
                "Collection response exceeded its size budget; previous results are retained",
            ),
        ] {
            let error: Box<dyn Error> = input.into();
            assert_eq!(safe_message(error.as_ref()), expected);
        }
    }
}
