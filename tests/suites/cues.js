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
    /* same filter as stepCards: a step is shown when any of its title or cue fields has text */
    ex.forEach(e=>{ const seenEn=new Set(), seenKo=new Set(); (e.steps||[]).slice(0,3).forEach((s,i)=>{ if(!(s.titleEn||s.titleKo||s.cueEn||s.cueKo||'').trim())return; n++;
      if(!(s.mistakeEn||'').trim()||!(s.mistakeKo||'').trim())miss.push(e.id+'#'+i);
      if((s.mistakeEn||'').length>60||(s.mistakeKo||'').length>30)long.push(e.id+'#'+i);
      const le=(s.mistakeEn||'').toLowerCase(); if(seenEn.has(le))same.push(e.id+'#'+i+' en'); seenEn.add(le);
      if(seenKo.has(s.mistakeKo))same.push(e.id+'#'+i+' ko'); seenKo.add(s.mistakeKo); }); });
    return {count:ex.length,n,miss,long,same}; });
  check('every exercise ('+r.count+') has an EN and KO mistake/tip line on each shown step ('+r.n+' steps)', r.miss.length===0, r.miss.slice(0,10).join(' '));
  check('lines stay short (EN ≤ 60, KO ≤ 30 characters)', r.long.length===0, r.long.slice(0,10).join(' '));
  check('no exercise repeats a line across its steps (EN and KO checked separately)', r.same.length===0, r.same.slice(0,10).join(' '));
  // a cardio and a stretch card render with the right label
  const lab=await page.evaluate(()=>{ const T=window.__T; T.S.settings.lang='ko'; T.S.plans={}; T.S.logs={}; const out={}; for(const id of ['ex_tennis','ex_tree']){ T.P.active=false; document.querySelector('#perf')?.remove(); const it=T.addPlanItem(T.todayKey(),T.S.exercises.find(e=>e.id===id)); T.startQueue([{date:T.todayKey(),id:it.id}]); out[id]=[...document.querySelectorAll('.smis')].map(x=>x.textContent).join(' | '); } return out; });
  check('tennis cards show 흔한 실수 lines', /흔한 실수/.test(lab.ex_tennis)&&lab.ex_tennis.split('|').length>=3, lab.ex_tennis);
  check('tree pose cards show 팁 lines', /팁/.test(lab.ex_tree)&&!/흔한 실수/.test(lab.ex_tree), lab.ex_tree);
  // saved data from an older version: built-in steps were stored without the new lines
  const mig=await page.evaluate(()=>{ const raw=JSON.parse(localStorage.getItem('wwt.state.v1')||'{}'); const ex=raw.exercises||window.__T.S.exercises.map(e=>JSON.parse(JSON.stringify(e)));
    const f=id=>ex.find(e=>e.id===id);
    f('ex_crossover').steps[0].mistakeEn=''; f('ex_crossover').steps[0].mistakeKo='';                     /* untouched step, line missing */
    f('ex_tennis').steps.forEach(s=>{ delete s.mistakeEn; delete s.mistakeKo; });                          /* very old format, no keys */
    f('ex_hammer').steps[0].mistakeEn='Elbows drifting forward'; f('ex_hammer').steps[0].mistakeKo='팔꿈치가 앞으로 나감'; /* replaced default */
    f('ex_jumprope').steps[0].cueEn='My own cue'; f('ex_jumprope').steps[0].mistakeEn=''; f('ex_jumprope').steps[0].mistakeKo=''; /* user-edited step */
    f('ex_bench').steps[0].mistakeEn='My note'; f('ex_bench').steps[0].mistakeKo='내 메모';                /* user-edited line */
    raw.exercises=ex; localStorage.setItem('wwt.state.v1',JSON.stringify(raw)); return true; });
  await page.reload(); await page.waitForTimeout(400);
  const after=await page.evaluate(()=>{ const f=id=>window.__T.S.exercises.find(e=>e.id===id); const saved=JSON.parse(localStorage.getItem('wwt.state.v1')).exercises.find(e=>e.id==='ex_crossover'); return {cross:f('ex_crossover').steps[0].mistakeEn, tennis:f('ex_tennis').steps.map(s=>s.mistakeKo||'').filter(Boolean).length, hammer:f('ex_hammer').steps[0].mistakeEn, rope:[f('ex_jumprope').steps[0].cueEn,f('ex_jumprope').steps[0].mistakeEn], bench:f('ex_bench').steps[0].mistakeKo, saved:saved.steps[0].mistakeEn}; });
  check('after an update, saved built-in exercises get the new lines (empty or missing fields)', !!after.cross&&after.tennis===3&&after.saved===after.cross, JSON.stringify(after));
  check('a default line replaced in this version is updated (hammer curl)', after.hammer==='Shoulders shrugged up', after.hammer);
  check('steps the user edited keep their own text and get no line', after.rope[0]==='My own cue'&&after.rope[1]===''&&after.bench==='내 메모', JSON.stringify([after.rope,after.bench]));
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
