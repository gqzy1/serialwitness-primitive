import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionStatus,TransactionHashVariant} from 'genlayer-js/types';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'), folder=path.basename(root), base=path.dirname(root);
if(process.env.NEW_TEST!=='1')throw Error('NEW_TEST=1 explicitly authorizes new zero-value development transactions; routine verification uses calls.mjs read');
if(!['schemaclosure-primitive','serialwitness-primitive'].includes(folder))throw Error('target');
const filename=folder.startsWith('schema')?'schema_closure.py':'serial_witness.py';
const privateDir=path.join(process.env.XDG_STATE_HOME||path.join(process.env.HOME,'.local/state'),folder);fs.mkdirSync(privateDir,{recursive:true,mode:0o700});
const outputDir=path.join(privateDir,'evidence');fs.mkdirSync(outputDir,{recursive:true,mode:0o700});
const keyPath=path.join(privateDir,folder+'.key');if(!fs.existsSync(keyPath))fs.writeFileSync(keyPath,generatePrivateKey(),{mode:0o600});
const account=privateKeyToAccount(fs.readFileSync(keyPath,'utf8').trim()),client=createClient({chain:studionet,account});
const write=(p,v)=>{fs.writeFileSync(p+'.tmp',JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x,2)+'\n');fs.renameSync(p+'.tmp',p)};
const journalPath=path.join(outputDir,'journal.json');const journal=fs.existsSync(journalPath)?JSON.parse(fs.readFileSync(journalPath)): {network:'Stable Studionet',chain_id:61999,rpc:'https://studio.genlayer.com/api',owner:account.address,steps:{}};
if(journal.owner.toLowerCase()!==account.address.toLowerCase())throw Error('Signer differs from journal; inspect local state');
const rpc=async(method,params=[])=>{const r=await fetch('https://studio.genlayer.com/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.error)throw Error(JSON.stringify(j.error));return j.result};
const chain=await rpc('eth_chainId'),gas=await rpc('eth_gasPrice');if(BigInt(chain)!==61999n||BigInt(gas)!==0n)throw Error('chain or cost mismatch');
write(path.join(outputDir,'preflight.json'),{chainId:chain,gasPrice:gas,sdk:'genlayer-js 1.1.8',preset:studionet.id,checked_at:new Date().toISOString()});
async function step(label,intent,send){
 let s=journal.steps[label];
 if(!s){s={intent,started_at:new Date().toISOString(),state:'INTENT'};journal.steps[label]=s;write(journalPath,journal);
 try{s.hash=await send();s.state='SENT';write(journalPath,journal);console.log(label,s.hash)}catch(e){s.error=String(e);s.state='SEND_UNKNOWN';write(journalPath,journal);throw e}}
 if(!s.hash)throw Error('Unresolved send intent '+label+'; inspect before any resend');
 if(s.state==='VERIFIED')return JSON.parse(fs.readFileSync(path.join(outputDir,label+'-receipt.json')));
 const receipt=await client.waitForTransactionReceipt({hash:s.hash,status:TransactionStatus.FINALIZED,interval:4000,retries:90});
 write(path.join(outputDir,label+'-receipt.json'),receipt);
 const status=receipt.status_name||receipt.statusName||receipt.status;console.log(label,'status',status,'result',receipt.resultName,'execution',receipt.txExecutionResultName);
 if(status!=='FINALIZED')throw Error('Not finalized');
 const leaders=receipt.consensus_data?.leader_receipt,leader=Array.isArray(leaders)?leaders.at(-1):leaders;
 if((!['MAJORITY_AGREE','SUCCESS'].includes(receipt.result_name||receipt.resultName))||(receipt.txExecutionResultName&&receipt.txExecutionResultName!=='SUCCESS')||(leader?.execution_result&&leader.execution_result!=='SUCCESS'))throw Error('Execution or consensus failure; inspect receipt, no automatic resend');
 s.state='VERIFIED';write(journalPath,journal);return receipt;
}
const source=fs.readFileSync(path.join(root,'contracts',filename),'utf8'),sourceSha=crypto.createHash('sha256').update(source).digest('hex');
const deployed=await step('deploy',{method:'deploy',source_sha256:sourceSha,leaderOnly:false,value:'0'},()=>client.deployContract({code:source,args:[],leaderOnly:false}));
let address=journal.address;
if(!address){address=deployed.data?.contract_address||deployed.data?.contractAddress||deployed.to_address||deployed.recipient;if(!address)throw Error('Inspect deployment receipt for address');journal.address=address;write(journalPath,journal);}
const deployedCode=await client.getContractCode(address);write(path.join(outputDir,'source-check.json'),{address,expected_sha256:sourceSha,returned_type:typeof deployedCode,exact:deployedCode===source});if(deployedCode!==source)throw Error('Source mismatch');
write(path.join(outputDir,'deployment.json'),{network:'Stable Studionet',chain_id:61999,rpc:'https://studio.genlayer.com/api',address,deploy_tx:journal.steps.deploy.hash,source_sha256:sourceSha,owner:account.address});
const input=JSON.parse(fs.readFileSync(path.join(root,'examples/example.json'))),cases=[['example',input]];
if(folder.startsWith('schema'))cases.push(['uncertain',{...input,rules:['Usually each part_id is associated with one supplier_id, but exceptions are possible.']}]);
else cases.push(['cycle',{...input,schedule:[0,1,3,2]}]);
for(const [slug,data] of cases){
 const recordId=account.address.toLowerCase()+':'+slug;
 await step('seal-'+slug,{method:'seal',args:[slug,JSON.stringify(data)],leaderOnly:false,value:'0'},()=>client.writeContract({address,functionName:'seal',args:[slug,JSON.stringify(data)],value:0n,leaderOnly:false}));
 await step('analyze-'+slug,{method:'analyze',args:[recordId],leaderOnly:false,value:'0'},()=>client.writeContract({address,functionName:'analyze',args:[recordId],value:0n,leaderOnly:false}));
 const record=JSON.parse(await client.readContract({address,functionName:'get_record',args:[recordId],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));
 write(path.join(outputDir,slug+'-record.json'),record);console.log(slug,record.state);
 const expected=folder.startsWith('schema')?(slug==='example'?'ANALYZED':'REVIEW'):(slug==='example'?'SERIALIZABLE':'CONFLICT');if(record.state!==expected)throw Error('Unexpected outcome '+record.state);
}
console.log('DONE',address,'Evidence:',outputDir);
