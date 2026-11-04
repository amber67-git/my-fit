// PWA manifest checks (no browser): a fixed app id keeps reinstalls working; no orientation lock; icon files exist.
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..','..');
const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
check('fixed app id', m.id==='/my-fit/app', m.id);
check('no orientation lock (landscape layouts must be reachable)', !('orientation' in m), m.orientation);
check('scope and start_url stay inside the site', m.scope==='./'&&/^\.\//.test(m.start_url), m.start_url);
check('icons: every file exists', (m.icons||[]).every(i=>fs.existsSync(path.join(root,i.src))));
check('icons: a regular 192 and 512 plus a maskable 512', ['192x192:any','512x512:any','512x512:maskable'].every(k=>(m.icons||[]).some(i=>i.sizes+':'+(i.purpose||'any')===k)));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'); check('service worker caches the manifest and every icon', ['./manifest.webmanifest'].concat((m.icons||[]).map(i=>'./'+i.src)).every(f=>sw.includes("'"+f+"'")));
console.log('errors',JSON.stringify(errors)); process.exit(errors.length?1:0);
