"""Own generated exact-arithmetic probe of a published threshold rule, not MTS-1 code."""
from fractions import Fraction
import json

def threshold_roundtrip(previous, current, epsilon):
    p,c,e=map(Fraction,(previous,current,epsilon))
    if e<0:raise ValueError('Negative threshold')
    delta=c-p if abs(c-p)>e else Fraction(0)
    restored=p+delta
    return {'previous':previous,'current':current,'epsilon':epsilon,'transmitted_delta':str(delta),'restored':str(restored),'numerically_equal':restored==c}

def run_cases():
    inputs=[('10','10.05','0.1'),('1','1.1','0.1'),('10','9.95','0.1'),('10','10.2','0.1'),('10','10.05','0')]
    return {'scope':'Own generated exact-rational contract probe; no third-party implementation or performance reproduction','source':'https://arxiv.org/html/2601.01602v1','cases':[threshold_roundtrip(*v) for v in inputs],'conclusion':'Positive thresholding is not universally exact numeric reconstruction; this does not assess every configuration or implementation.'}

if __name__=='__main__':print(json.dumps(run_cases(),indent=2))
