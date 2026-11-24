// Owned loopback proxy delays only an already accepted local enqueue receipt.
import {createServer} from 'node:http';
import {writeFileSync} from 'node:fs';
import {submitJob} from '../../apps/atlas-lab/ui/job-submit.mjs';
const backend='http://127.0.0.1:41379',receipt={scope:'Actual JavaScript submitter and Rust queue over owned loopback HTTP; no provider requests; not a browser test',complete:false};
const headers={'Content-Type':'application/json','X-Atlas-Request':'local-ui',Origin:backend};
let server,hold;
try{
 receipt.confirmed=await submitJob('DedupExperiment',{fetchImpl:(path,options)=>fetch(backend+path,{...options,headers})});
 receipt.forwarded_posts=0;
 server=createServer(async(request,response)=>{
  try{
   if(request.method!=='POST'||request.url!=='/api/jobs'){response.writeHead(404).end();return;}
   let body='';for await(const chunk of request){body+=chunk;if(body.length>4096)throw Error('Request byte budget');}
   receipt.forwarded_posts++;
   const result=await fetch(backend+'/api/jobs',{method:'POST',headers,body,redirect:'error'});
   receipt.backend_status=result.status;const bytes=await result.text();if(bytes.length>4096)throw Error('Backend receipt budget');receipt.backend_receipt=bytes;
   response.writeHead(result.status,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(bytes)});response.write(bytes.slice(0,1));
   hold=setTimeout(()=>response.end(bytes.slice(1)),20000);response.once('close',()=>clearTimeout(hold));
  }catch(error){receipt.proxy_failure=error.name;if(!response.headersSent)response.writeHead(502);response.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const proxy='http://127.0.0.1:'+server.address().port,start=performance.now();
 try{await submitJob('DedupExperiment',{fetchImpl:(path,options)=>fetch(proxy+path,options)});throw Error('Stalled receipt was incorrectly accepted');}
 catch(error){receipt.stalled_message=error.message;if(!error.message.includes('unconfirmed'))throw error;}
 receipt.elapsed_ms=performance.now()-start;
 if(receipt.backend_status!==200||receipt.forwarded_posts!==1||!receipt.backend_receipt)throw Error('No verified accepted-then-stalled path');
 receipt.complete=true;
}catch(error){receipt.failure={type:error.name,message:error.message};throw error;}
finally{clearTimeout(hold);if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}writeFileSync(process.argv[2],JSON.stringify(receipt,null,2)+'\n');}
