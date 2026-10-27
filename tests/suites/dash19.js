const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async()=>{const b=await chromium.launch(LAUNCH);const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  await p.clock.install({time:new Date('2026-10-19T10:00:00')});
  await p.addInitScript((v)=>{localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  const errors=[]; p.on('pageerror',e=>errors.push(String(e)));
  await p.goto('file://'+HARNESS); await p.waitForTimeout(300);
  // add two exercises today: one done, one planned
  await p.evaluate(()=>{const T=window.__T; const d=T.todayKey(); const ex=T.S.exercises.find(e=>e.id==='ex_legpress'); const it=T.addPlanItem(d,ex); it.status='done'; T.render();});
  await p.waitForTimeout(200); await p.screenshot({path:'d19-done.png'});
  // click add-today -> picker opens
  await p.click('[data-act="add-today"]'); await p.waitForTimeout(200); await p.screenshot({path:'d19-picker.png'});
  await p.fill('#pickq','pec'); await p.waitForTimeout(150);
  const n=await p.evaluate(()=>document.querySelectorAll('#picklist [data-ex]').length); console.log('pec matches',n);
  await p.click('#picklist [data-ex="ex_pecdeck"]'); await p.waitForTimeout(250);
  const items=await p.evaluate(()=>window.__T.planOf(window.__T.todayKey()).map(i=>i.exId+':'+i.status)); console.log('today',items);
  await p.screenshot({path:'d19-added.png'});
  // machine filter in picker counts
  await p.evaluate(()=>{window.__T.S.tab='week'; window.__T.render();});
  console.log('errors',errors); await b.close();})();
