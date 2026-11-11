// Goals (v0.37): set from the exercise history sheet, validated, shown on the dashboard with progress, removable.
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
  await page.clock.install({ time: new Date('2026-11-11T10:00:00') }); await page.clock.runFor(1);
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  await page.evaluate(()=>{ const T=window.__T; const S=T.S; S.settings.lang='ko'; S.plans={}; S.logs={}; S.settings.goals=[];
    const mk=(k,id,w,r)=>{ S.logs[k]=S.logs[k]||{entries:[]}; S.logs[k].entries.push({id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:1,endedAt:2,duration:400,sets:[0,1,2].map(()=>({reps:r,weight:w,done:true})),memo:'',condition:3,rpe:7}); };
    mk('2026-10-20','ex_bench',60,5); mk('2026-11-03','ex_bench',70,5); mk('2026-11-03','ex_deadhang',0,20);
    S.tab='report'; T.render(); });
  // open bench history from the report
  await page.locator('.it.hist[data-id="ex_bench"]').first().click(); await page.locator('#goal-new').waitFor({timeout:3000});
  await page.click('#goal-new'); await page.locator('#goal-v').waitFor();
  const pre=await page.evaluate(()=>({v:document.querySelector('#goal-v').value,now:document.querySelector('#goalbox').innerText}));
  check('the goal form suggests a target above the best (70 kg) and shows the best', +pre.v>70&&/지금까지 최고: 70/.test(pre.now), JSON.stringify(pre));
  await page.fill('#goal-v','65'); await page.click('#goal-save'); await page.waitForTimeout(60);
  check('a target at or below the current best is refused', /지금 최고\(70\)보다 높게/.test(await page.evaluate(()=>document.querySelector('#goal-err').textContent)));
  await page.fill('#goal-v','80'); await page.click('[data-gw="8"]'); await page.click('#goal-save'); await page.waitForTimeout(100);
  const g=await page.evaluate(()=>window.__T.S.settings.goals[0]);
  check('saving stores kind w, target 80, start 70, deadline 8 weeks out', g&&g.kind==='w'&&g.target===80&&g.start===70&&g.by==='2027-01-06', JSON.stringify(g));
  check('the history sheet now shows the goal with a remove button', await page.evaluate(()=>/목표/.test(document.querySelector('#goalbox').innerText)&&!!document.querySelector('#goal-del')));
  await page.keyboard.press('Escape');
  // dashboard card
  await page.evaluate(()=>{ const T=window.__T; T.S.tab='dash'; T.render(); });
  let card=await page.evaluate(()=>document.querySelector('#goalscard')?.innerText.replace(/\s+/g,' ')||'');
  check('dashboard shows the goal: 70 / 80 kg · 0% · 56 days left', /벤치프레스/.test(card)&&/70 \/ 80 kg · 0%/.test(card)&&/56일 남음/.test(card), card);
  // progress after a new best of 75
  await page.evaluate(()=>{ const T=window.__T; const S=T.S; S.logs['2026-11-11']={entries:[{id:'n1',planItemId:'pn1',exId:'ex_bench',mode:'sets',startedAt:1,endedAt:2,duration:400,sets:[{reps:3,weight:75,done:true}],memo:'',condition:3,rpe:8}]}; T.render(); });
  card=await page.evaluate(()=>document.querySelector('#goalscard')?.innerText.replace(/\s+/g,' ')||'');
  check('a new best of 75 kg shows 50 %', /75 \/ 80 kg · 50%/.test(card), card);
  await page.evaluate(()=>{ const T=window.__T; T.S.logs['2026-11-11'].entries[0].sets[0].weight=80; T.render(); });
  card=await page.evaluate(()=>document.querySelector('#goalscard')?.innerText.replace(/\s+/g,' ')||'');
  check('reaching 80 kg shows 달성 and 100 %', /달성/.test(card)&&/100%/.test(card), card);
  // a reps goal for the dead hang (seconds)
  await page.evaluate(()=>{ const T=window.__T; T.S.tab='report'; T.render(); });
  await page.locator('.it.hist[data-id="ex_deadhang"]').first().click(); await page.locator('#goal-new').waitFor({timeout:3000}); await page.click('#goal-new');
  check('a hold exercise asks for seconds', /한 세트 목표 \(초\)/.test(await page.evaluate(()=>document.querySelector('#goalbox').innerText)));
  await page.fill('#goal-v','30'); await page.click('#goal-save'); await page.waitForTimeout(80);
  check('the dead-hang goal is kind r with a 20 s start', await page.evaluate(()=>{ const g=window.__T.S.settings.goals.find(x=>x.exId==='ex_deadhang'); return g&&g.kind==='r'&&g.start===20&&g.target===30; }));
  // remove
  await page.click('#goal-del'); await page.waitForTimeout(60);
  check('removing the goal deletes only that goal', await page.evaluate(()=>window.__T.S.settings.goals.length===1&&window.__T.S.settings.goals[0].exId==='ex_bench'));
  // switching kg -> lb converts weight goals with the logs (a 80 kg goal must not read 80 lb and look reached)
  const lb=await page.evaluate(()=>{ const T=window.__T; const S=T.S; S.settings.goals=[{id:'gx',exId:'ex_bench',kind:'w',target:80,start:70,by:'2027-01-01',made:'2026-11-11'},{id:'gy',exId:'ex_deadhang',kind:'r',target:30,start:20,by:'2027-01-01',made:'2026-11-11'}]; S.tab='settings'; S.sub=null; T.render(); document.querySelector('[data-unit="lb"]').click(); const g=S.settings.goals; const out={w:[g[0].target,g[0].start],r:[g[1].target,g[1].start]}; S.tab='dash'; T.render(); out.card=document.querySelector('#goalscard')?.innerText.replace(/\s+/g,' ')||''; document.querySelector('#tabs [data-tab="settings"]')?.click(); S.tab='settings'; T.render(); document.querySelector('[data-unit="kg"]').click(); out.back=[S.settings.goals[0].target,S.settings.goals[0].start]; return out; });
  check('kg → lb converts the weight goal (80 → 176.5, start 70 → 154.5) and leaves the seconds goal alone', lb.w[0]===176.5&&lb.w[1]===154.5&&lb.r[0]===30&&lb.r[1]===20, JSON.stringify(lb));
  check('after the switch the dashboard card reads the target in lb (/ 176.5 lb), never 80 lb', /\/ 176\.5 lb/.test(lb.card)&&!/\/ 80 lb/.test(lb.card), lb.card);
  check('switching back gives 80 / 70 kg again', lb.back[0]===80&&lb.back[1]===70, JSON.stringify(lb.back));
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
