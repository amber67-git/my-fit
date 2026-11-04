// Own-origin move check. Serves the repo root at "/" twice:
//   new home  http://localhost:<A>/                 (as on Cloudflare Pages; NEW_HOME empty, no banner)
//   old home  http://amber67-git.github.io:<B>/     (host mapped to 127.0.0.1; NEW_HOME set, banner expected)
// Checks: load without page errors, manifest id/start_url/scope through CDP, no installability errors on the new home,
// banner only on the old hostname, backup downloaded on the old home loads on the new home.
const http=require('http'); const fs=require('fs'); const path=require('path'); const os=require('os');
const {chromium}=require(process.env.PW_MODULE||'playwright'); const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
const ROOT=path.resolve(__dirname,'..'); const A=Number(process.env.MOVE_PORT_A||8101), B=Number(process.env.MOVE_PORT_B||8102); const NEW_HOME=`http://localhost:${A}/`;
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.css':'text/css'};
const serve=(port,inject)=>http.createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(inject&&(p==='/my-fit'||p.startsWith('/my-fit/'))){ if(p==='/my-fit'){res.writeHead(301,{Location:'/my-fit/'});return res.end();} p=p.slice('/my-fit'.length); } if(p.endsWith('/'))p+='index.html'; const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('not found');}
  let body=fs.readFileSync(f); if(inject&&p==='/index.html'){ const s=body.toString('utf8'); const re=/const NEW_HOME='[^']*';/; if(!re.test(s))throw new Error('NEW_HOME constant not found'); body=Buffer.from(s.replace(re,`const NEW_HOME='${NEW_HOME}';`)); }
  res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'}); res.end(body); }).listen(port,'127.0.0.1');
const APP_VER=(fs.readFileSync(path.join(ROOT,'src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const fails=[]; const step=async(name,fn)=>{ try{ await fn(); console.log('ok   '+name); }catch(e){ console.log('FAIL '+name+' — '+String(e.message||e).split('\n')[0]); fails.push(name); } };
const enterLocal=async(page)=>{ const b=page.locator('#btn-local'); try{ await b.waitFor({state:'visible',timeout:8000}); await b.click(); }catch(e){} await page.locator('[data-act="add-today"]').first().waitFor({state:'visible',timeout:15000}); };
const today=()=>{ const d=new Date(); if(d.getHours()<4)d.setDate(d.getDate()-1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
(async()=>{ const sA=serve(A,false), sB=serve(B,true);
  const prof=fs.mkdtempSync(path.join(os.tmpdir(),'myfit-move-'));
  const ctx=await chromium.launchPersistentContext(prof,Object.assign({args:['--host-resolver-rules=MAP amber67-git.github.io 127.0.0.1'],acceptDownloads:true,viewport:{width:390,height:844}},LAUNCH));
  await ctx.addInitScript(v=>{ try{ localStorage.setItem('wwt.seenVersion',v); }catch(e){} },APP_VER);
  const errs={}; const watch=(p,tag)=>{ errs[tag]=[]; p.on('pageerror',e=>errs[tag].push(String(e))); p.on('console',m=>{ if(m.type()==='error'&&!/net::ERR|Failed to load resource|firebase|googleapis|gstatic/i.test(m.text()))errs[tag].push(m.text()); }); };
  const OLD=`http://amber67-git.github.io:${B}/my-fit/`; const KEY='wwt.state.v1';
  const seed={settings:{weeklyGoal:6,lang:'ko'},plans:{[today()]:{items:[{id:'mv1',exId:'ex_bench',mode:'sets',sets:3,reps:8,weight:40,rest:90,minutes:15,status:'planned'}]}},logs:{},body:{[today()]:{w:71.5,sleep:7,note:'move test'}},notes:{},routines:[],exercises:[]};

  // new home
  const pn=await ctx.newPage(); watch(pn,'new');
  await step('new home: loads at the site root',async()=>{ await pn.goto(NEW_HOME); await enterLocal(pn); });
  await step('new home: manifest id /app, start_url and scope at the root (CDP)',async()=>{ const c=await ctx.newCDPSession(pn); const m=await c.send('Page.getAppManifest'); if(m.errors&&m.errors.length)throw new Error('manifest errors '+JSON.stringify(m.errors)); const idr=await c.send('Page.getAppId').catch(()=>({}));
    const data=JSON.parse(m.data||'{}'); const start=new URL(data.start_url,m.url).href, scope=new URL(data.scope,m.url).href;
    /* Page.getAppId is missing in some Chromium builds: fall back to resolving the parsed manifest id against start_url, as the spec does */ const appId=idr.appId||(data.id?new URL(data.id,start).href:start); if(appId!==NEW_HOME+'app')throw new Error('appId '+appId); if(start!==NEW_HOME)throw new Error('start_url '+start); if(scope!==NEW_HOME)throw new Error('scope '+scope); await c.detach(); });
  await step('new home: no installability errors',async()=>{ await pn.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller,null,{timeout:15000}).catch(()=>{}); await pn.reload(); await enterLocal(pn); const c=await ctx.newCDPSession(pn); let last=null; for(let i=0;i<10;i++){ last=(await c.send('Page.getInstallabilityErrors')).installabilityErrors; if(!last.length)break; await pn.waitForTimeout(500); } await c.detach(); if(last.length)throw new Error(JSON.stringify(last)); });
  await step('new home: no moved banner',async()=>{ if(await pn.locator('#moved').count())throw new Error('banner shown on the new home'); });

  // banner only on the old hostname
  const pl=await ctx.newPage(); watch(pl,'localhost-B');
  await step('same build on another hostname: no banner',async()=>{ await pl.goto(`http://localhost:${B}/`); await enterLocal(pl); if(await pl.locator('#moved').count())throw new Error('banner shown on localhost'); }); await pl.close();

  // old home with data
  const po=await ctx.newPage(); watch(po,'old'); await po.addInitScript(([k,v])=>{ try{ if(!localStorage.getItem(k))localStorage.setItem(k,v); }catch(e){} },[KEY,JSON.stringify(seed)]);
  let backup=null;
  await step('old home: banner shows with backup and new-address buttons',async()=>{ await po.goto(OLD); await enterLocal(po); await po.locator('#moved').waitFor({timeout:5000}); const href=await po.locator('#moved a').getAttribute('href'); if(href!==NEW_HOME)throw new Error('link '+href); if(process.env.SHOT_DIR){ fs.mkdirSync(process.env.SHOT_DIR,{recursive:true}); await po.screenshot({path:path.join(process.env.SHOT_DIR,'move-banner.png')}); } });
  await step('old folder /my-fit/: service worker registers in the folder (secure localhost, 10 s limit)',async()=>{ const pf=await ctx.newPage(); watch(pf,'folder'); await pf.goto(`http://localhost:${B}/my-fit/`); const sc=await pf.evaluate(async()=>{ if(!navigator.serviceWorker)return 'no service worker API'; /* wait for the /my-fit/ registration itself: the same origin may also hold a root registration from an earlier visit */ const until=Date.now()+10000; while(Date.now()<until){ const r=await navigator.serviceWorker.getRegistration('/my-fit/'); if(r&&r.active&&r.scope.endsWith('/my-fit/'))return r.scope; await new Promise(z=>setTimeout(z,200)); } return 'no active /my-fit/ registration within 10 s'; }); await pf.close(); if(!String(sc).endsWith('/my-fit/'))throw new Error('scope '+sc); });
  await step('old home: app still works under the banner',async()=>{ await po.locator('.card',{hasText:/Bench|벤치/}).first().waitFor({timeout:5000}); });
  let backupFile=null;
  await step('old home: "download backup" downloads a named, versioned file',async()=>{ await po.click('#moved [data-moved="backup"]'); await po.locator('#dl').waitFor({timeout:5000}); const [dl]=await Promise.all([po.waitForEvent('download',{timeout:10000}),po.click('#dl')]); const name=dl.suggestedFilename(); if(!/^my-fit-\d{4}-\d{2}-\d{2}\.json$/.test(name))throw new Error('file name '+name); backupFile=path.join(prof,name); await dl.saveAs(backupFile); backup=JSON.parse(fs.readFileSync(backupFile,'utf8')); if(backup.app!=='my-fit'||!backup.version||!backup.exportedAt)throw new Error('missing app/version: '+JSON.stringify({app:backup.app,version:backup.version})); if(backup.settings.weeklyGoal!==6)throw new Error('goal '+backup.settings.weeklyGoal); });

  // load it on the new home from a file
  await step('new home: starts with its own empty storage',async()=>{ const v=await pn.evaluate(k=>{ const r=localStorage.getItem(k); return r?JSON.parse(r).settings.weeklyGoal:null; },KEY); if(v===6)throw new Error('storage shared with the old home'); });
  await step('new home: importing the backup file restores the data',async()=>{ await pn.evaluate(()=>{}); await pn.click('[data-tab="settings"]'); await pn.click('[data-act="import"]'); await pn.locator('#impf').setInputFiles(backupFile); await pn.waitForFunction(()=>document.querySelector('#imp').value.length>10&&!document.querySelector('#ib').disabled,null,{timeout:5000}); await pn.click('#ib'); await pn.locator('#ok').click(); await pn.waitForTimeout(400);
    const st=await pn.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY); if(st.settings.weeklyGoal!==6)throw new Error('goal '+st.settings.weeklyGoal); const t=Object.keys(st.plans||{}); if(!t.length||!(st.plans[t[0]].items||[]).some(i=>i.exId==='ex_bench'))throw new Error('plan missing'); if(!st.body||!Object.values(st.body).some(b=>b.note==='move test'))throw new Error('check-in missing'); });
  await step('new home: a backup from another app is refused',async()=>{ await pn.click('[data-act="import"]'); await pn.fill('#imp',JSON.stringify({app:'studydesk',version:'1',settings:{weeklyGoal:1}})); await pn.click('#ib'); await pn.waitForTimeout(300); if(await pn.locator('#ok').count())throw new Error('other-app backup reached the replace confirmation'); const g=await pn.evaluate(k=>JSON.parse(localStorage.getItem(k)).settings.weeklyGoal,KEY); if(g!==6)throw new Error('goal changed to '+g); });
  await step('new home: an old backup without app/version still loads',async()=>{ const old=Object.assign({},backup); delete old.app; delete old.version; delete old.exportedAt; old.settings=Object.assign({},old.settings,{weeklyGoal:5}); await pn.evaluate(()=>{ const x=document.querySelector('.backdrop'); if(x)x.click(); }); await pn.click('[data-act="import"]'); await pn.fill('#imp',JSON.stringify(old)); await pn.click('#ib'); await pn.locator('#ok').click(); await pn.waitForTimeout(300); const g=await pn.evaluate(k=>JSON.parse(localStorage.getItem(k)).settings.weeklyGoal,KEY); if(g!==5)throw new Error('goal '+g); });
  await step('old home: its data is untouched',async()=>{ const g=await po.evaluate(k=>JSON.parse(localStorage.getItem(k)).settings.weeklyGoal,KEY); if(g!==6)throw new Error('old goal '+g); });
  await step('no page or console errors',async()=>{ const all=Object.entries(errs).filter(([k,v])=>v.length); if(all.length)throw new Error(JSON.stringify(all).slice(0,400)); });
  await ctx.close(); sA.close(); sB.close(); fs.rmSync(prof,{recursive:true,force:true});
  console.log(fails.length?'MOVE FAILED':'MOVE PASSED'); process.exit(fails.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
