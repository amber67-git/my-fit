const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:900,height:900}});
  await p.goto('file://'+process.cwd()+'/review.html?p=0'); const total=await p.evaluate(()=>window.__total); const pages=Math.ceil(total/4);
  for(let i=0;i<pages;i++){ await p.goto('file://'+process.cwd()+'/review.html?p='+i); await p.screenshot({path:`rv-${String(i).padStart(2,'0')}.png`,fullPage:true}); }
  console.log('pages',pages,'figures',total); await b.close();})();
