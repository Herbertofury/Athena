# Exact contracts and deliberate omissions

## Shared interface

`python3 -B run_lab.py COMMAND` reads only `fixtures/COMMAND.json`. Ten allowlisted commands; one argument only. Valid output is `{command, real_network_executed:false, synthetic_model:true, result}`. Invalid CLI, fixture or model data returns exit code 2 and `{command, real_network_executed:false, synthetic_model:true, error:{code:"invalid_input",message}}`. Invalid command has `command:null`. Success exits 0. JSON keys print sorted with two-space indentation. `lab.run(command,data)` is a pure test API, returns the success envelope, and raises `LabError` on invalid input. No user-path API exists.

The fixture read requests at most 65,537 bytes, rejecting more than 65,536. Files and fixture-directory symlinks are rejected; the target must be a regular file. The loader rejects invalid UTF-8, malformed/trailing JSON, duplicate object keys at any depth, nonfinite numbers, floats (even `1.0`), integers whose absolute value exceeds 1,000,000, strings over 256 characters, lists/objects over 128 members, and nesting beyond 12 levels. Every model object has an exact field set: unknown and missing keys are errors. Booleans never substitute for integer fields. Arrays are ordered unless a contract says otherwise. Models do not mutate input. Identifiers match `[A-Za-z][A-Za-z0-9_-]{0,31}`. Where a field is a boolean it must be a genuine JSON `true` or `false`.

The loader's bounds constrain data volume, not a hostile operating system. The package is intended to be inspected and run locally under ordinary file ownership; this is not an OS sandbox. No code path uses sockets, HTTP, vendor SDKs, equipment CLIs, browser automation, secrets, publication, provisioning, or action retries.

## vlans

Input: `ports:[{id,mode,local_vlans,peer_vlans}]`, `frames:[{ingress,vlan,source,destination}]`. Ports nonempty, IDs unique. Mode `access|trunk`; VLAN integers 1–4094, no duplicate VLANs. Access requires exactly one local VLAN and an empty peer list. Trunk admits the intersection of local/peer lists; intersection can be empty. Nonempty local list required. Frames refer to an existing port. MAC addresses must be lowercase, colon-separated unicast addresses; multicast/broadcast inputs are deliberately unsupported.

Process frames in order. Reject an inadmissible VLAN before learning. Learn `(VLAN,source MAC) → ingress`; a move overwrites that key. A known destination on ingress is filtered, a known other port gets unicast, otherwise flood to all other admitting ports in sorted name order. Return `trunk_intersections`, ordered `events:{decision,egress}`, sorted `learned:{vlan,mac,port}`. Decisions: `drop_vlan`, `filter_same_port`, `known_unicast`, `flood_unknown_unicast`. Ports are assumed forwarding. No aging, buffer, native VLAN/tagging, VLAN negotiation, access tagging rules, STP, broadcast or multicast behavior. Native VLAN tagging is configurable on real equipment and is not modeled here.

## loop-control

Input: `switches:[{id,priority,mac}]`, `links:[{a,b,cost}]`. One synthetic common VLAN. Priority 0–61440 in steps of 4096; lowercase unicast MAC; unique IDs and `(priority,MAC)` tuples. Common VLAN means omitted system-ID extension is the same across bridges. Undirected links have distinct existing endpoints, unique endpoint pairs, positive integer cost 1–65535. Parallel links and self-links rejected. Normal topology cycles accepted.

Choose minimum supplied `(priority,MAC)` as root and compute shortest accumulated costs. Each sorted switch row has `root_cost` (null if unreachable), all `candidate_neighbors` that reduce cost along a shortest path, and status `root|unreachable|unique_cost_path|equal_cost_not_fully_tiebroken`. Equal costs are **not** resolved by sorting the output or selecting the first neighbor. Full STP compares additional sender bridge and port identifiers and local port information; this model intentionally stops at cost candidates, even where supplied bridge information could narrow them. It does not elect designated/alternate ports, simulate BPDUs/timers/convergence, or model RSTP, guards, PortFast or BPDU filtering. Unreachable rows show incomplete/disconnected evidence; a disconnected real component would have its own root election.

## bundles

Input: nonempty `members:[{id,speed_mbps,duplex,vlans,local_mode,peer_mode}]`. Unique member IDs, speed 1–1,000,000, duplex `full|half`, nonempty unique VLAN list, modes `active|passive`. First member is explicit comparison reference, not a discovered leader. Compare speed, duplex and sorted VLAN set against it; all members must be full duplex in this model. Passive/passive yields `both_passive`. Other reasons: `speed_mismatch`, `duplex_mismatch`, `vlan_mismatch`, `model_requires_full_duplex`. Output reference, per-member compatibility/reasons and `all_compatible`.

This is partial compatibility evidence only. It omits native VLAN, trunk mode, partner/system identity, timers and operational state, so `compatible:true` does not prove a bundle forms. LACP active/passive are not static `on` or PAgP modes. Local channel-group numbers need not match across peers. No throughput/hash calculation; multiple members do not imply multiplied single-flow throughput.

## ipv6

Input: canonical IPv6 `prefix`, nonempty unique `addresses`, `neighbor_observation: none|solicitation_seen|advertisement_seen`. Address uniqueness uses parsed numeric value. Prefix requires explicit slash and no host bits. Zone suffixes such as `%eth0` are rejected because this model lacks link/interface context. Output canonical prefix/length and per-address normalized form, membership and category `unspecified|loopback|multicast|link_local|unique_local|other_unicast`. ULA category tests `fc00::/7`. `other_unicast` is not a claim of global Internet routability; documentation addresses are intentionally used.

An observation never sets `reachability_proven:true`. Neighbor Discovery uses ICMPv6, not ARP. A solicitation/advertisement alone does not demonstrate fresh, bidirectional connectivity, application success or successful DAD. No addresses are assigned and no ICMPv6 is sent.

## routing

Input: destination IP and `routes:[{id,prefix,admin_distance,next_hop,active}]`. Unique route IDs, canonical CIDR networks, destination/prefix/next-hop same address family, AD 0–254 and boolean active. AD values are supplied, never vendor defaults. `active` means supplied candidate availability, not measured interface health.

For matching active candidates, first select minimum AD **within each identical prefix**, preserving equal-AD alternatives. Then apply longest-prefix forwarding lookup across those selected prefixes. Return destination, winning prefix length/AD, selected route IDs sorted, and `unique_route|tie_not_resolved`; no matching candidates returns `no_route` and empty selected list. Equal candidates are not converted into claimed ECMP installation or packet balancing. An inactive primary may allow a higher-AD same-prefix backup. A floating static route cannot detect silent downstream failure by itself. No metrics, protocol best-path details, recursive next-hop resolution, interface state, tracking, policy routing, VRFs or real RIB/FIB installation are modeled.

## ospf

Input: `neighbors:[{id,same_subnet,area_match,hello_match,dead_match,authentication_match,mtu_match}]`, `nodes`, `links`, `source`. IDs unique. Check fields boolean. Graph uses loop-control's positive undirected edge rules. Source must exist. Output each neighbor's failed check names, `prerequisites_satisfied`, and always `full_adjacency_proven:false`; also shortest costs (null unreachable).

Neighbor evidence and graph are independent tasks: a failed neighbor does not remove an edge from the supplied graph. This prevents invented link-state knowledge. The checks use a simplified same-subnet context, not every OSPF network type. A timer/area mismatch and MTU mismatch can affect different state transitions. Two-Way can be expected between DROTHER neighbors on broadcast networks. No neighbor state, election, actual LSDB, network type, LSA flooding or convergence simulation; satisfying listed checks does not prove adjacency.

## services

Input: `packet:{source,destination,protocol,destination_port}`, `rules:[{id,action,source,destination,protocol,port_min,port_max}]`, `static_nat:[{inside_local,inside_global}]`. IPv4 only. Packet protocol `tcp|udp|icmp`, port 0–65535; ICMP uses placeholder zero. Rule protocol additionally `any`, action `permit|deny`, canonical networks, ordered port range. `any` and `icmp` rules require full 0–65535 placeholder range (no ICMP type/code matching). Rule IDs unique. NAT local and global addresses each unique; no many-to-one/PAT.

First matching rule wins, unmatched packet implicitly denied. All rules are validated, even those after a match. NAT independently looks up the packet source in static mapping evidence, returning `source_mapping_if_applied` or null. `translation_executed:false`. **No inference about actual ACL/NAT processing order** or whether denied traffic would be translated. No direction/interface binding, stateful firewall, return-path or service availability proof. NAT is not automatically a security policy.

## wireless

Input: nonempty unique `client_security`, `minimum_security`, `aps:[{id,band,channel,width_mhz,security}]`. Security values `open|wpa2_aes|wpa3_sae`; local policy order is exactly that list, a simplified exercise policy rather than a complete security standard ranking. Band must be string `2.4`, channel integer 1–11, width exactly 20 MHz. Unique AP IDs. AP eligible only if client supports its security and it meets the requested policy minimum.

For every AP pair, same channel → `co_channel`; separation under five channel numbers → `overlap_in_simplified_plan`; otherwise `separated_in_simplified_plan`. This is an intentionally crude 2.4 GHz 20 MHz planning convention. It does not prove interference, throughput, airtime, adequate coverage, legal regional use, or a universally optimal channel selection. No RSSI, SNR, RF measurements, roaming, transition mode, EAP, DFS, 5/6 GHz or 40 MHz. `rf_measurements_available:false`.

## automation

Input: `actual` and `desired` arrays of `{id,vlan,enabled,description}`, plus `dependencies:[{before,after}]`. Each inventory has unique IDs, VLAN 1–4094, genuine boolean enabled, string description at most 80 characters. Dependencies must reference desired IDs; duplicates, self-dependencies and directed cycles rejected.

Compare ID sets for `create|remove`; compare common records in field order `vlan,enabled,description` for `update`. Changes sorted by ID. Topological order returns each available layer in sorted ID order; it describes only desired dependency order, not safe removal/update deployment sequencing. `applied:false` always. Actual/desired are names for two invented documents, not live observations. No diff means equality of these fields only, not device compliance or an idempotent real API. No REST request, credentials, configuration or deletion.

## capstone

Input: `observations:[{topic,outcome}]`; topics uniquely chosen from `vlan_membership|route_selection|acl_order|neighbor_exchange|application_response`; outcome `supports|contradicts|unknown`. Output sorted supporting topics, contradictions and gaps (missing or unknown). Always `end_to_end_success_proven:false` with a recommendation to resolve contradictions and obtain missing evidence in an authorized environment. Even all-supporting assertions cannot prove real activity or grant authorization. There is no automatic next action.
