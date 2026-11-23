"""Original receipt consistency gate. Not a binary verifier or authenticity check."""

def assess(receipt):
    if not isinstance(receipt, dict):
        return {"status": "invalid", "reasons": ["receipt must be an object"]}
    reasons = []
    for key in ("source_revision", "checker_revision", "input_sha256", "scope_id", "compiler_identity"):
        value = receipt.get(key)
        if not isinstance(value, str) or not value.strip() or len(value) > 256:
            reasons.append("missing/invalid " + key)
    digest = receipt.get("input_sha256", "")
    if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        reasons.append("input_sha256 must be lowercase SHA256")
    keys = ("expected_units", "checked_units", "matched_units", "expected_bytes", "checked_bytes", "matched_bytes", "unresolved_bindings", "failed_units")
    for key in keys:
        if type(receipt.get(key)) is not int or not 0 <= receipt[key] <= 2**63-1:
            reasons.append("invalid counter " + key)
    if reasons:
        return {"status": "invalid", "reasons": reasons}
    for kind in ("units", "bytes"):
        expected, checked, matched = (receipt[f"{p}_{kind}"] for p in ("expected", "checked", "matched"))
        if not 0 <= matched <= checked <= expected:
            reasons.append("inconsistent " + kind)
        if expected == 0:
            reasons.append("empty denominator " + kind)
    if reasons:
        return {"status": "invalid", "reasons": reasons}
    if receipt["unresolved_bindings"] or receipt["failed_units"]:
        reasons.append("unresolved or failed work")
    if any(receipt[f"{p}_{kind}"] != receipt[f"expected_{kind}"] for kind in ("units", "bytes") for p in ("checked", "matched")):
        reasons.append("partial or mismatched declared scope")
    return {"status": "incomplete" if reasons else "receipt_consistent_for_declared_scope", "reasons": reasons, "independently_verified": False, "playable_port_proven": False, "reuse_rights_granted": False}
