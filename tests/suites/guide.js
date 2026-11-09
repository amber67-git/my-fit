// In-app guide checks (no browser): the guide must stay in step with the app version, both languages, and the live address.
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..','..');
const app=fs.readFileSync(path.join(root,'src','app.html'),'utf8'); const src=fs.readFileSync(path.join(root,'src','guide.js'),'utf8');
const G=new Function('S','APP_VERSION','esc','t','view','ICO',src+';return {GUIDE,GUIDE_HISTORY,GUIDE_VERSION,GUIDE_DATE,renderGuide};')({settings:{lang:'ko'}},'0',x=>String(x),k=>k,{innerHTML:''},{back:''});
const APP=(app.match(/APP_VERSION='([^']+)'/)||[])[1]; const NEW_HOME=(app.match(/const NEW_HOME='([^']*)'/)||[])[1];
const mm=v=>String(v).split('.').slice(0,2).join('.');
const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
check('guide written against the current app line (major.minor)', mm(G.GUIDE_VERSION)===mm(APP), G.GUIDE_VERSION+' vs app '+APP);
check('FAQ date is a real date not in the future', /^\d{4}-\d{2}-\d{2}$/.test(G.GUIDE_DATE)&&!isNaN(Date.parse(G.GUIDE_DATE))&&Date.parse(G.GUIDE_DATE)<=Date.now()+86400000, G.GUIDE_DATE);
check('at least 8 sections', G.GUIDE.length>=8, G.GUIDE.length);
G.GUIDE.forEach(s=>{ const shape=a=>a.map(x=>typeof x==='string'?(x.startsWith('• ')?'li':'p'):(x&&x.q&&x.a?'qa':'bad')).join(',');
  check(`section "${s.id}": title in both languages`, !!(s.title&&s.title.en&&s.title.ko));
  check(`section "${s.id}": same structure in EN and KO`, Array.isArray(s.en)&&Array.isArray(s.ko)&&s.en.length===s.ko.length&&shape(s.en)===shape(s.ko)&&!/bad/.test(shape(s.en)), shape(s.en)+' | '+shape(s.ko)); });
check('FAQ section exists with question/answer pairs', G.GUIDE.some(s=>s.id==='faq'&&s.en.every(x=>x.q&&x.a)));
check('history newest first', G.GUIDE_HISTORY.every((h,i,a)=>i===0||a[i-1].date>=h.date), G.GUIDE_HISTORY.map(h=>h.date).join(' > '));
check('history top entry is the current app line', mm(G.GUIDE_HISTORY[0].v)===mm(APP), G.GUIDE_HISTORY[0].v);
check('history entries have both languages and ISO dates', G.GUIDE_HISTORY.every(h=>h.en&&h.ko&&/^\d{4}-\d{2}-\d{2}$/.test(h.date)));
const text=JSON.stringify(G.GUIDE);
check('guide names the live address (NEW_HOME)', !NEW_HOME||text.includes(NEW_HOME.replace(/\/$/,'')), NEW_HOME);
// one definition of "mentions clearing site data", shared by the collector and its own regression check below
const SITE_DATA_RE=/clear(ing)?\s+(the\s+|this\s+|all\s+|your\s+)?site\s+data|site\s+data[^.]{0,20}\bclear|사이트\s*데이터(를|을|는|도)?\s*(삭제|지우|지워)/i;
// every passage that mentions clearing site data must itself say not to (a "never" elsewhere does not excuse a passage that recommends it)
{ const passages=[]; G.GUIDE.forEach(s=>['en','ko'].forEach(l=>s[l].forEach(x=>{ const str=typeof x==='string'?x:x.q+' '+x.a; if(SITE_DATA_RE.test(str))passages.push(str); }))); const bad=passages.filter(p=>!/never|do not|don't|하지 마세요|누르지 마|금지|절대/i.test(p)); check('every mention of clearing site data says not to ('+passages.length+' passages)', passages.length>0&&!bad.length, bad.join(' || ').slice(0,200)); }
// the collector itself must catch phrasing variants that recommend clearing (regression guard for the check above)
{ const re=SITE_DATA_RE; const variants=['Clear the site data to fix this.','Try clearing all site data.','Site data should be cleared first.','사이트 데이터를 삭제하면 됩니다.','사이트데이터 지우기로 해결하세요.']; check('site-data collector recognises phrasing variants', variants.every(v=>re.test(v))); }
check('renderGuide builds a page with every section and the history', (()=>{ const view={innerHTML:''}; const F=new Function('S','APP_VERSION','esc','t','view','ICO',src+';renderGuide();return view.innerHTML;'); const html=F({settings:{lang:'en'}},APP,x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),k=>k,view,{back:''}); return G.GUIDE.every(s=>html.includes('id="g-'+s.id+'"'))&&html.includes('id="g-history"')&&html.includes('Guide written against version: v'+G.GUIDE_VERSION); })());
check('renderGuide renders Korean content when lang is ko', (()=>{ const view={innerHTML:''}; const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); const F=new Function('S','APP_VERSION','esc','t','view','ICO',src+';renderGuide();return view.innerHTML;'); const html=F({settings:{lang:'ko'}},APP,esc,k=>k,view,{back:''}); return html.includes(esc(G.GUIDE[0].title.ko))&&html.includes(esc(G.GUIDE[0].ko[0]))&&html.includes(esc(G.GUIDE_HISTORY[0].ko))&&!html.includes(esc(G.GUIDE[0].en[0])); })());
console.log('errors',JSON.stringify(errors)); process.exit(errors.length?1:0);
