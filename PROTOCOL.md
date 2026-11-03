# SerialWitness protocol

## State and commitments

`SEALED → SERIALIZABLE, CONFLICT or REVIEW`. A failed transaction writes no assessment. REVIEW is terminal; corrected declarations require a new slug. A caller cannot supply the semantic result or proof. Only the owner may request analysis; any account may read it.

Canonical JSON uses sorted keys, compact separators and UTF-8 without ASCII escaping. `input_hash = SHA256({version,input})` and `result_hash = SHA256({input_hash,semantic,proof})`. The full stored record additionally binds owner and owner-scoped ID; a content digest alone does not authenticate a signer or chain. Recompute commitments with `tools/verify_record.py`, then independently verify source, transaction sender/target/call and FINALIZED receipt using the read tool.

## Mathematical rule

Compile atomic-operation descriptions into a complete resource-access matrix; derive precedence edges from actual conflicting operation pairs in a submitted interleaving; return a topological serial order or an explicit directed cycle.

For every earlier/later operation pair in the supplied schedule, if their transactions differ and both touch the same resource with at least one write, add an edge earlier.transaction → later.transaction. READ/READ produces no edge. BOTH counts as a read and a write. Every edge stores the two operation indices and resource index, so a consumer can recompute it. Duplicate transaction edges keep their distinct conflict witnesses.

The operation array fixes per-transaction program order. The schedule must be an exact permutation preserving that order; a schedule cannot hide, duplicate or reverse an operation. Lexicographic Kahn sorting provides a deterministic serial order if the precedence graph is acyclic. Otherwise bounded simple-path enumeration returns an actual closed directed cycle and no serial order. A cycle is a conflict-serializability obstruction, not proof of an observed data corruption. Read-only transactions still occur in the returned serial order. Any UNKNOWN cell blocks all graph claims with REVIEW.

The access matrix has exactly one row per operation and one column per resource. NONE requires explicit exclusion or an exhaustive access statement; lack of information must be UNKNOWN. The contract checks structural completeness, while independent semantic execution checks the meaning of every cell. No operation, access or transaction is created by the model.

## Reuse and distinction

VOLTA and RunbookLatch derive explicit prerequisite constraints from procedure text. This contract derives conflicts from reads/writes and a concrete interleaving; one transaction can acquire edges in both directions across operations. It neither imports a prerequisite graph nor runs a procedure. No existing application is paired with it.

Shared engineering conventions (owner-scoped records, explicit UNKNOWN, canonical hashes and independent validators) are protocol scaffolding. The semantic objects and deterministic algorithms above constitute this primitive's mechanism.
