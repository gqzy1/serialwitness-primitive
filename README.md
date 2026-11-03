# SerialWitness

A standalone, reusable GenLayer Intelligent Contract. No frontend or application server.

Compile atomic-operation descriptions into a complete resource-access matrix; derive precedence edges from actual conflicting operation pairs in a submitted interleaving; return a topological serial order or an explicit directed cycle.

## Example

Transaction one reads alpha then writes beta; transaction two writes alpha then reads beta. Interleaving [0,1,2,3] is equivalent to serial order [one,two]. Interleaving [0,1,3,2] produces one → two on alpha and two → one on beta, a blocking cycle.

## Consensus boundary

The leader interprets the immutable source declarations. Each validator independently repeats the full interpretation of those ORIGINAL declarations, without seeing the leader output in its prompt. The custom `gl.vm.run_nondet_unsafe` validator validates and compares the complete canonical semantic result. It rejects malformed values, thrown errors and any semantic disagreement. Schema checking alone never accepts an interpretation. UNKNOWN is a supported consensus result that leads deterministically to REVIEW, not a guessed success.

After consensus, ordinary deterministic code derives the proof. The model never chooses a key, a serial order or a graph result. Persisted records bind protocol version, owner-scoped ID, exact input, semantic result and proof by SHA-256 commitments. Records are public and immutable after analysis.

## Use

Deploy `contracts/serial_witness.py` with no constructor arguments on **Stable Studionet, chain 61999**, RPC `https://studio.genlayer.com/api`.

| Call | Purpose | Permission |
| --- | --- | --- |
| `seal(slug, payload)` | Validate and seal immutable JSON; return record ID | Calling wallet owns the record |
| `analyze(record_id)` | Independently agreed semantic compilation and deterministic proof | Record owner; once |
| `get_record(record_id)` | Read complete JSON record, or empty string if absent | Public |
| `protocol()` | Read version, limits and exact model rules | Public |

Record ID is lowercase owner address + `:` + slug. Slugs are 3–32 lowercase ASCII letters, digits or hyphens. Each owner may seal 16 records. Sealing the same slug with identical normalized JSON is idempotent; different content is rejected. Inputs cannot be edited or deleted. No admin override, funds, paid API, Appeal or automatic retries are implemented.

Optional fresh network reproduction: `NEW_TEST=1 node tools/verify-live.mjs`. This explicitly creates a disposable zero-value development signer and new transactions, saves resumable state under `$XDG_STATE_HOME` (or `~/.local/state`), and leaves published evidence unchanged. It is unnecessary for checking existing evidence; never fund this signer. A failed/uncertain intent blocks new sends until inspected.

See [example input](examples/example.json), [calling tool](tools/calls.mjs), [mechanism](PROTOCOL.md), [network evidence](EVIDENCE.md), and [deployment](deployment.json). Use `TransactionHashVariant.LATEST_FINAL` for public reads. FINALIZED is network finality; a successful return and agreeing consensus must also be checked before claiming success.

```sh
npm ci
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
python tools/sdk_check.py
genvm-lint check contracts/serial_witness.py
node tools/calls.mjs read
python tools/verify_record.py evidence/example-record.json
```

Unit and Direct Mode SDK checks use scripted models and are NOT live consensus. The read tool performs no writes. The write tool journals intent/hash and requires an explicit command; it never automatically resends an uncertain send. Use an EIP-1193 signer for ongoing integrations without exporting user keys.

## Limits

Conflict serializability is sufficient for conflict equivalence, not necessary for view serializability. No tasks are executed, locked, rolled back or sandboxed. Atomicity, resource granularity, exhaustive accesses and absence of hidden effects are caller declarations. It does not prove application invariants, snapshot isolation, real-time ordering, crash recovery, or physical execution correctness. Commutative writes are conservatively conflicts; no application-specific algebra is assumed. Up to five transactions/resources and ten atomic operations are supported.

Wallet ownership proves address control, not a unique person or a truthful declaration. Validators may share interpretation errors. Text is untrusted and can contain prompt injection; instructions constrain its interpretation but cannot guarantee model robustness. Uncertainty blocks the entire record. Do not submit private data. This is a development-network primitive with no mainnet security or availability guarantee.

## Compatibility

Official network configuration and custom-equivalence documentation were checked on 2026-11-03. Actual RPC returned `0xf22f` and zero gas price before writes. JavaScript SDK `genlayer-js` 1.1.8 and `viem` 2.57.8 are pinned; Python testing uses `genlayer-test` 0.29.2 and SDK v0.3.0-rc7. The source pins a specific GenVM runner. The linter reports a newer runner exists; this project records compatibility of its declared runner, not untested future versions.

Official references: [Networks](https://docs.genlayer.com/developers/networks), [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle), [SDK source](https://github.com/genlayerlabs/genlayer-js). MIT license.
