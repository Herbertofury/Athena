# Engineering Atlas contribution contract

This repository is an evidence-led knowledge base, not an instruction to change other projects.

- Read README.md, CONTRIBUTING.md and docs/research-method.md before contributing.
- Preserve dated research and distinguish current guidance from historical compatibility targets.
- Do not invent benchmarks, citations, compatibility or acceptance. Synthetic fixtures must stay labeled synthetic.
- Keep private keys, credentials, user paths and private project traces out of commits.
- Use conditional recommendations; document disqualifying constraints and alternatives.
- Performance work must preserve full results, warnings, security checks and correctness. Cache-only or cosmetic changes do not establish a substantial end-to-end improvement.
- Run scripts/check_research.py and the tests. Never weaken a check merely to get green CI.
- Add primary sources to the complete register (data/sources.json plus indexed additions in data/sources.d) and list source IDs in the research note. Preserve existing entries; the shared loader and source-index check must pass.
- Newest is not automatically best. Check upstream changes against the exact installed version and benchmark the target workload.
