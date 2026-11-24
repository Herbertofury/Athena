//! Shared unchanged Linux self-observer, extracted from the existing memory lab.
fn memory_field(text: &str, name: &str) -> Result<u64, Box<dyn std::error::Error>> {
    let lines: Vec<_> = text.lines().filter(|s| s.starts_with(name)).collect();
    if lines.len() != 1 {
        return Err("Missing or duplicate OS memory field".into());
    }
    let parts: Vec<_> = lines[0].split_whitespace().collect();
    if parts.len() != 3 || parts[2] != "kB" {
        return Err("Unexpected OS memory unit".into());
    }
    Ok(parts[1]
        .parse::<u64>()?
        .checked_mul(1024)
        .ok_or("OS memory overflow")?)
}
pub(crate) fn memory() -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let status = std::fs::read_to_string("/proc/self/status")?;
    let rollup = std::fs::read_to_string("/proc/self/smaps_rollup")?;
    Ok(
        serde_json::json!({"status_rss_bytes":memory_field(&status,"VmRSS:")?,"status_high_water_rss_bytes":memory_field(&status,"VmHWM:")?,"rollup_rss_bytes":memory_field(&rollup,"Rss:")?,"rollup_pss_bytes":memory_field(&rollup,"Pss:")?,"rollup_private_clean_bytes":memory_field(&rollup,"Private_Clean:")?,"rollup_private_dirty_bytes":memory_field(&rollup,"Private_Dirty:")?,"source":"Linux self status and smaps_rollup; whole isolated process, not allocation delta","limits":"Status RSS accounting can be asynchronous; rollup is a separate instantaneous snapshot, not a high-water value or joint atomic read"}),
    )
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_only_requested_field_and_converts_kib() {
        assert_eq!(
            memory_field("Rss: 12 kB\nPss: 5 kB\n", "Rss:").unwrap(),
            12288
        );
    }
    #[test]
    fn missing_duplicate_invalid_units_and_values_fail_closed() {
        for text in [
            "Pss: 2 kB",
            "Rss: 1 kB\nRss: 2 kB",
            "Rss: 4 MB",
            "Rss: -1 kB",
            "Rss: NaN kB",
            "Rss: 18446744073709551615 kB",
            "Rss: 2 kB extra",
        ] {
            assert!(memory_field(text, "Rss:").is_err());
        }
    }
}
