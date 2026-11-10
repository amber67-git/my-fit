// Hold-second sets: a dead hang shows seconds instead of reps, the set card has a stopwatch,
// stopping it saves the seconds as that set and starts the rest timer; step cards show mistakes/tips.
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
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message)); page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-10T10:00:00') }); await page.clock.runFor(1);
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  const seeded=await page.evaluate(()=>{ const T=window.__T; T.S.settings.lang='ko'; const ex=T.S.exercises.find(e=>e.id==='ex_deadhang'); if(!ex)return null; const it=T.addPlanItem(T.todayKey(),ex); T.S.tab='dash'; T.render(); return {hold:!!ex.hold,reps:it.reps,sets:it.sets,rest:it.rest,minutes:ex.minutes}; });
  check('dead hang exists and is a hold exercise', !!(seeded&&seeded.hold), JSON.stringify(seeded));
  check('dead hang default 3 × 20 s, rest 90', seeded&&seeded.reps===20&&seeded.sets===3&&seeded.rest===90);
  check('estimated minutes use seconds, not reps×3', seeded&&seeded.minutes===Math.max(1,Math.round(3*(20+90)/60)), seeded&&seeded.minutes);
  const dashTxt=await page.evaluate(()=>document.querySelector('main').innerText);
  check('dashboard shows the hold target as 20초 × 3', /20초\s*×\s*3/.test(dashTxt.replace(/ /g,' ')));
  // freeze the clock so the stopwatch advances only through runFor (CI machines are slow between clicks)
  await page.clock.pauseAt(new Date('2026-11-10T10:00:05'));
  await page.click('[data-act="start-today"]'); await page.locator('[data-p="start"]').waitFor({timeout:5000});
  const prep=await page.evaluate(()=>({t:document.querySelector('#perf').innerText.replace(/ /g,' '),mis:document.querySelectorAll('#perf .smis').length}));
  check('prepare shows target 20초 × 3', /20초 × 3/.test(prep.t));
  check('step cards show the common-mistake line', prep.mis>=1, prep.mis);
  check('mistake line is labelled 흔한 실수 for a strength exercise', /흔한 실수:/.test(prep.t));
  await page.click('[data-p="start"]'); await page.locator('[data-p="hold"]').first().waitFor({timeout:5000});
  const card=await page.evaluate(()=>({unit:document.querySelector('.setcard .stp small')?.textContent.trim(),holds:document.querySelectorAll('[data-p="hold"]').length,weights:document.querySelectorAll('[data-sp="weight"]').length,label:document.querySelector('[data-p="hold"]').textContent.trim()}));
  check('set card unit is 초', card.unit==='초', card.unit);
  check('one stopwatch button per set, no weight stepper', card.holds===3&&card.weights===0, JSON.stringify(card));
  check('stopwatch button says 버티기 시작', /버티기 시작/.test(card.label), card.label);
  await page.locator('[data-p="hold"][data-i="0"]').click(); await page.clock.runFor(12400);
  const running=await page.evaluate(()=>document.querySelector('[data-p="hold"][data-i="0"]').textContent.trim());
  check('running stopwatch shows elapsed time', /00:12/.test(running), running);
  await page.locator('[data-p="hold"][data-i="0"]').click(); await page.waitForTimeout(100);
  const after=await page.evaluate(()=>{ const P=window.__T.P; return {reps:P.sets[0].reps,done:P.sets[0].done,rest:P.restRemaining,restShown:!document.querySelector('#restbox').hidden,hold:!!P.hold,next:document.querySelector('[data-p="hold"][data-i="1"]').textContent.trim()}; });
  check('stopping saves 12 seconds as set 1 and marks it done', after.reps===12&&after.done===true, JSON.stringify(after));
  check('rest timer starts after the hold', after.rest>0&&after.restShown, JSON.stringify(after));
  check('no stopwatch left running; next set still offers to start', !after.hold&&/버티기 시작/.test(after.next));
  // manual entry still works: − on set 2 lowers the seconds
  await page.locator('[data-sp="reps"][data-i="1"][data-d="-1"]').click(); const s2=await page.evaluate(()=>window.__T.P.sets[1].reps); check('− button still edits the seconds by hand', s2===19, s2);
  await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:5000});
  const done=await page.evaluate(()=>document.querySelector('#perf').innerText.replace(/ /g,' '));
  check('completion summary shows seconds (12초 × 1)', /12초 × 1/.test(done), done.slice(0,200));
  // tip label for a stretch
  await page.locator('[data-p="next"]').first().click(); await page.waitForTimeout(200);
  const tip=await page.evaluate(()=>{ const T=window.__T; const ex=T.S.exercises.find(e=>e.id==='ex_hamstring'); const it=T.addPlanItem(T.todayKey(),ex); T.render(); return !!it&&!T.P.active; });
  check('stretch added for the tip check', tip);
  await page.evaluate(()=>{ const T=window.__T; const items=T.planOf(T.todayKey()); T.startQueue(items.filter(x=>x.exId==='ex_hamstring').map(x=>({date:T.todayKey(),id:x.id}))); });
  await page.locator('[data-p="start"]').waitFor({timeout:5000});
  const tipTxt=await page.evaluate(()=>document.querySelector('#perf').innerText);
  check('stretch step cards label the hint 팁', /팁:/.test(tipTxt)&&!/흔한 실수:/.test(tipTxt));
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
