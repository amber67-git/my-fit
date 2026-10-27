// joint-angle audit: foot vs shin (ankle), knee flexion, elbow flexion — flags anatomically implausible frames
const vm=require('vm'),fs=require('fs');
const ctx={console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('dataset.js','utf8')+'\n'+fs.readFileSync('figall.js','utf8')+'\n;globalThis.__={DEFAULT_EXERCISES,EX_FIG,figFrames,_limbs};',ctx);
const {DEFAULT_EXERCISES,EX_FIG,figFrames,_limbs}=ctx.__;
const D=180/Math.PI; const ang=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0])*D;
const norm=(x)=>{while(x>180)x-=360;while(x<=-180)x+=360;return x;};
const only=process.argv[2]; const seen=new Set(); const out=[];
for(const ex of DEFAULT_EXERCISES()){ if(only&&!ex.id.includes(only))continue; const m=EX_FIG[ex.id]; const key=m?JSON.stringify(m):'fb:'+ex.equip+ex.type+ex.muscle; if(seen.has(key))continue; seen.add(key);
  const F=figFrames(ex); F.frames.forEach((f,i)=>{ const pose=f.pose; const L=_limbs(pose); const issues=[];
    L.legs.forEach((l,k)=>{ const shin=ang(l.kn,l.an), foot=ang(l.an,l.toe), thigh=ang(l.h,l.kn);
      const rel=Math.abs(norm(foot-shin)); // 90 = neutral ankle; <60 or >150 implausible
      const knee=Math.abs(norm(shin-thigh)); // 0 = straight, >150 implausible
      if(pose.v==="s"&&(rel<34||rel>116)) issues.push(`leg${k} ankle ${rel.toFixed(0)}° (shin ${shin.toFixed(0)}°, foot ${foot.toFixed(0)}°)`);
      if(knee>152) issues.push(`leg${k} knee flex ${knee.toFixed(0)}°`);
    });
    L.arms.forEach((a,k)=>{ if(!a.s||!a.el||!a.hd)return; const up=ang(a.s,a.el), fo=ang(a.el,a.hd); const el=Math.abs(norm(fo-up)); if(el>152) issues.push(`arm${k} elbow flex ${el.toFixed(0)}°`); });
    if(issues.length) out.push(`${ex.id} [${m?m[0]+(m[2]?' '+JSON.stringify(m[2]):''):'fb'}] f${i}: ${issues.join('; ')}`);
  });
}
console.log(out.join('\n')); console.log(out.length,'joint issues');
