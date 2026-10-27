const { chromium } = require(process.env.PW_MODULE||'playwright');
(async()=>{const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const p=await b.newPage({viewport:{width:900,height:900}});
  await p.goto('file://'+process.cwd()+'/review.html?p=0'); const total=await p.evaluate(()=>window.__total); const pages=Math.ceil(total/4);
  for(let i=0;i<pages;i++){ await p.goto('file://'+process.cwd()+'/review.html?p='+i); await p.screenshot({path:`rv-${String(i).padStart(2,'0')}.png`,fullPage:true}); }
  console.log('pages',pages,'figures',total); await b.close();})();
