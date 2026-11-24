"""Recompute evidence refresh priorities without modifying application records."""
import argparse
from datetime import date
import json
from pathlib import Path

from build_software_catalog import coverage_report, load_catalog


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", default=date.today().isoformat(), help="ISO date; defaults to today")
    parser.add_argument("--output", type=Path, default=Path("software-refresh-report.json"))
    args = parser.parse_args()
    report = coverage_report(load_catalog(), args.as_of)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"as_of": report["as_of"], "records_needing_research": report["records_needing_research"],
                      "single_application_categories": len(report["single_application_categories"]),
                      "report": str(args.output)}, indent=2))
