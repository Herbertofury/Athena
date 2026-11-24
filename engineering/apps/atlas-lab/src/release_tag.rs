//! Stable SemVer-shaped tags for the fixed hls.js and serde_json observers.
//! A provider's `prerelease: false` is not sufficient evidence by itself.
pub(crate) fn is_stable(tag: &str) -> bool {
    if tag.is_empty() || tag.len() > 256 {
        return false;
    }
    let tag = tag.strip_prefix('v').unwrap_or(tag);
    let (core, build) = tag
        .split_once('+')
        .map_or((tag, None), |(a, b)| (a, Some(b)));
    if let Some(build) = build
        && !build.split('.').all(|part| {
            !part.is_empty() && part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
        })
    {
        return false;
    }
    let mut parts = core.split('.');
    for _ in 0..3 {
        let Some(part) = parts.next() else {
            return false;
        };
        if part.is_empty()
            || (part.len() > 1 && part.starts_with('0'))
            || !part.bytes().all(|b| b.is_ascii_digit())
        {
            return false;
        }
    }
    parts.next().is_none()
}

#[cfg(test)]
mod tests {
    use super::is_stable;

    #[test]
    fn stable_core_and_build_metadata_are_distinct_from_prerelease() {
        for tag in [
            "v1.7.4",
            "v1.0.154",
            "0.0.0",
            "1.2.3+build.001",
            "v1.2.3+alpha-build",
        ] {
            assert!(is_stable(tag), "{tag}");
        }
        for tag in [
            "v3.0.0-alpha.5",
            "1.2.3-rc.1+build",
            "latest",
            "nightly",
            "",
            "v",
            "V1.2.3",
            "1.2",
            "1.2.3.4",
            "01.2.3",
            "1.02.3",
            "1.2.03",
            "1..3",
            "1.2.-3",
            "1.2.3+",
            "1.2.3+one..two",
            "1.2.3+one+two",
            " 1.2.3",
            "1.2.3\n",
            "１.2.3",
            "1.2.3+β",
        ] {
            assert!(!is_stable(tag), "{tag:?}");
        }
    }

    #[test]
    fn exact_size_bound_and_every_non_decimal_core_byte() {
        assert!(is_stable(&format!("1.2.3+{}", "x".repeat(250))));
        assert!(!is_stable(&format!("1.2.3+{}", "x".repeat(251))));
        for byte in 0_u8..=127 {
            if !byte.is_ascii_digit() {
                assert!(!is_stable(&format!("1.2.{}", char::from(byte))));
            }
        }
    }
}
