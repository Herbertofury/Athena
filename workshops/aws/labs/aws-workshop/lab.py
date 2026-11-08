"""Bounded, synthetic architecture reasoning. Not an AWS policy or service emulator."""
from collections import deque
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP, localcontext
import re

MAX_ITEMS = 100
TOKEN = re.compile(r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}\Z')


class ContractError(ValueError):
    """A caller violated this teaching model's input contract."""


def record(value, keys, label):
    if type(value) is not dict or set(value) != set(keys):
        raise ContractError(f'{label}: expected exactly {sorted(keys)}')
    return value


def token(value, label):
    if type(value) is not str or not TOKEN.fullmatch(value):
        raise ContractError(f'{label}: expected a 1–80 character identifier')
    return value


def rows(value, label, empty=False):
    if type(value) is not list or not (0 if empty else 1) <= len(value) <= MAX_ITEMS:
        raise ContractError(f'{label}: expected bounded list, max {MAX_ITEMS}')
    return value


def names(value, label, empty=False):
    rows(value, label, empty)
    for item in value:
        token(item, label)
    if len(set(value)) != len(value):
        raise ContractError(f'{label}: duplicate identifier')
    return value


def integer(value, label, maximum=1_000_000):
    if type(value) is not int or not 0 <= value <= maximum:
        raise ContractError(f'{label}: expected integer from 0 through {maximum}')
    return value


def boolean(value, label):
    if type(value) is not bool:
        raise ContractError(f'{label}: expected boolean')
    return value


def unique_ids(items, label):
    identifiers = [item['id'] for item in items]
    names(identifiers, label)


def identity(request, rules, approvals):
    """Exact action/resource matching and abstract approval gates; no wildcards/IAM."""
    record(request, ('action', 'resource', 'required_approvals'), 'request')
    action = token(request['action'], 'action')
    resource = token(request['resource'], 'resource')
    required = names(request['required_approvals'], 'required_approvals', True)
    names(approvals, 'approvals', True)
    rows(rules, 'rules', True)
    for rule in rules:
        record(rule, ('id', 'effect', 'action', 'resource'), 'rule')
        for key in ('id', 'action', 'resource'):
            token(rule[key], key)
        if rule['effect'] not in ('allow', 'deny'):
            raise ContractError('effect: expected allow or deny')
    if rules:
        unique_ids(rules, 'rules')
    matches = [r for r in rules if r['action'] == action and r['resource'] == resource]
    denies = sorted(r['id'] for r in matches if r['effect'] == 'deny')
    allows = sorted(r['id'] for r in matches if r['effect'] == 'allow')
    missing = sorted(set(required) - set(approvals))
    decision = 'deny' if denies or not allows else ('approval_required' if missing else 'allow')
    return dict(decision=decision, matching_allows=allows, matching_denies=denies,
                missing_approvals=missing, actual_authorization=False)


def network(nodes, routes, allows, source, target):
    """Reachability on directed route and allow graphs, not AWS packet behavior."""
    names(nodes, 'nodes')
    token(source, 'source'); token(target, 'target')
    if source not in nodes or target not in nodes:
        raise ContractError('source and target must be declared nodes')
    def edges(values, label):
        rows(values, label, True)
        result = set()
        for edge in values:
            if type(edge) is not list or len(edge) != 2:
                raise ContractError(f'{label}: edge must be [from, to]')
            for endpoint in edge:
                token(endpoint, label)
                if endpoint not in nodes:
                    raise ContractError(f'{label}: unknown endpoint')
            pair = tuple(edge)
            if pair in result:
                raise ContractError(f'{label}: duplicate edge')
            result.add(pair)
        return result
    route_set = edges(routes, 'routes'); allow_set = edges(allows, 'allows')
    def path(graph):
        pending = deque([(source, [source])]); seen = {source}
        while pending:
            current, trail = pending.popleft()
            if current == target:
                return trail
            for neighbor in sorted(b for a, b in graph if a == current):
                if neighbor not in seen:
                    seen.add(neighbor); pending.append((neighbor, trail + [neighbor]))
        return None
    routed = path(route_set); permitted = path(route_set & allow_set)
    return dict(route_path=routed, permitted_path=permitted, reachable=permitted is not None,
                routed_but_not_allowed=[list(edge) for edge in sorted(route_set - allow_set)],
                scope='one-way abstract graph; no ports, NAT, DNS, return path, or AWS rules')


def decision_matrix(requirements, options):
    """Expose all feasible options and nearest ties without choosing a universal winner."""
    names(requirements, 'requirements')
    rows(options, 'options')
    for option in options:
        record(option, ('id', 'capabilities', 'caveats'), 'option')
        token(option['id'], 'option id')
        names(option['capabilities'], 'capabilities', True)
        rows(option['caveats'], 'caveats', True)
        for caveat in option['caveats']:
            if type(caveat) is not str or not 1 <= len(caveat) <= 300:
                raise ContractError('caveat: expected 1–300 characters')
    unique_ids(options, 'options')
    evaluated = [dict(id=o['id'], unmet=sorted(set(requirements)-set(o['capabilities'])),
                      caveats=list(o['caveats'])) for o in sorted(options, key=lambda x: x['id'])]
    feasible = [o['id'] for o in evaluated if not o['unmet']]
    minimum = min(len(o['unmet']) for o in evaluated)
    nearest = [o['id'] for o in evaluated if len(o['unmet']) == minimum]
    return dict(feasible=feasible, nearest=nearest, ambiguous=len(nearest) > 1,
                status='feasible' if feasible else 'unmet_requirements', options=evaluated,
                recommendation=None)


def queues(messages, deliveries, max_attempts):
    """Fixed delivery schedule with transactional toy deduplication and bounded redrive."""
    rows(messages, 'messages'); rows(deliveries, 'deliveries', True)
    if integer(max_attempts, 'max_attempts', 100) == 0:
        raise ContractError('max_attempts: must be positive')
    for message in messages:
        record(message, ('id', 'amount_cents'), 'message')
        token(message['id'], 'message id'); integer(message['amount_cents'], 'amount_cents')
    unique_ids(messages, 'messages')
    by_id = {m['id']: m for m in messages}
    for delivery in deliveries:
        record(delivery, ('id', 'handler_ok', 'ack_received'), 'delivery')
        token(delivery['id'], 'delivery id')
        if delivery['id'] not in by_id:
            raise ContractError('delivery: unknown message')
        boolean(delivery['handler_ok'], 'handler_ok'); boolean(delivery['ack_received'], 'ack_received')
        if not delivery['handler_ok'] and delivery['ack_received']:
            raise ContractError('delivery: failed handler cannot acknowledge in this model')
    attempts = {m['id']: 0 for m in messages}; processed = set(); acknowledged = set(); dead = set()
    total = 0; events = []
    for delivery in deliveries:
        key = delivery['id']
        if key in dead or key in acknowledged:
            events.append(dict(id=key, outcome='ignored_terminal')); continue
        attempts[key] += 1
        if key in processed:
            outcome = 'duplicate_suppressed'
        elif delivery['handler_ok']:
            total += by_id[key]['amount_cents']; processed.add(key); outcome = 'applied'
        else:
            outcome = 'handler_failed'
        if delivery['ack_received']:
            acknowledged.add(key)
        elif attempts[key] >= max_attempts:
            dead.add(key)
        events.append(dict(id=key, outcome=outcome, attempt=attempts[key]))
    return dict(total_cents=total, applied=sorted(processed), acknowledged=sorted(acknowledged),
                dead_letter=sorted(dead), pending=sorted(set(by_id)-acknowledged-dead),
                attempts=attempts, events=events,
                assumption='effect and idempotency record commit atomically; not SQS semantics')


def resilience(replicas, failed_domains, required_survivors, measured_restore_minutes,
               backup_age_minutes, target_rto_minutes, target_rpo_minutes):
    rows(replicas, 'replicas'); names(failed_domains, 'failed_domains', True)
    for replica in replicas:
        record(replica, ('id', 'domain'), 'replica')
        token(replica['id'], 'replica id'); token(replica['domain'], 'domain')
    unique_ids(replicas, 'replicas')
    if set(failed_domains) - {r['domain'] for r in replicas}:
        raise ContractError('failed_domains: unknown domain')
    for label, value in [('required_survivors', required_survivors),
                         ('measured_restore_minutes', measured_restore_minutes),
                         ('backup_age_minutes', backup_age_minutes),
                         ('target_rto_minutes', target_rto_minutes), ('target_rpo_minutes', target_rpo_minutes)]:
        integer(value, label)
    if required_survivors == 0 or required_survivors > len(replicas):
        raise ContractError('required_survivors: must be 1 through replica count')
    survivors = sorted(r['id'] for r in replicas if r['domain'] not in failed_domains)
    return dict(survivors=survivors, capacity_count_sufficient=len(survivors) >= required_survivors,
                restore_within_rto=measured_restore_minutes <= target_rto_minutes,
                backup_within_rpo=backup_age_minutes <= target_rpo_minutes,
                evidence_limit='given measurements only; routing, consistency, health and restore execution untested')


def operations(evidence):
    """Classify source-shaped fictional evidence; never claim monitoring was executed."""
    rows(evidence, 'evidence')
    groups = {'CloudWatch': [], 'CloudTrail': [], 'AWS_Config': [], 'unclassified': []}
    mapping = {'metric': 'CloudWatch', 'log': 'CloudWatch', 'api_event': 'CloudTrail',
               'configuration': 'AWS_Config'}
    for item in evidence:
        record(item, ('id', 'kind', 'summary'), 'evidence item')
        token(item['id'], 'evidence id'); token(item['kind'], 'kind')
        if type(item['summary']) is not str or not 1 <= len(item['summary']) <= 300:
            raise ContractError('summary: expected 1–300 characters')
    unique_ids(evidence, 'evidence')
    for item in sorted(evidence, key=lambda x: x['id']):
        groups[mapping.get(item['kind'], 'unclassified')].append(dict(item))
    return dict(classification=groups, real_aws_evidence=False,
                caution='source categories overlap; a category alone cannot prove cause or compliance')


def money_decimal(value, label):
    # Decimal strings avoid binary floating-point and allow_nan JSON ambiguity.
    if type(value) is not str or not re.fullmatch(r'(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?', value):
        raise ContractError(f'{label}: expected unsigned decimal string, max 9 integer/6 fractional digits')
    try:
        result = Decimal(value)
    except InvalidOperation as exc:
        raise ContractError(f'{label}: invalid decimal') from exc
    if not result.is_finite():
        raise ContractError(f'{label}: nonfinite decimal')
    return result


def cost(lines, budget_cents):
    """Synthetic USD rates. Round each extended line to cents, then sum."""
    rows(lines, 'lines'); integer(budget_cents, 'budget_cents', 10**18)
    for line in lines:
        record(line, ('id', 'quantity', 'unit_usd'), 'line')
        token(line['id'], 'line id')
        money_decimal(line['quantity'], 'quantity'); money_decimal(line['unit_usd'], 'unit_usd')
    unique_ids(lines, 'lines')
    costs = []
    with localcontext() as context:
        context.prec = 40
        for line in sorted(lines, key=lambda x: x['id']):
            cents = int((money_decimal(line['quantity'], 'quantity') *
                         money_decimal(line['unit_usd'], 'unit_usd') * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
            costs.append(dict(id=line['id'], cents=cents))
    total = sum(line['cents'] for line in costs)
    return dict(currency='USD', synthetic_rates=True, line_costs=costs, total_cents=total,
                budget_cents=budget_cents, threshold_reached=total >= budget_cents,
                over_budget_cents=max(0, total-budget_cents), spending_cap=False,
                exclusions=['tax', 'free_tier', 'discounts', 'unlisted_usage'])


def capstone(cases):
    """Compute an evidence bundle, not a readiness score or deployment approval."""
    record(cases, ('identity', 'network', 'storage', 'compute', 'queues', 'database',
                   'resilience', 'operations', 'cost'), 'cases')
    functions = {'identity': identity, 'network': network, 'storage': decision_matrix,
                 'compute': decision_matrix, 'queues': queues, 'database': decision_matrix,
                 'resilience': resilience, 'operations': operations, 'cost': cost}
    results = {}
    # Exact function input keys are checked here to normalize malformed fixtures.
    import inspect
    for name, function in functions.items():
        record(cases[name], tuple(inspect.signature(function).parameters), name)
        results[name] = function(**cases[name])
    issues = []
    if results['identity']['decision'] != 'allow': issues.append('identity_not_allowed')
    if not results['network']['reachable']: issues.append('network_path_blocked')
    for name in ('storage', 'compute', 'database'):
        if not results[name]['feasible']: issues.append(name + '_unmet_requirements')
        if results[name]['ambiguous']: issues.append(name + '_tradeoff_unresolved')
    if results['queues']['dead_letter']: issues.append('queue_redrive_review_needed')
    for key in ('capacity_count_sufficient', 'restore_within_rto', 'backup_within_rpo'):
        if not results['resilience'][key]: issues.append(key + '_failed')
    if results['cost']['threshold_reached']: issues.append('budget_threshold_reached')
    return dict(results=results, issues=issues, deployment_approved=False,
                outstanding_evidence=['actual policy evaluation', 'bidirectional network testing',
                                      'workload benchmarks', 'restore drill', 'current regional pricing',
                                      'security and compliance review'])
