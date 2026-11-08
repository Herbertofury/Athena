# Worked answers and exact packaged outputs

These are deterministic outputs from invented fixtures, not transcripts from network equipment. [Worksheet](WORKSHEET.md) · [Contracts](CONTRACTS.md). The full envelope is included so synthetic/no-execution boundaries remain visible.

## vlans

The uplink admits VLANs 10 and 20, not 30. Frame 1 learns deskA in VLAN 10 and floods only to uplink. Frame 2 learns its source on uplink and unicasts to deskA. Frame 3 learns the same source MAC as frame 1 in a separate VLAN-20 table entry and floods to deskB. Frame 4 is dropped before learning because deskA admits only VLAN 10. Changing the uplink peer list to [30] makes frame 1 egress empty, without proving that no destination exists. No aging, tags/native VLAN handling, STP state or broadcast/multicast behavior is simulated.

Command: `python3 -B run_lab.py vlans`

```json
{
  "command": "vlans",
  "real_network_executed": false,
  "result": {
    "events": [
      {
        "decision": "flood_unknown_unicast",
        "egress": [
          "uplink"
        ]
      },
      {
        "decision": "known_unicast",
        "egress": [
          "deskA"
        ]
      },
      {
        "decision": "flood_unknown_unicast",
        "egress": [
          "deskB"
        ]
      },
      {
        "decision": "drop_vlan",
        "egress": []
      }
    ],
    "learned": [
      {
        "mac": "02:00:00:00:00:01",
        "port": "deskA",
        "vlan": 10
      },
      {
        "mac": "02:00:00:00:00:02",
        "port": "uplink",
        "vlan": 10
      },
      {
        "mac": "02:00:00:00:00:01",
        "port": "uplink",
        "vlan": 20
      }
    ],
    "trunk_intersections": {
      "uplink": [
        10,
        20
      ]
    }
  },
  "synthetic_model": true
}
```

## loop-control

Root's priority 4096 wins over 32768. Left and right each cost 4 from root; edge costs 8 through either. The model preserves both candidates and intentionally does not complete STP tie-breaking or port-role election. Real tie-breaks include bridge/port identifiers; list order is not a port election. Island has no path to the chosen root in the supplied graph; a separate real component could elect its own root. Raising right-edge cost to 5 leaves edge cost 8 but only left as a candidate. Cycles are ordinary topology evidence, not an error; dependency cycles in automation have different semantics.

Command: `python3 -B run_lab.py loop-control`

```json
{
  "command": "loop-control",
  "real_network_executed": false,
  "result": {
    "paths": [
      {
        "candidate_neighbors": [
          "left",
          "right"
        ],
        "root_cost": 8,
        "status": "equal_cost_not_fully_tiebroken",
        "switch": "edge"
      },
      {
        "candidate_neighbors": [],
        "root_cost": null,
        "status": "unreachable",
        "switch": "island"
      },
      {
        "candidate_neighbors": [
          "root"
        ],
        "root_cost": 4,
        "status": "unique_cost_path",
        "switch": "left"
      },
      {
        "candidate_neighbors": [
          "root"
        ],
        "root_cost": 4,
        "status": "unique_cost_path",
        "switch": "right"
      },
      {
        "candidate_neighbors": [],
        "root_cost": 0,
        "status": "root",
        "switch": "root"
      }
    ],
    "root": "root"
  },
  "synthetic_model": true
}
```

## bundles

m1 is the reference, with VLAN set {10,20}. m2 matches that set despite its reversed list order, but both peers are passive. m3 differs in speed and VLANs. With m1/m2 only and an active peer for m2, all supplied compatibility checks pass. This omits native VLAN, trunk mode, partner identity and operational state; no bundle has been negotiated. Local channel-group numbers need not match between peers, and hashing usually assigns a given flow to a member rather than multiplying its speed. Static on is not LACP active.

Command: `python3 -B run_lab.py bundles`

```json
{
  "command": "bundles",
  "real_network_executed": false,
  "result": {
    "all_compatible": false,
    "members": [
      {
        "compatible": true,
        "member": "m1",
        "reasons": []
      },
      {
        "compatible": false,
        "member": "m2",
        "reasons": [
          "both_passive"
        ]
      },
      {
        "compatible": false,
        "member": "m3",
        "reasons": [
          "speed_mismatch",
          "vlan_mismatch"
        ]
      }
    ],
    "reference_member": "m1"
  },
  "synthetic_model": true
}
```

## ipv6

Only 2001:db8:42::7 belongs to the supplied /64. The fourth 16-bit group is within that 64-bit network prefix; changing 42 to 43 changes the prefix. fe80::1 is link-local, fd00::1 ULA, ff02::1 multicast, :: unspecified, ::1 loopback. Documentation addresses categorized other_unicast are not claimed globally routable. ND observations alone do not prove current bidirectional connectivity, DAD success or an application response. Zone information requires interface/link context, which is absent. A /128 contains only its exact address; a /64 containing nonzero host bits is rejected by the canonical-network contract.

Command: `python3 -B run_lab.py ipv6`

```json
{
  "command": "ipv6",
  "real_network_executed": false,
  "result": {
    "addresses": [
      {
        "address": "2001:db8:42::7",
        "category": "other_unicast",
        "in_prefix": true
      },
      {
        "address": "2001:db8:43::7",
        "category": "other_unicast",
        "in_prefix": false
      },
      {
        "address": "fe80::1",
        "category": "link_local",
        "in_prefix": false
      },
      {
        "address": "fd00::1",
        "category": "unique_local",
        "in_prefix": false
      },
      {
        "address": "ff02::1",
        "category": "multicast",
        "in_prefix": false
      },
      {
        "address": "::",
        "category": "unspecified",
        "in_prefix": false
      },
      {
        "address": "::1",
        "category": "loopback",
        "in_prefix": false
      }
    ],
    "evidence_limit": "An observation alone does not prove current bidirectional reachability.",
    "neighbor_observation": "advertisement_seen",
    "prefix": "2001:db8:42::/64",
    "prefix_length": 64,
    "reachability_proven": false
  },
  "synthetic_model": true
}
```

## routing

The available /24 candidate is floating at AD 200 because primary is supplied inactive. The /26 specific route wins forwarding despite AD 220 because it is more specific than /24 or default. Marking specific inactive selects floating; also activating primary selects primary at AD 90 for the /24. Duplicating specific under a distinct ID produces tie_not_resolved, not proof of installed ECMP. Administrative distance is compared within identical-prefix candidates before forwarding lookup, never globally across unrelated prefix lengths. These supplied active flags do not measure downstream health or cause a floating route to detect silent failure.

Command: `python3 -B run_lab.py routing`

```json
{
  "command": "routing",
  "real_network_executed": false,
  "result": {
    "admin_distance": 220,
    "decision": "unique_route",
    "destination": "192.0.2.77",
    "prefix_length": 26,
    "selected": [
      "specific"
    ]
  },
  "synthetic_model": true
}
```

## ospf

peerA fails only mtu_match; peerB passes this limited checklist, but neither output proves Full adjacency. MTU mismatch can disrupt database exchange, while area/timer incompatibilities can prevent earlier neighbor progression. Two-Way between DROTHER neighbors can be normal on a broadcast network. A→C→B costs 5, better than direct A→B cost 10. A→C→B→D costs9, better than A→C→D cost 23. Island is unreachable in the supplied graph. Neighbor checks and graph have no asserted mapping: deleting an edge would invent LSDB evidence. Real current neighbor, interface, network-type and link-state evidence is absent.

Command: `python3 -B run_lab.py ospf`

```json
{
  "command": "ospf",
  "real_network_executed": false,
  "result": {
    "neighbors": [
      {
        "failed_checks": [
          "mtu_match"
        ],
        "full_adjacency_proven": false,
        "neighbor": "peerA",
        "prerequisites_satisfied": false
      },
      {
        "failed_checks": [],
        "full_adjacency_proven": false,
        "neighbor": "peerB",
        "prerequisites_satisfied": true
      }
    ],
    "scope": "Undirected positive-cost SPF model; supplied graph is not a learned LSDB.",
    "shortest_costs": {
      "A": 0,
      "B": 5,
      "C": 3,
      "D": 9,
      "island": null
    },
    "source": "A"
  },
  "synthetic_model": true
}
```

## services

blockHost denies first, so the later allowHttps rule does not change the original outcome. Reversing rule order permits the original packet. Changing source to 192.0.2.10 and TCP destination port to 80 matches neither rule and yields implicit deny. The original source has an independent static mapping to 203.0.113.9, but no translation occurs and no ACL/NAT ordering is claimed. NAT mappings are not a security policy or return-path proof.

Command: `python3 -B run_lab.py services`

```json
{
  "command": "services",
  "real_network_executed": false,
  "result": {
    "acl_decision": "deny",
    "implicit_deny": false,
    "matched_rule": "blockHost",
    "scope": "Independent ACL and static NAT evidence; no device processing order inferred.",
    "source_mapping_if_applied": "203.0.113.9",
    "translation_executed": false
  },
  "synthetic_model": true
}
```

## wireless

Only lobby meets both the client's WPA2-AES capability and the requested security floor. Office requires unsupported WPA3-SAE. Guest is open, both unsupported by this client's declared capability list and below the policy minimum. Channels 1/3 overlap in the simplified plan, 1/6 are separated, and 3/6 overlap. Adding WPA3-SAE capability makes office eligible without changing channel relationships. Channel legality, RF noise, airtime contention, power, walls, coverage, roaming and real client behavior are absent. Unsupported bands, widths and channels are rejected to avoid extending the crude model beyond its contract.

Command: `python3 -B run_lab.py wireless`

```json
{
  "command": "wireless",
  "real_network_executed": false,
  "result": {
    "aps": [
      {
        "ap": "lobby",
        "eligible": true,
        "reasons": []
      },
      {
        "ap": "office",
        "eligible": false,
        "reasons": [
          "unsupported_client_security"
        ]
      },
      {
        "ap": "guest",
        "eligible": false,
        "reasons": [
          "unsupported_client_security",
          "below_requested_security"
        ]
      }
    ],
    "channel_pairs": [
      {
        "a": "lobby",
        "b": "office",
        "relationship": "overlap_in_simplified_plan"
      },
      {
        "a": "lobby",
        "b": "guest",
        "relationship": "separated_in_simplified_plan"
      },
      {
        "a": "office",
        "b": "guest",
        "relationship": "overlap_in_simplified_plan"
      }
    ],
    "rf_measurements_available": false,
    "scope": "2.4 GHz channels 1..11, 20 MHz only; simplified planning, not regulatory advice."
  },
  "synthetic_model": true
}
```

## automation

Desk changes VLAN and description, listed in field order vlan,description; retired is removed from the proposed record set; uplink is created. The desired dependency order is uplink then desk. It is not a safe whole-deployment sequence and says nothing about removal order. Copying desired into actual produces no changes, demonstrating equality of these synthetic records only. JSON 1 is an integer, not boolean true. A reverse dependency creates a directed cycle. Duplicate IDs and orphan references make comparison ambiguous and are rejected. applied remains false, and no API or device is used.

Command: `python3 -B run_lab.py automation`

```json
{
  "command": "automation",
  "real_network_executed": false,
  "result": {
    "applied": false,
    "changes": [
      {
        "change": "update",
        "fields": [
          "vlan",
          "description"
        ],
        "id": "desk"
      },
      {
        "change": "remove",
        "id": "retired"
      },
      {
        "change": "create",
        "id": "uplink"
      }
    ],
    "desired_dependency_order": [
      "uplink",
      "desk"
    ]
  },
  "synthetic_model": true
}
```

## capstone

VLAN membership and route selection support the supplied claim; ACL order contradicts it. Neighbor exchange is explicitly unknown, and application response is absent; both are gaps. One supporting layer cannot cancel an independent contradiction. Even five supporting assertions leave end_to_end_success_proven false because the program has no live observations. A suitable handoff: “The invented ACL evidence contradicts the intended flow; neighbor exchange and application-response evidence are missing. In an authorized environment, establish the relevant ACL order/direction and independently gather current neighbor and application evidence. This exercise performed no network action.”

Command: `python3 -B run_lab.py capstone`

```json
{
  "command": "capstone",
  "real_network_executed": false,
  "result": {
    "contradictions": [
      "acl_order"
    ],
    "end_to_end_success_proven": false,
    "gaps": [
      "application_response",
      "neighbor_exchange"
    ],
    "next_step": "Resolve contradictions and collect missing independent evidence in an authorized environment.",
    "supporting": [
      "route_selection",
      "vlan_membership"
    ]
  },
  "synthetic_model": true
}
```

## Predictable invalid invocation

`python3 -B run_lab.py ../routing` exits 2 and never treats the argument as a path:

```json
{
  "command": null,
  "error": {
    "code": "invalid_input",
    "message": "Supply exactly one fixed command: vlans, loop-control, bundles, ipv6, routing, ospf, services, wireless, automation, capstone"
  },
  "real_network_executed": false,
  "synthetic_model": true
}
```
