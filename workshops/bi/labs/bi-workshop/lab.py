"""Original, fixed, synthetic BI teaching models. Not a platform emulator."""
from datetime import date, timedelta
from fractions import Fraction
import re

SCOPE = 'Python conceptual model only; no Power BI, M, DAX, authorization or accessibility validation.'
COMMANDS = ('transform', 'model', 'context', 'dates', 'report', 'refresh', 'access', 'capstone')
PRODUCTS = ({'product': 'P1', 'category': 'Supply'}, {'product': 'P2', 'category': 'Hardware'}, {'product': 'P3', 'category': 'Service'})
REGIONS = ('North', 'South')
RAW_FIELDS = {'id', 'date', 'region', 'product', 'quantity', 'unit_cents'}
FACT_FIELDS = RAW_FIELDS | {'amount_cents'}
REJECTION_FIELD_CHAR_LIMIT = 256

def raw_fixture():
    values = [('F1','2026-01-01',' north ','P1','2','1000'),
              ('F2','2026-01-02','NORTH','P2','1','3000'),
              ('F3','2026-01-02','south','P1','1','1000'),
              ('F4','2026-02-01',' South ','P2','2','3000'),
              ('F5','2026-02-01','North','P3','1','2000'),
              ('F6','2026-02-02','SOUTH','P3','1','2000'),
              ('F7','2026-02-02','North','P1','many','1000')]
    return [dict(zip(('id','date','region','product','quantity','unit_cents'), r)) for r in values]

def iso_day(value):
    if type(value) is not str or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', value):
        raise ValueError('date must be an exact YYYY-MM-DD string, without time')
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise ValueError('invalid calendar date') from error

def positive_integer(value, field):
    if type(value) is not str or not re.fullmatch(r'[0-9]+', value) or len(value) > 9:
        raise ValueError(field + ' must be a 1–9 digit positive integer string')
    result = int(value)
    if result <= 0:
        raise ValueError(field + ' must be positive')
    return result

def transform(rows):
    if type(rows) is not list:
        raise ValueError('rows must be a list')
    valid, rejected, seen = [], [], set()
    for index, row in enumerate(rows):
        try:
            if type(row) is not dict or set(row) != RAW_FIELDS:
                raise ValueError('raw row fields do not match schema')
            if any(type(v) is not str for v in row.values()):
                raise ValueError('all raw fields must be strings')
            if not re.fullmatch(r'F[1-9][0-9]*', row['id']):
                raise ValueError('invalid fact id')
            if row['id'] in seen:
                raise ValueError('duplicate fact id')
            # Reserve identifiers even when a later field fails: never silently replace a row.
            seen.add(row['id'])
            if iso_day(row['date']).year != 2026:
                raise ValueError('date outside the 2026 teaching year')
            region = row['region'].strip().casefold()
            if region not in ('north', 'south'):
                raise ValueError('unknown region')
            if row['product'] not in {p['product'] for p in PRODUCTS}:
                raise ValueError('unknown product')
            quantity = positive_integer(row['quantity'], 'quantity')
            price = positive_integer(row['unit_cents'], 'unit_cents')
            valid.append(dict(row, region=region.title(), quantity=quantity,
                              unit_cents=price, amount_cents=quantity * price))
        except ValueError as error:
            entry = {'row_index': index, 'reason': str(error)}
            # Bounded evidence for our six-field string schema, not arbitrary serialization.
            # Strings are immutable, so a new dict is an independent raw-record snapshot.
            if (type(row) is dict and set(row) == RAW_FIELDS
                    and all(type(k) is str for k in row)
                    and all(type(v) is str and len(v) <= REJECTION_FIELD_CHAR_LIMIT
                            for v in row.values())):
                entry['raw_record'] = dict(row)
            rejected.append(entry)
    return valid, rejected

def facts():
    return transform(raw_fixture())[0]

def calendar_2026():
    start = date(2026, 1, 1)
    return [(start + timedelta(days=n)).isoformat() for n in range(365)]

def calendar_check(days):
    if type(days) is not list:
        raise ValueError('calendar must be a list')
    parsed = [iso_day(d) for d in days]
    if len(parsed) != len(set(parsed)):
        raise ValueError('duplicate calendar date')
    expected, actual = set(calendar_2026()), set(days)
    ordered = sorted(parsed)
    contiguous = bool(ordered) and all((b-a).days == 1 for a,b in zip(ordered, ordered[1:]))
    return {'valid_full_year': actual == expected, 'date_count': len(days),
            'contiguous': contiguous, 'missing': sorted(expected-actual), 'extra': sorted(actual-expected)}

def validate_facts(rows):
    if type(rows) is not list:
        raise ValueError('facts must be a list')
    ids = set()
    for row in rows:
        if type(row) is not dict or set(row) != FACT_FIELDS:
            raise ValueError('fact schema mismatch')
        if any(type(row[k]) is not str for k in ('id','date','region','product')):
            raise ValueError('fact keys must be strings')
        if not re.fullmatch(r'F[1-9][0-9]*', row['id']) or row['id'] in ids:
            raise ValueError('invalid or duplicate fact id')
        ids.add(row['id'])
        if iso_day(row['date']).year != 2026:
            raise ValueError('fact date outside 2026')
        for key in ('quantity','unit_cents','amount_cents'):
            if type(row[key]) is not int or row[key] <= 0:
                raise ValueError('fact amounts must be positive exact integers')
        if row['amount_cents'] != row['quantity'] * row['unit_cents']:
            raise ValueError('fact arithmetic mismatch')

def validate_model(rows, products, regions, days):
    validate_facts(rows)
    if type(products) is not list or type(regions) is not list:
        raise ValueError('dimensions must be lists')
    if any(type(p) is not dict or set(p) != {'product','category'} or
           any(type(v) is not str or not v for v in p.values()) for p in products):
        raise ValueError('invalid product dimension')
    keys = [p['product'] for p in products]
    if len(keys) != len(set(keys)):
        raise ValueError('duplicate product key')
    if any(type(r) is not str or not r for r in regions) or len(regions) != len(set(regions)):
        raise ValueError('invalid or duplicate region key')
    if not calendar_check(days)['valid_full_year']:
        raise ValueError('calendar must contain every date of 2026 exactly once')
    if any(r['product'] not in keys or r['region'] not in regions or r['date'] not in days for r in rows):
        raise ValueError('orphan fact')
    return {'facts': len(rows), 'products': len(products), 'regions': len(regions), 'dates': len(days),
            'relationships': ['Product -> Fact: one-to-many, single direction',
                              'Region -> Fact: one-to-many, single direction',
                              'Date -> Fact: one-to-many, single direction']}

def select(rows, filters=None):
    validate_facts(rows)
    filters = {} if filters is None else filters
    if type(filters) is not dict or not set(filters) <= {'region','category','date','product'}:
        raise ValueError('unsupported filter schema')
    for values in filters.values():
        if type(values) is not set or any(type(v) is not str for v in values):
            raise ValueError('filter values must be sets of strings')
    categories = {p['product']: p['category'] for p in PRODUCTS}
    return [dict(r) for r in rows if all((categories.get(r['product']) if k == 'category' else r[k]) in v for k,v in filters.items())]

def total(rows):
    validate_facts(rows)
    return sum(r['amount_cents'] for r in rows) if rows else None

def change_filter(filters, column, values, keep=False):
    select([], filters)
    select([], {column: values})
    if type(keep) is not bool:
        raise ValueError('keep must be an exact bool')
    result = {k: set(v) for k,v in filters.items()}
    result[column] = result[column] & values if keep and column in result else set(values)
    return result

def month_total(rows, month):
    if type(month) is not int or not 1 <= month <= 12:
        raise ValueError('month must be integer 1–12')
    validate_facts(rows)
    return total([r for r in rows if iso_day(r['date']).month == month])

def ytd(rows, cutoff):
    day = iso_day(cutoff)
    if day.year != 2026:
        raise ValueError('cutoff outside 2026')
    validate_facts(rows)
    return total([r for r in rows if iso_day(r['date']) <= day])

def ratio(numerator, denominator):
    if any(v is not None and type(v) is not int for v in (numerator, denominator)):
        raise ValueError('ratio requires exact integers or None')
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    f = Fraction(numerator, denominator)
    return {'numerator': f.numerator, 'denominator': f.denominator}

def report_check(plan):
    if type(plan) is not dict or set(plan) != {'alt_text','order','units'}:
        raise ValueError('report plan schema mismatch')
    if any(type(v) is not str for v in plan.values()):
        raise ValueError('report plan fields must be strings')
    return [k for k,v in plan.items() if not v.strip()]

def read_snapshot(mode, available):
    if mode not in ('import', 'source_required') or type(mode) is not str or type(available) is not bool:
        raise ValueError('invalid simulation arguments')
    if mode == 'source_required' and not available:
        return {'available': False, 'total_cents': None, 'reason': 'simulated source outage'}
    return {'available': True, 'total_cents': total(facts()[:4] if mode == 'import' else facts()),
            'reason': 'invented copied snapshot' if mode == 'import' else 'invented current source'}

def hypothetical_access(role, regions, build=False):
    if type(role) is not str or role not in ('Viewer','Member','Contributor','Admin'):
        raise ValueError('unknown workspace role')
    if type(regions) is not set or any(type(r) is not str or r not in REGIONS for r in regions) or type(build) is not bool:
        raise ValueError('invalid hypothetical role assignment')
    if role == 'Viewer' and not regions:
        return {'decision': 'denied by teaching policy', 'total_cents': None}
    rows = select(facts(), {'region': regions}) if role == 'Viewer' else facts()
    return {'decision': 'hypothetical classification only', 'total_cents': total(rows)}

def receipt(command):
    if type(command) is not str or command not in COMMANDS:
        raise ValueError('unknown fixed exercise')
    rows, rejects = transform(raw_fixture())
    if command == 'transform':
        result = {'valid_rows': rows, 'rejected_rows': rejects, 'total_cents': total(rows), 'query_folding': 'untested'}
    elif command == 'model':
        result = validate_model(rows, list(PRODUCTS), list(REGIONS), calendar_2026())
        errors = {}
        for label, ps, rs in [('duplicate_key', list(PRODUCTS)+[PRODUCTS[0]], rows),
                              ('orphan_fact', list(PRODUCTS)[1:], rows)]:
            try:
                validate_model(rs, ps, list(REGIONS), calendar_2026())
            except ValueError as error:
                errors[label] = str(error)
        result['controlled_rejections'] = errors
    elif command == 'context':
        base = {'region': {'North'}, 'category': {'Hardware'}}
        result = {'hardware_cents': total(select(rows, {'category': {'Hardware'}})),
                  'north_hardware_cents': total(select(rows, base)),
                  'replace_south_cents': total(select(rows, change_filter(base, 'region', {'South'}))),
                  'keep_south_cents': total(select(rows, change_filter(base, 'region', {'South'}, True))),
                  'f1_row_amount_cents': rows[0]['amount_cents'], 'overall_measure_cents': total(rows)}
    elif command == 'dates':
        result = {'calendar': calendar_check(calendar_2026()),
                  'missing_january2': calendar_check([d for d in calendar_2026() if d != '2026-01-02']),
                  'jan_feb_only': calendar_check(calendar_2026()[:59]),
                  'january_cents': month_total(rows,1), 'february_cents': month_total(rows,2),
                  'ytd_cents': {d:ytd(rows,d) for d in ('2026-01-02','2026-02-01','2026-02-02')},
                  'month_difference_cents': month_total(rows,2)-month_total(rows,1),
                  'growth': ratio(month_total(rows,2)-month_total(rows,1),month_total(rows,1))}
    elif command == 'report':
        category_totals = {p['category']:total(select(rows, {'category': {p['category']}})) for p in PRODUCTS}
        result = {'category_totals_cents': category_totals,
                  'all_category_shares': {k:ratio(v,total(rows)) for k,v in category_totals.items()},
                  'hardware_all_percent': float(Fraction(category_totals['Hardware'] * 100, total(rows))),
                  'hardware_selected_percent': float(Fraction(category_totals['Hardware'] * 100, category_totals['Hardware'])),
                  'missing_plan_fields': report_check({'alt_text':'','order':'','units':''}),
                  'declared_complete_plan_missing': report_check({'alt_text':'Sales by category','order':'Hardware, Service, Supply','units':'fictional USD cents'}),
                  'rendered_accessibility': 'not tested'}
    elif command == 'refresh':
        result = {mode+'_'+state:read_snapshot(mode, state=='online') for mode in ('import','source_required') for state in ('online','outage')}
        result['direct_lake'] = 'not modeled; no provider guarantees'
    elif command == 'access':
        result = {role:hypothetical_access(role, {'North'}) for role in ('Viewer','Member','Contributor','Admin')}
        result.update(viewer_build=hypothetical_access('Viewer',{'North'},True),
                      viewer_union=hypothetical_access('Viewer',{'North','South'}),
                      viewer_unassigned=hypothetical_access('Viewer',set()),
                      warning='Not authorization or a security boundary. All fixture data remains readable.')
    else:
        result = {'valid_rows': len(rows), 'rejected_rows': len(rejects), 'total_cents': total(rows),
                  'model': validate_model(rows,list(PRODUCTS),list(REGIONS),calendar_2026()),
                  'january_cents': month_total(rows,1), 'february_cents': month_total(rows,2),
                  'reconciles': month_total(rows,1)+month_total(rows,2)==total(rows),
                  'unexecuted_platform_tasks': ['Build and inspect actual Power Query steps and query folding.',
                  'Create and inspect real relationships and full-year date setup.',
                  'Execute and verify DAX measures and filter behavior.',
                  'Render report and perform keyboard, screen-reader and contrast checks.',
                  'Configure refresh and test actual storage-mode/source availability behavior.',
                  'Test real role assignments and effective access with authorized test accounts.'],
                  'readiness_claim': 'None; only local computations executed.'}
    return {'schema_version': 1, 'exercise': command, 'scope': SCOPE, 'result': result}
