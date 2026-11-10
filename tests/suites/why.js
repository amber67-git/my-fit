// Target explanation (v0.32): Smart mode stores why each target was chosen and the get-ready screen shows it.
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
  await page.clock.install({ time: new Date('2026-11-10T10:00:00') }); await page.clock.runFor(1);
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  const res=await page.evaluate(()=>{ const T=window.__T; const S=T.S; S.settings.lang='ko'; S.settings.mode='smart'; S.settings.weeklyGoal=3; S.settings.smartSplit='full'; S.plans={}; S.logs={};
    const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const mk=(daysAgo,id,w,reps)=>{ const d=new Date(); d.setDate(d.getDate()-daysAgo); const k=key(d); const st=d.getTime(); const ex=S.exercises.find(e=>e.id===id); const sets=[0,1,2].map(j=>({reps:reps,weight:w,done:true,t:st+j*120000})); S.logs[k]=S.logs[k]||{entries:[]}; S.logs[k].entries.push({id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:st,endedAt:st+400000,duration:400,sets,memo:'',condition:3,rpe:7}); return ex; };
    // full-body routine uses goblet squat, push-up, dumbbell row, dumbbell press ...
    const g=mk(6,'ex_goblet',12,99); const r=mk(6,'ex_dbrow',14,1);
    S.tab='week'; T.render(); T.applySmart(); const items=[]; Object.keys(S.plans).forEach(k=>T.planOf(k).forEach(x=>items.push(x)));
    const gi=items.find(x=>x.exId==='ex_goblet'), ri=items.find(x=>x.exId==='ex_dbrow');
    return {goblet:gi&&{w:gi.weight,why:gi.why},row:ri&&{w:ri.weight,why:ri.why},today:T.todayKey()}; });
  check('hitting every rep raises the weight and records why (up_w)', res.goblet&&res.goblet.why&&res.goblet.why.k==='up_w'&&res.goblet.w>12, JSON.stringify(res.goblet));
  check('falling short keeps the weight and records why (hold)', res.row&&res.row.why&&res.row.why.k==='hold'&&res.row.w===14, JSON.stringify(res.row));
  // show it on the get-ready screen
  await page.evaluate(()=>{ const T=window.__T; const S=T.S; let date=null,id=null; Object.keys(S.plans).sort().forEach(k=>T.planOf(k).forEach(x=>{ if(!id&&x.exId==='ex_goblet'){date=k;id=x.id;} })); T.startQueue([{date,id}]); });
  await page.locator('[data-p="start"]').waitFor({timeout:3000});
  const why=await page.evaluate(()=>document.querySelector('#why')?.innerText||'');
  check('get-ready screen explains the target in Korean', /지난번 모든 세트에서 99회를 채워서 오늘은 \+2\.5kg예요/.test(why), why);
  // editing the target removes the explanation
  await page.click('[data-p="edit-target"]'); await page.locator('[data-act="save-item"]').waitFor({timeout:3000}); await page.click('[data-act="save-item"]'); await page.waitForTimeout(200);
  check('saving a manual target removes the explanation', await page.locator('#why').count()===0);
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
