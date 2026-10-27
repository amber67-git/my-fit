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
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER); await page.reload(); await page.waitForTimeout(300);
  await page.click('[data-tab="week"]'); await page.click('[data-act="open-routines"]'); await page.waitForTimeout(100); await page.click('[data-rt="rt_ppl"]'); await page.waitForTimeout(100); await page.click('#rt-apply'); await page.waitForTimeout(200);
  await page.click('[data-tab="dash"]'); await page.waitForTimeout(150);
  await page.click('.card .ic'); await page.waitForTimeout(200); log('icon tap: no sheet '+!(await page.$('#sheet'))+', acts as card tap (perform) '+await page.evaluate(()=>__T.P.active));
  if(await page.evaluate(()=>__T.P.active)){ await page.click('[data-p="exit"]'); await page.waitForTimeout(150); }
  await page.click('[data-act="start-today"]'); await page.waitForTimeout(250);
  log('prepare steps cards: '+await page.evaluate(()=>document.querySelectorAll('#perf .steps3 .sc').length)+' no howto button: '+!(await page.$('[data-p="howto"]')));
  await page.evaluate(()=>document.querySelector('#perf .steps3 .sc').click()); await page.waitForTimeout(150); log('step tap keeps stage: '+await page.evaluate(()=>__T.P.stage)+' sheet '+!!(await page.$('#sheet')));
  await page.click('[data-p="exit"]'); await page.waitForTimeout(150); log('exit -> active '+await page.evaluate(()=>__T.P.active));
  // library edit persists
  await page.click('[data-tab="settings"]'); await page.waitForTimeout(100); await page.click('[data-act="open-lib"]'); await page.waitForTimeout(200);
  await page.click('.li[data-act="edit-ex"]'); await page.waitForTimeout(200); log('steps heading: '+await page.evaluate(()=>document.querySelector('.sec-h h2')?.textContent));
  await page.fill('[data-f="nameEn"]', 'QA Renamed'); await page.click('[data-act="save-ex"]'); await page.waitForTimeout(200); await page.reload(); await page.waitForTimeout(300);
  log('renamed persisted: '+await page.evaluate(()=>__T.S.exercises.some(e=>e.nameEn==='QA Renamed')));
  log('scrollWidth '+await page.evaluate(()=>document.documentElement.scrollWidth));
  log('errors '+JSON.stringify(errs));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
