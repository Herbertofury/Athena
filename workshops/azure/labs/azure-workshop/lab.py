"""Bounded, synthetic Azure reasoning exercises. No cloud access or emulation."""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from ipaddress import ip_address, ip_network
import math

LIMIT = 100
COMMANDS = ('hierarchy','access','governance','storage','network','compute','monitoring','recovery','cost','capstone')

def fail(message):
    raise ValueError(message)

def obj(value, fields):
    if type(value) is not dict or set(value) != set(fields.split()):
        fail('Object fields must be exactly: ' + fields)

def seq(value, empty=False):
    if type(value) is not list or len(value) > LIMIT or (not empty and not value):
        fail('Expected bounded list')
    return value

def word(value):
    if type(value) is not str or not value.strip() or len(value) > 160:
        fail('Expected nonempty text up to 160 characters')
    return value

def integer(value, minimum=0):
    if type(value) is not int or not minimum <= value <= 1000000:
        fail('Expected bounded integer')
    return value

def number(value):
    if type(value) not in (int,float) or not 0 <= value <= 1000000 or not math.isfinite(value):
        fail('Expected finite nonnegative number')
    return value

def boolean(value):
    if type(value) is not bool:
        fail('Expected boolean')
    return value

def names(value, empty=False):
    seq(value,empty)
    for v in value: word(v)
    if len(set(value)) != len(value): fail('Duplicate names')
    return value

def records(value, fields, empty=False):
    seq(value,empty)
    seen=set()
    for row in value:
        obj(row,fields)
        key=word(row['id'])
        if key in seen: fail('Duplicate id')
        seen.add(key)
    return value

def envelope(command, **result):
    return dict(command=command,real_azure_executed=False,
        model_limitations=['Synthetic local reasoning only; not an Azure API, emulator, security test, or deployment approval.'],**result)

def hierarchy(data):
    obj(data,'scopes')
    rows=records(data['scopes'],'id parent kind')
    by={r['id']:r for r in rows}
    kinds={'management_group':{'management_group',None},'subscription':{'management_group'},'resource_group':{'subscription'},'resource':{'resource_group'}}
    for r in rows:
        if r['kind'] not in kinds: fail('Unknown scope kind')
        p=r['parent']
        if p is not None:
            word(p)
            if p not in by: fail('Orphan scope')
    result={}
    for r in rows:
        chain=[]; current=r
        while current['parent'] is not None:
            p=current['parent']
            if p==r['id'] or p in chain: fail('Scope cycle')
            chain.append(p); current=by[p]
        result[r['id']]=chain
    roots=[r for r in rows if r['parent'] is None]
    if len(roots)!=1 or roots[0]['kind']!='management_group': fail('One management-group root required')
    for r in rows:
        pk=by[r['parent']]['kind'] if r['parent'] is not None else None
        if pk not in kinds[r['kind']]: fail('Invalid scope relationship')
    return envelope('hierarchy',ancestors_by_scope=result)

def access(data):
    obj(data,'scopes assignments requests')
    ancestors=hierarchy({'scopes':data['scopes']})['ancestors_by_scope']
    assignments=records(data['assignments'],'id principal scope actions',True)
    for a in assignments:
        word(a['principal']); names(a['actions'])
        if any('*' in x for x in a['actions']): fail('Only exact actions supported')
        if a['scope'] not in ancestors: fail('Unknown assignment scope')
    decisions=[]
    for q in records(data['requests'],'id principal scope action'):
        word(q['principal']); word(q['action'])
        if '*' in q['action'] or q['scope'] not in ancestors: fail('Invalid request')
        matches=sorted(a['id'] for a in assignments if a['principal']==q['principal'] and a['scope'] in [q['scope']]+ancestors[q['scope']] and q['action'] in a['actions'])
        decisions.append(dict(scope=q['scope'],action=q['action'],allowed=bool(matches),matching_assignment_ids=matches))
    return envelope('access',decisions=decisions)

def governance(data):
    obj(data,'scopes resources locks operations allowed_regions required_tags')
    ancestors=hierarchy({'scopes':data['scopes']})['ancestors_by_scope']
    names(data['allowed_regions']); names(data['required_tags'],True)
    resources=records(data['resources'],'id region tags')
    ids={r['id'] for r in resources}; findings=[]
    for r in resources:
        if r['id'] not in ancestors: fail('Unknown resource scope')
        word(r['region']); names(r['tags'],True)
        if r['region'] not in data['allowed_regions']: findings.append({'resource_id':r['id'],'issue':'region_not_allowed'})
        for tag in sorted(set(data['required_tags'])-set(r['tags'])): findings.append({'resource_id':r['id'],'issue':'missing_tag:'+tag})
    locks=records(data['locks'],'id scope level',True)
    for lock in locks:
        if lock['scope'] not in ancestors or lock['level'] not in ('CanNotDelete','ReadOnly'): fail('Invalid lock')
    decisions=[]
    for op in records(data['operations'],'id resource_id operation plane'):
        if op['resource_id'] not in ids or op['operation'] not in ('read','write','delete') or op['plane'] not in ('control','data'): fail('Invalid operation')
        matches=sorted(l['id'] for l in locks if op['plane']=='control' and l['scope'] in [op['resource_id']]+ancestors[op['resource_id']] and (op['operation']=='delete' or (op['operation']=='write' and l['level']=='ReadOnly')))
        decisions.append(dict(resource_id=op['resource_id'],operation=op['operation'],blocked=bool(matches),lock_ids=matches))
    return envelope('governance',policy_findings=findings,lock_decisions=decisions)

def storage(data):
    obj(data,'requirements options'); names(data['requirements'])
    comparisons=[]
    for option in records(data['options'],'id capabilities'):
        names(option['capabilities'],True)
        missing=sorted(set(data['requirements'])-set(option['capabilities']))
        comparisons.append(dict(option=option['id'],missing_requirements=missing,meets_requirements=not missing))
    return envelope('storage',comparisons=comparisons,matching_options=[r['option'] for r in comparisons if r['meets_requirements']])

def network(data):
    obj(data,'routes destinations nsg_cases')
    routes=[]
    for r in records(data['routes'],'id prefix next_hop'):
        word(r['prefix']); word(r['next_hop'])
        try: prefix=ip_network(r['prefix'],strict=True)
        except ValueError: fail('Invalid canonical prefix')
        routes.append((r['id'],prefix))
    names(data['destinations']); choices=[]
    for destination in data['destinations']:
        try: address=ip_address(destination)
        except ValueError: fail('Invalid IP address')
        matches=[(i,p.prefixlen) for i,p in routes if address.version==p.version and address in p]
        longest=max((length for _,length in matches),default=-1)
        selected=sorted(i for i,length in matches if length==longest)
        choices.append(dict(destination=destination,selected_route_ids=selected,ambiguous=len(selected)>1))
    cases=[]
    for c in records(data['nsg_cases'],'id layers'):
        layers=[]
        for layer in records(c['layers'],'id rules'):
            priorities=set(); rules=records(layer['rules'],'id priority matches action',True)
            for rule in rules:
                integer(rule['priority'],100)
                if rule['priority']>4096 or rule['priority'] in priorities: fail('Invalid or duplicate priority')
                priorities.add(rule['priority']); boolean(rule['matches'])
                if rule['action'] not in ('allow','deny'): fail('Invalid rule action')
            matching=sorted((r for r in rules if r['matches']),key=lambda r:r['priority'])
            winner=matching[0] if matching else None
            layers.append(dict(layer=layer['id'],allowed=winner is not None and winner['action']=='allow',rule_id=winner['id'] if winner else None))
        cases.append(dict(id=c['id'],allowed=all(l['allowed'] for l in layers),layer_decisions=layers))
    return envelope('network',routes=choices,nsg_cases=cases)

def compute(data):
    obj(data,'demand capacity_per_instance target_utilization_percent min_instances max_instances current_instances')
    for key in data: integer(data[key],1 if key in ('capacity_per_instance','target_utilization_percent') else 0)
    if data['target_utilization_percent']>100 or data['min_instances']>data['max_instances'] or data['current_instances']>data['max_instances']: fail('Inconsistent scale bounds')
    numerator=data['demand']*100; denominator=data['capacity_per_instance']*data['target_utilization_percent']
    required=max(data['min_instances'],(numerator+denominator-1)//denominator)
    capped=min(required,data['max_instances'])
    return envelope('compute',required_instances=required,shortfall=max(0,required-data['current_instances']),capped_instances=capped,capacity_sufficient=capped>=required)

def monitoring(data):
    obj(data,'windows'); result=[]
    for w in records(data['windows'],'id samples expected_count threshold'):
        seq(w['samples'],True); integer(w['expected_count'],1); number(w['threshold'])
        if len(w['samples'])>w['expected_count']: fail('Too many samples')
        for sample in w['samples']:
            if sample is not None: number(sample)
        observed=[v for v in w['samples'] if v is not None]
        mean=sum(observed)/len(observed) if observed else None
        status='insufficient_data' if len(observed)<w['expected_count'] else ('breach' if mean>w['threshold'] else 'within_threshold')
        result.append(dict(id=w['id'],status=status,observed_count=len(observed),expected_count=w['expected_count'],mean=mean))
    return envelope('monitoring',windows=result)

def recovery(data):
    obj(data,'components recovery_point_age_minutes rpo_minutes')
    integer(data['recovery_point_age_minutes']); integer(data['rpo_minutes'])
    rows=records(data['components'],'id depends_on'); by={r['id']:r for r in rows}
    for r in rows: names(r['depends_on'],True)
    missing=sorted({d for r in rows for d in r['depends_on'] if d not in by})
    # Detect cycles even when another dependency is missing.
    visited=set(); active=set()
    def visit(key):
        if key in active: fail('Dependency cycle')
        if key in visited: return
        active.add(key)
        for dep in by[key]['depends_on']:
            if dep in by: visit(dep)
        active.remove(key); visited.add(key)
    for key in by: visit(key)
    order=[]; remaining=set(by)
    while remaining:
        available=sorted(k for k in remaining if set(by[k]['depends_on'])<=set(order))
        if not available: break
        order.extend(available); remaining.difference_update(available)
    return envelope('recovery',restore_order=order,rpo_met=data['recovery_point_age_minutes']<=data['rpo_minutes'],missing_dependencies=missing,blocked_components=sorted(remaining))

def money(value):
    if type(value) is not str or len(value)>24: fail('Money must be a bounded decimal string')
    try: amount=Decimal(value)
    except InvalidOperation: fail('Invalid decimal')
    if not amount.is_finite() or amount<0 or amount>Decimal('1000000') or amount.as_tuple().exponent < -4: fail('Invalid bounded money')
    return amount

def cost(data):
    obj(data,'resources budget'); budget=money(data['budget']); totals={}; missing=[]
    for r in records(data['resources'],'id team amount'):
        amount=money(r['amount'])
        if r['team'] is None: team='[unallocated]'; missing.append(r['id'])
        else:
            team=word(r['team'])
            if team=='[unallocated]': fail('Reserved team name')
        totals[team]=totals.get(team,Decimal(0))+amount
    total=sum(totals.values(),Decimal(0))
    fmt=lambda n: str(n.quantize(Decimal('0.01'),rounding=ROUND_HALF_UP))
    return envelope('cost',allocations={k:fmt(v) for k,v in sorted(totals.items())},missing_tag_resource_ids=sorted(missing),total=fmt(total),budget=fmt(budget),over_budget=total>budget,budget_is_cap=False)

def capstone(data):
    obj(data,'compute monitoring recovery cost evidence')
    c=compute(data['compute']); m=monitoring(data['monitoring']); r=recovery(data['recovery']); spend=cost(data['cost']); names(data['evidence'],True)
    risks=[]
    if not c['capacity_sufficient']: risks.append('capacity_ceiling_below_demand')
    if any(w['status']=='breach' for w in m['windows']): risks.append('telemetry_threshold_breach')
    if not r['rpo_met']: risks.append('recovery_point_older_than_rpo')
    if r['blocked_components']: risks.append('restore_dependencies_missing')
    if spend['over_budget']: risks.append('synthetic_spend_exceeds_budget')
    if spend['missing_tag_resource_ids']: risks.append('cost_allocation_tags_missing')
    required={'restore_test','role_assignment_review','region_availability_review'}
    missing=sorted(required-set(data['evidence']))
    if any(w['status']=='insufficient_data' for w in m['windows']): missing.append('complete_telemetry_windows')
    return envelope('capstone',risks=risks,missing_evidence=missing,conclusion='Review synthetic findings; no readiness or approval conclusion')

FUNCTIONS={name:globals()[name] for name in COMMANDS}

def run(command,data):
    if type(command) is not str or command not in FUNCTIONS: fail('Unknown fixed command')
    try: return FUNCTIONS[command](data)
    except (KeyError,TypeError,RecursionError) as exc: raise ValueError('Invalid fixture shape or field type') from exc
