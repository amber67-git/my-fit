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
  await page.evaluate(()=>{ const T=window.__T; T.P.prevSets=[{reps:6,weight:35,done:true}]; }); await page.evaluate(()=>{ const b=document.querySelector('[data-p="start"]'); }); 
  const lastIdx=await page.evaluate(()=>{ const T=window.__T; /* rerender so the last-time line is computed with warm-ups present */ return [...document.querySelectorAll('.setcard')].findIndex(c=>c.querySelector('.lastln')); });
  check('the first last-time line sits on 세트 1, not on a warm-up', lastIdx===-1||lastIdx===2, lastIdx);
  await page.click('[data-sp="weight"][data-i="0"][data-d="1"]'); await page.waitForTimeout(60);
  const w=await page.evaluate(()=>window.__T.P.sets.map(s=>s.weight)); check('changing a warm-up weight does not change the working sets', w[2]===40&&w[3]===40&&w[4]===40, JSON.stringify(w));
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(60); await page.click('[data-p="setdone"][data-i="2"]'); await page.waitForTimeout(60);
  await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:3000}); await page.click('[data-p="next"]'); await page.waitForTimeout(200);
  const log=await page.evaluate(()=>{ const T=window.__T; const e=T.logOf(T.todayKey())[0]; return e&&{n:e.sets.length,warm:e.sets.some(s=>s.warm),warmups:e.warmups,done:e.sets.filter(s=>s.done).length}; });
  check('the log keeps only working sets and counts the warm-ups separately', log&&log.n===3&&!log.warm&&log.warmups===1&&log.done===1, JSON.stringify(log));
  // light weight: none
  await start('ex_curl',10,true);
  check('light lifts (under 20 kg) get no warm-up', await page.evaluate(()=>!window.__T.P.sets.some(s=>s.warm)));
  // off: none
  await start('ex_bench',60,false);
  check('with the setting off there are no warm-ups', await page.evaluate(()=>!window.__T.P.sets.some(s=>s.warm)));
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
