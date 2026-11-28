import json,pathlib,re
from network_content import PATH, CASES
from workshop_content import PATHS as WORKSHOP_PATHS, SOURCES as WORKSHOP_SOURCES, lesson_markdown
R=pathlib.Path(__file__).resolve().parents[1]
cat=json.loads((R/'research/certifications.json').read_text()); lessons=json.loads((R/'src/lessons.json').read_text())
ids={'google-it-support':'google-it','comptia-a-plus':'a-plus','comptia-network-plus':'network-plus','comptia-security-plus':'security-plus','cisco-ccna':'ccna','aws-cloud-practitioner':'aws-clf','aws-solutions-architect-associate':'aws-saa','azure-fundamentals':'az-900','azure-administrator':'az-104','terraform-associate':'terraform','power-bi-data-analyst':'pl-300','rhcsa':'rhcsa','cka':'cka'}
focus={
'google-it':['troubleshooting','hardware','os-processes','files-permissions','ip-subnets','dns-dhcp','identity','support-people'],
'a-plus':['hardware','wireless','cloud-models','troubleshooting','os-processes','identity','incident','support-people'],
'network-plus':['ip-subnets','switch-route','wireless','dns-dhcp','transport-tls','observability','risk','troubleshooting'],
'security-plus':['identity','risk','cryptography','incident','switch-route','resilience'],
'ccna':['ip-subnets','switch-route','wireless','dns-dhcp','transport-tls','identity','shell-data'],
'aws-clf':['cloud-models','identity','aws-design','cost','resilience'],
'aws-saa':['aws-iam-vpc','aws-design','resilience','observability','cost','cryptography'],
'az-900':['cloud-models','azure-governance','azure-operations','cost'],
'az-104':['azure-governance','azure-operations','ip-subnets','dns-dhcp','resilience','observability'],
 'terraform':['terraform-workflow','terraform-lifecycle','identity','cost','shell-data'],
'pl-300':['data-quality','data-model','data-present','identity'],
'rhcsa':['shell-data','files-permissions','os-processes','linux-admin','linux-security','resilience'],
'cka':['containers','kubernetes-core','kubernetes-operations','identity','observability','resilience']}
careers={ 'google-it':'IT support','a-plus':'IT support','network-plus':'Networking','security-plus':'Cybersecurity','ccna':'Networking','aws-clf':'Cloud foundations','aws-saa':'Cloud architecture','az-900':'Cloud foundations','az-104':'Cloud administration','terraform':'Infrastructure & DevOps','pl-300':'Data analytics','rhcsa':'Linux administration','cka':'Platform engineering'}
colors={'IT support':'#9c7cff','Networking':'#41d9d0','Cybersecurity':'#ffb975','Cloud foundations':'#83b5ff','Cloud architecture':'#83b5ff','Cloud administration':'#83b5ff','Infrastructure & DevOps':'#a5dc82','Data analytics':'#f39bd7','Linux administration':'#ffce77','Platform engineering':'#9eb1ff'}
for c in cat['certifications']:
 c['sourceId']=c['id'];c['id']=ids[c['id']];c['lessonIds']=focus[c['id']];c['career']=careers[c['id']];c['color']=colors[c['career']];c['coverage']='Introductory lessons + guided lab roadmap; not a complete exam-preparation course';c['domainCoverage']=[{'title':d,'status':'roadmap','reason':'Domain-level roadmap. Full subobjective mapping, deeper lessons and graded practical assessment remain open.'} for d in c['domains']]
 c['lab']={'title':{'google-it':'Support desk incident portfolio','a-plus':'Recover a disposable workstation','network-plus':'Design and diagnose a small network','security-plus':'Threat model and incident tabletop','ccna':'Build a routed lab network','aws-clf':'Explain a cloud solution and its bill','aws-saa':'Design a resilient web workload','az-900':'Map Azure services to requirements','az-104':'Administer a disposable Azure design','terraform':'Version a local infrastructure workflow','pl-300':'Build a reconciled sales report','rhcsa':'Configure and recover a disposable Linux VM','cka':'Diagnose a disposable Kubernetes workload'}[c['id']], 'steps':['Read the current official objectives and select one bounded objective group.','Use disposable systems and synthetic data. No production credentials, customer records or unapproved paid resources.','Write acceptance criteria, a rollback/cleanup plan and the expected evidence before starting.','Complete the linked lessons and hands-on exercises. Record actual outputs and failures.','Repeat without step-by-step hints, then explain the result and trade-offs in your own words.'], 'acceptance':['A reproducible setup and exact versions are recorded.','The original requirement is demonstrated, not just described.','Failure and recovery are tested where applicable.','Costs, access and cleanup are accounted for.','No unsupported claim of official exam readiness is made.']}
specific_labs={
'google-it':(['Create three fictional support tickets: a name-resolution failure, a storage-capacity warning and an application permission error.','For each ticket record symptoms, scope, three hypotheses and one low-risk discriminating test.','Perform one harmless local test on your own device and record its actual output.','Write a plain-language user update and an escalation package that separates observation from inference.'],['Three complete tickets with no passwords or personal data.','At least one actual test output, with platform and timestamp.','Each conclusion is supported by evidence or explicitly left uncertain.']),
'a-plus':(['Create a disposable VM using a legitimately licensed or freely available operating system.','Inventory virtual CPU, memory, disk, network adapter, boot method and current software version.','Create a non-admin lab account and a harmless test document, then back up and restore the document.','Diagnose one deliberately misconfigured application setting without disabling security controls.','Restart and verify the original user workflow; record rollback and recovered file hash.'],['Hardware/OS inventory and a recoverable baseline.','Successful restore with content/hash comparison.','A specific defect, test, repair and repeatable validation.']),
'network-plus':(['Design two private IPv4 subnets for fictional departments with stated host counts.','Calculate network, broadcast, usable range and gateways manually, then check your results.','Draw switching, routing, DHCP and DNS roles and permitted application flows.','Use a local simulator or paper packet walk to diagnose an incorrect prefix and an incorrect resolver.'],['Address plan with no overlap and enough usable addresses.','Layer-by-layer explanation of two failures.','A monitoring and change/rollback plan.']),
'security-plus':(['Choose a fictional three-tier service and classify its data and trust boundaries.','Write five threat scenarios, their impact, likely weaknesses and proposed controls.','Create a tabletop incident with a timeline and explicit containment/recovery criteria.','Test the plan with a peer or by walking every dependency and record unanswered questions.'],['Threat model, risk register and residual-risk owners.','Evidence-handling and communication plan.','Recovery validation that does not destroy investigation evidence.']),
'ccna':(['Use an authorized network simulator or owned lab devices; record software and device versions.','Build two VLANs with a routed path and a documented IPv4 address plan.','Verify same-VLAN and cross-VLAN reachability, then deliberately introduce one selector/addressing error.','Capture the relevant interface, VLAN and route evidence; repair and retest.','Explain which v1.1 objectives this small lab exercises and which remain untouched.'],['Topology and versioned configuration files.','Before/after reachability and route evidence.','No claim that one lab covers OSPF, IPv6, wireless, automation or the entire blueprint.']),
'aws-clf':(['Choose a fictional small business workload and list its business requirements.','Compare a VM, managed application and SaaS approach using the shared-responsibility model.','Use the official pricing calculator without deploying anything.','Explain service selection, identity ownership, support needs and variable cost drivers in a one-page brief.'],['A responsibility matrix with customer obligations.','A dated estimate with assumptions, not a promised bill.','Clear distinction between foundational knowledge and architecture implementation.']),
'aws-saa':(['Design a fictional web application with compute, relational data, object storage and a delivery path.','Specify identity policies, public/private network boundaries and encryption/key responsibilities.','Model one-zone failure, data corruption and a restore; state RTO/RPO and dependency order.','Compare two architecture options for performance, resilience, operations and cost.','If later deploying, obtain a budget decision and use disposable resources with explicit teardown evidence.'],['Architecture and request/data-flow diagrams.','Trade-off table and recovery test plan.','No deployed/available claim without a real measured deployment.']),
'az-900':(['Map a fictional organization into management groups, subscriptions and resource groups.','Classify proposed services by service model and explain shared responsibility.','Distinguish Entra identity, Azure RBAC, Policy, locks and cost management with one example each.','Produce a non-deployed resource and cost-governance plan.'],['Accurate governance hierarchy.','Five clearly distinguished management controls.','Dated official references and explicit non-deployment status.']),
'az-104':(['Design a disposable resource group with a VM, storage, network and monitoring plan.','Write least-privilege role assignments and a private endpoint/DNS validation checklist.','Prepare equivalent portal and CLI/PowerShell steps from the current official guide; do not execute paid deployment without budget approval.','Define backup, restore, diagnostic and cleanup evidence.','In an authorized lab, execute one selected objective and validate it after restart or redeployment.'],['Versioned commands and scope assumptions.','Actual output for the selected executed objective, or a clear unexecuted label.','Cost and cleanup verification for any deployed resources.']),
 'terraform':(['Use labs/terraform/main.tf in a disposable directory with Terraform 1.12-compatible tooling.','Run terraform fmt -check, init, validate and plan; inspect every proposed change.','Apply only this local terraform_data resource, inspect output and local state, then rerun plan to observe no changes.','Change the input, review and apply the plan, then destroy the local resource and verify the resulting state.','Never commit state or substitute real cloud providers without a separate cost/access review.'],['Exact Terraform version and command output.','A no-change plan after convergence.','Cleanup evidence and an explanation of state versus provider lock files.']),
'pl-300':(['Import labs/data/orders.csv and order-lines.csv using synthetic data only.','Declare keys and grain; build a relationship rather than duplicating order totals across lines.','Create quantity-times-price revenue and verify North=80, South=70, All=150.','Build an accessible report with region filtering, clear units and a documented refresh path.','Design and test a region access rule in an authorized Power BI environment; hiding a page does not count.'],['Reconciled totals and documented transformation steps.','Model diagram and measure explanation.','Actual role-test evidence or a clearly pending security gate.']),
'rhcsa':(['Prepare a disposable RHEL 10 training VM through an authorized source and record recovery access.','Create a nonprivileged lab user, controlled file permissions and a simple shell script with validation.','Inspect service, boot and audit logs; configure one harmless service using supported tools.','Practice storage or network changes only after a recoverable snapshot/backup and console path exist.','Reboot and verify persistence against the selected EX200 objectives.'],['Exact OS version and selected objective list.','Before/after command output and successful reboot validation.','Recovery evidence; browser-only simulation does not count.']),
'cka':(['Use an approved disposable cluster and record Kubernetes version, context and namespace.','Deploy a small workload and Service with explicit labels, requests and readiness behavior.','Introduce a harmless selector mismatch, diagnose endpoints/events and repair it.','Exercise rollout and rollback; inspect a storage claim only in a disposable environment.','Map results to the current CKA curriculum and record missing cluster lifecycle/networking/storage tasks.'],['Correct context/namespace and version evidence.','Ready endpoints, rollout/rollback and failure diagnosis outputs.','Explicit teardown and no claim of whole-exam readiness.'])}
for c in cat['certifications']:
    steps,acceptance=specific_labs[c['id']]
    c['lab']['steps']=steps
    c['lab']['acceptance']=acceptance
cat['lessons']=lessons
for cluster in cat['sharedKnowledge']:
 cluster['sourceTrackIds']=cluster['tracks'][:]
 cluster['tracks']=[ids[track] for track in cluster['tracks']]
cat['release']='0.4.1-staging'
cat['learningPaths']=[PATH, *WORKSHOP_PATHS]
cat['workshops']=WORKSHOP_PATHS
cat['workshopSources']=WORKSHOP_SOURCES
cat['diagnosisCases']=CASES
cat['coverageStatement']='All 13 requested credentials are organized. This release contains 98 original lessons: the existing 48 foundations and Packet Trail lessons plus 50 applied lessons across six workshops. The workshops include 150 original checks (50 primary and 100 supplemental), worked examples, safe offline exercises and evidence worksheets. All 74 credential-domain rows remain roadmaps, not completed exam coverage. Real-cloud labs and Power BI workflows are unexecuted; read marks, XP and reference tests do not establish practical mastery or exam readiness.'
(R/'src/catalog.json').write_text(json.dumps(cat,indent=2,ensure_ascii=False)+'\n')
(R/'dist/catalog.js').write_text('globalThis.ATHENA_DATA = '+json.dumps(cat,ensure_ascii=False)+';\n')
# Repository-native documentation and ready-to-publish wiki, both generated from the same catalog.
def write(path,text): path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text+'\n')
home='# Athena\n\nA beautiful personal home for learning, building and improving every project. [Product vision](https://github.com/Herbertofury/Athena/wiki/Athena-Vision): one native app, reusable capabilities, continuous learning and evidence-led experiments. This direction is not a completed-migration claim.\n\nLearn once. Apply across credentials. Build proof, not just badges.\n\n'+cat['coverageStatement']+'\n\n## Start here\n\nStart with [The Packet Trail](paths/packet-trail.md) for a coherent applied networking foundation.\n\n1. Choose a career route in the app.\n2. Complete shared foundations, then credential-specific lessons.\n3. Run labs only on disposable authorized systems.\n4. Compare your work to the current official blueprint and record gaps.\n5. Book an exam only when you can independently perform its required tasks.\n\n## Certificate library\n\n'
for c in cat['certifications']:
 home+=f"- [{c['name']}](certificates/{c['id']}.md) — {c['version']}\n"
write(R/'docs/README.md',home)
home+='\n## Engineering research\n\nThe engineering source is preserved under `engineering/`, with native wiki pages prefixed `Engineering-`. [Unified Athena](Unified-Athena) describes the one-app learning, research and media integration and its remaining gates. Reviewed Foundry authoring is included in the shared shell; complete original-feature parity and private user-data migration remain unfinished. See [Engineering research](Engineering-Home) and the migration inventory for evidence.\n'
wiki_home=home.replace('(paths/packet-trail.md)', '(Packet-Trail)').replace('(certificates/','(').replace('.md)',')')
write(R/'wiki/Home.md','Welcome to the Athena wiki!\n\n'+wiki_home)
for c in cat['certifications']:
 s=f"# {c['name']}\n\n**Blueprint:** {c['version']}\n\n**Reviewed:** {cat['reviewedAt']}\n\n**Verification:** {c['verification']}\n\n**Coverage:** {c['coverage']}\n\n## Ordered study path\n\n"
 for i,lid in enumerate(c['lessonIds'],1):
  l=next(x for x in lessons if x['id']==lid);s+=f"{i}. [{l['title']}](../shared/{lid}.md)\n"
 s+='\n## Domain roadmap\n\nThese are paraphrased domain headings, not an exhaustive official-objective transcript. Every row remains a roadmap until detailed instruction and assessment are verified.\n\n'
 for d in c['domains']:s+=f'- [ ] {d}: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.\n'
 s+='\n## Guided capstone\n\n### '+c['lab']['title']+'\n\n'+'\n'.join(f'{i}. {v}' for i,v in enumerate(c['lab']['steps'],1))+'\n\n### Acceptance evidence\n\n'+'\n'.join('- '+v for v in c['lab']['acceptance'])
 s+='\n\n## Version and booking notes\n\n'+'\n'.join('- '+n for n in c['notes'])+'\n\n**Price status:** '+c['price']['status']+'\n\n## Official sources\n\n'+'\n'.join('- ['+z['purpose']+']('+z['url']+')' for z in c['sources'])
 write(R/f'docs/certificates/{c["id"]}.md',s)
 write(R/f'wiki/{c["id"]}.md',s.replace('../shared/','shared-').replace('.md)',')'))
for l in lessons:
 s='# '+l['title']+'\n\n'+l['summary']+'\n\n## Learn\n\n'+'\n\n'.join(l['explain'])+'\n\n## Worked example\n\n'+l['example']+'\n\n## Practice safely\n\n'+'\n'.join(f'{i}. {v}' for i,v in enumerate(l['lab'],1))+'\n\n## Check your understanding\n\n'+l['question']+'\n\n'+'\n'.join(f'- {o}' for o in l['options'])+'\n\n<details><summary>Answer and explanation</summary>\n\n'+l['options'][l['answer']]+'. '+l['why']+'\n\n</details>\n\n## Further study\n\n'+'\n'.join('- '+u for u in l['sources'])+'\n\n**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.\n'
 if l.get('workshopId'): s=lesson_markdown(l)
 write(R/f'docs/shared/{l["id"]}.md',s);write(R/f'wiki/shared-{l["id"]}.md',s)
write(R/'wiki/_Sidebar.md','# Athena\n\n- [Home](Home)\n- [Product vision](Athena-Vision)\n- [Unified app status](Unified-Athena)\n- [Knowledge map](Knowledge-Map)\n- [The Packet Trail](Packet-Trail)\n- [Coverage and quality](Coverage-and-Quality)\n- [Engineering research](Engineering-Home)\n- [Developer and agent cleanup tools](Engineering-Developer-Cleanup-and-Agent-Hygiene)\n- [Windows tools catalog](Engineering-Windows-Utilities-and-Creation-Tools)\n- [Windows optimization guide](Engineering-Windows-PC-Optimization)\n\n## Credentials\n\n'+'\n'.join(f'- [{c["name"]}]({c["id"]})' for c in cat['certifications'])+'\n\n## Shared foundations\n\n'+'\n'.join(f'- [{l["title"]}](shared-{l["id"]})' for l in lessons))
print('Built',len(cat['certifications']),'tracks,',sum(len(c['domains']) for c in cat['certifications']),'domain roadmaps,',len(lessons),'lessons')

path_doc='# The Packet Trail\n\n'+PATH['summary']+'\n\n'+PATH['limits']+'\n\n## Before you start\n\n'+ '\n'.join('- ['+next(l['title'] for l in lessons if l['id']==i)+'](../shared/'+i+'.md)' for i in PATH['prerequisites'])+'\n\n## Eight applied lessons\n\n'+ '\n'.join(str(n)+'. ['+next(l['title'] for l in lessons if l['id']==i)+'](../shared/'+i+'.md)' for n,i in enumerate(PATH['lessonIds'],1))+'\n\n## Practice and evidence\n\nThe app includes three synthetic diagnosis cases and a fixed-table route detective. They do not access your network or grant practical mastery.\n\nRun the [loopback HTTP lab](../../labs/network/README.md) on an authorized machine and retain actual test results. Complete the evidence template, explain what each test proves, and preserve unrun or failed checks.\n'
for c in CASES:
 path_doc+='\n## Case: '+c['title']+'\n\n'+c['brief']+'\n\n'+ '\n'.join('- '+x for x in c['evidence'])+'\n\n'+c['question']+'\n\n'+ '\n'.join('- '+x for x in c['options'])+'\n\n<details><summary>Reasoning and validation</summary>\n\n'+c['options'][c['answer']]+'. '+c['why']+'\n\n'+c['verify']+'\n\n</details>\n'
write(R/'docs/paths/packet-trail.md',path_doc)
write(R/'wiki/Packet-Trail.md',path_doc.replace('../shared/','shared-').replace('.md)',')').replace('(../../labs/network/README)', '(https://github.com/Herbertofury/Athena/blob/main/labs/network/README.md)'))

# Workshop docs retain source attribution and all three original checks.
for path in WORKSHOP_PATHS:
 text='# '+path['title']+'\n\n'+path['summary']+'\n\n'+path['limits']+'\n\n## Prerequisites\n\n'
 text+='\n'.join('- ['+next(x['title'] for x in lessons if x['id']==i)+'](../shared/'+i+'.md)' for i in path['prerequisites'])
 text+='\n\n## Ordered workshop\n\n'+'\n'.join(str(n)+'. ['+next(x['title'] for x in lessons if x['id']==i)+'](../shared/'+i+'.md)' for n,i in enumerate(path['lessonIds'],1))
 text+='\n\n## Offline practice\n\nDownload the workshop ZIP from the app, extract it and read its README before running any command. Run commands from that extracted workshop folder. The app does not execute Python or SQL, and a read mark is not lab evidence.\n\nSource and editable exercises: [workshop folder](../../workshops/'+path['packKey']+'/README.md).\n\n## Primary-source register\n\n'
 text+='\n'.join('- ['+x.get('title',x['url'])+']('+x['url']+')'+(' — '+x['scope'] if x.get('scope') else '') for x in path['sourceRegister'])
 write(R/'docs/paths'/f"{path['id']}.md", text)
 wiki=text.replace('../shared/','shared-').replace('.md)',')').replace('(../../workshops/'+path['packKey']+'/README)', '(https://github.com/Herbertofury/Athena/blob/main/workshops/'+path['packKey']+'/README.md)')
 write(R/'wiki'/f"Workshop-{path['id']}.md", wiki)
for name in ['docs/README.md','wiki/Home.md','wiki/_Sidebar.md']:
 destination=R/name
 links='\n\n## Applied workshops\n\n'+'\n'.join('- ['+x['title']+']('+('paths/'+x['id']+'.md' if name.startswith('docs') else 'Workshop-'+x['id'])+')' for x in WORKSHOP_PATHS)+'\n'
 destination.write_text(destination.read_text()+links)

for name, target in [('docs/README.md','accessibility.md'),('wiki/Home.md','Accessibility'),('wiki/_Sidebar.md','Accessibility')]:
 destination=R/name
 destination.write_text(destination.read_text()+'\n- [Keyboard access and verification limits]('+target+')\n')

# Explicitly reviewed public PC catalog assets; no broad research-directory export.
for name in ("index.html", "table.js", "catalog.json"):
    target=R/"dist/research/windows-utilities-2026-11-14"/name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes((R/"research/windows-utilities-2026-11-14"/name).read_bytes())

# Software discovery is part of the same Athena shell and generated Wiki navigation.
for name, target in [("docs/README.md", "https://herbertofury.github.io/Athena/#software"), ("wiki/Home.md", "Software-Catalog"), ("wiki/_Sidebar.md", "Software-Catalog")]:
 destination = R / name
 links = "\n\n## Software discovery\n\n- [Catalog and application families](" + target + ")\n"
 if name.startswith("wiki/"):
  links += "- [Task decision guides](Software-Decision-Guides)\n- [Coverage and refresh priorities](Software-Coverage)\n- [Selection and evidence methodology](Software-Methodology)\n"
 if name == "wiki/_Sidebar.md":
  for family, label in [("System", "System and hardware"), ("Files", "Files, backup and recovery"), ("Security", "Security and privacy"), ("Networking", "Networks and remote access"), ("Productivity", "Productivity and accessibility"), ("Creative", "Creative and multimedia"), ("Development", "Development and automation"), ("Ai", "AI and local models"), ("Gaming", "Gaming and modding"), ("Science", "Science and specialized work")]:
   links += "- [" + label + "](Software-" + family + ")\n"
 destination.write_text(destination.read_text() + links)

# Keep universal requirements discoverable after every clean catalog rebuild.
# This navigation is generated here; the requirements remain in PRODUCT-PILLARS.md.
pillars_navigation = '\n## Cross-project product requirements\n\n[Universal engineering pillars](PRODUCT-PILLARS.md) apply across repositories. Its separate project-goal index links domain-specific requirements to their owning repositories; MO2R features, External CAS photo fitting and game mechanics are not global pillars. Requirements and acceptance evidence remain distinct from shipped completion.\n'
destination = R / "docs/README.md"
destination.write_text(destination.read_text() + pillars_navigation)

# Generate the closeout navigation and short Wiki entry from the canonical policy link.
for name in ('wiki/Home.md', 'wiki/_Sidebar.md'):
 destination = R / name
 destination.write_text(destination.read_text() + "\n\n## Engineering closeout\n\n- [Documentation and release closeout](Engineering-Documentation-Closeout)\n")
write(R/'wiki/Engineering-Documentation-Closeout.md', "# Documentation and release closeout\n\nAthena maintains shared guidance for all participating projects. Documentation is an acceptance activity: describe the real product, walk through its changed workflows, and improve confusing or redundant work without losing accepted functionality.\n\n## How an agent uses the standard\n\n1. Consult the [canonical closeout standard](https://github.com/Herbertofury/Athena/blob/main/guidance/WIKI_CLOSEOUT.md) and the owning project's accepted feature inventory.\n2. Use the [feature guide template](https://github.com/Herbertofury/Athena/blob/main/guidance/templates/WIKI_FEATURE_GUIDE.md) to update the affected pages; retain existing useful documentation.\n3. Verify instructions against the actual supported app or deliverable. Check redundant steps, duplicate implementations and missing features; repair and retest safe improvements.\n4. Publish and verify the required live Wiki, then attach the evidence to the [release checkout receipt](https://github.com/Herbertofury/Athena/blob/main/guidance/PRE_RELEASE_OPTIMIZATION.md). Record blockers honestly.\n\n## Tooling and shared knowledge\n\n- [Documentation tool routing](https://github.com/Herbertofury/Athena/blob/main/guidance/WIKI_CLOSEOUT.md#4-documentation-tool-routing) covers RAG-Anything, Diagram Design, AFFiNE and lightweight alternatives. If an AFFiNE canvas informs a published workflow, check its linear reading order, exported output and parity with the canonical Wiki.\n- [Shared capability coordination](https://github.com/Herbertofury/Athena/blob/main/docs/REUSABLE-PACKAGE-COORDINATION.md) tracks reusable implementations and protects distinct project features.\n- [Frontier stack advancement](https://github.com/Herbertofury/Athena/blob/main/guidance/WEB_ACQUISITION_FRONTIER.md) requires current evidence and fix-forward repair before holding eligible older versions.\n\nThis page describes the required process. It is not evidence of complete documentation, installed tools, actual application walkthroughs or successful publication across every repository.\n")

# Publish the canonical game-engine host page from the Engine Foundry source of truth.
engine_foundry = """# Athena Engine Foundry

Athena is the canonical host for reusable card-game, roguelite and mascot open-world engines. It owns source intake, package contracts, versioning, tests, benchmarks, documentation and consumer compatibility.

- [Engine Foundry architecture](https://github.com/Herbertofury/Athena/blob/main/docs/ENGINE-FOUNDRY.md)
- [Machine-readable engine catalog](https://github.com/Herbertofury/Athena/blob/main/engines/catalog.json)
- [M5 implementation issue #365](https://github.com/Herbertofury/Athena/issues/365)
- [Game Systems Exchange](Engineering-Game-Systems-Exchange)

## The three flagship engines

| Engine | Existing source | Current status |
|---|---|---|
| Card Game | GameSync's 23-module card engine; GameSync Next has 19 identical files and four UI divergences | Exact source snapshot hosted in Athena; deterministic core extraction and host acceptance pending |
| Roguelite | GameSync Mascot Survivors, JetSetCraft's seeded run/circuit and Modhunter Siege | GameSync loop hosted as source; cross-host run core and deterministic replay pending |
| Mascot Open World | GameSync Midnight Mascot Syndicate world simulation, Three.js WebGPU renderer and Dev Room | 16 exact source files hosted; hybrid 2D-world/3D-renderer foundation, not yet full volumetric 3D |

## Source intake and consumer policy

Athena currently hosts 41 exact GPL-3.0-or-later GameSync source files across four package manifests. The immutable snapshots are verified by Git blob SHA and are not production APIs. New refactored code belongs in Athena package source folders. Third-party Three.js MIT source is referenced, not copied; mascot packs and other assets remain separately licensed.

Consumers pin exact local package versions and keep host-specific UI, assets, saves and adapters. No app needs a live Athena connection. Do not delete or silently fork existing implementations before two compatible consumers pass complete acceptance and rollback.

[Card Game package](https://github.com/Herbertofury/Athena/tree/main/engines/card-game) · [Roguelite package](https://github.com/Herbertofury/Athena/tree/main/engines/roguelite) · [Mascot Open World package](https://github.com/Herbertofury/Athena/tree/main/engines/mascot-open-world) · [Shared Browser Game Runtime](https://github.com/Herbertofury/Athena/tree/main/engines/shared-game-runtime)
"""
write(R/'wiki/Engineering-Engine-Foundry.md', engine_foundry.rstrip('\n'))
# Engineering-* navigation is maintained by Engineering Atlas, not this generator.
for name, target in [('wiki/Home.md','Engineering-Engine-Foundry'),('wiki/_Sidebar.md','Engineering-Engine-Foundry')]:
 destination = R / name
 link = '\n## Game engines\n\n- [Athena Engine Foundry](' + target + ')\n'
 existing = destination.read_text()
 if 'Athena Engine Foundry](' not in existing:
  destination.write_text(existing + link)

# Generic shared-capability sources stay separate from product branding.
write(R/'wiki/Shared-Feed-Cores.md', """# Shared feed cores

Athena owns generic shared feed capabilities. Consumer products choose their own
configuration and identity; INTA exposes its integrated experience as **News**.

- [Core catalog, exact-source consumption and verification](https://github.com/Herbertofury/Athena/blob/main/cores/README.md)
- [feed-core API, portable preferences and date/attribution rules](https://github.com/Herbertofury/Athena/blob/main/cores/feed-core/README.md)
- [ticker-core lifecycle, motion controls and host responsibilities](https://github.com/Herbertofury/Athena/blob/main/cores/ticker-core/README.md)
- [content-extraction-core inert metadata and listing extraction](https://github.com/Herbertofury/Athena/blob/main/cores/content-extraction-core/README.md)
- [feed-generation-core recipes, regression validation and portable output](https://github.com/Herbertofury/Athena/blob/main/cores/feed-generation-core/README.md)
- [visual-editor-core immutable dashboard operations](https://github.com/Herbertofury/Athena/blob/main/cores/visual-editor-core/README.md)
- [feed-widget-core configurable reader and editor controls](https://github.com/Herbertofury/Athena/blob/main/cores/feed-widget-core/README.md)
- [Shared capability routing index](https://github.com/Herbertofury/Athena/blob/main/guidance/registry/shared-capabilities.json)

Consumers bundle pinned source locally and keep independent offline operation.
The source and contract fixtures are implemented; full independent second-host
acceptance and GameSync feature parity remain open. A shared source is not an
automatic claim that every platform has shipped or that a live workflow ran.
""")
for name in ('wiki/Home.md', 'wiki/_Sidebar.md'):
 destination = R / name
 destination.write_text(destination.read_text() + '\n## Shared application cores\n\n- [Feed cores](Shared-Feed-Cores)\n')
