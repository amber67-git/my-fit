// Weekly review (v0.34): dashboard card on Mon–Wed for last week, change vs the week before, PRs, focus, dismiss, image save.
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  const open=async(when)=>{ const ctx=await browser.newContext({ viewport:{width:390,height:780}, deviceScaleFactor:2, reducedMotion:'reduce', acceptDownloads:true }); const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    await page.clock.install({ time: new Date(when) }); await page.clock.runFor(1);
    await page.goto('file://'+HARNESS); await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER); await page.reload(); await page.waitForTimeout(300);
    await page.evaluate(()=>{ const T=window.__T; const S=T.S; S.settings.lang='ko'; S.plans={}; S.logs={};
      const mk=(k,id,w,r)=>{ const st=new Date(k+'T09:00:00').getTime(); const sets=[0,1,2].map(j=>({reps:r,weight:w,done:true,t:st+j*120000})); S.logs[k]=S.logs[k]||{entries:[]}; S.logs[k].entries.push({id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:st,endedAt:st+600000,duration:600,sets,memo:'',condition:3,rpe:7}); };
      // week of Oct 26 (two weeks before): 1 session; week of Nov 2 (last week): 2 sessions, bench PR
      mk('2026-10-27','ex_bench',40,8);
      mk('2026-11-03','ex_bench',45,8); mk('2026-11-03','ex_bbrow',30,10); mk('2026-11-05','ex_bbsquat',60,5);
      S.tab='dash'; T.render(); });
    return {ctx,page,errs}; };
  // Tuesday Nov 10: card shows last week (Nov 2–8)
  let {ctx,page,errs}=await open('2026-11-10T10:00:00');
  const txt=await page.evaluate(()=>document.querySelector('#wkrev')?.innerText.replace(/\s+/g,' ')||'');
  check('Tuesday shows last week\'s review card', /지난주 리뷰/.test(txt), txt.slice(0,80));
  check('sessions 2 with +100% vs the week before', /운동 세션 2 \+100%/.test(txt), txt.slice(0,200));
  check('new personal record listed (bench 45kg × 8)', /벤치프레스 45kg × 8/.test(txt), txt);
  check('most-trained muscles listed', /많이 한 부위/.test(txt));
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:5000}).catch(()=>null), page.click('[data-act="wk-share"]')]);
  check('"이미지로 저장" downloads a PNG', !!dl&&/myfit-week-2026-11-02\.png/.test(dl.suggestedFilename()), dl&&dl.suggestedFilename());
  await page.click('[data-act="wk-dismiss"]'); await page.waitForTimeout(100);
  check('Close hides the card and remembers the week', await page.evaluate(()=>!document.querySelector('#wkrev')&&window.__T.S.settings.reviewDismissed==='2026-11-02'));
  check('no page errors (Tuesday)', errs.length===0, errs.join(' | '));
  await ctx.close();
  // Friday: no card
  ({ctx,page,errs}=await open('2026-11-13T10:00:00'));
  check('Friday shows no review card', await page.locator('#wkrev').count()===0);
  await ctx.close();
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
