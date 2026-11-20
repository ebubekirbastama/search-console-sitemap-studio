/* Content script: only touches the currently selected Search Console property. */
(()=>{
  if(globalThis.__sitemapStudioLoaded)return;
  globalThis.__sitemapStudioLoaded=true;
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const text=element=>String(element?.innerText||element?.textContent||'').replace(/\s+/g,' ').trim();
  const visible=element=>!!element&&element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden';
  const labels=element=>[element?.innerText,element?.textContent,element?.getAttribute('aria-label')].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  const norm=value=>String(value||'').trim().toLowerCase();
  const send=async(message)=>{try{await chrome.runtime.sendMessage(message);}catch(err){console.warn('Sitemap Studio:',err.message);}};
  const progress=(job,stage,detail,level='info')=>send({type:'progress',runId:job.runId,domain:job.domain,stage,detail,level});
  const result=(job,status,detail,stage='confirmation')=>send({type:'result',runId:job.runId,domain:job.domain,status,detail,stage});
  const successPhrases=[
    /site haritas[ıi] başar[ıi]yla gönderildi/i,
    /sitemap submitted successfully/i,
    /sitemap successfully submitted/i,
    /sitemap enviado correctamente/i,
    /sitemap enviado com sucesso/i,
    /sitemap (?:a été )?envoyé(?:e)? avec succès/i,
    /sitemap erfolgreich eingereicht/i,
    /sitemap inviata correttamente/i
  ];
  const errorPhrases=[/\bhata\b/i,/\berror\b/i,/geçersiz/i,/\binvalid\b/i,/başar[ıi]s[ıi]z/i,/\bfailed\b/i,/couldn.t fetch/i,/\berreur\b/i,/\bfehler\b/i,/\berror al enviar\b/i];
  const closePhrases=/^(kapat|tamam|close|ok|okay|got it|done|cerrar|aceptar|fermer|d'accord|schließen|oké|chiudi|fechar|entendi)$/i;
  async function waitInput(timeout=30000){
    const start=Date.now();
    while(Date.now()-start<timeout){
      const inputs=[...document.querySelectorAll('input:not([type="hidden"])')].filter(e=>visible(e)&&!e.disabled);
      const hit=inputs.find(e=>/site haritası|sitemap|site map|plan du site|sitemaps/i.test([
        e.getAttribute('aria-label'),e.getAttribute('placeholder'),e.getAttribute('name')].filter(Boolean).join(' ')))
        || inputs.find(e=>e.classList.contains('whsOnd')&&e.classList.contains('zHQkBf'));
      if(hit)return hit;
      await delay(350);
    }
    throw Error('Sitemap input not found. Check property access and Search Console language.');
  }
  function findSubmit(){
    const buttons=[...document.querySelectorAll('button,[role="button"]')].filter(e=>visible(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true');
    return buttons.find(e=>/^(gönder|submit|send|enviar|envoyer|senden|invia|enviar sitemap)$/i.test(norm(text(e))))
      || buttons.find(e=>/^(gönder|submit|send|enviar|envoyer|senden|invia)$/i.test(norm(e.getAttribute('aria-label'))));
  }
  function findDialog(){
    const dialogs=[...document.querySelectorAll('[role="dialog"],[role="alertdialog"],.uW2Fw-Sx9Kwc')].filter(visible);
    for(const dialog of dialogs){
      const message=text(dialog).slice(0,1200);
      const buttons=[...dialog.querySelectorAll('button,[role="button"]')].filter(visible);
      const close=buttons.find(e=>closePhrases.test(norm(text(e)))||closePhrases.test(norm(e.getAttribute('aria-label'))));
      if(!close)continue; // Observe the close button; NEVER click it.
      const success=successPhrases.some(pattern=>pattern.test(message));
      const error=errorPhrases.some(pattern=>pattern.test(message));
      if(success||error)return {message,success:success&&!error};
    }
    return null;
  }
  async function waitDialog(timeout=35000){
    const start=Date.now();
    while(Date.now()-start<timeout){const dialog=findDialog();if(dialog)return dialog;await delay(400);}
    return null;
  }
  async function submit(job){
    const u=new URL(location.href);
    if(u.origin!=='https://search.google.com'||u.pathname!=='/search-console/sitemaps'||u.searchParams.get('resource_id')!==job.domain){
      throw Error('The current Search Console property does not match the requested property.');
    }
    await progress(job,'input','Looking for sitemap input');
    const input=await waitInput();
    input.click();input.focus();
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    setter.call(input,job.sitemap);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    await delay(500);
    if(input.value!==job.sitemap)throw Error('Unable to set sitemap input value.');
    await progress(job,'input',`Sitemap path entered: ${job.sitemap}`);
    const button=findSubmit();
    if(!button)throw Error('Enabled Submit button not found. UI language may not be supported.');
    await progress(job,'submit','Clicking Submit');
    button.click();
    await progress(job,'confirmation','Waiting for success dialog and visible Close button (button will not be clicked)');
    const dialog=await waitDialog();
    if(!dialog)throw Error('No recognized success/error dialog with a Close button appeared within 35 seconds. Submission unverified.');
    if(!dialog.success)await result(job,'error',`Error dialog detected; close button untouched: ${dialog.message}`);
    else await result(job,'confirmed',`Success dialog detected; close button untouched: ${dialog.message}. Indexing not guaranteed.`);
  }
  chrome.runtime.onMessage.addListener((job,sender,reply)=>{
    if(job?.type!=='submit')return;
    submit(job).catch(error=>result(job,'error',error.message||String(error),'content'));
    reply({received:true});
  });
})();
