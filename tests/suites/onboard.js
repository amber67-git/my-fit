// First-run onboarding (v0.30) and the theme setting.
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  const fresh=async(seen)=>{ const ctx=await browser.newContext({ viewport:{width:390,height:780}, deviceScaleFactor:2, reducedMotion:'reduce', colorScheme:'light' }); const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    /* a fixed Wednesday: onboarding plans only this week's remaining days, so a weekend run would leave nothing to check */
    await page.clock.install({ time: new Date('2026-11-11T10:00:00') }); await page.clock.runFor(1);
    /* a new context starts with empty storage; only seed the seen version (never clear on load: a reload must keep the data) */
    await page.addInitScript(([s,v])=>{ if(s&&!localStorage.getItem('wwt.seenVersion'))localStorage.setItem('wwt.seenVersion',v); },[seen,APP_VER]);
    await page.goto('file://'+HARNESS); return {ctx,page,errs}; };
  // 1. brand-new user: onboarding appears
  let {ctx,page,errs}=await fresh(false);
  await page.locator('#ob').waitFor({timeout:5000});
  check('first run shows the onboarding sheet', await page.locator('#ob [data-obd]').count()===5);
  await page.locator('#ob [data-obd="4"]').click(); await page.locator('#ob [data-ob="next"]').click();
  const rts=await page.evaluate(()=>[...document.querySelectorAll('#ob [data-obr]')].map(b=>b.dataset.obr));
  check('step 2 lists the preset routines plus "plan it myself"', rts.length===7&&rts.includes('rt_ul')&&rts.includes('none'), JSON.stringify(rts));
  const firstDays=await page.evaluate(()=>document.querySelector('#ob [data-obr]').innerText);
  check('routines matching the chosen 4 days come first and show their days', /주 4일|4 days/.test(firstDays), firstDays.replace(/\s+/g,' ').slice(0,80));
  await page.locator('#ob [data-obr="rt_ul"]').click();
  const st=await page.evaluate(()=>{ const T=window.__T; let n=0; Object.keys(T.S.plans).forEach(k=>n+=T.planOf(k).length); return {goal:T.S.settings.weeklyGoal,items:n,step3:!!document.querySelector('#ob [data-ob="week"]')}; });
  check('picking Upper / Lower sets the weekly goal to 4 and fills the week', st.goal===4&&st.items>0&&st.step3, JSON.stringify(st));
  const past=await page.evaluate(()=>{ const T=window.__T; const tk=T.todayKey(); return Object.keys(T.S.plans).filter(k=>k<tk&&T.planOf(k).length).length; });
  check('days already past this week are left empty', past===0, past);
  await page.locator('#ob [data-ob="week"]').click(); await page.waitForTimeout(150);
  check('"See my week" closes the sheet and opens the weekly tab', await page.evaluate(()=>!document.querySelector('#sheet')&&window.__T.S.tab==='week'));
  // reload: no onboarding again (seenVersion now set)
  await page.reload(); await page.waitForTimeout(1800);
  { const dbg=await page.evaluate(()=>({ob:!!document.querySelector('#ob'),seen:localStorage.getItem('wwt.seenVersion'),plans:Object.keys(window.__T.S.plans).filter(k=>window.__T.planOf(k).length).length})); check('onboarding does not come back after the first run', !dbg.ob, JSON.stringify(dbg)); }
  check('no page errors (new user)', errs.length===0, errs.join(' | '));
  await ctx.close();
  // 2. skip works and leaves the app empty
  ({ctx,page,errs}=await fresh(false)); await page.locator('#ob').waitFor({timeout:5000});
  await page.locator('#ob [data-ob="skip"]').click(); await page.waitForTimeout(100);
  check('Skip closes onboarding without planning anything', await page.evaluate(()=>{ const T=window.__T; return !document.querySelector('#sheet')&&!Object.keys(T.S.plans).some(k=>T.planOf(k).length); }));
  // theme setting
  await page.evaluate(()=>{ const T=window.__T; T.S.tab='settings'; T.S.sub=null; T.render(); });
  await page.locator('[data-themeset="dark"]').click(); await page.waitForTimeout(80);
  const dark=await page.evaluate(()=>({attr:document.documentElement.dataset.theme,bg:getComputedStyle(document.body).backgroundColor,saved:window.__T.S.settings.theme}));
  check('Theme → Dark sets data-theme=dark and a dark background', dark.attr==='dark'&&dark.saved==='dark'&&/rgb\((1[0-9]|2[0-9]), ?(1[0-9]|2[0-9])/.test(dark.bg), JSON.stringify(dark));
  await page.locator('[data-themeset="auto"]').click(); await page.waitForTimeout(80);
  check('Theme → Auto removes the attribute', await page.evaluate(()=>!document.documentElement.hasAttribute('data-theme')));
  check('no page errors (skip + theme)', errs.length===0, errs.join(' | '));
  await ctx.close();
  // 3. existing user who updates: no onboarding
  ({ctx,page,errs}=await fresh(true)); await page.waitForTimeout(1800);
  check('a returning user (seen version set) never sees onboarding', await page.locator('#ob').count()===0);
  await ctx.close();
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
