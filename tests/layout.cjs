// Layout check: every main screen at desktop (full/split), Galaxy Tab S8 (landscape/portrait) and phone (portrait/landscape).
// Fails on horizontal page scroll, elements outside the viewport, clipped text or page errors. Screenshots go to SHOT_DIR/layout.
const {chromium}=require(process.env.PW_MODULE||'playwright'); const fs=require('fs'); const path=require('path');
const HARNESS=process.env.HARNESS||'http://127.0.0.1:8080/build/test.html'; const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
const VP=[['desktop-full',1920,1080,1],['desktop-split',960,1080,1],['tab-s8-landscape',1280,800,2],['tab-s8-portrait',800,1280,2],['phone-portrait',384,854,2.8],['phone-landscape',854,384,2.8]];
const OUT=path.join(process.env.SHOT_DIR||'e2e-out','layout')+path.sep; fs.mkdirSync(OUT,{recursive:true}); const report={};
(async()=>{ const b=await chromium.launch(LAUNCH);
for(const [name,w,h,dpr] of VP){ const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:Math.min(dpr,2),hasTouch:w<1000,isMobile:false}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ try{localStorage.clear();localStorage.setItem('wwt.seenVersion','99');}catch(e){} });
  await p.goto(HARNESS); await p.waitForTimeout(400);
  await p.evaluate(()=>{ const T=window.__T; const S=T.S; const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const ids=[['ex_bench','ex_bbrow','ex_ohp'],['ex_bbsquat','ex_rdl','ex_calf'],['ex_lateral','ex_curl','ex_pushdown'],['ex_treadmill']];
    for(let i=1;i<=40;i++){ if(i%2)continue; const d=new Date(); d.setDate(d.getDate()-i); const k=key(d); const st=d.getTime(); const set=ids[(i/2)%4];
      const entries=set.map(id=>{ const ex=S.exercises.find(e=>e.id===id); if(ex.mode==='time')return {id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'time',startedAt:st,endedAt:st+1500000,duration:1500,sets:[],memo:'',condition:4,rpe:6,distance:4.5,hr:140};
        const sets=[0,1,2].map(j=>({reps:8,weight:(ex.weight||20)+i%5,done:true,t:st+j*150000})); return {id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:st,endedAt:st+450000,duration:450,sets,memo:'',condition:3,rpe:7}; });
      S.logs[k]={entries}; S.plans[k]={items:entries.map(e=>({id:e.planItemId,exId:e.exId,mode:e.mode,sets:3,reps:8,weight:30,rest:90,minutes:20,status:'done'}))}; S.body[k]={w:72-i*0.02,sleep:7}; }
    ['ex_bbrow','ex_incline','ex_bbsquat','ex_plank'].forEach(id=>{ const ex=S.exercises.find(e=>e.id===id); if(ex)T.addPlanItem(T.todayKey(),ex); });
    T.persist&&T.persist.settings&&T.persist.settings(); T.render(); });
  await p.waitForTimeout(200);
  const measure=async(screen)=>{ const m=await p.evaluate(()=>{ const W=window.innerWidth, H=window.innerHeight; const off=[]; const seen=new Set();
      document.querySelectorAll('body *').forEach(el=>{ const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden')return; const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
        // ignore content inside horizontal scrollers
        let a=el.parentElement, inScroll=false; while(a){ const s=getComputedStyle(a); if(/(auto|scroll)/.test(s.overflowX)&&a.scrollWidth>a.clientWidth){inScroll=true;break;} a=a.parentElement; } if(inScroll)return;
        if(r.right>W+1||r.left<-1){ const id=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):''); if(!seen.has(id)){seen.add(id); off.push(id+' ['+Math.round(r.left)+','+Math.round(r.right)+']');} } });
      // text clipped: elements whose scrollWidth > clientWidth with overflow hidden and no ellipsis intent
      const clipped=[]; document.querySelectorAll('button,.nm,.cap,h1,h2,h3,.v,.tile,.sk,.scue').forEach(el=>{ const cs=getComputedStyle(el); if(cs.display==='none')return; if(el.scrollWidth>el.clientWidth+2&&cs.overflow!=='visible'&&cs.textOverflow!=='ellipsis'){ clipped.push((el.className||el.tagName)+': '+(el.innerText||'').slice(0,30)); } });
      return {docW:document.documentElement.scrollWidth,W,H,off:off.slice(0,12),clipped:clipped.slice(0,8)}; });
    report[name]=report[name]||{}; report[name][screen]=m; };
  const shot=async(screen,full=true)=>{ await p.waitForTimeout(250); await measure(screen); await p.screenshot({path:OUT+name+'--'+screen+'.png',fullPage:full}); };
  for(const tab of ['dash','week','month','report','settings']){ await p.evaluate(t=>{ const T=window.__T; T.S.tab=t; T.render(); window.scrollTo(0,0); },tab); await shot(tab); }
  await p.evaluate(()=>{ const T=window.__T; T.S.tab='dash'; T.render(); T.openItemEditor(T.todayKey(), T.planOf(T.todayKey())[0].id); }); await shot('editor',false);
  await p.evaluate(()=>{ const x=document.querySelector('.backdrop'); if(x)x.click(); }); await p.waitForTimeout(300);
  const add=await p.$('[data-act="add-ex"],[data-act="add-today"],[data-act="add"]'); if(!add)throw new Error(name+': add-exercise button not found'); { await add.click(); await shot('picker',false); await p.evaluate(()=>{ const x=document.querySelector('.backdrop'); if(x)x.click(); }); await p.waitForTimeout(300); }
  await p.click('[data-act="start-today"]'); await p.locator('[data-p="start"]').waitFor({timeout:5000}); await shot('prepare');
  await p.click('[data-p="start"]'); await p.locator('[data-p="setdone"]').first().waitFor({timeout:5000}); await shot('perform');
  await p.locator('[data-p="setdone"]').first().click(); await p.waitForTimeout(200); await p.locator('[data-p="finish"]').first().click(); await p.locator('[data-p="next"]').first().waitFor({timeout:5000}); await shot('complete');
  report[name]._errors=errs; await p.close(); }
fs.writeFileSync(OUT+'report.json',JSON.stringify(report,null,1)); await b.close();
let fail=0; for(const [vp,sc] of Object.entries(report)){ for(const [s,m] of Object.entries(sc)){ if(s.startsWith('_'))continue; const bad=[]; if(m.docW>m.W)bad.push('horizontal scroll '+m.docW+'>'+m.W); if(m.off.length)bad.push('outside viewport: '+m.off.join(', ')); if(m.clipped.length)bad.push('clipped text: '+m.clipped.join(', ')); console.log((bad.length?'FAIL ':'ok   ')+vp.padEnd(17)+s.padEnd(9)+(bad.length?' '+bad.join(' | '):'')); if(bad.length)fail=1; }
  if(sc._errors.length){ console.log('FAIL '+vp+' page errors: '+sc._errors.join(' | ')); fail=1; } }
console.log(fail?'LAYOUT FAILED':'LAYOUT PASSED'); process.exit(fail);
})().catch(e=>{ console.error(e); process.exit(1); });
