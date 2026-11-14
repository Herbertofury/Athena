"""Compare a trusted local extractor with an independent srcset boundary-state oracle.

This checks raw URL token boundaries only. Descriptor validity, URL resolution,
sanitization, browser conformance and currentSrc selection are NOT evaluated.
Only generated strings are used. No network, external inputs or URLs are read.
The supplied extractor is trusted Python source and is executed to load its
srcset_url_tokens function. No upstream package is installed or executed.
"""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
from pathlib import Path
import platform
import random
import types


SEED = 42758
EXHAUSTIVE_ALPHABET = "a ,()\u00a0"
EXHAUSTIVE_MAX_LENGTH = 6
RANDOM_ALPHABET = "".join([
    "a", "b", "c", ",", "/", "(", ")", "[", "]", "\\", '"',
    "?", "=", "#", "\t", "\n", "\f", "\r", " ", "\u00a0", "\u202f", "\v",
])
RANDOM_COUNT = 50000
RANDOM_LENGTH_STOP = 100


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def boundary_oracle(value: str) -> list[str]:
    """Explicit three-state WHATWG boundary model; no descriptor parser."""
    whitespace = "\t\n\f\r "
    position = 0
    output: list[str] = []
    while True:
        while position < len(value) and value[position] in whitespace + ",":
            position += 1
        if position == len(value):
            return output
        start = position
        while position < len(value) and value[position] not in whitespace:
            position += 1
        url = value[start:position]
        if url.endswith(","):
            output.append(url.rstrip(","))
            continue
        while position < len(value) and value[position] in whitespace:
            position += 1
        state = "descriptor"
        while True:
            character = value[position] if position < len(value) else None
            if character is None:
                break
            if state == "descriptor":
                if character in whitespace:
                    state = "after"
                elif character == ",":
                    position += 1
                    break
                elif character == "(":
                    state = "parens"
            elif state == "parens":
                if character == ")":
                    state = "descriptor"
            elif character not in whitespace:
                state = "descriptor"
                continue
            position += 1
        output.append(url)


def generated_inputs():
    for length in range(EXHAUSTIVE_MAX_LENGTH + 1):
        for characters in itertools.product(EXHAUSTIVE_ALPHABET, repeat=length):
            yield "exhaustive", "".join(characters)
    rng = random.Random(SEED)
    for _ in range(RANDOM_COUNT):
        yield "random", "".join(rng.choices(RANDOM_ALPHABET, k=rng.randrange(RANDOM_LENGTH_STOP)))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extractor", type=Path, required=True, help="Trusted local extractor Python source")
    parser.add_argument("--expected-extractor-sha256", help="Optional exact source-identity guard")
    parser.add_argument("--output", type=Path, help="New sanitized JSON receipt; existing files are never overwritten")
    args = parser.parse_args()

    source = args.extractor.read_bytes()
    extractor_hash = sha256(source)
    if args.expected_extractor_sha256 and extractor_hash != args.expected_extractor_sha256:
        print(json.dumps({"status": "extractor_hash_mismatch", "extractor_sha256": extractor_hash}))
        return 2
    module = types.ModuleType("independent_srcset_boundary_review")
    exec(compile(source, "trusted-extractor.py", "exec"), module.__dict__)

    counts = {"exhaustive": 0, "random": 0}
    mismatch_count = 0
    failure_summaries = []
    input_stream_hash = hashlib.sha256()
    for index, (kind, value) in enumerate(generated_inputs()):
        counts[kind] += 1
        encoded = value.encode("utf-8")
        input_stream_hash.update(len(encoded).to_bytes(8, "big"))
        input_stream_hash.update(encoded)
        exception_type = None
        try:
            actual = list(module.srcset_url_tokens(value))
            expected = boundary_oracle(value)
            matches = actual == expected
        except Exception as error:
            matches = False
            exception_type = type(error).__name__
        if not matches:
            mismatch_count += 1
            if len(failure_summaries) < 20:
                failure_summaries.append({
                    "index": index,
                    "kind": kind,
                    "input_sha256": sha256(encoded),
                    "input_codepoints": len(value),
                    "exception_type": exception_type,
                })

    receipt = {
        "kind": "independent-generated-srcset-boundary-state-oracle",
        "status": "passed" if mismatch_count == 0 else "failed",
        "scope": "Raw URL token boundaries only; not descriptor validity, URL resolution, sanitization, browser conformance or currentSrc selection",
        "python": platform.python_version(),
        "extractor_sha256": extractor_hash,
        "oracle_script_sha256": sha256(Path(__file__).read_bytes()),
        "exhaustive": {
            "alphabet": EXHAUSTIVE_ALPHABET,
            "alphabet_codepoints": [f"U+{ord(c):04X}" for c in EXHAUSTIVE_ALPHABET],
            "length_min": 0,
            "length_max_inclusive": EXHAUSTIVE_MAX_LENGTH,
            "count": counts["exhaustive"],
        },
        "random": {
            "seed": SEED,
            "generator": "random.Random(seed); length=randrange(100); characters=choices(alphabet,k=length)",
            "alphabet": RANDOM_ALPHABET,
            "alphabet_codepoints": [f"U+{ord(c):04X}" for c in RANDOM_ALPHABET],
            "length_min": 0,
            "length_max_inclusive": RANDOM_LENGTH_STOP - 1,
            "count": counts["random"],
        },
        "total_inputs": sum(counts.values()),
        "mismatches": mismatch_count,
        "input_stream_sha256": input_stream_hash.hexdigest(),
        "input_stream_encoding": "For each generated input in order: eight-byte unsigned big-endian UTF-8 byte length, then UTF-8 bytes",
        "failure_summaries": failure_summaries,
        "failure_summary_limit": 20,
        "raw_private_inputs_used": False,
        "raw_input_values_published": False,
        "network_used": False,
        "browser_used": False,
    }
    rendered = json.dumps(receipt, indent=2, ensure_ascii=True) + "\n"
    if args.output:
        with args.output.open("x", encoding="utf-8") as stream:
            stream.write(rendered)
    print(rendered, end="")
    return int(mismatch_count != 0)


if __name__ == "__main__":
    raise SystemExit(main())
