// Smoke E2E for My Fit. Runs against a static server of this repo (default http://localhost:8080/).
// Covers: local mode entry, add exercise for today, start workout, complete a set, finish, swipe cancel/delete, no horizontal scroll.
const fs=require('fs'), path=require('path');
const { chromium } = require('playwright');
const BASE=process.env.APP_URL||'http://localhost:8080/';
const OUT=process.env.SHOT_DIR||path.join(__dirname,'..','.e2e-out');
fs.mkdirSync(OUT,{recursive:true});
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ver=(html.match(/APP_VERSION='([^']+)'/)||[])[1];
const step=async(name,fn)=>{ try{ await fn(); console.log('ok  ',name);}catch(e){ console.log('FAIL',name,'-',e.message.split('\n')[0]); throw e; } };
(async()=>{
  const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  if(ver) await page.addInitScript(v=>{try{localStorage.setItem('wwt.seenVersion',v);}catch(e){}},ver);
  const shot=(n)=>page.screenshot({path:path.join(OUT,n+'.png')});
  try{
    await step('open app',async()=>{ await page.goto(BASE,{waitUntil:'load'}); await page.waitForTimeout(800); });
    await step('local mode',async()=>{ const b=page.locator('#btn-local'); if(await b.count()&&await b.isVisible()){ await b.click(); } await page.locator('[data-act="add-today"]').first().waitFor({timeout:10000}); });
    await step('add leg press for today',async()=>{ await page.locator('[data-act="add-today"]').first().click(); await page.fill('#pickq','leg press'); await page.locator('#picklist [data-ex="ex_legpress"]').click(); await page.locator('[data-act="start-today"]').waitFor({timeout:5000}); await shot('01-today'); });
    await step('start workout and complete a set',async()=>{ await page.click('[data-act="start-today"]'); await page.locator('[data-p="start"]').waitFor({timeout:5000}); await shot('02-prepare'); await page.click('[data-p="start"]'); await page.locator('[data-p="setdone"]').first().waitFor({timeout:5000}); await page.locator('[data-p="setdone"]').first().click(); await shot('03-sets'); await page.locator('[data-p="finish"]').first().click(); await page.waitForTimeout(600); await shot('04-complete'); const nx=page.locator('[data-p="next"]'); if(await nx.count()&&await nx.first().isVisible()) await nx.first().click(); await page.locator('.card.done').first().waitFor({timeout:8000}); await shot('05-done'); });
    await step('swipe shows cancel + delete, cancel restores',async()=>{ const card=page.locator('.swipe .card').first(); const b=await card.boundingBox(); const y=b.y+b.height/2; await page.mouse.move(b.x+b.width-20,y); await page.mouse.down(); for(let i=1;i<=8;i++){ await page.mouse.move(b.x+b.width-20-i*25,y); } await page.mouse.up(); await page.locator('.swipe.open').waitFor({timeout:3000}); await shot('06-swipe'); await page.click('[data-act="swipe-cancel"]'); await page.waitForTimeout(300); if(await page.locator('.swipe.open').count()) throw new Error('swipe still open after cancel'); });
    await step('swipe + delete removes the card',async()=>{ const card=page.locator('.swipe .card').first(); const b=await card.boundingBox(); const y=b.y+b.height/2; await page.mouse.move(b.x+b.width-20,y); await page.mouse.down(); for(let i=1;i<=8;i++){ await page.mouse.move(b.x+b.width-20-i*25,y); } await page.mouse.up(); await page.locator('.swipe.open').waitFor({timeout:3000}); await page.click('[data-act="swipe-del"]'); await page.waitForTimeout(400); if(await page.locator('.swipe').count()) throw new Error('card still present after delete'); await shot('07-deleted'); });
    await step('no horizontal scroll, no page errors',async()=>{ const w=await page.evaluate(()=>document.documentElement.scrollWidth); if(w>390) throw new Error('scrollWidth '+w); if(errors.length) throw new Error(errors.join(' | ')); });
    console.log('SMOKE PASSED'); await browser.close();
  }catch(e){ await shot('99-failure').catch(()=>{}); await browser.close(); process.exit(1); }
})();
