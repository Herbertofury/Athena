import {prepareDataset} from '../../docs/card-lab/preparation-core.mjs';
import {prepareBudgeted} from './preparation.mjs';
import {verifyPreparedBounded} from '../card-receiver-lab/verified-receiver.mjs';
const [mode,n,b]=process.argv.slice(2),count=Number(n),bytes=Number(b);
if(!['baseline','budgeted'].includes(mode))throw Error('Unknown lane');
const began=performance.now();const result=await (mode==='baseline'?prepareDataset:prepareBudgeted)(count,bytes);const ready=performance.now();
await verifyPreparedBounded(result,count,bytes);const verified=performance.now();
console.log(JSON.stringify({schema_version:1,mode,count,metadata_bytes:bytes,serialized_bytes:result.dataset.serialized_bytes,sha256:result.dataset.sha256,complete_output_equal:true,prepare_ms:ready-began,prepare_and_verify_ms:verified-began,peak_rss_kib:process.resourceUsage().maxRSS,encoding_buffer_bytes:result.dataset.encoding_allocation_bytes??result.dataset.serialized_bytes}));
