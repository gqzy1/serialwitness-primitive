# How a schedule becomes a conflict graph

## State and commitments

`SEALED → SERIALIZABLE, CONFLICT or REVIEW`. A failed transaction writes no assessment. REVIEW is terminal; corrected declarations require a new slug. A caller cannot supply the semantic result or proof. Only the owner may request analysis; any account may read it.

Canonical JSON uses sorted keys, compact separators and UTF-8 without ASCII escaping. `input_hash = SHA256({version,input})` and `result_hash = SHA256({input_hash,semantic,proof})`. The full stored record additionally binds owner and owner-scoped ID; a content digest alone does not authenticate a signer or chain. Recompute commitments with `tools/verify_record.py`, then independently verify source, transaction sender/target/call and FINALIZED receipt using the read tool.

## Conflicting accesses

Compile atomic-operation descriptions into a complete resource-access matrix; derive precedence edges from actual conflicting operation pairs in a submitted interleaving; return a topological serial order or an explicit directed cycle.

For every earlier/later operation pair in the supplied schedule, if their transactions differ and both touch the same resource with at least one write, add an edge earlier.transaction → later.transaction. READ/READ produces no edge. BOTH counts as a read and a write. Every edge stores the two operation indices and resource index, so a consumer can recompute it. Duplicate transaction edges keep their distinct conflict witnesses.

The operation array fixes per-transaction program order. The schedule must be an exact permutation preserving that order; a schedule cannot hide, duplicate or reverse an operation. Lexicographic Kahn sorting provides a deterministic serial order if the precedence graph is acyclic. Otherwise bounded simple-path enumeration returns an actual closed directed cycle and no serial order. A cycle is a conflict-serializability obstruction, not proof of an observed data corruption. Read-only transactions still occur in the returned serial order. Any UNKNOWN cell blocks all graph claims with REVIEW.

The access matrix has exactly one row per operation and one column per resource. NONE requires explicit exclusion or an exhaustive access statement; lack of information must be UNKNOWN. The contract checks structural completeness, while independent semantic execution checks the meaning of every cell. No operation, access or transaction is created by the model.

## Using a cycle witness

For every adjacent pair of transactions in `proof.cycle`, find a matching `proof.edges` entry. Its `before`, `after` and `resource` indices identify the two scheduled operations that forced that precedence. A cycle closes on its first transaction and the result contains no purported serial order. Inspect those operation descriptions before proposing another schedule.

In the deployed example, the cyclic order is `[0,1,3,2]`. The alpha conflict requires transaction one before two, while the beta conflict requires two before one. The recorded witness is `[0,1,0]`. Rearranging the schedule to `[0,1,2,3]` removes the reverse edge and yields serial order `[0,1]`.

This is conflict equivalence over declared abstract resources. A cyclic schedule can still be view-serializable in special cases; CONFLICT must not be translated into a claim of actual corruption or an assertion that every possible equivalence test would fail.
