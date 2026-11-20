/* Sitemap Studio — background worker (Manifest V3). No remote telemetry. */
const JOB_KEY='sitemapJob';
const WATCHDOG='sitemapStudioWatchdog';
const PREFIX='https://search.google.com/search-console/sitemaps?resource_id=';
const now=()=>Date.now();
let inTransition=false;
const getJob=async()=> (await chrome.storage.local.get(JOB_KEY))[JOB_KEY];
const saveJob=async job=>chrome.storage.local.set({[JOB_KEY]:job});
function parseProperty(input){
  const v=String(input||'').trim();
  if(!v)return null;
  if(/^sc-domain:/i.test(v)){
    const d=v.slice(10).toLowerCase();
    return /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(d)?`sc-domain:${d}`:null;
  }
  try{
    const u=new URL(/^https?:\/\//i.test(v)?v:`https://${v}`);
    if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)return null;
    if(!/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname))return null;
    // Preserve URL-prefix path. E.g. https://example.com/news/
    const path=u.pathname.endsWith('/')?u.pathname:u.pathname+'/';
    return `${u.protocol}//${u.host}${path}`;
  }catch{return null;}
}
const normalizeProperties=entries=>[...new Set((entries||[]).map(parseProperty).filter(Boolean))];
const validSitemap=value=>/^[a-zA-Z0-9_.\/-]+\.xml(?:\?[a-zA-Z0-9_=&%-]+)?$/.test(value)&&!value.includes('..')&&!value.startsWith('/');
const urlFor=prop=>PREFIX+encodeURIComponent(prop);
function log(job,level,stage,message,property){
  job.logs??=[];
  job.logs.push({time:now(),level,stage,domain:property===undefined?(job.sites?.[job.index]||''):property,message:String(message).slice(0,1200)});
  if(job.logs.length>2000)job.logs.splice(0,job.logs.length-2000);
}
function sameProperty(tabUrl,property){
  try{
    const u=new URL(tabUrl);
    return u.origin==='https://search.google.com'&&u.pathname==='/search-console/sitemaps'&&u.searchParams.get('resource_id')===property;
  }catch{return false;}
}
async function pause(reason='Stopped by user',stage='control'){
  const job=await getJob();
  if(!job?.running)return job;
  job.running=false;job.paused=true;job.awaiting=false;job.injectingIndex=null;
  log(job,'warn',stage,reason);
  await saveJob(job);await chrome.alarms.clear(WATCHDOG);
  return job;
}
async function advance(status,detail,stage='result',runId=null,property=null){
  if(inTransition)return;
  inTransition=true;
  let next=false;
  try{
    const job=await getJob();
    if(!job?.running||!job.awaiting||job.index>=job.sites.length)return;
    if(runId&&job.runId!==runId)return;
    if(property&&job.sites[job.index]!==property)return;
    const current=job.sites[job.index];
    job.results??=[];
    job.results.push({domain:current,status,detail:String(detail).slice(0,1200),time:now(),stage});
    log(job,status==='confirmed'?'info':'error',stage,detail,current);
    job.index++;job.awaiting=false;job.injectingIndex=null;job.injectedAt=0;
    if(job.index===job.sites.length){
      job.running=false;job.paused=false;job.completedAt=now();
      log(job,'info','finish',`Finished ${job.results.length} properties; ${job.results.filter(x=>x.status==='error').length} errors`,'');
      await saveJob(job);await chrome.alarms.clear(WATCHDOG);
    }else{await saveJob(job);next=true;}
  }finally{inTransition=false;}
  if(next)await openCurrent();
}
async function openCurrent(){
  let job=await getJob();
  if(!job?.running||job.index>=job.sites.length)return;
  const property=job.sites[job.index];
  const prior=job.tabId;
  job.awaiting=true;job.tabId=null;job.injectingIndex=null;job.injectedAt=0;job.navigationAt=now();job.mismatchLogged=false;
  log(job,'info','navigation',`Opening property ${job.index+1}/${job.sites.length}`,property);
  await saveJob(job);
  try{
    // New tab per property avoids missed SPA navigation events in Search Console.
    const tab=await chrome.tabs.create({url:urlFor(property),active:true});
    job=await getJob();
    if(!job?.running||job.sites[job.index]!==property){await chrome.tabs.remove(tab.id).catch(()=>{});return;}
    job.tabId=tab.id;job.navigationAt=now();await saveJob(job);
    if(prior&&prior!==tab.id)await chrome.tabs.remove(prior).catch(()=>{});
    await inject(tab.id,'tab-created');
  }catch(e){
    await advance('error',`Cannot open tab: ${e.message}`,'navigation',job?.runId,property);
  }
}
async function inject(tabId,reason){
  const job=await getJob();
  if(!job?.running||!job.awaiting||job.tabId!==tabId)return;
  const prop=job.sites[job.index];
  let tab;
  try{tab=await chrome.tabs.get(tabId);}catch{return;}
  if(!sameProperty(tab.url||tab.pendingUrl||'',prop)){
    if(tab.status==='complete'&&!job.mismatchLogged){
      job.mismatchLogged=true;log(job,'warn','url',`Unexpected page: ${(tab.url||'').slice(0,250)}`,prop);await saveJob(job);
    }
    return;
  }
  if(tab.status!=='complete'||job.injectingIndex===job.index)return;
  const fresh=await getJob();
  if(!fresh?.running||fresh.tabId!==tabId||fresh.index!==job.index||fresh.injectingIndex===fresh.index)return;
  fresh.injectingIndex=fresh.index;fresh.injectedAt=now();fresh.mismatchLogged=false;
  log(fresh,'info','inject',`Starting submission check (${reason})`,prop);await saveJob(fresh);
  try{
    await chrome.scripting.executeScript({target:{tabId},files:['content.js']});
    await chrome.tabs.sendMessage(tabId,{type:'submit',domain:prop,sitemap:fresh.sitemap,runId:fresh.runId});
  }catch(e){await advance('error',`Injection failed: ${e.message}`,'inject',fresh.runId,prop);}
}
async function start({sites,sitemap}){
  const existing=await getJob();if(existing?.running)throw Error('A job is already running.');
  const props=normalizeProperties(sites);
  const path=String(sitemap||'').trim();
  if(!props.length)throw Error('Add at least one valid Search Console property.');
  if(!validSitemap(path))throw Error('Invalid relative sitemap path (example: sitemap.xml).');
  const job={runId:crypto.randomUUID(),running:true,paused:false,sites:props,sitemap:path,index:0,results:[],logs:[],startedAt:now(),awaiting:false,tabId:null};
  log(job,'info','start',`New job started for ${props.length} properties`,'');await saveJob(job);
  await chrome.alarms.create(WATCHDOG,{periodInMinutes:0.5});
  await openCurrent();return getJob();
}
async function resume(){
  const job=await getJob();if(!job)throw Error('No saved job to resume.');
  if(job.running)throw Error('A job is already running.');
  if(job.index>=job.sites.length)throw Error('Job completed. Start a new job or reset progress.');
  job.runId=crypto.randomUUID();job.running=true;job.paused=false;job.awaiting=false;job.tabId=null;job.injectingIndex=null;
  log(job,'info','resume',`Resuming at ${job.index+1}/${job.sites.length}`);
  await saveJob(job);await chrome.alarms.create(WATCHDOG,{periodInMinutes:0.5});await openCurrent();return getJob();
}
async function reset(){
  const job=await getJob();if(job?.running)throw Error('Stop the job before resetting.');
  await chrome.alarms.clear(WATCHDOG);await chrome.storage.local.remove(JOB_KEY);return null;
}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  if(msg?.type==='progress'||msg?.type==='result'){
    (async()=>{
      const job=await getJob();
      if(!job?.running||!job.awaiting||sender.tab?.id!==job.tabId||job.runId!==msg.runId||job.sites[job.index]!==msg.domain)return;
      if(msg.type==='progress'){
        log(job,msg.level==='warn'?'warn':'info',msg.stage||'content',msg.detail||'',msg.domain);await saveJob(job);
      }else await advance(msg.status==='confirmed'?'confirmed':'error',msg.detail||'No details',msg.stage||'result',msg.runId,msg.domain);
    })().catch(console.error);
    return;
  }
  const actions={start:()=>start(msg),resume,pause:()=>pause(),reset};
  if(!actions[msg?.type])return;
  actions[msg.type]().then(job=>reply({ok:true,job})).catch(e=>reply({ok:false,error:e.message}));return true;
});
chrome.tabs.onUpdated.addListener((id,changes)=>{
  if(changes.status==='complete'||changes.url)inject(id,'tab-updated').catch(console.error);
});
chrome.tabs.onRemoved.addListener(async tabId=>{
  const job=await getJob();if(job?.running&&job.tabId===tabId)await pause('Working tab closed. Resume from the extension.','tab');
});
chrome.alarms.onAlarm.addListener(async alarm=>{
  if(alarm.name!==WATCHDOG)return;
  const job=await getJob();if(!job?.running||!job.awaiting)return;
  await inject(job.tabId,'watchdog').catch(console.error);
  const latest=await getJob();
  if(!latest?.running||!latest.awaiting||latest.index!==job.index||latest.runId!==job.runId)return;
  if(now()-(latest.injectedAt||latest.navigationAt||now())<90000)return;
  let details='Timed out while waiting for submission confirmation (90s).';
  try{const tab=await chrome.tabs.get(latest.tabId);details+=` URL: ${tab.url||'-'}; status: ${tab.status}`;}catch{}
  await advance('error',details,'timeout',latest.runId,latest.sites[latest.index]);
});
chrome.runtime.onStartup.addListener(async()=>{
  const job=await getJob();
  if(job?.running){job.running=false;job.paused=true;job.awaiting=false;log(job,'warn','startup','Browser restarted. Use Resume to continue.');await saveJob(job);}
  await chrome.alarms.clear(WATCHDOG);
});
