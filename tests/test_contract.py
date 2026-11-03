import sys, unittest, json, types, itertools
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from load_source import load
m=load()
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'examples/example.json').read_text())
model=json.loads((root/'examples/model-fixture.json').read_text())
class Return:
    def __init__(self, v): self.calldata=v
m.gl=types.SimpleNamespace(vm=types.SimpleNamespace(Return=Return))

class ContractTests(unittest.TestCase):
    def test_payload(self): self.assertEqual(m.input_data(m.pack(data)),data)
    def test_duplicate_json(self):
        with self.assertRaises(Exception): m.decode('{"x":1,"x":2}')
    def test_unknown_field(self):
        bad=dict(data,extra=True)
        with self.assertRaises(Exception): m.input_data(m.pack(bad))
    def test_untrimmed(self):
        bad=dict(data,scope=' '+data['scope'])
        with self.assertRaises(Exception): m.input_data(m.pack(bad))
    def test_oversize(self):
        with self.assertRaises(Exception): m.input_data(' '*8000)
    def test_model_shape(self):
        with self.assertRaises(Exception): m.model_result({},data)
    def test_validator_agrees(self): self.assertTrue(m.equivalent(Return(model),lambda:model,data))
    def test_validator_errors(self): self.assertFalse(m.equivalent(Return(model),lambda: {},data))
    def test_validator_leader_error(self): self.assertFalse(m.equivalent(Exception(),lambda:model,data))
    def test_validator_semantic_disagreement(self):
        other=json.loads(json.dumps(model))
        if 'rules' in other: other['rules'][0]={'status':'UNKNOWN','fds':[]}
        else: other['access'][0][0]='NONE'
        self.assertFalse(m.equivalent(Return(model),lambda:other,data))
    def test_acyclic(self):
        p=m.derive(data,model)
        self.assertEqual(p['status'],'SERIALIZABLE')
        self.assertEqual(p['serial_order'],[0,1])
    def test_cycle(self):
        d=dict(data,schedule=[0,1,3,2])
        p=m.derive(d,model)
        self.assertEqual(p['status'],'CONFLICT')
        self.assertEqual(p['cycle'],[0,1,0])
        self.assertEqual(p['serial_order'],[])
    def test_read_read(self):
        p=m.derive(data,{'access':[['READ','READ'] for _ in range(4)]})
        self.assertEqual(p['edges'],[])
    def test_blind_write_conflict(self):
        p=m.derive(data,{'access':[['WRITE','NONE'] for _ in range(4)]})
        self.assertEqual(p['status'],'CONFLICT')
    def test_unknown_blocks(self):
        a=json.loads(json.dumps(model));a['access'][0][0]='UNKNOWN'
        p=m.derive(data,a)
        self.assertEqual(p['status'],'REVIEW')
        self.assertEqual(p['serial_order'],[])
    def test_program_order(self):
        with self.assertRaises(Exception):m.input_data(m.pack(dict(data,schedule=[2,0,1,3])))
    def test_boolean_operation(self):
        with self.assertRaises(Exception):m.input_data(m.pack(dict(data,schedule=[False,1,2,3])))
    def test_exhaustive_schedules(self):
        for schedule in itertools.permutations(range(4)):
            d=dict(data,schedule=list(schedule))
            try:m.input_data(m.pack(d))
            except Exception:continue
            p=m.derive(d,model)
            edges={(e['from'],e['to']) for e in p['edges']}
            expected=any(all(order.index(a)<order.index(b) for a,b in edges) for order in itertools.permutations(range(2)))
            self.assertEqual(p['status']=='SERIALIZABLE',expected)
            if p['cycle']:
                self.assertEqual(p['cycle'][0],p['cycle'][-1])
                self.assertTrue(all((a,b) in edges for a,b in zip(p['cycle'],p['cycle'][1:])))

if __name__=='__main__':unittest.main()
