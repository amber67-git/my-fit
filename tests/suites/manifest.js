// PWA manifest checks (no browser): a fixed app id keeps reinstalls working; no orientation lock; icon files exist.
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..','..');
const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
check('fixed app id', m.id==='/my-fit/app', m.id);
check('no orientation lock (landscape layouts must be reachable)', !('orientation' in m), m.orientation);
{ const base='https://amber67-git.github.io/my-fit/manifest.webmanifest'; const scope=new URL(m.scope||'./',base).href, start=new URL(m.start_url||'.',base).href, id=new URL(m.id,new URL(m.start_url||'.',base)).href;
  check('scope resolves to the site folder', scope==='https://amber67-git.github.io/my-fit/', scope);
  check('start_url resolves inside the scope', start.startsWith(scope), start);
  check('app id resolves on the same origin', new URL(id).origin===new URL(base).origin, id); }
check('icons: every file exists', (m.icons||[]).every(i=>fs.existsSync(path.join(root,i.src))));
check('icons: a regular 192 and 512 plus a maskable 512', ['192x192:any','512x512:any','512x512:maskable'].every(k=>(m.icons||[]).some(i=>i.sizes+':'+(i.purpose||'any')===k)));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'); check('service worker caches the manifest and every icon', ['./manifest.webmanifest'].concat((m.icons||[]).map(i=>'./'+i.src)).every(f=>sw.includes("'"+f+"'")));
console.log('errors',JSON.stringify(errors)); process.exit(errors.length?1:0);
