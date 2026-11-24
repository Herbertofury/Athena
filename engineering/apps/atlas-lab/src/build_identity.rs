//! Stable evidence identity, not an assertion of trust in a supplied snapshot.
use sha2::{Digest, Sha256};
pub fn sha256_hex(bytes: &[u8]) -> String {
    let hash = Sha256::digest(bytes);
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(64);
    for byte in hash.iter().copied() {
        output.push(HEX[(byte >> 4) as usize] as char);
        output.push(HEX[(byte & 15) as usize] as char);
    }
    output
}
pub fn environment(scope: &str) -> String {
    format!(
        "{}-{}; atlas-lab {}; {}; target:{}; profile:{}; opt:{}; flags-sha256:{}; lock-sha256:{}; {}",
        std::env::consts::OS,
        std::env::consts::ARCH,
        env!("CARGO_PKG_VERSION"),
        env!("ATLAS_RUSTC_VERSION"),
        env!("ATLAS_BUILD_TARGET"),
        env!("ATLAS_BUILD_PROFILE"),
        env!("ATLAS_OPT_LEVEL"),
        env!("ATLAS_BUILD_FLAGS_SHA256"),
        sha256_hex(include_bytes!("../Cargo.lock")),
        scope
    )
}
