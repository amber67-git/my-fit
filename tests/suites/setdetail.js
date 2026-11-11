// Set details (v0.35): optional per-set RPE and drop / to-failure marks, session RPE from the average, CSV columns.
const path=require('path'); const fs=require('fs');
const { chromium } = require(process.env.PW_MODULE||'playwright');
const HARNESS=process.env.HARNESS||path.resolve(__dirname,'..','..','build','test.html');
const APP_VER=(fs.readFileSync(path.resolve(__dirname,'..','..','src','app.html'),'utf8').match(/APP_VERSION='([^']+)'/)||[])[1];
const LAUNCH=process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs=[]; const errors=[];
  const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message));
  await page.goto('file://'+HARNESS);
  await page.evaluate((v)=>{localStorage.clear();localStorage.setItem('wwt.seenVersion',v);},APP_VER);
  await page.reload(); await page.waitForTimeout(300);
  const start=async(on)=>{ await page.evaluate((on)=>{ const T=window.__T; T.P.active=false; document.querySelector('#perf')?.remove(); T.S.settings.lang='ko'; T.S.settings.setDetail=on; T.S.settings.warmupOn=false; T.S.plans={}; T.S.logs={}; const ex=T.S.exercises.find(e=>e.id==='ex_bench'); const it=T.addPlanItem(T.todayKey(),ex); T.S.tab='dash'; T.render(); T.startQueue([{date:T.todayKey(),id:it.id}]); },on); await page.locator('[data-p="start"]').waitFor({timeout:3000}); await page.click('[data-p="start"]'); await page.locator('[data-p="setdone"]').first().waitFor({timeout:3000}); };
  // off: nothing extra
  await start(false);
  check('with the setting off there are no type chips or RPE buttons', await page.evaluate(()=>!document.querySelector('[data-p="skind"],[data-p="srpe"]')));
  // on
  await start(true);
  check('each working set has a type chip reading 일반', await page.evaluate(()=>[...document.querySelectorAll('[data-p="skind"]')].map(b=>b.textContent).join('|'))==='일반|일반|일반');
  check('no RPE buttons before a set is ticked', await page.locator('[data-p="srpe"]').count()===0);
  await page.click('[data-p="skind"][data-i="2"]'); await page.waitForTimeout(60);
  check('tapping the chip makes it 드롭세트', await page.evaluate(()=>window.__T.P.sets[2].kind==='drop'&&document.querySelector('[data-p="skind"][data-i="2"]').textContent==='드롭세트'));
  await page.click('[data-p="skind"][data-i="2"]'); await page.waitForTimeout(60);
  check('tapping again makes it 실패까지', await page.evaluate(()=>window.__T.P.sets[2].kind==='fail'));
  await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(60);
  check('a ticked set shows RPE 6–10', await page.locator('[data-p="srpe"][data-i="0"]').count()===5);
  await page.click('[data-p="srpe"][data-i="0"][data-v="7"]'); await page.waitForTimeout(60);
  await page.click('[data-p="setdone"][data-i="1"]'); await page.waitForTimeout(60); await page.click('[data-p="srpe"][data-i="1"][data-v="9"]'); await page.waitForTimeout(60);
  await page.click('[data-p="setdone"][data-i="2"]'); await page.waitForTimeout(60); await page.click('[data-p="srpe"][data-i="2"][data-v="10"]'); await page.waitForTimeout(60);
  await page.click('[data-p="srpe"][data-i="2"][data-v="10"]'); await page.waitForTimeout(60);
  check('tapping the chosen RPE again clears it', await page.evaluate(()=>window.__T.P.sets[2].rpe===undefined));
  await page.click('[data-p="srpe"][data-i="2"][data-v="10"]'); await page.waitForTimeout(60);
  await page.locator('[data-p="finish"]').first().click(); await page.locator('[data-p="next"]').first().waitFor({timeout:3000});
  check('the workout RPE is pre-filled with the average (7, 9, 10 → 9)', await page.evaluate(()=>window.__T.P.result.rpe===9&&!!document.querySelector('[data-rpe="9"].on')));
  await page.click('[data-p="next"]'); await page.waitForTimeout(150);
  const log=await page.evaluate(()=>{ const T=window.__T; const e=T.logOf(T.todayKey())[0]; return e.sets.map(s=>(s.rpe||'-')+'/'+(s.kind||'n')).join(','); });
  check('the log keeps each set\'s RPE and type', log==='7/n,9/n,10/fail', log);
  const csv=await page.evaluate(()=>window.__T.rptCsv());
  const head=csv.split('\n').find(l=>l.startsWith('date,exercise_id'))||''; const line=csv.split('\n').find(l=>/ex_bench/.test(l)&&/,10,fail/.test(l));
  check('CSV has set_rpe and set_kind columns with the values', /set_rpe,set_kind/.test(head)&&!!line, head.slice(-40)+' :: '+(line||'').slice(-30));
  // every CSV row of the sets section has as many columns as the header (timed entries included)
  const cols=await page.evaluate(()=>{ const T=window.__T; T.S.logs['2026-01-02']={entries:[{id:'tm',planItemId:'ptm',exId:'ex_hamstring',mode:'time',startedAt:1,endedAt:2,duration:120,sets:[],memo:'',condition:3,rpe:0}]}; const lines=T.rptCsv().split('\n'); const hi=lines.findIndex(l=>l.startsWith('date,exercise_id')); const n=s=>{ let c=1,q=false; for(const ch of s){ if(ch==='"')q=!q; else if(ch===','&&!q)c++; } return c; }; const head=n(lines[hi]); const rows=[]; for(let i=hi+1;i<lines.length&&lines[i]&&!lines[i].startsWith('#');i++)rows.push(n(lines[i])); return {head,bad:rows.filter(x=>x!==head).length,rows:rows.length}; });
  check('every sets-section CSV row (timed rows too) has the header\'s column count', cols.bad===0&&cols.rows>3, JSON.stringify(cols));
  // accessibility: chip names its current type, RPE buttons expose the pressed state
  await start(true); await page.click('[data-p="skind"][data-i="0"]'); await page.waitForTimeout(40); await page.click('[data-p="setdone"][data-i="0"]'); await page.waitForTimeout(40); await page.click('[data-p="srpe"][data-i="0"][data-v="8"]'); await page.waitForTimeout(40);
  const a11y=await page.evaluate(()=>({chip:document.querySelector('[data-p="skind"][data-i="0"]').getAttribute('aria-label'),pressed:[...document.querySelectorAll('[data-p="srpe"][data-i="0"]')].map(b=>b.getAttribute('aria-pressed')).join(',')}));
  check('the type chip\'s accessible name includes the current type; the chosen RPE is aria-pressed', /세트 유형: 드롭세트/.test(a11y.chip)&&a11y.pressed==='false,false,true,false,false', JSON.stringify(a11y));
  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('errors',JSON.stringify(errors)); await browser.close(); process.exit(errors.length?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
