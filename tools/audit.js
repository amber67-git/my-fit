const vm=require('vm'),fs=require('fs');
const ctx={console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('dataset.js','utf8')+'\n'+fs.readFileSync('figall.js','utf8')+'\n;globalThis.__={DEFAULT_EXERCISES,EX_FIG,figFrames,_limbs,_bodyPts,figFrameBox,FT,PZ,_fixedArrows};',ctx);
const {DEFAULT_EXERCISES,EX_FIG,figFrames,_limbs,_bodyPts,figFrameBox}=ctx.__;
const seen=new Set(); const out=[];
for(const ex of DEFAULT_EXERCISES()){ const m=EX_FIG[ex.id]; const key=m?JSON.stringify(m):'fb:'+ex.equip+ex.type+ex.muscle; if(seen.has(key))continue; seen.add(key);
  const F=figFrames(ex); F.frames.forEach((f,i)=>{ const pose=f.pose; const L=_limbs(pose); const pts=_bodyPts(pose,L); const box=figFrameBox(f,{});
    const floorY=box.floor?box.floorY:null; const maxY=Math.max(...pts.map(p=>p[1]+p[2]*0)); const minY=Math.min(...pts.map(p=>p[1]));
    const issues=[];
    if(floorY!=null&&box.floor&&maxY>floorY+3) issues.push('below floor by '+(maxY-floorY).toFixed(0));
    if(floorY!=null&&box.floor&&maxY<floorY-10) issues.push('floating '+(floorY-maxY).toFixed(0)+' above floor');
    if(!box.floor&&pose.v==='s'&&Math.abs(((pose.torso==null?180:pose.torso)%360+360)%360-180)<=50){ /* standing w/o floor: check feet level */ }
    // overlap: head centre too close to hands/feet
    const hc=pts.find(p=>p[2]===8); 
    if(issues.length) out.push(`${ex.id} [${m?m[0]+(m[1]?'/'+m[1]:''):'fallback'}] f${i}: ${issues.join('; ')}`);
  });
}
console.log(out.join('\n')); console.log(out.length,'issues');
// extra checks: props on the head, arrows crossing the head
{ const {DEFAULT_EXERCISES,EX_FIG,figFrames,_limbs,_fixedArrows}=ctx.__; const seen=new Set(); const out2=[];
  for(const ex of DEFAULT_EXERCISES()){ const m=EX_FIG[ex.id]; const key=m?JSON.stringify(m):'fb:'+ex.equip+ex.type+ex.muscle; if(seen.has(key))continue; seen.add(key);
    const F=figFrames(ex); F.frames.forEach((f,i)=>{ const L=_limbs(f.pose); const hc=L.headC; const h=(k)=>L.arms[k]?L.arms[k].hd:[50,50]; const at=(v)=>typeof v==='string'?(v==='h0'?h(0):v==='h1'?h(1):v==='mid'?[(h(0)[0]+h(1)[0])/2,(h(0)[1]+h(1)[1])/2]:[50,50]):v;
      (f.props||[]).forEach(p=>{ if(['plate','db','kb','ball'].includes(p[0])){ const c=at(p[1]); const r=p[0]==='ball'?(p[2]||11):6; const d=Math.hypot(c[0]-hc[0],c[1]-hc[1]); if(d<6+r-1) out2.push(`${ex.id} f${i}: ${p[0]} overlaps head (d=${d.toFixed(0)})`); } });
      _fixedArrows(f,L).forEach(a=>{ if(a[0]==='line'){ const [x0,y0]=a[1],[x1,y1]=a[2]; const t=Math.max(0,Math.min(1,((hc[0]-x0)*(x1-x0)+(hc[1]-y0)*(y1-y0))/(((x1-x0)**2+(y1-y0)**2)||1))); const px=x0+t*(x1-x0),py=y0+t*(y1-y0); if(Math.hypot(px-hc[0],py-hc[1])<8) out2.push(`${ex.id} f${i}: arrow crosses head`); } });
    }); }
  console.log(out2.join('\n')); console.log(out2.length,'overlap issues'); }
