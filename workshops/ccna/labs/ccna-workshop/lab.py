"""Original, bounded educational models. Never opens a network or controls a device."""
import sys
sys.dont_write_bytecode = True
import ipaddress
import json
import re

COMMANDS = ('vlans', 'loop-control', 'bundles', 'ipv6', 'routing', 'ospf',
            'services', 'wireless', 'automation', 'capstone')
MAX_BYTES = 65536

class LabError(ValueError):
    """A predictable invalid model input, never an equipment diagnostic."""

def require(condition, message):
    if not condition:
        raise LabError(message)

def bounded(value, depth=0):
    require(depth <= 12, 'Input nesting exceeds 12 levels')
    if value is None or type(value) is bool:
        return
    if type(value) is int:
        require(abs(value) <= 1000000, 'Integer exceeds model bound')
    elif type(value) is str:
        require(len(value) <= 256, 'String exceeds 256 characters')
    elif type(value) is list:
        require(len(value) <= 128, 'List exceeds 128 entries')
        for item in value:
            bounded(item, depth + 1)
    elif type(value) is dict:
        require(len(value) <= 128, 'Object exceeds 128 keys')
        for key, item in value.items():
            require(type(key) is str, 'Object keys must be strings')
            bounded(key, depth + 1)
            bounded(item, depth + 1)
    else:
        raise LabError('Unsupported value type (including floating point)')

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON object key')
        result[key] = value
    return result

def decode(raw):
    require(type(raw) is bytes, 'JSON input must be bytes')
    require(len(raw) <= MAX_BYTES, 'JSON exceeds 65536 bytes')
    def reject_constant(value):
        raise LabError('Nonfinite JSON number')
    try:
        data = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_object,
                          parse_constant=reject_constant)
        bounded(data)
        return data
    except (UnicodeError, json.JSONDecodeError, RecursionError, ValueError) as exc:
        if isinstance(exc, LabError):
            raise
        raise LabError('Malformed JSON') from None

def obj(value, keys):
    require(type(value) is dict, 'Expected object')
    require(set(value) == set(keys.split()), 'Unexpected or missing object fields')
    return value

def seq(value, nonempty=False):
    require(type(value) is list and len(value) <= 128, 'Expected bounded list')
    require(not nonempty or bool(value), 'List must not be empty')
    return value

def name(value):
    require(type(value) is str and re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,31}', value),
            'Expected simple identifier (1..32 characters)')
    return value

def integer(value, low, high):
    require(type(value) is int and low <= value <= high, 'Integer out of allowed range')
    return value

def choice(value, values):
    require(type(value) is str and value in values, 'Unsupported enum value')
    return value

def boolean(value):
    require(type(value) is bool, 'Expected boolean')
    return value

def unique(values, label='identifier'):
    require(len(values) == len(set(values)), 'Duplicate ' + label)
    return values

def ip(value, version=None):
    require(type(value) is str and '%' not in value, 'Expected unscoped IP address')
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        raise LabError('Invalid IP address') from None
    require(version is None or address.version == version, 'Wrong IP version')
    return address

def net(value, version=None):
    require(type(value) is str and '/' in value and '%' not in value, 'Expected CIDR network')
    try:
        network = ipaddress.ip_network(value, strict=True)
    except ValueError:
        raise LabError('Invalid or noncanonical CIDR network') from None
    require(version is None or network.version == version, 'Wrong network version')
    return network

def vlan_list(value):
    return unique([integer(v, 1, 4094) for v in seq(value)], 'VLAN')

def mac(value):
    require(type(value) is str and re.fullmatch(r'(?:[0-9a-f]{2}:){5}[0-9a-f]{2}', value),
            'Expected lowercase colon MAC')
    require(int(value[:2], 16) & 1 == 0, 'Model requires unicast MAC')
    return value

def vlans(data):
    obj(data, 'ports frames')
    ports = {}
    intersections = {}
    for port in seq(data['ports'], True):
        obj(port, 'id mode local_vlans peer_vlans')
        key = name(port['id'])
        require(key not in ports, 'Duplicate port')
        mode = choice(port['mode'], ('access', 'trunk'))
        local, peer = vlan_list(port['local_vlans']), vlan_list(port['peer_vlans'])
        require(bool(local), 'Local VLAN list must not be empty')
        if mode == 'access':
            require(len(local) == 1 and peer == [], 'Access port needs one VLAN and no peer list')
            allowed = set(local)
        else:
            allowed = set(local) & set(peer)
            intersections[key] = sorted(allowed)
        ports[key] = allowed
    table, events = {}, []
    for frame in seq(data['frames']):
        obj(frame, 'ingress vlan source destination')
        ingress = name(frame['ingress'])
        require(ingress in ports, 'Unknown ingress port')
        vlan = integer(frame['vlan'], 1, 4094)
        src, dst = mac(frame['source']), mac(frame['destination'])
        if vlan not in ports[ingress]:
            events.append({'decision': 'drop_vlan', 'egress': []})
            continue
        table[(vlan, src)] = ingress
        target = table.get((vlan, dst))
        if target == ingress:
            decision, egress = 'filter_same_port', []
        elif target is not None:
            decision, egress = 'known_unicast', [target]
        else:
            decision = 'flood_unknown_unicast'
            egress = sorted(p for p, allowed in ports.items() if p != ingress and vlan in allowed)
        events.append({'decision': decision, 'egress': egress})
    return {'trunk_intersections': intersections, 'events': events,
            'learned': [{'vlan': v, 'mac': m, 'port': p} for (v, m), p in sorted(table.items())]}

def graph(nodes, links):
    ids = unique([name(n) for n in seq(nodes, True)])
    adjacency = {n: {} for n in ids}
    seen = set()
    for link in seq(links):
        obj(link, 'a b cost')
        a, b = name(link['a']), name(link['b'])
        require(a in adjacency and b in adjacency, 'Orphan graph endpoint')
        require(a != b, 'Self-loop is outside model')
        pair = tuple(sorted((a, b)))
        require(pair not in seen, 'Duplicate undirected link')
        seen.add(pair)
        cost = integer(link['cost'], 1, 65535)
        adjacency[a][b] = adjacency[b][a] = cost
    return adjacency

def distances(adjacency, source):
    pending, dist = set(adjacency), {source: 0}
    while pending:
        reachable = [n for n in pending if n in dist]
        if not reachable:
            break
        node = min(reachable, key=lambda n: (dist[n], n))
        pending.remove(node)
        for peer, cost in adjacency[node].items():
            candidate = dist[node] + cost
            if peer not in dist or candidate < dist[peer]:
                dist[peer] = candidate
    return dist

def loop_control(data):
    obj(data, 'switches links')
    switches = seq(data['switches'], True)
    bids = {}
    for switch in switches:
        obj(switch, 'id priority mac')
        key = name(switch['id'])
        require(key not in bids, 'Duplicate switch')
        priority = integer(switch['priority'], 0, 61440)
        require(priority % 4096 == 0, 'Priority must use 4096 steps')
        bids[key] = (priority, mac(switch['mac']))
    unique(list(bids.values()), 'bridge identifier')
    adjacency = graph(list(bids), data['links'])
    root = min(bids, key=bids.get)
    dist = distances(adjacency, root)
    paths = []
    for node in sorted(bids):
        options = sorted(peer for peer, cost in adjacency[node].items()
                         if node in dist and peer in dist and dist[peer] + cost == dist[node])
        paths.append({'switch': node, 'root_cost': dist.get(node),
                      'candidate_neighbors': options,
                      'status': 'root' if node == root else 'unreachable' if node not in dist
                      else 'equal_cost_not_fully_tiebroken' if len(options) > 1 else 'unique_cost_path'})
    return {'root': root, 'paths': paths}

def bundles(data):
    obj(data, 'members')
    members = seq(data['members'], True)
    baseline = None
    rows, ids = [], []
    for member in members:
        obj(member, 'id speed_mbps duplex vlans local_mode peer_mode')
        ids.append(name(member['id']))
        speed = integer(member['speed_mbps'], 1, 1000000)
        duplex = choice(member['duplex'], ('full', 'half'))
        vlans_ = sorted(vlan_list(member['vlans']))
        require(bool(vlans_), 'Bundle VLAN list cannot be empty')
        local = choice(member['local_mode'], ('active', 'passive'))
        peer = choice(member['peer_mode'], ('active', 'passive'))
        signature = (speed, duplex, vlans_)
        if baseline is None:
            baseline = signature
        reasons = []
        if speed != baseline[0]: reasons.append('speed_mismatch')
        if duplex != baseline[1]: reasons.append('duplex_mismatch')
        if vlans_ != baseline[2]: reasons.append('vlan_mismatch')
        if duplex != 'full': reasons.append('model_requires_full_duplex')
        if local == peer == 'passive': reasons.append('both_passive')
        rows.append({'member': member['id'], 'compatible': not reasons, 'reasons': reasons})
    unique(ids, 'member')
    return {'reference_member': ids[0], 'members': rows, 'all_compatible': all(r['compatible'] for r in rows)}

def ipv6(data):
    obj(data, 'prefix addresses neighbor_observation')
    network = net(data['prefix'], 6)
    addresses = [ip(a, 6) for a in seq(data['addresses'], True)]
    unique(addresses, 'address')
    observation = choice(data['neighbor_observation'], ('none', 'solicitation_seen', 'advertisement_seen'))
    rows = []
    for address in addresses:
        scope = ('unspecified' if address.is_unspecified else 'loopback' if address.is_loopback
                 else 'multicast' if address.is_multicast else 'link_local' if address.is_link_local
                 else 'unique_local' if address in ipaddress.ip_network('fc00::/7') else 'other_unicast')
        rows.append({'address': str(address), 'in_prefix': address in network, 'category': scope})
    return {'prefix': str(network), 'prefix_length': network.prefixlen, 'addresses': rows,
            'neighbor_observation': observation, 'reachability_proven': False,
            'evidence_limit': 'An observation alone does not prove current bidirectional reachability.'}

def routing(data):
    obj(data, 'destination routes')
    destination = ip(data['destination'])
    candidates, ids = [], []
    for route in seq(data['routes']):
        obj(route, 'id prefix admin_distance next_hop active')
        key = name(route['id']); ids.append(key)
        network = net(route['prefix'], destination.version)
        hop = ip(route['next_hop'], destination.version)
        ad = integer(route['admin_distance'], 0, 254)
        active = boolean(route['active'])
        if active and destination in network:
            candidates.append((network, ad, key, str(hop)))
    unique(ids, 'route')
    if not candidates:
        return {'destination': str(destination), 'decision': 'no_route', 'selected': []}
    # Stage 1: select same-prefix RIB candidates by supplied AD.
    best_ad = {}
    for network, ad, _, _ in candidates:
        best_ad[network] = min(ad, best_ad.get(network, ad))
    installed = [c for c in candidates if c[1] == best_ad[c[0]]]
    # Stage 2: model forwarding lookup across those selected prefixes.
    prefixlen = max(c[0].prefixlen for c in installed)
    finalists = [c for c in installed if c[0].prefixlen == prefixlen]
    ad = finalists[0][1]
    selected = sorted(c[2] for c in finalists)
    return {'destination': str(destination), 'prefix_length': prefixlen, 'admin_distance': ad,
            'decision': 'unique_route' if len(selected) == 1 else 'tie_not_resolved', 'selected': selected}

def ospf(data):
    obj(data, 'neighbors nodes links source')
    rows, ids = [], []
    for neighbor in seq(data['neighbors']):
        obj(neighbor, 'id same_subnet area_match hello_match dead_match authentication_match mtu_match')
        key = name(neighbor['id']); ids.append(key)
        failures = [field for field in ('same_subnet', 'area_match', 'hello_match', 'dead_match',
                                       'authentication_match', 'mtu_match') if not boolean(neighbor[field])]
        rows.append({'neighbor': key, 'prerequisites_satisfied': not failures, 'failed_checks': failures,
                     'full_adjacency_proven': False})
    unique(ids, 'neighbor')
    adjacency = graph(data['nodes'], data['links'])
    source = name(data['source']); require(source in adjacency, 'Unknown source node')
    dist = distances(adjacency, source)
    return {'neighbors': rows, 'source': source,
            'shortest_costs': {n: dist.get(n) for n in sorted(adjacency)},
            'scope': 'Undirected positive-cost SPF model; supplied graph is not a learned LSDB.'}

def services(data):
    obj(data, 'rules packet static_nat')
    packet = obj(data['packet'], 'source destination protocol destination_port')
    source, destination = ip(packet['source'], 4), ip(packet['destination'], 4)
    protocol = choice(packet['protocol'], ('tcp', 'udp', 'icmp'))
    port = integer(packet['destination_port'], 0, 65535)
    require(protocol != 'icmp' or port == 0, 'ICMP uses placeholder port zero in this model')
    matched, decision, ids = None, 'deny', []
    for rule in seq(data['rules']):
        obj(rule, 'id action source destination protocol port_min port_max')
        key = name(rule['id']); ids.append(key)
        action = choice(rule['action'], ('permit', 'deny'))
        srcnet, dstnet = net(rule['source'], 4), net(rule['destination'], 4)
        proto = choice(rule['protocol'], ('any', 'tcp', 'udp', 'icmp'))
        low, high = integer(rule['port_min'], 0, 65535), integer(rule['port_max'], 0, 65535)
        require(low <= high, 'Reversed port range')
        require(proto not in ('any', 'icmp') or (low, high) == (0, 65535), 'Any/ICMP rules require full placeholder range')
        if matched is None and source in srcnet and destination in dstnet and proto in ('any', protocol) and low <= port <= high:
            matched, decision = key, action
    unique(ids, 'rule')
    internal, external, mapping = [], [], None
    for row in seq(data['static_nat']):
        obj(row, 'inside_local inside_global')
        local, global_ = ip(row['inside_local'], 4), ip(row['inside_global'], 4)
        internal.append(local); external.append(global_)
        if local == source:
            mapping = str(global_)
    unique(internal, 'inside-local mapping'); unique(external, 'inside-global mapping')
    return {'acl_decision': decision, 'matched_rule': matched, 'implicit_deny': matched is None,
            'source_mapping_if_applied': mapping, 'translation_executed': False,
            'scope': 'Independent ACL and static NAT evidence; no device processing order inferred.'}

def wireless(data):
    obj(data, 'client_security aps minimum_security')
    security = ('open', 'wpa2_aes', 'wpa3_sae')
    client = unique([choice(s, security) for s in seq(data['client_security'], True)], 'client capability')
    minimum = choice(data['minimum_security'], security)
    rows, ids, channels = [], [], []
    for ap in seq(data['aps']):
        obj(ap, 'id band channel width_mhz security')
        key = name(ap['id']); ids.append(key)
        choice(ap['band'], ('2.4',))
        channel = integer(ap['channel'], 1, 11)
        integer(ap['width_mhz'], 20, 20)
        mode = choice(ap['security'], security)
        reasons = []
        if mode not in client: reasons.append('unsupported_client_security')
        if security.index(mode) < security.index(minimum): reasons.append('below_requested_security')
        rows.append({'ap': key, 'eligible': not reasons, 'reasons': reasons})
        channels.append((key, channel))
    unique(ids, 'AP')
    pairs = []
    for i, (left, channel) in enumerate(channels):
        for right, other in channels[i + 1:]:
            pairs.append({'a': left, 'b': right, 'relationship': 'co_channel' if channel == other
                          else 'overlap_in_simplified_plan' if abs(channel - other) < 5
                          else 'separated_in_simplified_plan'})
    return {'aps': rows, 'channel_pairs': pairs, 'rf_measurements_available': False,
            'scope': '2.4 GHz channels 1..11, 20 MHz only; simplified planning, not regulatory advice.'}

def automation(data):
    obj(data, 'actual desired dependencies')
    def inventory(rows):
        result = {}
        for row in seq(rows):
            obj(row, 'id vlan enabled description')
            key = name(row['id']); require(key not in result, 'Duplicate inventory identifier')
            integer(row['vlan'], 1, 4094); boolean(row['enabled'])
            require(type(row['description']) is str and len(row['description']) <= 80, 'Invalid description')
            result[key] = row
        return result
    actual, desired = inventory(data['actual']), inventory(data['desired'])
    dependencies, pairs = {key: [] for key in desired}, set()
    for dependency in seq(data['dependencies']):
        obj(dependency, 'before after')
        before, after = name(dependency['before']), name(dependency['after'])
        require(before in desired and after in desired, 'Orphan dependency')
        require((before, after) not in pairs, 'Duplicate dependency')
        pairs.add((before, after)); dependencies[after].append(before)
    order, pending = [], set(desired)
    while pending:
        ready = sorted(key for key in pending if all(p in order for p in dependencies[key]))
        require(bool(ready), 'Dependency cycle')
        order.extend(ready); pending.difference_update(ready)
    changes = []
    for key in sorted(set(actual) | set(desired)):
        if key not in actual: changes.append({'id': key, 'change': 'create'})
        elif key not in desired: changes.append({'id': key, 'change': 'remove'})
        else:
            fields = [field for field in ('vlan', 'enabled', 'description') if actual[key][field] != desired[key][field]]
            if fields: changes.append({'id': key, 'change': 'update', 'fields': fields})
    return {'changes': changes, 'desired_dependency_order': order, 'applied': False}

def capstone(data):
    obj(data, 'observations')
    allowed = ('vlan_membership', 'route_selection', 'acl_order', 'neighbor_exchange', 'application_response')
    rows = {}
    for observation in seq(data['observations']):
        obj(observation, 'topic outcome')
        topic = choice(observation['topic'], allowed)
        require(topic not in rows, 'Duplicate evidence topic')
        rows[topic] = choice(observation['outcome'], ('supports', 'contradicts', 'unknown'))
    return {'supporting': sorted(k for k, v in rows.items() if v == 'supports'),
            'contradictions': sorted(k for k, v in rows.items() if v == 'contradicts'),
            'gaps': sorted(k for k in allowed if rows.get(k, 'unknown') == 'unknown'),
            'end_to_end_success_proven': False,
            'next_step': 'Resolve contradictions and collect missing independent evidence in an authorized environment.'}

HANDLERS = dict(zip(COMMANDS, (vlans, loop_control, bundles, ipv6, routing, ospf, services, wireless, automation, capstone)))

def run(command, data):
    require(type(command) is str and command in HANDLERS, 'Unknown fixed command')
    bounded(data)
    result = HANDLERS[command](data)
    return {'command': command, 'real_network_executed': False, 'synthetic_model': True, 'result': result}
