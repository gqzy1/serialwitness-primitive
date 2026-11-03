# SerialWitness

A concurrency check for task plans written in ordinary language.

Two individually ordered tasks can still interfere when their operations are interleaved. SerialWitness asks a narrow question: **does this particular schedule have the same conflict order as some serial execution?** It returns an order you can inspect, or the cycle that prevents one.

## One trace, two outcomes

| Operation | Transaction | Action |
| --- | --- | --- |
| 0 | one | Read alpha |
| 1 | two | Replace alpha without reading it |
| 2 | one | Replace beta without reading it |
| 3 | two | Read beta |

Each transaction retains its own program order. The difference is where the two traces cross:

| Submitted schedule | Recorded outcome | Diagnostic |
| --- | --- | --- |
| `0, 1, 2, 3` | SERIALIZABLE | Equivalent serial order: one, then two |
| `0, 1, 3, 2` | CONFLICT | Alpha forces one → two; beta forces two → one |

These two cases have been executed on Stable Studionet. The full input explicitly excludes other accesses; the abbreviated table above is explanatory.

## Start with the existing run

```sh
npm ci
npm run read
```

No wallet is needed for that command. It checks the deployed source, existing transaction receipts and finalized records without sending a write.

**Deployment:** [`0xD112b813ab20c183261402C7de3Fc63c155Ff9bd`](https://explorer-studio.genlayer.com/address/0xD112b813ab20c183261402C7de3Fc63c155Ff9bd) · Studionet 61999

[Recorded runs and votes](audit/studionet.md) · [Deployment manifest](deployment.json)

## How to act on a result

**SERIALIZABLE** supplies `proof.serial_order`. Every directed conflict edge must point forward in that order.

**CONFLICT** supplies `proof.cycle` and the operation/resource witnesses in `proof.edges`. Use them to locate the incompatible ordering before changing the plan. It is not a report of observed data corruption.

**REVIEW** lists uncertain matrix cells. Resolve the missing access description first; there is no supported serial-order claim to use yet.

## Why interpretation is on-chain

A task may “replace” a value, “read” it, or “append using the existing contents.” GenLayer validators independently turn those descriptions into READ / WRITE / BOTH / NONE / UNKNOWN for every operation-resource pair. The leader's matrix is accepted only if the validator's full independent interpretation agrees. Checking array dimensions alone does not establish an access pattern.

Ordinary code then constructs the precedence graph from the submitted interleaving. A deterministic topological sort or cycle search supplies the result. No model is asked to guess whether the schedule is safe, and the contract does not execute the tasks.

## Engineer's guide

- [Describe operations, submit calls and verify results](manual/operation.md)
- [Conflict rules, ordering algorithm and cycle diagnosis](manual/conflicts.md)
- [Security boundaries](SECURITY.md)
- [Python contract](contracts/serial_witness.py) · [Full example](examples/example.json)

Useful for public Agent batch plans and small abstract resource schedules. Correctness depends on truthful, exhaustive access declarations and the stated atomicity model. It does not provide locking, rollback or transaction isolation for another system. All submitted text is public. MIT licensed.
