"""Original integer-lattice 2D circle-overlap experiment; not a physics engine or swept collision detector."""
from dataclasses import dataclass
from collections import defaultdict

@dataclass(frozen=True)
class Circle:
    id: int
    x: int
    y: int
    radius: int


def validate(circles):
    circles = tuple(circles)
    seen = set()
    for c in circles:
        if not isinstance(c, Circle) or type(c.id) is not int or c.id in seen:
            raise ValueError('unique integer circle IDs required')
        seen.add(c.id)
        if any(type(v) is not int or abs(v) > 10**9 for v in (c.x, c.y, c.radius)) or c.radius < 0:
            raise ValueError('integer coordinates/radii bounded to 1e9 required; radius nonnegative')
    return circles


def overlaps(a, b):
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.radius + b.radius) ** 2


def brute_force(circles):
    circles = validate(circles)
    return sorted((min(a.id, b.id), max(a.id, b.id))
                  for i, a in enumerate(circles) for b in circles[i + 1:] if overlaps(a, b))


def indexed(circles, cell_size=4, max_cells_per_circle=4096):
    circles = validate(circles)
    if type(cell_size) is not int or cell_size <= 0:
        raise ValueError('cell size must be a positive integer')
    if type(max_cells_per_circle) is not int or max_cells_per_circle < 1:
        raise ValueError('positive integer cell budget required')
    cells = defaultdict(list)
    for c in circles:
        lo_x, hi_x = (c.x-c.radius)//cell_size, (c.x+c.radius)//cell_size
        lo_y, hi_y = (c.y-c.radius)//cell_size, (c.y+c.radius)//cell_size
        if (hi_x-lo_x+1)*(hi_y-lo_y+1) > max_cells_per_circle:
            return brute_force(circles), {'fallback': True, 'reason': 'cell budget'}
        for x in range(lo_x, hi_x+1):
            for y in range(lo_y, hi_y+1):
                cells[(x,y)].append(c)
    candidates = set()
    by_id = {c.id: c for c in circles}
    for bucket in cells.values():
        for i,a in enumerate(bucket):
            for b in bucket[i+1:]:
                candidates.add((min(a.id,b.id),max(a.id,b.id)))
    found = sorted((a,b) for a,b in candidates if overlaps(by_id[a],by_id[b]))
    return found, {'fallback': False, 'cells': len(cells), 'candidate_pairs': len(candidates)}
