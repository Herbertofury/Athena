//! Order-preserving exact deduplication for collected record identifiers.
//! Strings are compared exactly: no case folding, truncation or lossy numeric conversion.
use std::collections::HashSet;

pub fn reference_unique(input: &[String]) -> Vec<&str> {
    let mut output = Vec::new();
    for value in input {
        if !output.contains(&value.as_str()) {
            output.push(value.as_str());
        }
    }
    output
}

pub fn indexed_unique(input: &[String]) -> Vec<&str> {
    let mut seen = HashSet::with_capacity(input.len());
    let mut output = Vec::with_capacity(input.len());
    for value in input {
        if seen.insert(value.as_str()) {
            output.push(value.as_str());
        }
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preserves_order_case_unicode_and_large_ids() {
        let input: Vec<String> = [
            "z",
            "A",
            "a",
            "z",
            "",
            "18446744073709551617",
            "é",
            "é",
            "A",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();
        assert_eq!(indexed_unique(&input), reference_unique(&input));
        assert_eq!(
            indexed_unique(&input),
            ["z", "A", "a", "", "18446744073709551617", "é", "é"]
        );
    }
    #[test]
    fn generated_differential_stress() {
        let mut state = 0x71f023abcde9981u64;
        for case in 0..10_000 {
            let input: Vec<String> = (0..case % 128)
                .map(|_| {
                    state ^= state << 13;
                    state ^= state >> 7;
                    state ^= state << 17;
                    format!("provider:{}/{}", state % 4, state % 31)
                })
                .collect();
            assert_eq!(
                indexed_unique(&input),
                reference_unique(&input),
                "case {case}"
            );
        }
    }
}
