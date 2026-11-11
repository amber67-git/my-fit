// Tempo hint and muscles used today (v0.36) on the get-ready screen.
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
  const prep=async(id,withLog)=>{ await page.evaluate(([id,withLog])=>{ const T=window.__T; const S=T.S; T.P.active=false; document.querySelector('#perf')?.remove(); S.settings.lang='ko'; S.plans={}; S.logs={}; const k=T.todayKey();
      if(withLog){ S.logs[k]={entries:[{id:'e1',planItemId:'p1',exId:'ex_bench',mode:'sets',startedAt:1,endedAt:2,duration:400,sets:[0,1,2].map(()=>({reps:8,weight:40,done:true})),memo:'',condition:3,rpe:7}]}; }
      const ex=S.exercises.find(e=>e.id===id); const it=T.addPlanItem(k,ex); S.tab='dash'; T.render(); T.startQueue([{date:k,id:it.id}]); },[id,withLog]); await page.locator('[data-p="start"]').waitFor({timeout:3000}); return page.evaluate(()=>({tempo:document.querySelector('#tempo')?.innerText||'',used:document.querySelector('#usedtoday')?.innerText||'',warn:!!document.querySelector('#usedtoday.warn')})); };
  let r=await prep('ex_incline',false);
  check('a strength exercise shows the tempo hint', /템포: 2초 내리고/.test(r.tempo), r.tempo);
  check('nothing done today: no used-today line', r.used==='', r.used);
  r=await prep('ex_incline',true);
  check('after bench press, incline press lists chest already worked today with sets', /오늘 이미 한 부위/.test(r.used)&&/3세트/.test(r.used), r.used);
  check('same main muscle as earlier today is highlighted', r.warn&&/같은 주동근/.test(r.used), r.used);
  r=await prep('ex_bbsquat',true);
  check('a leg exercise after bench lists the chest but is not highlighted', /오늘 이미 한 부위/.test(r.used)&&!r.warn, r.used);
  r=await prep('ex_deadhang',false);
  check('a hold exercise gets the breathing hint', /숨 참지 않기/.test(r.tempo), r.tempo);
  r=await prep('ex_hamstring',false);
  check('a stretch shows no tempo hint', r.tempo==='', r.tempo);
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
