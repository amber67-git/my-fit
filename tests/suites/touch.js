// Tap targets (v0.38): every visible control on the main screens has an effective tap area of at least 44 × 44 px
// (an invisible ::before extension counts), at phone width, in normal and large text. Large text zooms the app 15 %.
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  for(const large of [false,true]){
    const ctx = await browser.newContext({ viewport: { width: 384, height: 854 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://'+HARNESS); await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER); await page.reload(); await page.waitForTimeout(300);
    await page.evaluate((large)=>{ const T=window.__T; T.S.settings.lang='ko'; T.S.settings.textLarge=large; T.S.settings.setDetail=true; T.S.plans={}; T.S.logs={}; const d=new Date(); d.setDate(d.getDate()-3); const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); T.S.logs[k]={entries:[{id:'o',planItemId:'po',exId:'ex_bench',mode:'sets',startedAt:1,endedAt:2,duration:300,sets:[{reps:8,weight:40,done:true},{reps:8,weight:40,done:true},{reps:8,weight:40,done:true}],memo:'',condition:3,rpe:7}]}; ['ex_bench','ex_bbrow'].forEach(id=>T.addPlanItem(T.todayKey(),T.S.exercises.find(e=>e.id===id))); T.render(); },large);
    const scan=async(name)=>page.evaluate((name)=>{ const small=[]; const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
      document.querySelectorAll('button,[role=button],input:not([type=hidden]),select,[data-act],[data-p],[data-tab],[data-sp]').forEach(el=>{ const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||el.disabled)return;         if(el.closest('.backdrop')===el)return; const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
        let h=r.height, w=r.width; const pb=getComputedStyle(el,'::before'); if(pb.content&&pb.content!=='none'&&pb.position==='absolute'){ h=Math.max(h,parseFloat(pb.height)*zoom||0); }
        if(el.matches('textarea,input[type=text],input[type=number],input:not([type])'))w=Math.max(w,44);
        if(h<43.5||w<43.5)small.push((el.className&&typeof el.className==='string'?el.className.split(' ')[0]:el.tagName.toLowerCase())+(el.dataset.p?'[p='+el.dataset.p+']':el.dataset.act?'[act='+el.dataset.act+']':'')+' '+Math.round(w)+'×'+Math.round(h)); });
      return [...new Set(small)].map(s=>name+': '+s); },name);
    const all=[];
    for(const tab of ['dash','week','month','report','settings']){ await page.evaluate(t=>{const T=window.__T;T.S.tab=t;T.S.sub=null;T.render();},tab); all.push(...await scan(tab)); }
    // exercise picker (week grid "+") and the plan-item editor, both bottom sheets
    await page.evaluate(()=>{const T=window.__T;T.S.tab='week';T.render();}); await page.locator('[data-act="add-day"]').first().click(); await page.locator('#sheet').waitFor({timeout:3000}); all.push(...await scan('picker'));
    await page.evaluate(()=>document.querySelector('[data-act="close-sheet"]')?.click()||document.querySelector('.backdrop')?.remove()); await page.waitForTimeout(120);
    await page.evaluate(()=>{const T=window.__T; const it=T.planOf(T.todayKey())[0]; T.openItemEditor(T.todayKey(),it.id);}); await page.locator('#sheet').waitFor({timeout:3000}); all.push(...await scan('editor'));
    await page.evaluate(()=>document.querySelector('[data-act="close-sheet"]')?.click()||document.querySelector('.backdrop')?.remove()); await page.waitForTimeout(120);
    await page.evaluate(()=>{const T=window.__T;T.S.tab='dash';T.render();}); await page.click('[data-act="start-today"]'); await page.locator('[data-p="start"]').waitFor(); all.push(...await scan('prepare'));
    await page.click('[data-p="start"]'); await page.locator('[data-p="setdone"]').first().waitFor(); await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(80); all.push(...await scan('perform'));
    const ov=await page.evaluate(()=>{ const L=[...document.querySelectorAll('.lastln')]; const st=[...document.querySelectorAll('.stp')].map(x=>x.getBoundingClientRect()); const hit=L.filter(l=>{ const r=l.getBoundingClientRect(); return st.some(s=>r.left<s.right&&r.right>s.left&&r.top<s.bottom-0.5&&r.bottom>s.top+0.5); }).length; return {n:L.length,hit}; });
    check('"last time" lines do not overlap the steppers ('+(large?'large':'normal')+')', ov.n>0&&ov.hit===0, JSON.stringify(ov));
    if(!large){ await page.setViewportSize({width:320,height:700}); await page.waitForTimeout(80); const rw=await page.evaluate(()=>[...document.querySelectorAll('.srpe button')].map(b=>Math.round(b.getBoundingClientRect().width))); check('at 320 px the five RPE buttons stay at least 44 px wide on one row', rw.length===5&&rw.every(w=>w>=44)&&Math.max(...rw)-Math.min(...rw)<=1, rw.join(',')); await page.setViewportSize({width:384,height:854}); }
    await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:3000}); all.push(...await scan('complete'));
    const label=large?'large text':'normal text';
    check('every control on 10 screens has a tap area ≥ 44 × 44 px ('+label+')', all.length===0, all.slice(0,12).join(' | '));
    await page.evaluate(()=>{const T=window.__T; document.querySelector('#perf')?.remove(); T.P.active=false; T.S.tab='settings'; T.S.sub=null; T.render();});
    const ap=await page.evaluate(()=>[...document.querySelectorAll('[data-textsize]')].map(b=>b.getAttribute('aria-pressed')).join(','));
    check('text-size buttons expose the chosen size with aria-pressed', ap===(large?'false,true':'true,false'), ap);
    if(large){ const z=await page.evaluate(()=>getComputedStyle(document.documentElement).zoom); check('large text zooms the app to 1.15', String(z)==='1.15', z); }
    check('no page errors ('+label+')', errs.length===0, errs.join(' | '));
    await ctx.close();
  }
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
