// Exercise history (v0.29): sheet from report rows, prepare "Last" tile, item editor and dashboard card;
// report summary above the check-in; PR rows use the right unit for hold exercises.
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
  await page.evaluate(()=>{ const T=window.__T; const S=T.S; S.settings.lang='ko'; S.plans={}; S.logs={}; const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const mk=(daysAgo,id,w,r,secs)=>{ const d=new Date(); d.setDate(d.getDate()-daysAgo); const k=key(d); const st=d.getTime(); const sets=[0,1,2].map(j=>({reps:r,weight:w,done:true,t:st+j*120000})); S.logs[k]=S.logs[k]||{entries:[]}; S.logs[k].entries.push({id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:st,endedAt:st+(secs||400)*1000,duration:secs||400,sets,memo:'',condition:3,rpe:7}); };
    mk(21,'ex_bench',40,8); mk(14,'ex_bench',42.5,8); mk(7,'ex_bench',45,8); mk(2,'ex_bench',45,6);
    mk(9,'ex_deadhang',0,20); mk(2,'ex_deadhang',0,28,300);
    T.S.tab='dash'; T.render(); });
  // dashboard last-workout card
  const card=await page.evaluate(()=>{ const b=document.querySelector('.lastwk'); return b?b.innerText.replace(/\s+/g,' '):''; });
  check('dashboard shows the last workout card (date, 외 1개, minutes)', /지난 운동/.test(card)&&/외 1개/.test(card)&&/12 분|12분/.test(card), card);
  // report order: summary before check-in
  await page.evaluate(()=>{ const T=window.__T; T.S.tab='report'; T.render(); });
  const order=await page.evaluate(()=>[...document.querySelectorAll('main .rpt-sec h3')].slice(0,2).map(h=>h.textContent));
  check('report shows the summary before the check-in', order[0]==='요약'&&order[1]==='오늘 체크인', JSON.stringify(order));
  // PR row for the hold exercise uses seconds
  const prTxt=await page.evaluate(()=>[...document.querySelectorAll('.it.hist')].map(x=>x.innerText.replace(/\s+/g,' ')).join(' | '));
  check('personal-record row for dead hang says 초, not 회', /데드 행[^|]*28 초/.test(prTxt), prTxt.slice(0,300));
  // open history from a report row
  await page.locator('.it.hist[data-id="ex_bench"]').first().click(); await page.locator('#histlist').waitFor({timeout:3000});
  const h=await page.evaluate(()=>({t:document.querySelector('#sheet').innerText.replace(/\s+/g,' '),rows:document.querySelectorAll('#histlist .it').length,spark:!!document.querySelector('#sheet .rpt-chart polyline')}));
  check('history lists the 4 bench sessions, newest first', h.rows===4&&/45kg × 6 × 3/.test(h.t.split('최고 기록')[1]||''), h.t.slice(0,200));
  check('history shows best e1RM and a trend line', /최고 기록 57/.test(h.t)&&h.spark, h.t.slice(0,160));
  check('history shows the change since the first session (50.7 → 54 e1RM = +7%)', /변화 \+7%/.test(h.t), h.t.slice(0,240));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  check('Escape closes the history sheet', await page.locator('#sheet').count()===0);
  // keyboard: Enter on a focused report row opens it
  await page.locator('.it.hist[data-id="ex_bench"]').first().focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  check('Enter on a focused report row opens the history', await page.locator('#histlist').count()===1);
  await page.keyboard.press('Escape');
  // mixed records: a bodyweight bench session (40 reps) and an old timed one must not become the "best" of a weighted history
  await page.evaluate(()=>{ const T=window.__T; const S=T.S; const k=Object.keys(S.logs).sort()[0]; S.logs[k].entries.push({id:'mixbw',planItemId:'pmixbw',exId:'ex_bench',mode:'sets',startedAt:1,endedAt:2,duration:300,sets:[{reps:40,weight:0,done:true}],memo:'',condition:3,rpe:7},{id:'mixt',planItemId:'pmixt',exId:'ex_bench',mode:'time',startedAt:1,endedAt:2,duration:900,sets:[],memo:'',condition:3,rpe:7}); });
  await page.evaluate(()=>{ const T=window.__T; T.S.tab='report'; T.render(); });
  await page.locator('.it.hist[data-id="ex_bench"]').first().click(); await page.locator('#histlist').waitFor({timeout:3000});
  const mix=await page.evaluate(()=>document.querySelector('#sheet').innerText.replace(/\s+/g,' '));
  check('best stays the weighted e1RM when bodyweight and timed records are mixed in', /최고 기록 57 kg e1RM/.test(mix)&&!/최고 기록 40/.test(mix), mix.slice(0,160));
  await page.keyboard.press('Escape');
  // from the prepare screen "Last" tile
  await page.evaluate(()=>{ const T=window.__T; T.S.tab='dash'; const ex=T.S.exercises.find(e=>e.id==='ex_deadhang'); const it=T.addPlanItem(T.todayKey(),ex); T.render(); T.startQueue([{date:T.todayKey(),id:it.id}]); });
  await page.locator('[data-p="history"]').waitFor({timeout:3000}); await page.click('[data-p="history"]'); await page.locator('#histlist').waitFor({timeout:3000});
  const hh=await page.evaluate(()=>document.querySelector('#sheet').innerText.replace(/\s+/g,' '));
  check('prepare "Last" tile opens the dead-hang history in seconds', /데드 행/.test(hh)&&/최고 기록 28 초/.test(hh), hh.slice(0,160));
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
