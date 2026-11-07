"""Original worked trace. Fixed data, stdout only."""
import json

def demo():
    lines = [(2, 1250), (3, 499), (1, 1000)]
    total = 0
    trace = []
    for index, (quantity, unit_cents) in enumerate(lines, 1):
        before = total
        line_cents = quantity * unit_cents
        total += line_cents
        trace.append(dict(step=index, before=before, line_cents=line_cents, after=total))
    return {'trace': trace, 'subtotal_cents': total}
if __name__ == '__main__':
    print(json.dumps(demo(), indent=2))
