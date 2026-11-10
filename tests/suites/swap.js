// Swap (v0.31): the get-ready screen lists exercises that share primary muscles and replaces the plan item.
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
  await page.evaluate(()=>{ const T=window.__T; T.S.settings.lang='ko'; T.S.plans={}; T.S.logs={}; const ex=T.S.exercises.find(e=>e.id==='ex_legpress'); const it=T.addPlanItem(T.todayKey(),ex); T.S.tab='dash'; T.render(); T.startQueue([{date:T.todayKey(),id:it.id}]); });
  await page.locator('[data-p="swap"]').waitFor({timeout:3000}); await page.click('[data-p="swap"]'); await page.locator('#swaplist').waitFor({timeout:3000});
  const c=await page.evaluate(()=>{ const T=window.__T; const ids=[...document.querySelectorAll('#swaplist [data-swap]')].map(b=>b.dataset.swap); const base=new Set(T.targetsOf(T.S.exercises.find(x=>x.id==='ex_legpress')).p); return {ids,allShare:ids.every(id=>{ const e=T.S.exercises.find(x=>x.id===id); return e&&e.mode==='sets'&&T.targetsOf(e).p.some(m=>base.has(m)); }),n:ids.length}; });
  check('swap lists up to 12 set-based alternatives that share a primary muscle with leg press', c.n>0&&c.n<=12&&c.allShare, JSON.stringify(c.ids));
  check('leg press alternatives include a squat', c.ids.some(id=>/squat|goblet/.test(id)), JSON.stringify(c.ids.slice(0,6)));
  check('the exercise itself is not offered', !c.ids.includes('ex_legpress'));
  const pick=c.ids.find(id=>/goblet|squat/.test(id));
  await page.locator(`#swaplist [data-swap="${pick}"]`).click(); await page.waitForTimeout(150);
  const after=await page.evaluate((pick)=>{ const T=window.__T; const it=T.planOf(T.todayKey())[0]; const sn=T.P.queue[0].snap; const ex=T.S.exercises.find(e=>e.id===pick); const same=o=>o&&o.exId===pick&&o.sets===ex.sets&&o.reps===ex.reps&&o.weight===ex.weight; return {plan:same(it),snap:same(sn),title:document.querySelector('#perf h1')?.textContent||'',want:T.exName(ex)}; },pick);
  check('picking an alternative sets the plan item and the queued snapshot to its default targets', after.plan&&after.snap, JSON.stringify(after));
  check('the get-ready screen shows the new exercise name', after.title===after.want, after.title+' vs '+after.want);
  // local save failure (no account): the toast says the save failed
  await page.evaluate(()=>{ const T=window.__T; T.P.active=false; document.querySelector('#perf')?.remove(); const ex=T.S.exercises.find(e=>e.id==='ex_legpress'); const it=T.addPlanItem(T.todayKey(),ex); T.startQueue([{date:T.todayKey(),id:it.id}]); });
  await page.locator('[data-p="swap"]').waitFor({timeout:3000}); await page.click('[data-p="swap"]'); await page.locator('#swaplist').waitFor({timeout:3000});
  await page.evaluate(()=>document.querySelectorAll('.toast').forEach(x=>x.remove()));
  await page.evaluate(()=>{ window.__origSet=Storage.prototype.setItem; Storage.prototype.setItem=function(){ throw new Error('QuotaExceeded'); }; });
  await page.locator('#swaplist [data-swap]').first().click(); await page.waitForTimeout(100);
  const toastTxt=await page.evaluate(()=>{ Storage.prototype.setItem=window.__origSet; return [...document.querySelectorAll('.toast')].map(x=>x.textContent).join(' | '); });
  check('a failed local save shows 저장 실패 instead of the success message', /저장 실패/.test(toastTxt)&&!/바꿨어요/.test(toastTxt), toastTxt);
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
