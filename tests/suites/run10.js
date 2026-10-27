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
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  // 1. apply PPL routine
  await page.click('[data-tab="week"]'); await page.click('[data-act="open-routines"]'); await page.waitForTimeout(100); await page.click('[data-rt="rt_ppl"]'); await page.waitForTimeout(100); await page.click('#rt-apply'); await page.waitForTimeout(200);
  await page.screenshot({ path: 'r10-week.png' });
  // 2. dashboard
  await page.click('[data-tab="dash"]'); await page.waitForTimeout(100); await page.screenshot({ path: 'r10-dash.png' });
  const todayCount = await page.evaluate(()=>document.querySelectorAll('.card').length); log('today cards '+todayCount);
  if(!todayCount){ // today may not be Mon/Wed/Fri: add exercises manually
    await page.click('[data-tab="week"]'); for(const ex of ['ex_jacks','ex_bench','ex_squat']){ await page.click('[data-act="add-day"]'); await page.waitForTimeout(80); await page.click(`[data-ex="${ex}"]`); await page.waitForTimeout(80);} await page.click('[data-tab="dash"]'); await page.waitForTimeout(100); }
  // 3. start workout
  await page.click('[data-act="start-today"]'); await page.waitForTimeout(150); await page.screenshot({ path: 'r10-prepare.png' });
  await page.click('.steps3'); await page.waitForTimeout(200); await page.screenshot({ path: 'r10-howto.png' }); log('steps tap -> sheet '+!!(await page.$('#sheet .howto.v'))); await page.mouse.click(195,30); await page.waitForTimeout(150);
  await page.click('[data-p="start"]'); await page.waitForTimeout(1200); await page.screenshot({ path: 'r10-timer.png' });
  await page.click('[data-p="plus1"]'); await page.waitForTimeout(100); const big = await page.evaluate(()=>document.querySelector('#big').textContent); log('after +1min '+big);
  await page.click('[data-p="finish"]'); await page.waitForTimeout(100); await page.click('[data-c="4"]'); await page.click('[data-p="next"]'); await page.waitForTimeout(150);
  // 4. sets exercise with editing
  await page.click('[data-p="start"]'); await page.waitForTimeout(150); await page.screenshot({ path: 'r10-sets.png' });
  await page.click('[data-sp="weight"][data-i="0"][data-d="1"]'); await page.waitForTimeout(80); await page.click('[data-sp="weight"][data-i="0"][data-d="1"]'); await page.waitForTimeout(80);
  const w = await page.evaluate(()=>[...document.querySelectorAll('.setcard .stp:nth-child(2) .v')].map(x=>x.textContent.trim()).join('|')); log('weights after +2 steps '+w);
  await page.click('[data-p="addset"]'); await page.waitForTimeout(80); log('sets after add '+await page.evaluate(()=>document.querySelectorAll('.setcard').length));
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(150); await page.screenshot({ path: 'r10-rest.png' });
  log('rest visible '+await page.evaluate(()=>!document.querySelector('#restbox').hidden+' '+document.querySelector('#restt').textContent));
  await page.click('[data-p="rest+15"]'); await page.waitForTimeout(80); log('rest +15 '+await page.evaluate(()=>document.querySelector('#restt').textContent));
  await page.click('[data-p="skiprest"]'); await page.click('[data-p="setdone"][data-i="1"]'); await page.click('[data-p="skiprest"]');
  await page.click('[data-p="rmset"]'); await page.waitForTimeout(80); log('sets after remove '+await page.evaluate(()=>document.querySelectorAll('.setcard').length));
  // add exercise mid-workout
  await page.click('[data-p="addex"]'); await page.waitForTimeout(150); await page.click('[data-ex="ex_plank"]'); await page.waitForTimeout(150); log('queue count '+await page.evaluate(()=>document.querySelector('#perf .cap.num')?.textContent));
  // exit with progress → ask
  await page.click('[data-p="exit"]'); await page.waitForTimeout(150); await page.screenshot({ path: 'r10-leave.png' }); const hasLeave = await page.evaluate(()=>!!document.querySelector('#lv-save')); log('leave sheet '+hasLeave);
  await page.click('#lv-save'); await page.waitForTimeout(200);
  await page.screenshot({ path: 'r10-dash2.png' });
  const st = await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('wwt.state.v1'));const k=Object.keys(s.logs)[0];return k+' entries='+s.logs[k].entries.length+' sets='+JSON.stringify(s.logs[k].entries[1]?.sets);}); log('log '+st);
  // 5. monthly + detail
  await page.click('[data-tab="month"]'); await page.waitForTimeout(100); await page.screenshot({ path: 'r10-month.png' });
  await page.click('.cal .cell.today'); await page.waitForTimeout(150); await page.screenshot({ path: 'r10-daydetail.png' }); await page.mouse.click(10,10);
  // 6. settings: export/import roundtrip
  await page.click('[data-tab="settings"]'); await page.waitForTimeout(100); await page.click('[data-act="export"]'); await page.waitForTimeout(100);
  const json = await page.evaluate(()=>document.querySelector('#exp').value); await page.mouse.click(10,10);
  await page.click('[data-act="reset"]'); await page.waitForTimeout(100); await page.click('#ok'); await page.waitForTimeout(150);
  log('after reset plans '+await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('wwt.state.v1')).plans).length));
  await page.click('[data-act="import"]'); await page.waitForTimeout(100); await page.evaluate(j=>{document.querySelector('#imp').value=j}, json); await page.click('#ib'); await page.waitForTimeout(200);
  log('after import plans '+await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('wwt.state.v1')).plans).length));
  // 7. KO + dark
  await page.click('[data-l="ko"]'); await page.waitForTimeout(100); await page.click('[data-tab="dash"]'); await page.waitForTimeout(100);
  await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForTimeout(100); await page.screenshot({ path: 'r10-dark.png' });
  await page.emulateMedia({ colorScheme: 'light' }); await page.click('[data-l="en"]');
  // 8. library edit new exercise
  await page.click('[data-tab="settings"]'); await page.click('[data-act="open-lib"]'); await page.click('[data-act="new-ex"]'); await page.waitForTimeout(100);
  await page.fill('[data-f="nameEn"]','Test move'); await page.click('[data-icon="curl"]'); await page.click('[data-act="save-ex"]'); await page.waitForTimeout(150);
  log('library count text '+await page.evaluate(()=>document.querySelector('.cap')?.textContent));
  log('scrollWidth '+await page.evaluate(()=>document.documentElement.scrollWidth));
  console.log('errors', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
