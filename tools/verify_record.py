"""Verify persisted deterministic proof and commitments; does not prove network finality."""
import json, sys
from load_source import load
m=load()
r=json.load(open(sys.argv[1]))
data=m.input_data(m.pack(r['input']))
assert r['version']==m.VERSION
assert r['input_hash']==m.sha({'version':m.VERSION,'input':data})
semantic=m.model_result(r['semantic'],data)
assert r['proof']==m.derive(data,semantic)
assert r['state']==r['proof']['status']
assert r['result_hash']==m.sha({'input_hash':r['input_hash'],'semantic':semantic,'proof':r['proof']})
print('PASS: source-derived proof and commitments. Check network evidence separately.')
