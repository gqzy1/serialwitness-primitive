# Running SerialWitness

## Before submitting a schedule

Name 2–5 resources and 2–5 transactions with distinct lowercase identifiers. List 2–10 atomic operations. Every operation has a transaction index and a complete description of which declared resources it reads or writes. Every transaction must have at least one operation.

The operation array fixes each transaction's internal program order. Supply `schedule` as an exact permutation of operation indices, preserving that internal order. The contract rejects omitted operations, duplicates and reversals before calling a model. See [the sample payload](../examples/example.json).

An access is READ, WRITE, BOTH, NONE or UNKNOWN. A blind replacement is WRITE; incrementing or appending based on the old value is BOTH. NONE requires an explicit exclusion or an exhaustive statement. An unspecified access is UNKNOWN. A mention of a resource alone is not an access declaration.

## Integration checklist

1. Use Stable Studionet, chain 61999, RPC `https://studio.genlayer.com/api`.
2. Deploy `contracts/serial_witness.py` with no constructor arguments, or use the canonical address in `deployment.json`.
3. Sign `seal(slug, JSON.stringify(payload))` in full-consensus mode with zero value. Wait for successful FINALIZED execution and majority agreement.
4. Sign `analyze(lowercaseOwner + ':' + slug)` from the same wallet. Wait for successful finalization again.
5. Read `get_record(id)` with `TransactionHashVariant.LATEST_FINAL`. Inspect `state`, the entire `semantic.access` matrix and the proof, not just a badge.

The complete SDK calls and transaction recovery are in [verify-live.mjs](../tools/verify-live.mjs). `protocol()` exposes the exact interpretation rules. Slugs use 3–32 lowercase letters, digits or hyphens; an owner can seal 16 records. Identical resealing is idempotent. Changed content requires a new slug. Only the owner may analyze, and a terminal record cannot be reanalyzed. Reads are public.

## Verify the current runs

```sh
npm ci
npm run read
python tools/verify_record.py evidence/example-record.json
python tools/verify_record.py evidence/cycle-record.json
```

The network command checks source identity, finalized agreement, successful execution, sender, target, exact calldata and LATEST_FINAL state. The Python commands rebuild each graph and commitment locally. These checks create no new transactions.

To develop locally: install `requirements-dev.txt`, run the unittest suite, `python tools/sdk_check.py`, and `genvm-lint check contracts/serial_witness.py`. Local model fixtures are simulations. The Direct Mode test also executes the captured validator with matching and conflicting responses; this is still not live consensus.

For a deliberately new zero-value test run, use `NEW_TEST=1 node tools/verify-live.mjs`. Its disposable signer and resumable evidence live under `$XDG_STATE_HOME` or `~/.local/state`, outside the checkout. Never fund that account. An uncertain send stops the sequence; keep its hash and inspect the receipt. No automatic Appeal or resubmission is performed.

## Operating envelope

Operations and resources are abstract declarations, not monitored processes. This tool neither executes nor locks a task. It does not verify atomicity, complete access descriptions, hidden side effects, actual isolation level or a service's real execution order. Writes that commute under a special business rule are still treated conservatively as conflicts.

The published deployment uses genlayer-js 1.1.8 and viem 2.57.8. SDK Direct Mode uses genlayer-test 0.29.2 / Python SDK v0.3.0-rc7. The source retains its tested runner pin, with the newer-runner advisory visible in lint evidence.

[Official networks](https://docs.genlayer.com/developers/networks) · [GenLayer custom validation](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
