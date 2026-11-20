/* Local-only popup. User-provided property list is never included in the package. */
const $=id=>document.getElementById(id);
const I18N={
 en:{subtitle:'Search Console batch submission',statusHeading:'Job status',processed:'Processed',remaining:'Remaining',errors:'Errors',settings:'Submission settings',sitemapPath:'Relative sitemap path',properties:'Search Console properties (one per line)',requireAccess:'Requires property access',start:'▶ Start new job',resume:'↻ Resume',pause:'Ⅱ Pause',reset:'⟲ Reset progress',logsHeading:'Activity log',all:'All entries',warnings:'Warnings',information:'Information',export:'↓ Export TXT',disclaimer:'The extension observes the success dialog but does not click Close. Submission does not guarantee indexing. Logs and settings stay in your browser.',ready:'Ready',running:'Running',complete:'Completed',paused:'Paused',next:'Next',started:'Started',confirmed:'Success dialogs seen',noLogs:'No entries for this filter.',noSites:'Add one or more properties.',startConfirm:'Start a batch of {n} Search Console properties?',unfinished:'A previous job is unfinished. Resume it or reset progress first.',resumeDifferent:'Resume uses the property list and sitemap path from the saved job. Continue?',resetConfirm:'Clear saved progress, results and logs? The property list will be preserved.',noLogExport:'No logs to export.',count:'{n} properties'},
 tr:{subtitle:'Search Console toplu gönderim',statusHeading:'İşlem durumu',processed:'İşlenen',remaining:'Kalan',errors:'Hatalar',settings:'Gönderim ayarları',sitemapPath:'Göreli sitemap yolu',properties:'Search Console mülkleri (satır başına bir mülk)',requireAccess:'Mülk erişimi gerekir',start:'▶ Yeni işlem',resume:'↻ Kaldığı yerden devam',pause:'Ⅱ Durdur',reset:'⟲ İlerlemeyi sıfırla',logsHeading:'İşlem günlüğü',all:'Tüm kayıtlar',warnings:'Uyarılar',information:'Bilgi',export:'↓ TXT indir',disclaimer:'Başarı penceresi görülür, ancak Kapat düğmesine basılmaz. Gönderim indekslemeyi garanti etmez. Kayıtlar ve ayarlar tarayıcınızda kalır.',ready:'Hazır',running:'Çalışıyor',complete:'Tamamlandı',paused:'Duraklatıldı',next:'Sıradaki',started:'Başlangıç',confirmed:'Başarı penceresi görülen',noLogs:'Bu filtrede kayıt yok.',noSites:'Bir veya daha fazla mülk ekleyin.',startConfirm:'{n} Search Console mülkü için işlem başlatılsın mı?',unfinished:'Önceki işlem tamamlanmadı. Devam edin veya ilerlemeyi sıfırlayın.',resumeDifferent:'Devam işlemi kayıtlı mülkleri ve sitemap yolunu kullanır. Devam edilsin mi?',resetConfirm:'Kaydedilmiş ilerleme, sonuçlar ve loglar silinsin mi? Mülk listesi korunur.',noLogExport:'Dışarı aktarılacak günlük yok.',count:'{n} mülk'}
};
let language='en',job=null;
const tr=(key,params={})=>(I18N[language][key]||key).replace(/\{(\w+)\}/g,(_,key)=>params[key]??'');
function applyLanguage(){document.documentElement.lang=language;for(const element of document.querySelectorAll('[data-i18n]'))element.textContent=tr(element.dataset.i18n);$('language').value=language;render(job);updateCount();}
function parseLines(raw){
  return [...new Set(String(raw||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];
}
function updateCount(){$('count').textContent=tr('count',{n:parseLines($('sites').value).length});}
const timestamp=ms=>ms?new Date(ms).toLocaleString(language==='tr'?'tr-TR':'en-US'):'-';
function render(value){
 job=value||null;
 const total=job?.sites?.length||0;
 const done=job?.results?.length||0;
 const errs=job?.results?.filter(r=>r.status==='error').length||0;
 const successes=job?.results?.filter(r=>r.status==='confirmed').length||0;
 const running=!!job?.running;
 $('start').disabled=running||!!(job&&job.index<total);
 $('resume').disabled=running||!job||job.index>=total;
 $('pause').disabled=!running;
 $('reset').disabled=running;
 $('sites').disabled=running;$('sitemap').disabled=running;
 const state=!job?'ready':running?'running':job.index>=total?'complete':'paused';
 $('statePill').textContent=tr(state);
 $('status').textContent=!job?tr('ready'):`${tr(state)} · ${done}/${total}\n${successes} ${tr('confirmed')} · ${errs} ${tr('errors')}\n${job.index<total?tr('next')+': '+job.sites[job.index]:''}\n${tr('started')}: ${timestamp(job.startedAt)}`;
 $('metricDone').textContent=done;$('metricRemaining').textContent=Math.max(0,total-done);$('metricErrors').textContent=errs;
 $('bar').style.width=`${total?Math.round(100*done/total):0}%`;
 renderLogs();
}
function renderLogs(){
 const filter=$('filter').value;
 const logs=(job?.logs||[]).filter(l=>filter==='all'||filter===l.level).slice().reverse();
 const parent=$('logs');parent.replaceChildren();
 if(!logs.length){parent.textContent=tr('noLogs');return;}
 for(const item of logs){const div=document.createElement('div');div.className=`entry ${item.level}`;div.textContent=`[${timestamp(item.time)}] ${item.level.toUpperCase()} / ${item.stage}${item.domain?' / '+item.domain:''}\n${item.message}`;parent.appendChild(div);}
}
async function call(type,data={}){
 try{const response=await chrome.runtime.sendMessage({type,...data});if(!response?.ok)throw Error(response?.error||'Unknown error');render(response.job||null);}catch(e){alert(e.message);}
}
async function initialize(){
 const values=await chrome.storage.local.get(['studioProperties','studioSitemap','studioLanguage','sitemapJob']);
 language=values.studioLanguage||((navigator.language||'').toLowerCase().startsWith('tr')?'tr':'en');
 $('sites').value=values.studioProperties||'';$('sitemap').value=values.studioSitemap??'sitemap.xml';
 job=values.sitemapJob||null;applyLanguage();
}
$('language').addEventListener('change',async()=>{language=$('language').value;await chrome.storage.local.set({studioLanguage:language});applyLanguage();});
$('sites').addEventListener('input',async()=>{updateCount();await chrome.storage.local.set({studioProperties:$('sites').value});});
$('sitemap').addEventListener('input',async()=>chrome.storage.local.set({studioSitemap:$('sitemap').value}));
$('filter').addEventListener('change',renderLogs);
$('start').addEventListener('click',async()=>{
 if(job&&job.index<job.sites.length){alert(tr('unfinished'));return;}
 const sites=parseLines($('sites').value);if(!sites.length){alert(tr('noSites'));return;}
 if(!confirm(tr('startConfirm',{n:sites.length})))return;
 await call('start',{sites,sitemap:$('sitemap').value});
});
$('resume').addEventListener('click',async()=>{
 if(!job)return;
 if(job.sitemap!==$('sitemap').value||job.sites.join('\n')!==parseLines($('sites').value).join('\n')){
   if(!confirm(tr('resumeDifferent')))return;
 }
 await call('resume');
});
$('pause').addEventListener('click',()=>call('pause'));
$('reset').addEventListener('click',async()=>{if(confirm(tr('resetConfirm')))await call('reset');});
$('export').addEventListener('click',()=>{
 if(!job?.logs?.length){alert(tr('noLogExport'));return;}
 const lines=[`Sitemap Studio log`, `Started: ${timestamp(job.startedAt)}`,`Properties: ${job.sites.length}`,`Processed: ${job.results.length}`,'','=== PROPERTY RESULTS ===',...job.results.map(r=>`[${timestamp(r.time)}] ${r.domain} | ${r.status} | ${r.stage} | ${r.detail}`),'','=== ACTIVITY LOG ===',...job.logs.map(l=>`[${timestamp(l.time)}] ${l.level.toUpperCase()} | ${l.stage} | ${l.domain||'-'} | ${l.message}`)];
 const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='sitemap-studio-log.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
chrome.storage.onChanged.addListener(ch=>{if(ch.sitemapJob)render(ch.sitemapJob.newValue);});
initialize().catch(err=>$('status').textContent=err.message);
