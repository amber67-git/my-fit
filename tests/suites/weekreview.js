// Weekly review (v0.34): dashboard card Mon–Wed (app days start at 4 am) for last week, change vs the week before,
// PRs (weighted and bodyweight tracked separately), focus, Close survives a reload, PNG has drawn content.
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  const seed=async(page,extra)=>page.evaluate((extra)=>{ const T=window.__T; const S=T.S; S.settings.lang='ko'; S.plans={}; S.logs={};
      const mk=(k,id,w,r)=>{ const st=new Date(k+'T09:00:00').getTime(); const sets=[0,1,2].map(j=>({reps:r,weight:w,done:true,t:st+j*120000})); S.logs[k]=S.logs[k]||{entries:[]}; S.logs[k].entries.push({id:'e'+k+id+w,planItemId:'p'+k+id+w,exId:id,mode:'sets',startedAt:st,endedAt:st+600000,duration:600,sets,memo:'',condition:3,rpe:7}); };
      mk('2026-10-27','ex_bench',40,8);
      mk('2026-11-03','ex_bench',45,8); mk('2026-11-03','ex_bbrow',30,10); mk('2026-11-05','ex_bbsquat',60,5);
      if(extra){ /* earlier: weighted dips 10kg×4 and bodyweight dips 30; last week: 10kg×5 and bodyweight 20 → weighted PR only */ mk('2026-10-28','ex_dips',10,4); mk('2026-10-28','ex_dips',0,30); mk('2026-11-06','ex_dips',10,5); mk('2026-11-06','ex_dips',0,20); }
      T.persist.plan&&0; S.tab='dash'; T.render(); },extra);
  const open=async(when,opts)=>{ const ctx=await browser.newContext({ viewport:{width:390,height:780}, deviceScaleFactor:2, reducedMotion:'reduce', acceptDownloads:true }); const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    await page.clock.install({ time: new Date(when) }); await page.clock.runFor(1);
    await page.goto('file://'+HARNESS); await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER); await page.reload(); await page.waitForTimeout(300);
    await seed(page,opts&&opts.extra); return {ctx,page,errs}; };
  const hasCard=async(when)=>{ const {ctx,page}=await open(when); const n=await page.locator('#wkrev').count(); await ctx.close(); return n===1; };
  // Tuesday Nov 10
  let {ctx,page,errs}=await open('2026-11-10T10:00:00',{extra:true});
  const txt=await page.evaluate(()=>document.querySelector('#wkrev')?.innerText.replace(/\s+/g,' ')||'');
  check('Tuesday shows last week\'s review card', /지난주 리뷰/.test(txt), txt.slice(0,80));
  check('sessions 3 with +50% vs the week before', /운동 세션 3 \+50%/.test(txt), txt.slice(0,200));
  check('new personal record listed (bench 45kg × 8)', /벤치프레스 45kg × 8/.test(txt), txt);
  check('weighted PR is found even when a bodyweight set of the same exercise has more reps (dips 10kg × 5)', /10kg × 5/.test(txt)&&!/딥스[^·]*20 회/.test(txt), txt);
  check('most-trained muscles listed', /많이 한 부위/.test(txt));
  // PNG has drawn content
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:5000}).catch(()=>null), page.click('[data-act="wk-share"]')]);
  check('"이미지로 저장" downloads a PNG named after the week', !!dl&&/myfit-week-2026-11-02\.png/.test(dl.suggestedFilename()), dl&&dl.suggestedFilename());
  if(dl){ const p=await dl.path(); const b64=fs.readFileSync(p).toString('base64');
    const ink=await page.evaluate(async(b64)=>{ const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode(); const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const g=c.getContext('2d'); g.drawImage(img,0,0); const bg=g.getImageData(1000,1000,1,1).data; const d=g.getImageData(70,300,300,90).data; let n=0; for(let i=0;i<d.length;i+=4){ if(Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>120)n++; } return {w:img.width,h:img.height,n}; },b64);
    check('the PNG is 1080×1080 with text drawn where the session count goes', ink.w===1080&&ink.h===1080&&ink.n>200, JSON.stringify(ink)); }
  // Close, then reload: still hidden
  await page.click('[data-act="wk-dismiss"]'); await page.waitForTimeout(100);
  check('Close hides the card and stores the week', await page.evaluate(()=>!document.querySelector('#wkrev')&&window.__T.S.settings.reviewDismissed==='2026-11-02'));
  await page.reload(); await page.waitForTimeout(400); await page.evaluate(()=>{ const T=window.__T; T.S.tab='dash'; T.render(); });
  check('after a reload the card stays closed for that week', await page.evaluate(()=>window.__T.S.settings.reviewDismissed==='2026-11-02'&&!document.querySelector('#wkrev')));
  check('no page errors (Tuesday)', errs.length===0, errs.join(' | '));
  await ctx.close();
  // day boundaries (app days start at 4 am)
  check('Monday 03:59 still counts as Sunday: no card', !(await hasCard('2026-11-09T03:59:00')));
  check('Monday 04:00: card shows', await hasCard('2026-11-09T04:00:00'));
  check('Thursday 00:00 still counts as Wednesday: card shows', await hasCard('2026-11-12T00:00:00'));
  check('Thursday 04:00: no card', !(await hasCard('2026-11-12T04:00:00')));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
