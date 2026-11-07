// Build-time compiler query only; no command-execution API is added to the app.
use sha2::{Digest, Sha256};
fn main() {
    let compiler = std::env::var_os("RUSTC").expect("Cargo must identify its compiler");
    let output = std::process::Command::new(compiler)
        .arg("--version")
        .output()
        .expect("Read compiler identity");
    assert!(output.status.success(), "Compiler identity command failed");
    let text = String::from_utf8(output.stdout).expect("Compiler version must be UTF-8");
    let version = text.trim();
    assert!(
        version.starts_with("rustc ") && !version.contains(['\r', '\n']),
        "Unexpected compiler identity format"
    );
    println!("cargo:rustc-env=ATLAS_RUSTC_VERSION={version}");
    for (name, key) in [
        ("PROFILE", "ATLAS_BUILD_PROFILE"),
        ("OPT_LEVEL", "ATLAS_OPT_LEVEL"),
        ("TARGET", "ATLAS_BUILD_TARGET"),
    ] {
        let value = std::env::var(name).expect("Cargo build metadata");
        assert!(
            !value.contains(['\r', '\n']),
            "Unexpected build metadata format"
        );
        println!("cargo:rustc-env={key}={value}");
    }
    let flags = match std::env::var("CARGO_ENCODED_RUSTFLAGS") {
        Ok(v) => v,
        Err(std::env::VarError::NotPresent) => String::new(),
        Err(_) => panic!("Build flags must be UTF-8"),
    };
    let hash = Sha256::digest(flags.as_bytes());
    let mut hex = String::with_capacity(64);
    const HEX: &[u8; 16] = b"0123456789abcdef";
    for b in hash.iter().copied() {
        hex.push(HEX[(b >> 4) as usize] as char);
        hex.push(HEX[(b & 15) as usize] as char);
    }
    println!("cargo:rustc-env=ATLAS_BUILD_FLAGS_SHA256={hex}");
    println!("cargo:rerun-if-env-changed=CARGO_ENCODED_RUSTFLAGS");

    println!("cargo:rerun-if-env-changed=RUSTC");
    println!("cargo:rerun-if-env-changed=RUSTUP_TOOLCHAIN");
    println!("cargo:rerun-if-changed=build.rs");
}
