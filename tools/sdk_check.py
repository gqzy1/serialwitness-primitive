"""Official SDK lifecycle and adversarial callback tests. LLM is mocked, never live evidence."""
import json
from pathlib import Path
from gltest.direct import VMContext, deploy_contract, create_address
root=Path(__file__).resolve().parents[1]
vm=VMContext();vm.sender=create_address('sdk-owner')
with vm.activate():
    c=deploy_contract(next((root/'contracts').glob('*.py')),vm,sdk_version='v0.3.0-rc7')
    vm.check_pickling=True
    data=json.loads((root/'examples/example.json').read_text())
    model=json.loads((root/'examples/model-fixture.json').read_text())
    vm.mock_llm('.*',json.dumps(model))
    key=c.seal('sdk-example',json.dumps(data))
    assert c.seal('sdk-example',json.dumps(data))==key
    vm.sender=create_address('sdk-intruder')
    try:c.analyze(key);raise AssertionError('unauthorized call accepted')
    except Exception as e:assert 'OWNER_ONLY' in str(e)
    vm.sender=create_address('sdk-owner')
    r=json.loads(c.analyze(key))
    assert r['state'] in ['ANALYZED','SERIALIZABLE']
    assert json.loads(c.get_record(key))==r
    assert vm.run_validator() is True
    other=json.loads(json.dumps(model))
    if 'rules' in other: other['rules'][0]={'status':'UNKNOWN','fds':[]}
    else: other['access'][0][0]='NONE'
    vm.clear_mocks()
    vm.mock_llm('.*',json.dumps(other))
    assert vm.run_validator() is False
    assert vm.run_validator(leader_error=Exception('mock failure')) is False
    try:c.analyze(key);raise AssertionError('duplicate analysis accepted')
    except Exception as e:assert 'ALREADY_ANALYZED' in str(e)
    print('PASS official SDK: storage, calldata, callback pickling, owner checks, idempotent seal, terminal write protection; captured validator accepts independent agreement and rejects changed semantics and leader error. Model mocked.')
