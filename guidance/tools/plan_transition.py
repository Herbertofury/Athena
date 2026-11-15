#!/usr/bin/env python3
"""Read-only Agent-Foundry to Athena transition proposal; never applies changes."""
import argparse
import json
from pathlib import Path
from audit_consumers import audit, expected_paths
from repository_governance import checked_release, content, destination, digest, safe_path

def plan(source, target):
    source = source.resolve(); target = target.resolve()
    report = audit(source, target, 'selected-consumer')
    manifest = checked_release(source)
    legacy = report['locks'][0]
    conflicts = []
    if legacy['state'] != 'legacy-migration-required': conflicts.append('legacy-source-pin-needs-review')
    if report['locks'][1]['present']: conflicts.append('existing-athena-lock-needs-review')
    rows = []
    for old, canonical in expected_paths('.agents/foundry').items():
        new = destination(canonical)
        current = safe_path(target, new)
        state = 'absent'
        if current.exists():
            state = 'matching-but-unmanaged' if current.is_file() and digest(content(current)) == manifest['files'][canonical] else 'destination-conflict'
            conflicts.append('existing-destination-preserved')
        rows.append({'legacyPath':old,'proposedPath':new,'wantedSha256':manifest['files'][canonical],
                     'destinationState':state,'legacyDisposition':'preserve until explicitly reviewed transition and rollback are verified'})
    review = [{'path':row['path'],'sha256':row['sha256'],'reason':'classify historical reference versus active dependency; no automatic replacement'} for row in report['legacyReferences']]
    return {'schemaVersion':1,'targetHead':report['head'],'proposalOnly':True,'writesPerformed':False,
            'sourceVersion':legacy.get('version'),'destinationVersion':manifest['version'],
            'conflicts':sorted(set(conflicts)),'candidateForHumanReview':not conflicts,
            'mappings':rows,'referenceReview':review,'uninspectedPaths':report['uninspectedPaths'],
            'preservation':'All root/nested AGENTS.md, overrides, CLAUDE.md, legacy files and locks remain unchanged.',
            'requiredNextSteps':['Review semantic policy changes and project-specific authority.',
                'Review the complete reference list, unsupported files and external consumers.',
                'Authorize one concrete consumer transition; prepare tested rollback before any write.',
                'Verify that consumer in its actual harness before removing legacy dependencies.'],
            'retirementReady':False,'applySupported':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--target',type=Path,required=True)
    args=parser.parse_args()
    try:
        result=plan(args.source,args.target)
        print(json.dumps(result,indent=2));return 0 if result['candidateForHumanReview'] else 1
    except (OSError,ValueError,KeyError,TypeError):
        print(json.dumps({'proposalOnly':True,'error':'Inspection incomplete; preserve all files and review the selected target.'}));return 2
if __name__=='__main__':raise SystemExit(main())
