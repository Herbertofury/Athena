# CCNA coverage and remaining work

## Version and source boundary

Reviewed 2026-11-08. This workbook maps selected concepts to **200-301 CCNA v1.1**, not the complete exam. Cisco's [official transition announcement](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh) states that v1.1 testing runs through **2027-02-02** and v2.0 begins **2027-02-03**. No v2.0 objective mapping is claimed; review that version separately before using this material for its preparation.

The [official v1.1 topics page](https://learningnetwork.cisco.com/s/ccna-exam-topics) was readable through indexed official-source results. Direct page retrieval returned a CSS error, and the official v1.1 PDF URL redirected to v1.0. We do not claim to have fully retrieved a current v1.1 PDF. The [v1.1 release notes](https://learningcontent.cisco.com/documents/marketing/exam-topics/CCNA_1_1_release_notes.pdf) independently clarify its additions. The [source register](../research/ccna-sources.json) preserves those retrieval limits and the platform scope of technical references.

## What each lesson contributes

Objective numbers below are pointers to partial conceptual alignment, not completion marks. The [machine-readable map](../research/ccna-objective-gap-map.json) distinguishes what is discussed from what the local model actually computes.

- **VLANs**: 1.13, 2.1, 2.2. Source learning and unicast decisions within a VLAN; common allowed trunk membership. No actual VLAN/trunk configuration, native-tag behavior, voice VLAN implementation or inter-VLAN routing.
- **Loop control**: 2.5. Explain root identifiers, costs and selected protection concepts; compute supplied root costs. No operational port roles/states, full BPDU comparison, guard operation or convergence measurement. Cost ties remain unresolved.
- **Bundles**: 2.4. Compare supplied LACP mode pairs and member settings; discuss hash limits. No negotiation, Layer 2/Layer 3 EtherChannel configuration or measured failover/throughput.
- **IPv6**: 1.8, 1.9.a, 1.9.c. Address categories, prefix arithmetic and conceptual ND boundaries. No configured interfaces, SLAAC/DAD, anycast or modified EUI-64 assessment.
- **Routing**: 3.1, 3.2, 3.3. Same-prefix candidate preference and longest-prefix lookup; floating-route reasoning. No installed device routes, recursive resolution, tracking, real failure detection or forwarding verification.
- **OSPF**: 3.4. Discuss prerequisite compatibility, router identifiers and shared-segment roles. Model only supplied boolean prerequisites and independent graph costs. No router-ID comparison, DR/BDR election, state machine, learned LSDB or actual OSPF process.
- **Services**: 4.1, 4.2, 4.3, 4.6, 5.6. Model ordered ACL matching and independent static NAT evidence; discuss DNS, DHCP relay and NTP. No live service exchange, pool/PAT allocation, device processing order, ACL attachment or clock synchronization.
- **Wireless**: 1.11, 5.9. Compare simplified client/security requirements and channel spacing. No RF survey, regulatory validation, AP/WLC GUI, WLAN creation, WPA2-PSK verification or roaming test. Architecture is discussed, not assessed.
- **Automation**: 6.1, 6.5, 6.7. Validate JSON-shaped types, compute an original desired-state diff and order dependencies; discuss HTTP methods. No HTTP requests, response-code exercise, controller login, real configuration, AI/ML assessment or Ansible/Terraform practice.
- **Capstone**: Selected cross-layer reasoning only. Retain supporting findings, an ACL contradiction and two evidence gaps. No new full-objective coverage, end-to-end traffic test or deployment approval.

## Gaps across the complete blueprint

All six v1.1 domains remain partial: network fundamentals, network access, IP connectivity, IP services, security fundamentals, and automation/programmability. Domain weights are examination weights, not estimates of workbook completeness. No percentage-coverage or pass-probability claim is made.

Substantial omitted work includes network components and architectures, cabling and interface diagnosis, comprehensive IPv4/subnet and client OS checks, virtualization, CDP/LLDP, controller and WLAN GUI workflows, first-hop redundancy, SNMP/syslog/QoS, remote management and file-transfer protocols, broad threat/security controls and VPN concepts. AI/ML (6.4) and Ansible/Terraform (6.6) are not assessed. The detailed map names unclaimed objectives; prerequisites do not silently fill those gaps.

Every configure-and-verify objective requires additional authorized equipment or emulator work. None is satisfied by the synthetic CLI. Real command navigation, configuration persistence, packet capture, interface counters, failure recovery, rollback and independent timed assessment are unperformed. The Python programs do not emit IOS outputs or replace a vendor platform. These original exercises are not an official Cisco course or question bank, and completing them does not establish exam readiness or operational competence.
