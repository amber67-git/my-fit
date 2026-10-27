const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs=[]; const log=(m)=>console.log(m);
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message)); page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-10-19T10:00:00') }); await page.clock.runFor(1);
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  // smart mode on, with goal 3
  await page.click('[data-tab="week"]'); await page.waitForTimeout(100);
  const hasSmart = await page.$('[data-act="smart-toggle"], #smart-toggle, [data-mode="smart"]');
  log('smart toggle present '+!!hasSmart);
  const html0 = await page.evaluate(()=>document.querySelector('main').innerText.slice(0,300));
  log('week text: '+html0.replace(/\n/g,' | '));
  // apply via smart if available
  await page.evaluate(()=>{ const {S,persist,render}=__T; S.settings.mode='smart'; persist.settings(); render(); });
  await page.waitForTimeout(200);
  const applyBtn = await page.$('[data-act="smart-apply"], [data-act="apply-smart"]');
  log('smart apply btn '+!!applyBtn);
  if(applyBtn){ await applyBtn.click(); await page.waitForTimeout(200); }
  const plans1 = await page.evaluate(()=>Object.entries(__T.S.plans).map(([k,v])=>k+':'+v.items.length).join(','));
  log('smart plans '+plans1);
  // mark today's first item done via editor if today has items; else create one
  let today = await page.evaluate(()=>__T.todayKey());
  let n = await page.evaluate(()=>__T.planOf(__T.todayKey()).length);
  if(!n){ await page.evaluate(()=>{ __T.addPlanItem(__T.todayKey(), __T.S.exercises[0]); __T.render(); }); n=1; }
  const item0 = await page.evaluate(()=>__T.planOf(__T.todayKey())[0].id);
  await page.evaluate((id)=>__T.openItemEditor(__T.todayKey(), id), item0); await page.waitForTimeout(100);
  // numeric input
  const hasNum = await page.$('#sv-weight, #sv-minutes, #sv-reps');
  log('numeric input present '+!!hasNum);
  if(hasNum){ await page.evaluate(()=>{ const i=document.querySelector('#sv-weight')||document.querySelector('#sv-minutes')||document.querySelector('#sv-reps'); i.value='33'; i.dispatchEvent(new Event('input',{bubbles:true})); }); }
  await page.click('[data-act="mark-done"]'); await page.waitForTimeout(150);
  log('after mark-done status '+await page.evaluate((id)=>{ const it=__T.planOf(__T.todayKey()).find(x=>x.id===id); return it.status+' w='+it.weight+' m='+it.minutes+' r='+it.reps+' log='+(__T.logOf(__T.todayKey()).filter(e=>e.planItemId===id).length); }, item0));
  // smart re-apply should keep done item
  if(applyBtn){ await page.evaluate(()=>__T.applySmart()); await page.waitForTimeout(100);
    log('after re-apply keeps done '+await page.evaluate((id)=>!!__T.planOf(__T.todayKey()).find(x=>x.id===id&&x.status==='done'), item0)); }
  // add a planned item and start it, then reload → resume prompt
  await page.evaluate(()=>{ const ex=__T.S.exercises.find(e=>e.mode==='sets'); __T.addPlanItem(__T.todayKey(), ex); __T.render(); });
  await page.waitForTimeout(100);
  const pid = await page.evaluate(()=>__T.planOf(__T.todayKey()).filter(x=>x.status==='planned'&&x.mode==='sets').slice(-1)[0].id);
  await page.evaluate((id)=>__T.startQueue([{date:__T.todayKey(),id}]), pid); await page.waitForTimeout(150);
  log('stage before start '+await page.evaluate(()=>__T.P.stage+' '+__T.P.active+' '+JSON.stringify(__T.P.queue)));
  await page.screenshot({ path: 'r11-prepare.png' });
  await page.click('[data-p="start"]'); await page.waitForTimeout(150);
  log('stage after start '+await page.evaluate(()=>__T.P.stage+' sets='+JSON.stringify(__T.P.sets)));
  await page.screenshot({ path: 'r11-perform0.png' });
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(100);
  log('perform saved '+await page.evaluate(()=>!!localStorage.getItem('wwt.perform')));
  await page.reload(); await page.waitForTimeout(400);
  log('resume sheet '+!!(await page.$('#rs-yes')));
  await page.screenshot({ path: 'r11-resume.png' });
  await page.click('#rs-yes'); await page.waitForTimeout(200);
  log('resumed sets '+await page.evaluate(()=>__T.P.active+' '+__T.P.stage+' '+JSON.stringify(__T.P.sets.map(s=>s.done))));
  await page.screenshot({ path: 'r11-perform.png' });
  // uncheck all sets and finish → no sets prompt
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(100);
  await page.click('[data-p="finish"]'); await page.waitForTimeout(150);
  log('no-sets prompt '+!!(await page.$('#ns-skip')));
  await page.screenshot({ path: 'r11-nosets.png' });
  await page.click('#ns-skip'); await page.waitForTimeout(200);
  log('after skip active '+await page.evaluate(()=>__T.P.active)+' status '+await page.evaluate((id)=>__T.planOf(__T.todayKey()).find(x=>x.id===id).status, pid));
  log('perform cleared '+await page.evaluate(()=>!localStorage.getItem('wwt.perform')));
  // dark mode screenshot of dashboard
  await page.emulateMedia({ colorScheme: 'dark' }); await page.click('[data-tab="dash"]'); await page.waitForTimeout(150);
  await page.screenshot({ path: 'r11-dark.png' });
  await page.emulateMedia({ colorScheme: 'light' });
  // weeklyGoal cap
  await page.click('[data-tab="settings"]'); await page.waitForTimeout(100);
  for(let i=0;i<9;i++){ const b=await page.$('[data-set="weeklyGoal"][data-d="1"]'); if(b)await b.click(); }
  log('weeklyGoal '+await page.evaluate(()=>__T.S.settings.weeklyGoal));
  // packExercises size
  log('pack size '+await page.evaluate(()=>JSON.stringify(__T.packExercises()).length)+' vs full '+await page.evaluate(()=>JSON.stringify({items:__T.S.exercises}).length));
  log('unpack roundtrip '+await page.evaluate(()=>{ const {S,unpackExercises,packExercises}=__T; S.exercises[3].nameEn='Zed'; const u=unpackExercises(packExercises()); return u.length===S.exercises.length && u[3].nameEn==='Zed'; }));
  log('errors '+JSON.stringify(errs));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
