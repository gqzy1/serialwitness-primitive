"""Load pure functions for offline proof verification. Never runs model calls."""
import ast, hashlib, json, types
from pathlib import Path

def load():
    path = next((Path(__file__).resolve().parents[1] / 'contracts').glob('*.py'))
    tree = ast.parse(path.read_text())
    tree.body = [n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.Assign))]
    m = types.SimpleNamespace()
    m.__dict__.update({'json': json, 'hashlib': hashlib})
    exec(compile(tree, str(path), 'exec'), m.__dict__)
    return m
