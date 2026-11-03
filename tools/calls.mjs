// Read-only public acceptance checks. No wallet or signing key is needed.
import {createClient,abi} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.argv[2]!=='read')throw Error('Usage: node tools/calls.mjs read');
const deployment=JSON.parse(fs.readFileSync(path.join(root,'deployment.json'))),journal=JSON.parse(fs.readFileSync(path.join(root,'evidence/journal.json')));
const client=createClient({chain:studionet});
const chain=await client.request({method:'eth_chainId',params:[]});if(BigInt(chain)!==61999n)throw Error('Wrong chain');
const sourceFile=fs.readdirSync(path.join(root,'contracts')).find(f=>f.endsWith('.py'));
const source=fs.readFileSync(path.join(root,'contracts',sourceFile),'utf8');
if(crypto.createHash('sha256').update(source).digest('hex')!==deployment.source_sha256)throw Error('Local source changed');
if(await client.getContractCode(deployment.address)!==source)throw Error('Deployed source mismatch');
for(const [label,step] of Object.entries(journal.steps)){
 const tx=await client.getTransaction({hash:step.hash});
 if((tx.status_name||tx.statusName)!=='FINALIZED')throw Error('Not finalized '+label);
 if((tx.result_name||tx.resultName)!=='MAJORITY_AGREE')throw Error('Consensus not agreed '+label);
 if((tx.from_address||tx.sender).toLowerCase()!==deployment.owner.toLowerCase())throw Error('Sender mismatch');
 if((tx.to_address||tx.recipient).toLowerCase()!==deployment.address.toLowerCase())throw Error('Target mismatch');
 if(tx.leader_only!==false)throw Error('Leader-only transaction');
 const leaders=tx.consensus_data?.leader_receipt;if(!Array.isArray(leaders)||!leaders.length||leaders.at(-1).execution_result!=='SUCCESS')throw Error('Execution failed');
 const votes=Object.values(tx.consensus_data?.votes||{});if(!votes.includes('agree'))throw Error('No agreeing validator votes');
 if(step.intent.method!=='deploy'){
   const raw=await client.request({method:'eth_getTransactionByHash',params:[step.hash]});
   const decoded=abi.calldata.decode(Buffer.from(raw.data.calldata,'base64'));
   const call=Object.fromEntries(decoded);
   if(!call)throw Error('Missing decoded call');
   if(call.method!==step.intent.method||JSON.stringify(call.args)!==JSON.stringify(step.intent.args))throw Error('Method/arguments mismatch '+label);
 }
 console.log(label,step.hash,'FINALIZED / MAJORITY_AGREE / SUCCESS');
}
for(const file of fs.readdirSync(path.join(root,'evidence')).filter(f=>f.endsWith('-record.json'))){
 const saved=JSON.parse(fs.readFileSync(path.join(root,'evidence',file)));
 const live=JSON.parse(await client.readContract({address:deployment.address,functionName:'get_record',args:[saved.id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));
 if(JSON.stringify(live)!==JSON.stringify(saved))throw Error('Final record mismatch '+file);
 console.log(saved.id,live.state,'latest-final matches saved record');
}
console.log('PASS: chain, exact source, finalized agreeing successful receipts, sender/target/call binding and latest-final state.');
