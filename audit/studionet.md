# Recorded Studionet runs

Network: Stable Studionet, chain **61999**, RPC `https://studio.genlayer.com/api`.

Contract: [`0xD112b813ab20c183261402C7de3Fc63c155Ff9bd`](https://explorer-studio.genlayer.com/address/0xD112b813ab20c183261402C7de3Fc63c155Ff9bd)

Source SHA-256: `cb7c7f3b83486cb62233d463e3920400ad8ca3b7b199bca1e579965cce22adc0`. `gen_getContractCode` returned the exact local source; [source check](../evidence/source-check.json). All calls used zero value and `leaderOnly:false`; preflight checked chain and zero gas price.

## Real network transactions

| Step | Transaction | Finality | Consensus / execution | Observed votes |
| --- | --- | --- | --- | --- |
| deploy | [`0x6a638930f8…`](https://explorer-studio.genlayer.com/tx/0x6a638930f8df882da675216aeb14b9ee74b39202a6125ac0eb21e1d11185b17e) | FINALIZED | MAJORITY_AGREE / SUCCESS | {'agree': 3, 'idle': 2} |
| seal-example | [`0xbaa1806c80…`](https://explorer-studio.genlayer.com/tx/0xbaa1806c80a46c20e270c695d84fac0561f7152a83da5e53628834a93a69fcb4) | FINALIZED | MAJORITY_AGREE / SUCCESS | {'agree': 3, 'idle': 2} |
| analyze-example | [`0x1cd8958aec…`](https://explorer-studio.genlayer.com/tx/0x1cd8958aec925f3134ff9c919c301cc6839f81d0e8a50613a0eada277720851f) | FINALIZED | MAJORITY_AGREE / SUCCESS | {'agree': 3, 'idle': 2} |
| seal-cycle | [`0xde7cc1f08b…`](https://explorer-studio.genlayer.com/tx/0xde7cc1f08b36b7323c3f40ee76a4383f63bb30cf33a355e9d61ec6766e6a2580) | FINALIZED | MAJORITY_AGREE / SUCCESS | {'agree': 4, 'idle': 1} |
| analyze-cycle | [`0xaa5374c92b…`](https://explorer-studio.genlayer.com/tx/0xaa5374c92becc78c1532f1a8c057a8709226430ea22040990e3704a1052f5539) | FINALIZED | MAJORITY_AGREE / SUCCESS | {'agree': 3, 'idle': 2} |

These are actual RPC receipts, not mocked responses. Individual receipts retain leader/validator execution results and model configurations. The network reached majority agreement; some validators were idle. This is not a claim of unanimity or independent real-world organizations. Source code requests full consensus and does not choose the validator set. No protocol Appeal or automatic application resend was performed. Routine read checks reuse these hashes and do not create transactions.

## Finalized records

- [cycle-record.json](../evidence/cycle-record.json): `CONFLICT`; record ID `0x3a2d532ea73be33f6577607e2eb1b8d394807e8b:cycle`.
- [example-record.json](../evidence/example-record.json): `SERIALIZABLE`; record ID `0x3a2d532ea73be33f6577607e2eb1b8d394807e8b:example`.

Each persisted record was read using LATEST_FINAL. `tools/verify_record.py` recomputes the exact deterministic proof and both content commitments from the actual accepted semantic result. The RPC read checker additionally verifies network identity, exact deployed source, transaction sender/target/method/arguments, successful execution, majority agreement and equality with the saved finalized state. It decodes the raw RPC's base64 calldata with the official SDK, rather than parsing the human-readable pretty-printer.

The evidence signer is a disposable development account, generated for zero-value testing. It is not the user's wallet or proof of several independent people. Signing secrets are excluded.

## Offline validation

- [Unit suite](../evidence/unit-tests.txt): 18 test methods, including adversarial semantics and bounded exhaustive algorithm checks. Model and host are mocked.
- [Official SDK Direct Mode](../evidence/sdk-check.txt): storage, calldata, callback serialization, owner permissions, idempotent sealing, terminal-state protection, and captured validator acceptance/rejection. LLM responses are scripted. No live consensus is claimed by this test.
- [GenVM lint](../evidence/lint.txt): syntax/contract validation passed. The declared runner is pinned; a newer-runner informational note is retained.
- [Read-only network acceptance](../evidence/live-read-check.txt): checks the existing deployment and saved records without writes.

Known semantic and execution limits are in [overview](../README.md) and [conflict analysis](../manual/conflicts.md). Majority agreement can preserve a shared model mistake. Finality is evidence of the recorded computation, not truth of caller declarations.
