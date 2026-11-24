"""A deliberately wrong mean and a small regression that distinguishes it."""
import json

def buggy_mean(values):
    return sum(values) // len(values) if values else None

def corrected_mean(values):
    return sum(values) / len(values) if values else None

def demo():
    fixture = [1, 2]
    expected = 1.5
    return {'input': fixture, 'expected': expected, 'buggy': buggy_mean(fixture), 'corrected': corrected_mean(fixture), 'regression_detects_known_bug': buggy_mean(fixture) != expected, 'corrected_matches': corrected_mean(fixture) == expected, 'scope': 'A bounded teaching regression, not proof of all numeric correctness.'}
if __name__ == '__main__':
    print(json.dumps(demo(), indent=2))
