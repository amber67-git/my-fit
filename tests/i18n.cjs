// Language cross-check: render every main screen in EN and in KO and flag text that leaks from the other language.
// KO screens must not show Latin words except units/acronyms on the allowlist; EN screens must not show Hangul.
// Also checks the I18N dictionary (same keys both sides, no identical EN/KO text, same {placeholders}) and the
// exercise library (every exercise has EN and KO names and EN/KO text for every step cue and mistake).
const {chromium}=require(process.env.PW_MODULE||'playwright'); const fs=require('fs'); const path=require('path');
const HARNESS=process.env.HARNESS||'http://127.0.0.1:8080/build/test.html'; const SRC=fs.readFileSync(path.resolve(__dirname,'..','src','app.html'),'utf8');
const APP_VER=(SRC.match(/APP_VERSION='([^']+)'/)||[])[1]; const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
// Latin tokens that are fine on a Korean screen: units, acronyms, product names, the language switch itself.
const KO_ALLOW=new Set(['kg','lb','km','cm','min','sec','bpm','RPE','PR','PRs','1RM','CSV','JSON','EN','KO','Firebase','Google','My','Fit','Netlify','GitHub','Chrome','Safari','Android','iPhone','iOS','id','app','v','vs','AM','PM','A','B','x','e.g.','FAQ','ID','URL','PWA','Smart','Preset','RM','e1RM','MIT','AB','RDL','MTB','streak','ClassDesk','StudyDesk','react-native-body-highlighter','avataaars']);
// Addresses and code inside a string are not translatable text; only those parts are removed before the scan.
const ADDR_RE=/(https?:\/\/\S+|chrome:\/\/\S+|[a-z0-9-]+(\.[a-z0-9-]+)*\.(app|io|com|ai)(\/\S*)?|\/my-fit\b)/gi;
// Verbatim citations of another product's English text that the Korean guide quotes on purpose.
const CITATIONS=['This app is already installed','Could not open app'];
const stripNonText=s=>{ let r=s.replace(ADDR_RE,' '); for(const c of CITATIONS)r=r.split(c).join(' '); return r; };
const errors=[]; const ok=(m)=>console.log('ok   '+m); const bad=(m)=>{console.log('FAIL '+m); errors.push(m);};
// ---- static checks -------------------------------------------------------------------------------------------
{ const i=SRC.indexOf('const I18N={'); let depth=0,j=i+'const I18N='.length; for(;j<SRC.length;j++){const c=SRC[j]; if(c==='{')depth++; else if(c==='}'){depth--; if(depth===0)break;}}
  const I18N=new Function('return '+SRC.slice(i+'const I18N='.length,j+1))();
  const en=Object.keys(I18N.en), ko=Object.keys(I18N.ko);
  const onlyEn=en.filter(k=>!(k in I18N.ko)), onlyKo=ko.filter(k=>!(k in I18N.en));
  (onlyEn.length||onlyKo.length)?bad('I18N keys differ: only EN '+onlyEn.join(',')+' only KO '+onlyKo.join(',')):ok('I18N: '+en.length+' keys, same set in EN and KO');
  const same=en.filter(k=>k in I18N.ko&&I18N.en[k]===I18N.ko[k]&&/[A-Za-z]{3,}/.test(String(I18N.en[k])));
  same.length?bad('I18N: KO text identical to EN for '+same.join(',')):ok('I18N: no KO entry left in English');
  const ph=en.filter(k=>k in I18N.ko&&((String(I18N.en[k]).match(/\{\w+\}/g)||[]).sort().join()!==(String(I18N.ko[k]).match(/\{\w+\}/g)||[]).sort().join()));
  ph.length?bad('I18N: placeholder mismatch in '+ph.join(',')):ok('I18N: {placeholders} match in every entry');
  const i2=SRC.indexOf('function DEFAULT_EXERCISES(){'); let d2=0,j2=i2+'function DEFAULT_EXERCISES()'.length; for(;j2<SRC.length;j2++){const c=SRC[j2]; if(c==='{')d2++; else if(c==='}'){d2--; if(d2===0)break;}}
  const rows=[]; const X=(...a)=>{rows.push({id:a[0],en:a[1],ko:a[2],steps:a[11]||[]});}; const T=(...a)=>{rows.push({id:a[0],en:a[1],ko:a[2],steps:a[8]||[]});};
  new Function('X','T',SRC.slice(i2,j2+1)+'; DEFAULT_EXERCISES();')(X,T);
  const noName=rows.filter(r=>!r.en||!r.ko||r.en===r.ko).map(r=>r.id);
  noName.length?bad('exercises without distinct EN/KO names: '+noName.join(',')):ok('exercises: '+rows.length+', every one has EN and KO names');
  const halfSteps=rows.filter(r=>r.steps.some(s=>(!!s[0])!==(!!s[1])||(!!s[2])!==(!!s[3])||(!!s[4])!==(!!s[5]))).map(r=>r.id);
  halfSteps.length?bad('exercise steps with text in one language only: '+halfSteps.join(',')):ok('exercise steps: every cue and mistake has both EN and KO');
  const incomplete=rows.filter(r=>r.steps.length<2||r.steps.length>4||r.steps.some(s=>!String(s[2]||'').trim()||!String(s[3]||'').trim())).map(r=>r.id);
  incomplete.length?bad('built-in exercises with missing steps or cues: '+incomplete.join(',')):ok('exercise steps: every built-in exercise has 2-4 steps with EN and KO cues');
}
// ---- rendered screens ----------------------------------------------------------------------------------------
(async()=>{ const b=await chromium.launch(LAUNCH); const leaks={en:{},ko:{}};
for(const lang of ['en','ko']){ const p=await b.newPage({viewport:{width:384,height:854},deviceScaleFactor:2,hasTouch:true}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(v=>{ try{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);}catch(e){} },APP_VER);
  await p.goto(HARNESS); await p.waitForTimeout(400);
  await p.evaluate((lang)=>{ const T=window.__T; const S=T.S; S.settings.lang=lang; const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const ids=[['ex_bench','ex_bbrow','ex_ohp'],['ex_bbsquat','ex_rdl','ex_calf'],['ex_lateral','ex_curl','ex_pushdown'],['ex_treadmill']];
    for(let i=1;i<=40;i++){ if(i%2)continue; const d=new Date(); d.setDate(d.getDate()-i); const k=key(d); const st=d.getTime(); const set=ids[(i/2)%4];
      const entries=set.map(id=>{ const ex=S.exercises.find(e=>e.id===id); if(ex.mode==='time')return {id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'time',startedAt:st,endedAt:st+1500000,duration:1500,sets:[],memo:'',condition:4,rpe:6,distance:4.5,hr:140};
        const sets=[0,1,2].map(j=>({reps:8,weight:(ex.weight||20)+i%5,done:true,t:st+j*150000})); return {id:'e'+k+id,planItemId:'p'+k+id,exId:id,mode:'sets',startedAt:st,endedAt:st+450000,duration:450,sets,memo:'',condition:3,rpe:7}; });
      S.logs[k]={entries}; S.plans[k]={items:entries.map(e=>({id:e.planItemId,exId:e.exId,mode:e.mode,sets:3,reps:8,weight:30,rest:90,minutes:20,status:'done'}))}; S.body[k]={w:72-i*0.02,sleep:7}; }
    ['ex_bbrow','ex_incline','ex_bbsquat','ex_plank'].forEach(id=>{ const ex=S.exercises.find(e=>e.id===id); if(ex)T.addPlanItem(T.todayKey(),ex); });
    T.persist&&T.persist.settings&&T.persist.settings(); T.render(); },lang);
  await p.waitForTimeout(200);
  const scan=async(screen)=>{ await p.waitForTimeout(150); const txt=await p.evaluate(()=>{ const parts=[]; document.querySelectorAll('body *').forEach(el=>{ if(['SCRIPT','STYLE','SVG','PATH'].includes(el.tagName))return; const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden')return; el.childNodes.forEach(n=>{ if(n.nodeType===3&&n.textContent.trim())parts.push(n.textContent.trim()); }); if(el.placeholder)parts.push(el.placeholder); if(el.value&&el.tagName==='INPUT'&&el.type!=='number')parts.push(el.value); const al=el.getAttribute('aria-label'); if(al)parts.push(al); if(el.title)parts.push(el.title); }); return parts; });
    const found=new Set();
    for(const s of txt){ if(lang==='ko'){ const s2=stripNonText(s); for(const w of (s2.match(/[A-Za-z][A-Za-z.'-]*/g)||[])){ if(KO_ALLOW.has(w)||/^[A-Za-z]$/.test(w))continue; found.add(w+' ← '+s.slice(0,40)); } }
      else { if(/[ㄱ-ㆎ가-힣]/.test(s))found.add(s.slice(0,50)); } }
    leaks[lang][screen]={n:found.size,list:[...found].slice(0,20)}; };
  for(const tab of ['dash','week','month','report','settings']){ await p.evaluate(t=>{ const T=window.__T; T.S.tab=t; T.S.sub=null; T.render(); },tab); await scan(tab); }
  for(const sub of ['guide','library']){ await p.evaluate(s=>{ const T=window.__T; T.S.tab='settings'; T.S.sub=s; T.render(); },sub); await scan(sub); }
  await p.evaluate(()=>{ const T=window.__T; T.S.sub=null; T.S.tab='settings'; T.render(); }); const rt=await p.$('[data-act="open-routines"]'); if(!rt)throw new Error(lang+': open-routines button not found'); await rt.click(); await scan('routines'); await p.evaluate(()=>{ const x=document.querySelector('.backdrop'); if(x)x.click(); }); await p.waitForTimeout(250);
  await p.evaluate(()=>{ const T=window.__T; T.S.tab='dash'; T.S.sub=null; T.render(); T.openItemEditor(T.todayKey(), T.planOf(T.todayKey())[0].id); }); await scan('editor');
  await p.evaluate(()=>{ const x=document.querySelector('.backdrop'); if(x)x.click(); }); await p.waitForTimeout(250);
  const add=await p.$('[data-act="add-ex"],[data-act="add-today"],[data-act="add"]'); if(!add)throw new Error(lang+': add-exercise button not found'); await add.click(); await scan('picker'); await p.evaluate(()=>{ const x=document.querySelector('.backdrop'); if(x)x.click(); }); await p.waitForTimeout(250);
  await p.click('[data-act="start-today"]'); await p.locator('[data-p="start"]').waitFor({timeout:5000}); await scan('prepare');
  await p.click('[data-p="start"]'); await p.locator('[data-p="setdone"]').first().waitFor({timeout:5000}); await scan('perform');
  await p.locator('[data-p="setdone"]').first().click(); await p.waitForTimeout(200); await p.locator('[data-p="finish"]').first().click(); await p.locator('[data-p="next"]').first().waitFor({timeout:5000}); await scan('complete');
  if(Object.keys(leaks[lang]).length!==13)bad(lang+': expected 13 scanned screens, got '+Object.keys(leaks[lang]).length);
  if(errs.length)bad(lang+' page errors: '+errs.join(' | '));
  await p.close(); }
await b.close();
for(const lang of ['en','ko']){ for(const [screen,{n,list}] of Object.entries(leaks[lang])){ if(n)bad(lang.toUpperCase()+' screen "'+screen+'" shows '+n+' '+(lang==='ko'?'English':'Korean')+' text'+(n>1?'s':'')+(n>list.length?' (first '+list.length+' shown)':'')+': '+list.join(' ; ')); else ok(lang.toUpperCase()+' '+screen); } }
console.log(errors.length?'I18N FAILED ('+errors.length+')':'I18N PASSED'); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
