// Muscle-map renderer checks (no browser): side selection, band overlaps, weights, hair.
const fs=require('fs'); const path=require('path');
const src=['bodymap-data.js','bodymap.js'].map(f=>fs.readFileSync(path.resolve(__dirname,'..','..','src','figure',f),'utf8')).join('\n');
const M=new Function(src+';return {bodyMapSvg,muscleMapHtml,bodyViewsFor,BODY_RULES};')();
const errors=[]; const check=(name,ok,info)=>{ console.log((ok?'ok   ':'FAIL ')+name+(info!==undefined?' — '+info:'')); if(!ok)errors.push(name); };
const bands=s=>(s.match(/clip-path=/g)||[]).length; const bandOp=s=>Number((s.match(/clip-path="[^"]+" style="opacity:([\d.]+)/)||[])[1]);
check('back-only exercise shows the back', JSON.stringify(M.bodyViewsFor(['lats','rhomboids'],['biceps']))==='["b"]');
check('front-only exercise shows the front', JSON.stringify(M.bodyViewsFor(['chest_upper'],['triceps']))==='["f"]');
check('front+back primaries show both', JSON.stringify(M.bodyViewsFor(['quads','glute_max'],[]))==='["f","b"]');
check('cardio heart shows the front', JSON.stringify(M.bodyViewsFor(['heart'],[]))==='["f"]');
check('every SUB key has a rule', ['chest_upper','chest_mid','chest_lower','lats','traps','rhomboids','erectors','delt_front','delt_side','delt_rear','rotator','biceps','triceps','forearms','quads','hams','glute_max','glute_med','adductors','hip_flexors','calves','abs','obliques','core_deep','full_body','heart'].every(k=>k in M.BODY_RULES));
let s=M.bodyMapSvg('f',['quads','hip_flexors'],[],200,{weights:{quads:.65,hip_flexors:.65}}); check('equal weights: no double-drawn overlap', bands(s)===0, bands(s));
s=M.bodyMapSvg('f',['quads','hip_flexors'],[],200,{weights:{quads:.4,hip_flexors:.9}}); check('stronger band reaches its own value', Math.abs(bandOp(s)-(1-(1-.9)/(1-.4)))<0.01, bandOp(s));
s=M.bodyMapSvg('f',['quads'],['hip_flexors'],200,{}); check('secondary band never covers a primary piece', bands(s)===0);
s=M.bodyMapSvg('f',['hip_flexors'],['quads'],200,{}); check('primary band over secondary piece is fully red', bandOp(s)===1, bandOp(s));
s=M.bodyMapSvg('f',['chest_upper'],[],200,{}); check('upper chest is a band, not the whole pec', bands(s)===2 && !/class="r p"(?! clip)/.test(s.replace(/<path d="[^"]*" class="r p" clip-path[^>]*>/g,'')));
for(const sex of ['m','f'])for(const v of ['f','b']){ s=M.bodyMapSvg(v,[],[],200,{sex}); check(`hair drawn (${sex}/${v})`, /class="hair"/.test(s)); }
console.log('errors',JSON.stringify(errors)); process.exit(errors.length?1:0);
