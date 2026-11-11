// Form cues (v0.40): every built-in exercise has a common-mistake (or, for stretches and warm-ups, a tip) line in EN and KO
// under each step card the app shows (the first three steps).
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs=[]; const errors=[];
  const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message));
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  const r=await page.evaluate(()=>{ const ex=window.__T.S.exercises; const miss=[], long=[], same=[]; let n=0;
    ex.forEach(e=>{ const seen=new Set(); (e.steps||[]).slice(0,3).forEach((s,i)=>{ if(!(s.cueEn||s.cueKo))return; n++;
      if(!(s.mistakeEn||'').trim()||!(s.mistakeKo||'').trim())miss.push(e.id+'#'+i);
      if((s.mistakeEn||'').length>60||(s.mistakeKo||'').length>30)long.push(e.id+'#'+i);
      if(seen.has(s.mistakeEn))same.push(e.id+'#'+i); seen.add(s.mistakeEn); }); });
    return {count:ex.length,n,miss,long,same}; });
  check('every exercise ('+r.count+') has an EN and KO mistake/tip line on each shown step ('+r.n+' steps)', r.miss.length===0, r.miss.slice(0,10).join(' '));
  check('lines stay short (EN ≤ 60, KO ≤ 30 characters)', r.long.length===0, r.long.slice(0,10).join(' '));
  check('no exercise repeats a line across its steps', r.same.length===0, r.same.slice(0,10).join(' '));
  // a cardio and a stretch card render with the right label
  const lab=await page.evaluate(()=>{ const T=window.__T; T.S.settings.lang='ko'; T.S.plans={}; T.S.logs={}; const out={}; for(const id of ['ex_tennis','ex_tree']){ T.P.active=false; document.querySelector('#perf')?.remove(); const it=T.addPlanItem(T.todayKey(),T.S.exercises.find(e=>e.id===id)); T.startQueue([{date:T.todayKey(),id:it.id}]); out[id]=[...document.querySelectorAll('.smis')].map(x=>x.textContent).join(' | '); } return out; });
  check('tennis cards show 흔한 실수 lines', /흔한 실수/.test(lab.ex_tennis)&&lab.ex_tennis.split('|').length>=3, lab.ex_tennis);
  check('tree pose cards show 팁 lines', /팁/.test(lab.ex_tree)&&!/흔한 실수/.test(lab.ex_tree), lab.ex_tree);
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
