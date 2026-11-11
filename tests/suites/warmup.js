// Warm-up sets (v0.33): optional, heavy strength lifts only, separate from working sets, left out of the log.
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs=[]; const errors=[];
  const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message));
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  const start=async(id,w,on)=>{ await page.evaluate(([id,w,on])=>{ const T=window.__T; T.P.active=false; document.querySelector('#perf')?.remove(); T.S.settings.lang='ko'; T.S.settings.warmupOn=on; T.S.plans={}; T.S.logs={}; const ex=T.S.exercises.find(e=>e.id===id); const it=T.addPlanItem(T.todayKey(),ex); it.weight=w; T.S.tab='dash'; T.render(); T.startQueue([{date:T.todayKey(),id:it.id}]); },[id,w,on]); await page.locator('[data-p="start"]').waitFor({timeout:3000}); await page.click('[data-p="start"]'); await page.locator('[data-p="setdone"]').first().waitFor({timeout:3000}); };
  // settings row
  await page.evaluate(()=>{ const T=window.__T; T.S.settings.lang='ko'; T.S.tab='settings'; T.S.sub=null; T.render(); });
  check('Settings has a warm-up toggle, off by default', await page.locator('[data-sset="warmupOn"][data-v="0"].on').count()===1);
  // on, bench 40 kg
  await start('ex_bench',40,true);
  const c=await page.evaluate(()=>({sets:window.__T.P.sets.map(s=>(s.warm?'W':'S')+s.weight+'x'+s.reps),labels:[...document.querySelectorAll('.setcard .top b')].map(b=>b.textContent),dashed:document.querySelectorAll('.setcard.warm').length}));
  check('heavy lift starts with 50 % × 8 and 70 % × 5 warm-ups', JSON.stringify(c.sets.slice(0,2))==='["W20x8","W27.5x5"]'&&c.sets.length===5, JSON.stringify(c.sets));
  check('cards read 워밍업 1, 워밍업 2, 세트 1…3 and warm-ups are dashed', c.labels.join('|')==='워밍업 1|워밍업 2|세트 1|세트 2|세트 3'&&c.dashed===2, c.labels.join('|'));
  check('warm-up cards have no "last time" line', await page.evaluate(()=>!document.querySelector('.setcard.warm .lastln')));
  // a previous bench session so the last-time line has data
  await page.evaluate(()=>{ const T=window.__T; const d=new Date(); d.setDate(d.getDate()-3); const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); T.S.logs[k]={entries:[{id:'old',planItemId:'pold',exId:'ex_bench',mode:'sets',startedAt:1,endedAt:2,duration:300,sets:[{reps:6,weight:35,done:true}],memo:'',condition:3,rpe:7}]}; });
  await page.click('[data-sp="weight"][data-i="0"][data-d="1"]'); await page.waitForTimeout(60);
  const w=await page.evaluate(()=>window.__T.P.sets.map(s=>s.weight)); check('changing a warm-up weight does not change the working sets', w[2]===40&&w[3]===40&&w[4]===40, JSON.stringify(w));
  const lastIdx=await page.evaluate(()=>[...document.querySelectorAll('.setcard')].findIndex(c=>c.querySelector('.lastln')));
  check('the first last-time line sits on 세트 1 (card index 2), not on a warm-up', lastIdx===2, lastIdx);
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(60); await page.click('[data-p="setdone"][data-i="2"]'); await page.waitForTimeout(60);
  await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:3000}); await page.click('[data-p="next"]'); await page.waitForTimeout(200);
  const log=await page.evaluate(()=>{ const T=window.__T; const e=T.logOf(T.todayKey())[0]; return e&&{n:e.sets.length,warm:e.sets.some(s=>s.warm),warmups:e.warmups,done:e.sets.filter(s=>s.done).length}; });
  check('the log keeps only working sets and counts the warm-ups separately', log&&log.n===3&&!log.warm&&log.warmups===1&&log.done===1, JSON.stringify(log));
  const planned=await page.evaluate(()=>{ const T=window.__T; const it=T.planOf(T.todayKey())[0]; return {sets:it.sets,weight:it.weight}; });
  check('the plan keeps 3 working sets and the working weight after a session with warm-ups', planned.sets===3&&planned.weight===40, JSON.stringify(planned));
  // only warm-ups done, then leave with "save": the session is saved, not lost
  await start('ex_bench',40,true);
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(60);
  await page.click('[data-p="exit"]'); await page.locator('#lv-save').waitFor({timeout:3000}); await page.click('#lv-save'); await page.waitForTimeout(200);
  const saved=await page.evaluate(()=>{ const T=window.__T; const e=T.logOf(T.todayKey())[0]; return {active:T.P.active,entry:!!e,warmups:e&&e.warmups,sheet:!!document.querySelector('#sheet')}; });
  check('leaving with Save after only warm-ups stores the session (warm-ups counted) and closes it', saved.entry&&saved.warmups===1&&!saved.active&&!saved.sheet, JSON.stringify(saved));
  // light weight: none
  await start('ex_curl',10,true);
  check('light lifts (under 20 kg) get no warm-up', await page.evaluate(()=>!window.__T.P.sets.some(s=>s.warm)));
  // off: none
  await start('ex_bench',60,false);
  check('with the setting off there are no warm-ups', await page.evaluate(()=>!window.__T.P.sets.some(s=>s.warm)));
  // v0.39: number of steps and the working weight they start from
  await page.evaluate(()=>{ const T=window.__T; T.P.active=false; document.querySelector('#perf')?.remove(); T.S.settings.warmupOn=true; T.S.tab='settings'; T.S.sub=null; T.render(); });
  const ui=await page.evaluate(()=>({steps:[...document.querySelectorAll('[data-snum="warmupSteps"]')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(','),min:[...document.querySelectorAll('[data-snum="warmupMinLv"]')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(','),scheme:document.querySelector('#wu-scheme')?.textContent}));
  check('with warm-ups on, Settings offers 1/2/3 steps (2 chosen) and 20/40/60 kg (20 chosen)', ui.steps==='1,2*,3'&&ui.min==='20kg*,40kg,60kg'&&ui.scheme==='50% × 8 · 70% × 5', JSON.stringify(ui));
  await page.click('[data-snum="warmupSteps"][data-v="3"]'); await page.waitForTimeout(60);
  check('choosing 3 shows 40% × 10 · 60% × 5 · 80% × 3', await page.evaluate(()=>document.querySelector('#wu-scheme')?.textContent)==='40% × 10 · 60% × 5 · 80% × 3');
  await start('ex_bench',40,true);
  const three=await page.evaluate(()=>window.__T.P.sets.filter(s=>s.warm).map(s=>s.weight+'x'+s.reps).join(','));
  check('bench 40 kg with 3 steps: 15×10, 25×5, 32.5×3', three==='15x10,25x5,32.5x3', three);
  await page.evaluate(()=>{ const T=window.__T; T.P.active=false; document.querySelector('#perf')?.remove(); T.S.settings.warmupSteps=1; T.S.settings.warmupMinLv=2; });
  await start('ex_bench',35,true);
  check('starting weight 40 kg: bench 35 kg gets no warm-up', await page.evaluate(()=>!window.__T.P.sets.some(s=>s.warm)));
  await start('ex_bench',40,true);
  const one=await page.evaluate(()=>window.__T.P.sets.filter(s=>s.warm).map(s=>s.weight+'x'+s.reps).join(','));
  check('1 step at 40 kg: one warm-up of 25 × 5 (60 %)', one==='25x5', one);
  await page.evaluate(()=>{ const T=window.__T; T.P.active=false; document.querySelector('#perf')?.remove(); T.S.settings.unit='lb'; T.S.tab='settings'; T.S.sub=null; T.render(); });
  const lb=await page.evaluate(()=>[...document.querySelectorAll('[data-snum="warmupMinLv"]')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(','));
  check('in lb the choices read 45/95/135 lb and keep the chosen level', lb==='45lb,95lb*,135lb', lb);
  await page.evaluate(()=>{ const T=window.__T; T.S.settings.unit='kg'; T.S.settings.warmupSteps=2; T.S.settings.warmupMinLv=1; T.S.settings.warmupOn=false; });
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
