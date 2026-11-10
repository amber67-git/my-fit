// Record-ease (v0.28): direct number input on set cards, "last time" line + copy, PR badge,
// recent exercises at the top of the picker, quick log on an empty day.
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
  // empty day: quick log button
  await page.evaluate(()=>{ const T=window.__T; T.S.settings.lang='ko'; T.S.plans={}; T.S.logs={}; T.S.tab='dash'; T.render(); });
  check('empty day shows "지금 운동 기록하기"', await page.locator('[data-act="quick-log"]').count()===1);
  // history: bench 40kg x 8 x 3 five days ago, squat two weeks ago
  await page.evaluate(()=>{ const T=window.__T; const S=T.S; const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const mk=(daysAgo,id,w,r)=>{ const d=new Date(); d.setDate(d.getDate()-daysAgo); const k=key(d); const st=d.getTime(); const sets=[0,1,2].map(j=>({reps:r,weight:w,done:true,t:st+j*120000})); S.logs[k]=S.logs[k]||{entries:[]}; S.logs[k].entries.push({id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:st,endedAt:st+400000,duration:400,sets,memo:'',condition:3,rpe:7}); };
    mk(5,'ex_bench',40,8); mk(14,'ex_bbsquat',60,5); mk(40,'ex_deadlift',80,5); T.render(); });
  // picker: recent group
  await page.click('[data-act="quick-log"]'); await page.locator('#picklist').waitFor();
  const rec=await page.evaluate(()=>[...document.querySelectorAll('#pickrecent [data-ex]')].map(b=>b.dataset.ex));
  check('picker lists recent exercises first (last 4 weeks, newest first)', JSON.stringify(rec)==='["ex_bench","ex_bbsquat"]', JSON.stringify(rec));
  check('recent group is titled 최근 운동', /최근 운동/.test(await page.evaluate(()=>document.querySelector('#picklist').innerText)));
  await page.locator('#pickrecent [data-ex="ex_bench"]').click();
  await page.locator('[data-p="start"]').waitFor({timeout:5000});
  check('quick log adds the exercise to today and opens it', await page.evaluate(()=>{ const T=window.__T; return T.planOf(T.todayKey()).some(x=>x.exId==='ex_bench')&&T.P.active; }));
  await page.click('[data-p="start"]'); await page.locator('[data-p="setdone"]').first().waitFor({timeout:5000});
  // last-time line
  const last=await page.evaluate(()=>[...document.querySelectorAll('.lastln')].map(x=>x.innerText.replace(/\s+/g,' ').trim()));
  check('each set shows last time (지난번 40kg × 8)', last.length===3&&last.every(s=>/지난번 40kg × 8/.test(s)), JSON.stringify(last));
  // direct input on weight of set 1 -> later sets follow
  const w0=page.locator('.svi[data-svk="weight"][data-i="0"]'); await w0.fill('42.5'); await page.waitForTimeout(80);
  const ws=await page.evaluate(()=>window.__T.P.sets.map(s=>s.weight)); check('typed weight 42.5 applies to set 1 and later sets', JSON.stringify(ws)==='[42.5,42.5,42.5]', JSON.stringify(ws));
  const r0=page.locator('.svi[data-svk="reps"][data-i="0"]'); await r0.fill('9'); await page.waitForTimeout(80);
  check('typed reps 9 saved', await page.evaluate(()=>window.__T.P.sets[0].reps)===9);
  // copy last time into set 2
  await page.locator('[data-p="uselast"][data-i="1"]').click(); await page.waitForTimeout(80);
  const s1=await page.evaluate(()=>window.__T.P.sets[1]); check('tapping last-time copies 40kg × 8 into set 2', s1.weight===40&&s1.reps===8, JSON.stringify(s1));
  // ± still works on an input-based stepper
  await page.click('[data-sp="weight"][data-i="2"][data-d="1"]'); await page.waitForTimeout(80);
  check('+ button still steps the weight (42.5 → 45)', await page.evaluate(()=>window.__T.P.sets[2].weight)===45);
  // set 1 = 42.5 × 9 beats 40 × 8 -> PR badge
  await page.locator('[data-p="setdone"][data-i="0"]').click(); await page.waitForTimeout(80);
  await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:5000});
  const badge=await page.evaluate(()=>document.querySelector('#prbadge')?.innerText||'');
  check('completion shows the PR badge with the set', /개인 기록 갱신/.test(badge)&&/42.5kg × 9/.test(badge), badge);
  await page.click('[data-p="next"]'); await page.waitForTimeout(200);
  // a weaker session shows no badge
  await page.evaluate(()=>{ const T=window.__T; const ex=T.S.exercises.find(e=>e.id==='ex_bench'); const it=T.addPlanItem(T.todayKey(),ex); T.startQueue([{date:T.todayKey(),id:it.id}]); });
  await page.click('[data-p="start"]'); await page.locator('[data-p="setdone"]').first().waitFor({timeout:5000});
  await page.locator('.svi[data-svk="weight"][data-i="0"]').fill('30'); await page.locator('[data-p="setdone"][data-i="0"]').click(); await page.waitForTimeout(80);
  await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:5000});
  check('no PR badge when the record is not beaten', await page.locator('#prbadge').count()===0);
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
