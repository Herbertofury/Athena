//! Shared bounded JSON body reader. Does not select URLs or relax provider status policy.
use std::{error::Error, io::Read};
pub fn read_json_response(
    response: reqwest::blocking::Response,
    max: u64,
) -> Result<Vec<u8>, Box<dyn Error>> {
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
    if response.content_length().is_some_and(|n| n > max) {
        return Err("Response exceeds size budget".into());
    }
    let limit = max.checked_add(1).ok_or("Invalid body budget")?;
    let mut bytes = Vec::new();
    response.take(limit).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max {
        return Err("Response exceeds size budget".into());
    }
    Ok(bytes)
}
