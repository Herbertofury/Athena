use std::process::Command;

fn observe() -> Command {
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_atlas-lab"));
    cmd.arg("windows-directory-observation");
    cmd
}

#[test]
fn scanner_usage_and_bad_caps_refuse_without_exposing_supplied_path() {
    let private = "disposable-sentinel-not-a-real-path";
    for (args, message) in [
        (vec![], "Usage: atlas-lab windows-directory-observation"),
        (vec![private, "abc"], "Entry cap must be an integer"),
        (
            vec![private, "10", "extra"],
            "Usage: atlas-lab windows-directory-observation",
        ),
        (vec![private, "0"], "Entry cap must be between"),
    ] {
        let result = observe().args(args).output().unwrap();
        assert!(!result.status.success());
        assert!(result.stdout.is_empty());
        let error = String::from_utf8_lossy(&result.stderr);
        assert!(error.contains(message), "{error}");
        assert!(!error.contains(private));
    }
}

#[cfg(unix)]
#[test]
fn raw_path_is_never_echoed_through_a_global_argv_panic() {
    use std::{ffi::OsString, os::unix::ffi::OsStringExt};
    let sensitive = "disposable-raw-argument-sentinel";
    let input = [sensitive.as_bytes(), &[0xff]].concat();
    let result = observe().arg(OsString::from_vec(input)).output().unwrap();
    assert!(!result.status.success());
    assert!(result.stdout.is_empty());
    let error = String::from_utf8_lossy(&result.stderr);
    assert!(error.contains("unavailable on this platform"));
    assert!(!error.contains("panicked"));
    assert!(!error.contains(sensitive));
}
