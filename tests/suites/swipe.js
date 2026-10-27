const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-10-22T10:00:00') }); await page.clock.runFor(1);
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER); await page.reload(); await page.waitForTimeout(300);
  // plan tomorrow (Thu Oct 23) and today
  await page.evaluate(()=>{ const t=__T.todayKey(); const d=new Date(); d.setDate(d.getDate()+1); const k=d.toISOString().slice(0,10); const ex=__T.S.exercises; __T.addPlanItem(k,ex[0]); __T.addPlanItem(k,ex[1]); __T.render(); });
  await page.waitForTimeout(200);
  const n0=await page.evaluate(()=>document.querySelectorAll('.swipe').length); console.log('cards',n0);
  // tap tomorrow card -> editor sheet
  const cards=await page.$$('.swipe .card'); await cards[0].tap(); await page.waitForTimeout(200); console.log('tomorrow tap opens editor:', !!(await page.$('#sheet [data-act="save-item"]')));
  await page.mouse.click(195,30); await page.waitForTimeout(150);
  // swipe left on the second tomorrow card
  const bb=await cards[1].boundingBox(); const cdp=await ctx.newCDPSession(page);
  const swipe=async(dist)=>{ const y=bb.y+bb.height/2; const xs=bb.x+bb.width-20; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:xs,y}]}); for(let i=1;i<=8;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:xs-dist*i/8,y}]}); await page.waitForTimeout(16);} await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await page.waitForTimeout(250); };
  await swipe(70); console.log('after short swipe open:', await page.evaluate(()=>document.querySelectorAll('.swipe.open').length)); await page.screenshot({path:'swipe-open.png'});
  console.log('cancel button visible:', !!(await page.$('.swipe.open .swipe-cancel')));
  await page.tap('.swipe.open .swipe-cancel'); await page.waitForTimeout(200); console.log('after cancel open:', await page.evaluate(()=>document.querySelectorAll('.swipe.open').length), 'cards', await page.evaluate(()=>document.querySelectorAll('.swipe').length));
  await swipe(170); console.log('after LONG swipe cards (must still be 2):', await page.evaluate(()=>document.querySelectorAll('.swipe').length), 'open', await page.evaluate(()=>document.querySelectorAll('.swipe.open').length));
  await page.tap('.swipe.open .swipe-del'); await page.waitForTimeout(250); console.log('after delete tap cards:', await page.evaluate(()=>document.querySelectorAll('.swipe').length));
  // target tile on get-ready opens the editor and updates the tile
  await page.evaluate(()=>{ const d=new Date(); d.setDate(d.getDate()+1); const k=d.toISOString().slice(0,10); const id=__T.planOf(k)[0].id; __T.startQueue([{date:k,id}]); }); await page.waitForTimeout(250);
  await page.click('[data-p="edit-target"]'); await page.waitForTimeout(200); console.log('target tap opens editor:', !!(await page.$('#sheet [data-act="save-item"]')));
  await page.evaluate(()=>{ const i=document.querySelector('#sv-sets')||document.querySelector('#sv-minutes'); i.value='5'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); });
  await page.click('[data-act="save-item"]'); await page.waitForTimeout(250); console.log('target tile now:', await page.evaluate(()=>document.querySelector('[data-p="edit-target"] .v').textContent));
  await page.screenshot({path:'swipe-target.png'});
  
  console.log('errors', JSON.stringify(errs)); await browser.close();
})();
