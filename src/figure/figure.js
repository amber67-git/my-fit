// ---------- Pose figure renderer: proportional line pictograms ----------
const FIG={head:5.6,neck:3,torso:24,upper:16,fore:14,thigh:21,shin:19,foot:7,shW:8,hipW:5,sw:4};
function _dir(a){const r=a*Math.PI/180;return [Math.sin(r),Math.cos(r)];}
function _pt(p,a,len){const d=_dir(a);return [p[0]+d[0]*len,p[1]+d[1]*len];}
// ankle range of motion: foot angle is kept within plantarflexion 55° / dorsiflexion 25° of neutral (toes perpendicular to the shin, in front of it); null = neutral
// elbow range of motion: forearm never folds past 150° of flexion relative to the upper arm
function _elbow(up,fo){ let d=fo-up; while(d>180)d-=360; while(d<=-180)d+=360; if(d>150)d=150; if(d<-150)d=-150; return up+d; }
function _ankle(shin,foot){ const n=shin+90; if(foot==null)return n; let d=foot-n; while(d>180)d-=360; while(d<-180)d+=360; if(d<-55)d=-55; if(d>25)d=25; return n+d; }
function _n(v){return Math.round(v*10)/10;}
function _L(a,b){return `M${_n(a[0])} ${_n(a[1])}L${_n(b[0])} ${_n(b[1])}`;}
function _poly(pts){return 'M'+pts.map(p=>_n(p[0])+' '+_n(p[1])).join('L');}
// pose: {v:'s'|'f', hip:[x,y], torso:deg(180=up,90=forward), head:degOffset, arms:[[upper,fore],[upper,fore]], legs:[[thigh,shin,foot],[..]], flip:bool}
function _limbs(pose){
  const o={}; const hip=pose.hip; const t=pose.torso==null?180:pose.torso;
  if(pose.v==='f'){
    const shC=[hip[0],hip[1]-FIG.torso]; o.shC=shC; o.sh=[[shC[0]+FIG.shW,shC[1]],[shC[0]-FIG.shW,shC[1]]]; o.hips=[[hip[0]+FIG.hipW,hip[1]],[hip[0]-FIG.hipW,hip[1]]];
    o.headC=[shC[0],shC[1]-FIG.neck-FIG.head]; o.neckEnd=[shC[0],shC[1]-FIG.neck];
    o.arms=(pose.arms||[[0,0],[0,0]]).map((a,i)=>{const sg=i===0?1:-1; const s=o.sh[i]; const el=_pt(s,a[0]*sg,FIG.upper); const hd=_pt(el,_elbow(a[0],a[1])*sg,FIG.fore); return {s,el,hd};});
    o.legs=(pose.legs||[[0,0],[0,0]]).map((l,i)=>{const sg=i===0?1:-1; const h=o.hips[i]; const kn=_pt(h,l[0]*sg,FIG.thigh); const an=_pt(kn,l[1]*sg,FIG.shin); const toe=_pt(an,(l[2]==null?0:l[2])*sg,FIG.foot*0.6); return {h,kn,an,toe};});
  } else {
    const sh=_pt(hip,t,FIG.torso); o.sh=sh; const ha=t+(pose.head||0); o.neckEnd=_pt(sh,ha,FIG.neck); o.headC=_pt(o.neckEnd,ha,FIG.head);
    o.arms=(pose.arms||[[0,0],[0,0]]).map(a=>{const el=_pt(sh,a[0],FIG.upper); const hd=_pt(el,_elbow(a[0],a[1]),FIG.fore); return {s:sh,el,hd};});
    o.legs=(pose.legs||[[0,0,90],[0,0,90]]).map(l=>{const kn=_pt(hip,l[0],FIG.thigh); const an=_pt(kn,l[1],FIG.shin); const toe=_pt(an,_ankle(l[1],l[2]),FIG.foot); return {h:hip,kn,an,toe};});
  }
  return o;
}
function _figurePaths(pose,opts){
  opts=opts||{}; const L=_limbs(pose); const simple=opts.simple; const hl=opts.muscle||''; const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  // segments: {pts, k(kind), far}
  const segs=[]; const pathOf=(pts)=>_poly(pts);
  const addLimb=(pts,k,far)=>segs.push({pts,k,far});
  if(pose.v==='f'){
    const arms=pose.arms||[[0,0],[0,0]], legs=pose.legs||[[0,0],[0,0]];
    L.legs.forEach((l,i)=>{addLimb([l.h,l.kn],'thigh',false);addLimb([l.kn,l.an],'shin',false);segs.push({pts:[l.an,l.toe],k:'foot',far:false,kn:l.kn,fv:true});});
    segs.push({torsoF:true});
    segs.push({pts:[L.shC,L.neckEnd],k:'neck'});
    L.arms.forEach((a,i)=>{addLimb([a.s,a.el],'armU',false);addLimb([a.el,a.hd],'armF',false);});
  } else {
    const arms=pose.arms||[[0,0],[0,0]], legs=pose.legs||[[0,0,90],[0,0,90]];
    const farArm=arms.length>1&&!same(arms[0],arms[1]), farLeg=legs.length>1&&!same(legs[0],legs[1]);
    if(legs.length>1){const l=L.legs[1]; addLimb([l.h,l.kn],'thigh',true);addLimb([l.kn,l.an],'shin',true);segs.push({pts:[l.an,l.toe],k:'foot',far:true,kn:l.kn});}
    if(arms.length>1){const a=L.arms[1]; addLimb([a.s,a.el],'armU',true);addLimb([a.el,a.hd],'armF',true);}
    const mid=[(pose.hip[0]+L.sh[0])/2,(pose.hip[1]+L.sh[1])/2];
    segs.push({torsoS:true,mid});
    segs.push({pts:[L.sh,L.neckEnd],k:'neck'});
    {const l=L.legs[0]; addLimb([l.h,l.kn],'thigh',false);addLimb([l.kn,l.an],'shin',false);segs.push({pts:[l.an,l.toe],k:'foot',far:false,kn:l.kn});}
    {const a=L.arms[0]; addLimb([a.s,a.el],'armU',false);addLimb([a.el,a.hd],'armF',false);}
  }
  const hlKinds={chest:['torsoU'],back:['torsoU'],core:['torsoL'],arms:['armU','armF'],legs:['thigh','shin'],innerthigh:['thigh'],outerthigh:['thigh','hip'],glutes:['hip'],shoulders:['shoulder'],full:[]};
  const hk=new Set(hlKinds[hl]||[]);
  const hc=[L.headC[0]+(pose.headTilt||0)*0.25,L.headC[1]+Math.abs(pose.headTilt||0)*0.05];
  const wOut=(k)=>k==='torsoU'||k==='torsoL'?11:k==='neck'?6.5:k==='foot'?6.5:k==='thigh'?9.5:k==='armU'?9:k==='shin'?8.2:8;
  const wIn=(k)=>k==='torsoU'||k==='torsoL'?7:k==='neck'?3:k==='foot'?3:k==='thigh'?5.6:k==='armU'?5.2:k==='shin'?4.5:4.3;
  const nrm=(v)=>{const l=Math.hypot(v[0],v[1])||1;return [v[0]/l,v[1]/l];}; const ad=(p,v,k)=>[p[0]+v[0]*k,p[1]+v[1]*k]; const r90=(v)=>[-v[1],v[0]];
  const torsoPoly=()=>{ const sR=L.sh[0],sL=L.sh[1],hR=L.hips[0],hL=L.hips[1]; const wR=[(sR[0]+hR[0])/2-2.2,(sR[1]+hR[1])/2+2], wL=[(sL[0]+hL[0])/2+2.2,(sL[1]+hL[1])/2+2]; return `M${_n(sL[0])} ${_n(sL[1])}L${_n(sR[0])} ${_n(sR[1])}Q${_n(wR[0])} ${_n(wR[1])} ${_n(hR[0])} ${_n(hR[1])}L${_n(hL[0])} ${_n(hL[1])}Q${_n(wL[0])} ${_n(wL[1])} ${_n(sL[0])} ${_n(sL[1])}Z`; };
  const torsoSide=()=>{ const H=pose.hip,S=L.sh; const a=nrm([S[0]-H[0],S[1]-H[1]]); const n=r90(a); const P=(t,w)=>ad(ad(H,a,t),n,w);
    const hf=P(0,4.6), wf=P(9,3.6), cf=P(19,6.2), sf=P(25,4.6), sb=P(25.5,-4.8), ub=P(16,-6.4), lb=P(6,-4.8), hb=P(-0.5,-5.2); const q=(c,p)=>`Q${_n(c[0])} ${_n(c[1])} ${_n(p[0])} ${_n(p[1])}`;
    return `M${_n(hf[0])} ${_n(hf[1])}${q(wf,P(15,5.4))}${q(cf,sf)}${q(P(27,0),sb)}${q(ub,P(10,-5.4))}${q(lb,hb)}${q(P(-2.5,0),hf)}Z`; };
  const shoePath=(sg)=>{ const A=sg.pts[0],T=sg.pts[1]; const d=nrm([T[0]-A[0],T[1]-A[1]]); let n;
    if(sg.fv){ const c=[A[0],A[1]+2.4]; return `M${_n(c[0]-4.2)} ${_n(c[1])}a4.2 3 0 1 0 8.4 0a4.2 3 0 1 0 -8.4 0Z`; }
    const sdir=nrm([A[0]-sg.kn[0],A[1]-sg.kn[1]]); const dot=sdir[0]*d[0]+sdir[1]*d[1]; let v=[sdir[0]-d[0]*dot,sdir[1]-d[1]*dot]; if(Math.hypot(v[0],v[1])<0.2)v=r90(d); n=nrm(v);
    const pts=[ad(ad(A,d,-1.5),n,-1.4),ad(ad(A,d,-3.8),n,1.2),ad(ad(A,d,-3.6),n,3.4),ad(ad(A,d,6.5),n,4.6),ad(ad(A,d,8.6),n,3.6),ad(ad(A,d,8.2),n,1.8),ad(ad(A,d,5),n,0.6),ad(ad(A,d,2.2),n,-1.4)]; return _poly(pts)+'Z'; };
  const grips=opts.grips||[];
  const handPath=(i)=>{ const a=L.arms[i]; const W=a.hd; const f=nrm([W[0]-a.el[0],W[1]-a.el[1]]); const n=r90(f);
    if(grips[i]){ const c=ad(W,f,2.2); const ang=Math.atan2(f[1],f[0])*180/Math.PI; return {d:`M${_n(c[0]-3.4)} ${_n(c[1])}a3.4 2.8 0 1 0 6.8 0a3.4 2.8 0 1 0 -6.8 0Z`,tf:`rotate(${_n(ang)} ${_n(c[0])} ${_n(c[1])})`}; }
    const pts=[ad(W,n,2.2),ad(ad(W,f,3.6),n,2.6),ad(ad(W,f,5.8),n,1.4),ad(ad(W,f,5.8),n,-1.4),ad(ad(W,f,3.6),n,-2.6),ad(W,n,-2.2)]; return {d:_poly(pts)+'Z',tf:''}; };
  const pass1=(sg)=>{ if(sg.torsoF) return `<path d="${torsoPoly()}" stroke-width="3.7" fill="currentColor"/>`; if(sg.torsoS) return `<path d="${torsoSide()}" stroke-width="3.7" fill="currentColor"/>`; if(sg.k==='foot') return `<path d="${shoePath(sg)}" stroke-width="3.7" fill="currentColor"/>`; return `<path d="${_poly(sg.pts)}" stroke-width="${wOut(sg.k)}"/>`; };
  const pass2=(sg)=>{ if(sg.torsoS){ let x=`<path d="${torsoSide()}" class="fillp" stroke="none"/>`; if(hk.has('torsoU'))x+=`<path d="${_L(sg.mid,L.sh)}" stroke-width="5.5" class="hls"/>`; if(hk.has('torsoL'))x+=`<path d="${_L(pose.hip,sg.mid)}" stroke-width="5.5" class="hls"/>`; return x; }
    if(sg.k==='foot') return `<path d="${shoePath(sg)}" class="fillp" stroke="none"/>`;
    if(sg.torsoF){ let x=`<path d="${torsoPoly()}" class="fillp" stroke="none"/>`; const top=[L.sh[1],L.sh[0],[L.hips[0][0]+1.5,L.hips[0][1]-11],[L.hips[1][0]-1.5,L.hips[1][1]-11]]; const bot=[[L.hips[1][0]-1.5,L.hips[1][1]-11],[L.hips[0][0]+1.5,L.hips[0][1]-11],L.hips[0],L.hips[1]]; if(hk.has('torsoU'))x+=`<path d="${_poly(top)}Z" class="hlf"/>`; if(hk.has('torsoL'))x+=`<path d="${_poly(bot)}Z" class="hlf"/>`; return x; }
    return `<path d="${_poly(sg.pts)}" stroke-width="${wIn(sg.k)}" class="${hk.has(sg.k)?'hls':'fill'}"/>`; };
  const simpleSeg=(sg)=>{ if(sg.torsoF) return `<path d="${torsoPoly()}" stroke-width="${FIG.sw}"/>`; if(sg.torsoS) return `<path d="${_poly([pose.hip,L.sh])}" stroke-width="${FIG.sw}" class="${hk.has('torsoU')||hk.has('torsoL')?'hls':''}"/>`; return `<path d="${_poly(sg.pts)}" stroke-width="${FIG.sw}" class="${hk.has(sg.k)?'hls':''}"/>`; };
  const headOut=simple?`<circle cx="${_n(hc[0])}" cy="${_n(hc[1])}" r="${FIG.head}" stroke-width="${FIG.sw}"/>`:`<circle cx="${_n(hc[0])}" cy="${_n(hc[1])}" r="${FIG.head+1.5}" fill="currentColor" stroke="none"/>`;
  const headIn=simple?'':`<circle cx="${_n(hc[0])}" cy="${_n(hc[1])}" r="${FIG.head-0.2}" class="fillp" stroke="none"/>`;
  const dots=()=>{ let x=''; if(hk.has('hip')) x+=(pose.v==='f'?L.hips:[pose.hip]).map(p=>`<circle cx="${_n(p[0])}" cy="${_n(p[1])}" r="${simple?3:4.5}" class="hlf"/>`).join(''); if(hk.has('shoulder')) x+=(pose.v==='f'?L.sh:[L.sh]).map(p=>`<circle cx="${_n(p[0])}" cy="${_n(p[1])}" r="${simple?3:4.5}" class="hlf"/>`).join(''); return x; };
  const hands=L.arms.map(a=>a.hd);
  const handIdx=(far)=>far?[1]:[0];
  const handsOut=(far)=>handIdx(far).filter(i=>L.arms[i]).map(i=>{ if(simple){const h=hands[i];return `<circle cx="${_n(h[0])}" cy="${_n(h[1])}" r="2.6" fill="currentColor" stroke="none"/>`;} const hp=handPath(i); return `<path d="${hp.d}" transform="${hp.tf}" stroke-width="3.4" fill="currentColor"/>`; }).join('');
  const handsIn=(far)=>simple?'':handIdx(far).filter(i=>L.arms[i]).map(i=>{ const hp=handPath(i); return `<path d="${hp.d}" transform="${hp.tf}" class="fillp" stroke="none"/>`; }).join('');
  const render=(list,withHead)=>{ if(simple){ const far=!withHead&&list.some(x=>x.far); const hasArm=list.some(x=>x.k==='armF'); return list.map(simpleSeg).join('')+(hasArm?handsOut(far):'')+(withHead?headOut+dots():''); } const far=!withHead&&list.some(x=>x.far); const hasArm=list.some(x=>x.k==='armF'); return list.map(pass1).join('')+(hasArm?handsOut(far):'')+(withHead?headOut:'')+list.map(pass2).join('')+(hasArm?handsIn(far):'')+(withHead?headIn+dots():''); };
  const farSegs=segs.filter(x=>x.far), nearSegs=segs.filter(x=>!x.far);
  let out=''; if(farSegs.length) out+=`<g transform="translate(2 0)">${render(farSegs,false).replace(/class="hls"/g,'class="fill"')}</g>`;
  const legsOut=[]; const rest=[]; nearSegs.forEach(sg=>((sg.k==='thigh'||sg.k==='shin'||sg.k==='foot')&&pose.tilt?legsOut:rest).push(sg));
  let body=render(rest,true);
  if(pose.tilt) body=`<g transform="rotate(${pose.tilt} ${_n(pose.hip[0])} ${_n(pose.hip[1])})">${body}</g>`;
  let svg=(legsOut.length?render(legsOut,false):'')+out+body;
  if(pose.rot) svg=`<g transform="rotate(${pose.rot} ${_n(pose.hip[0])} ${_n(pose.hip[1])})">${svg}</g>`;
  let gripSvg=''; if(!simple&&grips[0]&&L.arms[0]){ const hp=handPath(0); gripSvg=`<path d="${hp.d}" transform="${hp.tf}" stroke-width="3.4" fill="currentColor"/><path d="${hp.d}" transform="${hp.tf}" class="fillp" stroke="none"/>`; if(pose.tilt)gripSvg=`<g transform="rotate(${pose.tilt} ${_n(pose.hip[0])} ${_n(pose.hip[1])})">${gripSvg}</g>`; if(pose.rot)gripSvg=`<g transform="rotate(${pose.rot} ${_n(pose.hip[0])} ${_n(pose.hip[1])})">${gripSvg}</g>`; }
  return {svg,L,gripSvg};
}
// props: drawn relative to limb points. spec: ['floor',y] ['bar',[x,y],w] (barbell front) ['plate',[x,y]] (barbell side) ['db',[x,y],ang] ['kb',[x,y]] ['band',[x0,y0],[x1,y1]] ['ball',[x,y],r] ['bench',[x,y],w] ['pullbar',y,x0,x1] ['box',[x,y],w,h] ['wall',x] ['bike'] ['rope',[x,y],r] ['stairs',[x,y]] ['rower',[x,y]] ['treadmill',[x,y]] ['mat',y]
function _prop(sp,L){
  const h=(i)=>L.arms[i]?L.arms[i].hd:[50,50];
  const at=(v)=>typeof v==='string'?(v==='h0'?h(0):v==='h1'?h(1):v==='mid'?[(h(0)[0]+h(1)[0])/2,(h(0)[1]+h(1)[1])/2]:v==='sh'?(L.sh.length===2&&typeof L.sh[0]==='number'?L.sh:L.shC):v==='a0'?L.legs[0].an:v==='a1'?L.legs[1].an:[50,50]):v;
  switch(sp[0]){
    case 'floor': return `<path class="p" d="M4 ${sp[1]}H96"/>`;
    case 'plate': {const p=at(sp[1]); return `<path class="p" d="M${_n(p[0]-10)} ${_n(p[1])}H${_n(p[0]+10)}" stroke-width="2.2"/><circle class="p" cx="${_n(p[0])}" cy="${_n(p[1])}" r="6" fill="var(--soft,#f5f6f8)"/><circle class="p" cx="${_n(p[0])}" cy="${_n(p[1])}" r="3"/>`;}
    case 'bar': {const p=at(sp[1]); const w=sp[2]||30; const y=_n(p[1]); return `<path class="p" d="M${_n(p[0]-w)} ${y}H${_n(p[0]+w)}"/><rect class="p" x="${_n(p[0]-w-1)}" y="${y-6}" width="4" height="12" rx="1"/><rect class="p" x="${_n(p[0]+w-3)}" y="${y-6}" width="4" height="12" rx="1"/>`;}
    case 'db': {const p=at(sp[1]); const a=(sp[2]==null?90:sp[2])*Math.PI/180; const dx=Math.sin(a)*5,dy=Math.cos(a)*5; const px=Math.cos(a)*3,py=-Math.sin(a)*3; const r=(x,y)=>`M${_n(x-px)} ${_n(y-py)}L${_n(x+px)} ${_n(y+py)}`; return `<path class="p" d="M${_n(p[0]-dx)} ${_n(p[1]-dy)}L${_n(p[0]+dx)} ${_n(p[1]+dy)}${r(p[0]-dx,p[1]-dy)}${r(p[0]+dx,p[1]+dy)}" stroke-width="3"/>`;}
    case 'kb': {const p=at(sp[1]); return `<circle class="p" cx="${_n(p[0])}" cy="${_n(p[1]+7.5)}" r="5" fill="var(--soft,#f5f6f8)"/><path class="p" d="M${_n(p[0]-3.5)} ${_n(p[1]+3)}a3.5 3.5 0 0 1 7 0"/>`;}
    case 'band': {const a=at(sp[1]),b=at(sp[2]); const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2; return `<path class="p band" d="M${_n(a[0])} ${_n(a[1])}Q${_n(mx+4)} ${_n(my)} ${_n(b[0])} ${_n(b[1])}"/>`;}
    case 'ball': {const p=at(sp[1]); const r=sp[2]||11; return `<circle class="p" cx="${_n(p[0])}" cy="${_n(p[1])}" r="${r}"/><path class="p" d="M${_n(p[0]-r*0.55)} ${_n(p[1]-r*0.45)}a${r*0.7} ${r*0.7} 0 0 1 ${r*0.5} ${-r*0.35}" opacity=".6"/>`;}
    case 'bench': {const p=sp[1],w=sp[2]||34; const fy=L.floorY!=null?Math.max(p[1]+12,L.floorY-1):p[1]+12; return `<rect class="p" x="${p[0]-w/2}" y="${p[1]-1}" width="${w}" height="4" rx="1.5"/><path class="p" d="M${p[0]-w/2+5} ${p[1]+3}V${_n(fy)}M${p[0]+w/2-5} ${p[1]+3}V${_n(fy)}M${p[0]-w/2+1} ${_n(fy)}h8M${p[0]+w/2-9} ${_n(fy)}h8"/>`;}
    case 'benchv': {const p=sp[1],w=sp[2]||16,h=sp[3]||60; return `<rect class="p" x="${p[0]-w/2}" y="${p[1]}" width="${w}" height="${h}" rx="4" fill="var(--soft,#f5f6f8)"/>`;}
    case 'pullbar': return `<path class="p" d="M${sp[2]||20} ${sp[1]}H${sp[3]||80}M${(sp[2]||20)+4} ${sp[1]}V2M${(sp[3]||80)-4} ${sp[1]}V2"/>`;
    case 'box': {const p=sp[1]; return `<rect class="p" x="${p[0]}" y="${p[1]}" width="${sp[2]}" height="${sp[3]}" rx="1.5" fill="var(--soft,#f5f6f8)"/><path class="p" d="M${p[0]} ${p[1]+4}h${sp[2]}"/>`;}
    case 'wall': return `<path class="p" d="M${sp[1]} 6V94"/>`;
    case 'bike': return `<circle class="p" cx="26" cy="80" r="11"/><circle class="p" cx="74" cy="80" r="11"/><path class="p" d="M26 80L44 56H62L74 80M44 56L52 80M62 56L66 50H72"/>`;
    case 'rope': {const p=sp[1]; return `<path class="p" d="M${p[0]-16} ${p[1]}q16 ${sp[2]||40} 32 0"/>`;}
    case 'stairs': {const p=sp[1]; return `<path class="p" d="M${p[0]} ${p[1]}h12v-10h12v-10h12v-10h12"/>`;}
    case 'rower': {const p=sp[1]; return `<path class="p" d="M${p[0]-30} ${p[1]}H${p[0]+30}M${p[0]+22} ${p[1]}v-14h6"/>`;}
    case 'treadmill': return `<path class="p" d="M14 92L86 92M18 92L26 70M82 92L78 60"/>`;
    case 'step': {const p=sp[1]; return `<rect class="p" x="${p[0]}" y="${p[1]}" width="${sp[2]||24}" height="6" rx="1"/>`;}
    case 'machine': {const p=sp[1]; return `<path class="p" d="M${p[0]} ${p[1]}v-30h18M${p[0]} ${p[1]-30}l-10 -12"/>`;}
    case 'stick': {const p=at(sp[1]); const q=_pt(p,sp[2],sp[3]||24); return `<path class="p" d="${_L(p,q)}" stroke-width="${sp[4]||2.4}"/>`;}
    case 'racket': {const p=at(sp[1]); const r=sp[4]||5.5; const q=_pt(p,sp[2],(sp[3]||12)+r); const m=_pt(p,sp[2],sp[3]||12); return `<path class="p" d="${_L(p,m)}"/><ellipse class="p" cx="${_n(q[0])}" cy="${_n(q[1])}" rx="${r}" ry="${r*0.8}" transform="rotate(${-(sp[2]||0)} ${_n(q[0])} ${_n(q[1])})" fill="var(--soft,#f5f6f8)"/>`;}
    case 'dot': {const p=at(sp[1]); return `<circle class="p" cx="${_n(p[0])}" cy="${_n(p[1])}" r="${sp[2]||3.5}" fill="var(--soft,#f5f6f8)"/>`;}
    case 'blade': {const p=at(sp[1]); const y=_n(p[1]+4.5); return `<path class="p" d="M${_n(p[0]-3)} ${y}H${_n(p[0]+9)}"/>`;}
    case 'ski': {const p=at(sp[1]); const y=_n(p[1]+4.5); return `<path class="p" d="M${_n(p[0]-(sp[2]||16))} ${y}H${_n(p[0]+(sp[3]||18))}q4 0 6 -3"/>`;}
    case 'hoop': {const p=sp[1]; return `<ellipse class="p" cx="${p[0]}" cy="${p[1]}" rx="${sp[2]||22}" ry="${sp[3]||5}"/>`;}
    case 'water': return `<path class="p" d="M4 ${sp[1]}q6 -4 12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0"/>`;
    case 'boat': {const p=sp[1],w=sp[2]||36; return `<path class="p" d="M${p[0]-w/2} ${p[1]-6}q${w/2} 14 ${w} 0"/><path class="p" d="M${p[0]-w/2} ${p[1]-6}H${p[0]+w/2}"/>`;}
    case 'sail': {const p=sp[1],h=sp[2]||56; return `<path class="p" d="M${p[0]} ${p[1]}V${p[1]-h}"/><path class="p" d="M${p[0]} ${p[1]-h+4}L${p[0]+26} ${p[1]-10}H${p[0]}Z" fill="var(--soft,#f5f6f8)"/>`;}
    case 'board': {const p=sp[1],w=sp[2]||40; return `<path class="p" d="M${p[0]-w/2} ${p[1]}q${w/2} 6 ${w} 0"/><path class="p" d="M${p[0]-w/2} ${p[1]}q-3 -2 0 -4h${w}q3 2 0 4"/>`;}
    case 'horse': {const p=sp[1]; return `<rect class="p" x="${p[0]-22}" y="${p[1]}" width="44" height="16" rx="8" fill="var(--soft,#f5f6f8)"/><path class="p" d="M${p[0]+20} ${p[1]+4}l10 -18l8 2M${p[0]-16} ${p[1]+16}v14M${p[0]-6} ${p[1]+16}v14M${p[0]+8} ${p[1]+16}v14M${p[0]+18} ${p[1]+16}v14M${p[0]-22} ${p[1]+6}q-6 6 -4 14"/>`;}
    case 'wing': {const p=sp[1],w=sp[2]||70; return `<path class="p" d="M${p[0]-w/2} ${p[1]+8}Q${p[0]} ${p[1]-8} ${p[0]+w/2} ${p[1]+8}"/><path class="p" d="M${p[0]} ${p[1]}V${p[1]+12}"/>`;}
    case 'slope': return `<path class="p" d="M4 ${sp[1]}L96 ${sp[2]}"/>`;
    case 'holds': {const p=sp[1]; return (sp[2]||[]).map(q=>`<circle class="p" cx="${p+q[0]}" cy="${q[1]}" r="1.6" fill="var(--equip,#55585e)"/>`).join('');}
    case 'table': {const p=sp[1],w=sp[2]||40,h=sp[3]||4; return `<rect class="p" x="${p[0]-w/2}" y="${p[1]}" width="${w}" height="${h}" rx="1" fill="var(--soft,#f5f6f8)"/><path class="p" d="M${p[0]-w/2+6} ${p[1]+h}v${sp[4]||18}M${p[0]+w/2-6} ${p[1]+h}v${sp[4]||18}"/>`;}
    case 'bow': {const p=at(sp[1]),q=at(sp[2]); return `<path class="p" d="M${_n(p[0])} ${_n(p[1]-22)}Q${_n(p[0]+8)} ${_n(p[1])} ${_n(p[0])} ${_n(p[1]+22)}"/><path class="p" d="M${_n(p[0])} ${_n(p[1]-22)}L${_n(q[0])} ${_n(q[1])}L${_n(p[0])} ${_n(p[1]+22)}" stroke-width="1.2"/>`;}
    case 'line': return `<path class="p" d="${_L(at(sp[1]),at(sp[2]))}"/>`;
    case 'door': return `<path class="p" d="M${sp[1]} 8V94M${sp[1]} 8h10"/>`;
  }
  return '';
}
// arrows: ['arc',[cx,cy],r,a0,a1] angles in our convention; ['line',[x0,y0],[x1,y1]]
const AW=2.2;
function _arrow(sp,k){ k=k||1; const w=AW*k, hl=5*k, hw=2.4*k;
  if(sp[0]==='line'){const a=sp[1],b=sp[2]; const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len; const h=[b[0]-ux*hl,b[1]-uy*hl]; return `<path class="ar" stroke-width="${_n(w)}" d="${_L(a,b)}"/><path class="ah" d="${_poly([b,[h[0]-uy*hw,h[1]+ux*hw],[h[0]+uy*hw,h[1]-ux*hw]])}Z"/>`;}
  if(sp[0]==='arc'){const [c,r,a0,a1]=[sp[1],sp[2],sp[3],sp[4]]; const p0=_pt(c,a0,r),p1=_pt(c,a1,r); const sweep=a1>a0?1:0; const large=Math.abs(a1-a0)>180?1:0; const tang=a1+(sweep?90:-90); const u=_dir(tang); const h=[p1[0]-u[0]*hl,p1[1]-u[1]*hl]; return `<path class="ar" stroke-width="${_n(w)}" d="M${_n(p0[0])} ${_n(p0[1])}A${r} ${r} 0 ${large} ${sweep} ${_n(p1[0])} ${_n(p1[1])}"/><path class="ah" d="${_poly([p1,[h[0]-u[1]*hw,h[1]+u[0]*hw],[h[0]+u[1]*hw,h[1]-u[0]*hw]])}Z"/>`;}
  return '';
}
function _rotP(p,c,deg){ if(!deg)return p; const r=deg*Math.PI/180,co=Math.cos(r),si=Math.sin(r),dx=p[0]-c[0],dy=p[1]-c[1]; return [c[0]+dx*co-dy*si,c[1]+dx*si+dy*co]; }
// body points [x,y,radius] in frame coordinates (after tilt/rot, before flip)
function _bodyPts(pose,L){ const pts=[]; const hip=pose.hip; const tilt=pose.tilt||0, rot=pose.rot||0;
  const push=(p,r,inTilt)=>{ let q=inTilt?_rotP(p,hip,tilt):p; q=_rotP(q,hip,rot); pts.push([q[0],q[1],r||4.5]); };
  L.legs.forEach(l=>{push(l.h,5.5);push(l.kn,4.5);push(l.an,4.5);push(l.toe,3.5);});
  L.arms.forEach(a=>{push(a.s,5.5,true);push(a.el,4.5,true);push(a.hd,4,true);});
  const hc=[L.headC[0]+(pose.headTilt||0)*0.25,L.headC[1]+Math.abs(pose.headTilt||0)*0.05]; push(hc,FIG.head+2,true);
  if(pose.v==='f'){L.hips.forEach(h=>push(h,6));L.sh.forEach(h=>push(h,6,true));}
  return pts; }
function _propBox(sp,L){
  const h=(i)=>L.arms[i]?L.arms[i].hd:[50,50];
  const at=(v)=>typeof v==='string'?(v==='h0'?h(0):v==='h1'?h(1):v==='mid'?[(h(0)[0]+h(1)[0])/2,(h(0)[1]+h(1)[1])/2]:v==='sh'?(L.sh.length===2&&typeof L.sh[0]==='number'?L.sh:L.shC):v==='a0'?L.legs[0].an:v==='a1'?L.legs[1].an:[50,50]):v;
  const B=(x0,y0,x1,y1)=>[x0,y0,x1,y1]; let p;
  switch(sp[0]){
    case 'floor': return null;
    case 'plate': p=at(sp[1]); return B(p[0]-11,p[1]-7,p[0]+11,p[1]+7);
    case 'bar': {p=at(sp[1]); const w=sp[2]||30; return B(p[0]-w-2,p[1]-7,p[0]+w+2,p[1]+7);}
    case 'db': p=at(sp[1]); return B(p[0]-6,p[1]-6,p[0]+6,p[1]+6);
    case 'kb': p=at(sp[1]); return B(p[0]-6.5,p[1]-1,p[0]+6.5,p[1]+14);
    case 'band': {const a=at(sp[1]),b=at(sp[2]); return B(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0])+4,Math.max(a[1],b[1]));}
    case 'ball': {p=at(sp[1]); const r=(sp[2]||11)+2; return B(p[0]-r,p[1]-r,p[0]+r,p[1]+r);}
    case 'bench': {p=sp[1]; const w=sp[2]||34; return B(p[0]-w/2-2,p[1]-3,p[0]+w/2+2,Math.max(p[1]+14,(L.floorY||0)+1));}
    case 'benchv': {p=sp[1]; return B(p[0]-(sp[2]||16)/2-1,p[1]-1,p[0]+(sp[2]||16)/2+1,p[1]+(sp[3]||60)+1);}
    case 'pullbar': return B((sp[2]||20)-2,2,(sp[3]||80)+2,sp[1]+2);
    case 'box': p=sp[1]; return B(p[0]-2,p[1]-2,p[0]+sp[2]+2,p[1]+sp[3]+2);
    case 'wall': return B(sp[1]-2,6,sp[1]+2,94);
    case 'bike': return B(13,48,87,93);
    case 'rope': p=sp[1]; return B(p[0]-18,p[1]-2,p[0]+18,p[1]+(sp[2]||40)/2+2);
    case 'stairs': p=sp[1]; return B(p[0]-2,p[1]-32,p[0]+50,p[1]+2);
    case 'rower': p=sp[1]; return B(p[0]-32,p[1]-16,p[0]+32,p[1]+2);
    case 'treadmill': return B(12,58,88,94);
    case 'step': p=sp[1]; return B(p[0]-2,p[1]-2,p[0]+(sp[2]||24)+2,p[1]+8);
    case 'machine': p=sp[1]; return B(p[0]-12,p[1]-44,p[0]+20,p[1]+2);
    case 'stick': {p=at(sp[1]); const q=_pt(p,sp[2],sp[3]||24); return B(Math.min(p[0],q[0])-2,Math.min(p[1],q[1])-2,Math.max(p[0],q[0])+2,Math.max(p[1],q[1])+2);}
    case 'racket': {p=at(sp[1]); const r=(sp[4]||5.5)+1; const q=_pt(p,sp[2],(sp[3]||12)+r); return B(Math.min(p[0],q[0]-r),Math.min(p[1],q[1]-r),Math.max(p[0],q[0]+r),Math.max(p[1],q[1]+r));}
    case 'dot': {p=at(sp[1]); const r=(sp[2]||3.5)+1; return B(p[0]-r,p[1]-r,p[0]+r,p[1]+r);}
    case 'blade': p=at(sp[1]); return B(p[0]-4,p[1],p[0]+10,p[1]+6);
    case 'ski': p=at(sp[1]); return B(p[0]-(sp[2]||16)-1,p[1],p[0]+(sp[3]||18)+7,p[1]+6);
    case 'hoop': p=sp[1]; return B(p[0]-(sp[2]||22)-1,p[1]-(sp[3]||5)-1,p[0]+(sp[2]||22)+1,p[1]+(sp[3]||5)+1);
    case 'water': return B(4,sp[1]-4,96,sp[1]+2);
    case 'boat': {p=sp[1]; const w=sp[2]||36; return B(p[0]-w/2-1,p[1]-7,p[0]+w/2+1,p[1]+2);}
    case 'sail': {p=sp[1]; const h=sp[2]||56; return B(p[0]-1,p[1]-h-1,p[0]+27,p[1]+1);}
    case 'board': {p=sp[1]; const w=sp[2]||40; return B(p[0]-w/2-4,p[1]-5,p[0]+w/2+4,p[1]+4);}
    case 'horse': p=sp[1]; return B(p[0]-28,p[1]-16,p[0]+40,p[1]+31);
    case 'wing': {p=sp[1]; const w=sp[2]||70; return B(p[0]-w/2-1,p[1]-9,p[0]+w/2+1,p[1]+13);}
    case 'slope': return B(4,Math.min(sp[1],sp[2])-1,96,Math.max(sp[1],sp[2])+1);
    case 'holds': return null;
    case 'table': {p=sp[1]; const w=sp[2]||40; return B(p[0]-w/2-1,p[1]-1,p[0]+w/2+1,p[1]+(sp[3]||4)+(sp[4]||18)+1);}
    case 'bow': {p=at(sp[1]); return B(p[0]-2,p[1]-24,p[0]+10,p[1]+24);}
    case 'line': {const a=at(sp[1]),b=at(sp[2]); return B(Math.min(a[0],b[0])-2,Math.min(a[1],b[1])-2,Math.max(a[0],b[0])+2,Math.max(a[1],b[1])+2);}
    case 'door': return B(sp[1]-2,6,sp[1]+12,94);
  }
  return null; }
function _arrowBox(sp){ if(sp[0]==='line'){const a=sp[1],b=sp[2]; return [Math.min(a[0],b[0])-3,Math.min(a[1],b[1])-3,Math.max(a[0],b[0])+3,Math.max(a[1],b[1])+3];} if(sp[0]==='arc'){const c=sp[1],r=sp[2]; const p0=_pt(c,sp[3],r),p1=_pt(c,sp[4],r); const xs=[p0[0],p1[0]],ys=[p0[1],p1[1]]; for(let a=Math.min(sp[3],sp[4]);a<=Math.max(sp[3],sp[4]);a+=15){const q=_pt(c,a,r);xs.push(q[0]);ys.push(q[1]);} return [Math.min(...xs)-3,Math.min(...ys)-3,Math.max(...xs)+3,Math.max(...ys)+3];} return null; }
// body segments [[p,q,halfWidth]] in frame coordinates, for arrow clearance
function _bodySegs(pose,L){ const out=[]; const hip=pose.hip; const tilt=pose.tilt||0, rot=pose.rot||0;
  const T=(p,inTilt)=>{ let q=inTilt?_rotP(p,hip,tilt):p; return _rotP(q,hip,rot); };
  const seg=(a,b,w,inTilt)=>out.push([T(a,inTilt),T(b,inTilt),w]);
  L.legs.forEach(l=>{seg(l.h,l.kn,5);seg(l.kn,l.an,5);seg(l.an,l.toe,4);});
  L.arms.forEach(a=>{seg(a.s,a.el,5,true);seg(a.el,a.hd,5,true);});
  if(pose.v==='f'){ seg(L.sh[0],L.sh[1],6,true); seg(L.hips[0],L.hips[1],6); seg(L.shC,hip,9,true); } else { seg(hip,L.sh,6,true); }
  const hc=[L.headC[0]+(pose.headTilt||0)*0.25,L.headC[1]+Math.abs(pose.headTilt||0)*0.05]; seg(hc,hc,FIG.head+1.5,true);
  return out; }
function _distSeg(p,a,b){ const dx=b[0]-a[0],dy=b[1]-a[1]; const l2=dx*dx+dy*dy; let t=l2?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy)); }
function _arrowPts(sp){ if(sp[0]==='line'){const a=sp[1],b=sp[2]; const n=8; return Array.from({length:n+1},(_,i)=>[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);} if(sp[0]==='arc'){const c=sp[1],r=sp[2]; const a0=Math.min(sp[3],sp[4]),a1=Math.max(sp[3],sp[4]); const pts=[]; for(let a=a0;a<=a1+0.01;a+=10)pts.push(_pt(c,a,r)); pts.push(_pt(c,a1,r)); return pts;} return []; }
function _arrowHits(sp,segs,margin){ const pts=_arrowPts(sp); return pts.some(p=>segs.some(sg=>_distSeg(p,sg[0],sg[1])<sg[2]+margin)); }
function _shiftArrow(sp,dx,dy){ if(sp[0]==='line')return ['line',[sp[1][0]+dx,sp[1][1]+dy],[sp[2][0]+dx,sp[2][1]+dy]]; if(sp[0]==='arc')return ['arc',[sp[1][0]+dx,sp[1][1]+dy],sp[2],sp[3],sp[4]]; return sp; }
// move an arrow outward from the body centre until it no longer touches the figure
function _clearArrow(sp,segs,pose,L){ const margin=4.5; if(!_arrowHits(sp,segs,margin))return sp;
  const pts=_arrowPts(sp); const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length, cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
  const bc=[(pose.hip[0]+L.headC[0])/2,(pose.hip[1]+L.headC[1])/2]; let vx=cx-bc[0], vy=cy-bc[1]; const vl=Math.hypot(vx,vy)||1; vx/=vl; vy/=vl;
  const dirs=[[vx,vy],[-vy,vx],[vy,-vx],[-vx,-vy]];
  for(let d=2;d<=30;d+=2){ for(const [ux,uy] of dirs){ const c=_shiftArrow(sp,ux*d,uy*d); if(!_arrowHits(c,segs,margin))return c; } }
  return sp; }
const ARROW_LEN=14, ARC_R=15, FIG_SCALE=0.9;
function _normArrow(sp){
  if(sp[0]==='line'){ const a=sp[1],b=sp[2]; const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2; let ang=Math.atan2(b[1]-a[1],b[0]-a[0]); ang=Math.round(ang/(Math.PI/4))*(Math.PI/4); const h=ARROW_LEN/2; return ['line',[mx-Math.cos(ang)*h,my-Math.sin(ang)*h],[mx+Math.cos(ang)*h,my+Math.sin(ang)*h]]; }
  if(sp[0]==='arc'){ const c=sp[1]; let a0=sp[3],a1=sp[4]; const sw=a1-a0; const mag=Math.abs(sw); const snap=mag>=200?mag:mag<=75?60:mag<=105?90:120; const s0=Math.round(a0/15)*15; const r=mag>=200?Math.min(ARC_R,sp[2]):ARC_R; return ['arc',c,r,s0,s0+Math.sign(sw||1)*snap]; }
  return sp; }
function _fixedArrows(frame,L){ const segs=_bodySegs(frame.pose,L); return (frame.arrows||[]).map(a=>_clearArrow(_normArrow(a),segs,frame.pose,L)); }
function _isLying(pose){ if(pose.v==='f')return false; const t=((((pose.torso==null?180:pose.torso)+(pose.tilt||0)+(pose.rot||0))%360)+360)%360; return Math.abs(t-180)>50; }
// bounding box of one frame: [x0,y0,x1,y1] (before flip), plus whether a floor line is wanted
const ON_FLOOR=['bench','box','step','machine','bike','stairs','rower','treadmill','wall','door','pullbar','table','horse'];
function floorInfo(frame,L,force){ const pose=frame.pose; const props=frame.props||[]; const fl=props.find(p=>p[0]==='floor'); if(!fl||frame.nofloor)return {floor:false,floorY:93};
  const pts=_bodyPts(pose,L); const low=Math.max(...pts.map(p=>p[1]))+3; const hasEquip=props.some(p=>p[0]!=='floor'); const stands=props.some(p=>ON_FLOOR.includes(p[0]));
  const handsLow=L.arms.some(a=>a.hd[1]>=low-10); const seated=(low-pose.hip[1])<18; const rotated=Math.abs(pose.rot||0)>45; const show=!!force||!!fl[2]||hasEquip||_isLying(pose)||rotated||handsLow||seated||pose.v==='s'&&L.legs.some(l=>l.kn[1]>=low-8);
  const floorY=stands?Math.max(fl[1],low):low; return {floor:show,floorY}; }
function figFrameBox(frame,opts){ const pose=frame.pose; const L=_limbs(pose); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const add=(b)=>{ if(!b)return; x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3]); };
  const fi=floorInfo(frame,L,opts&&opts.floorAll); L.floorY=fi.floor?fi.floorY:null;
  _bodyPts(pose,L).forEach(p=>add([p[0]-p[2],p[1]-p[2],p[0]+p[2],p[1]+p[2]]));
  (frame.props||[]).forEach(p=>add(_propBox(p,L)));
  if(!(opts&&opts.noArrows))_fixedArrows(frame,L).forEach(a=>add(_arrowBox(a)));
  if(fi.floor)add([x0,fi.floorY-2,x1,fi.floorY+2]);
  if(pose.flip){const nx0=100-x1,nx1=100-x0;x0=nx0;x1=nx1;}
  return {x0,y0,x1,y1,floor:fi.floor,floorY:fi.floorY}; }
function figFitBox(frames,opts){ opts=Object.assign({},opts||{}); const any=frames.some(f=>figFrameBox(f,opts).floor); if(any)opts.floorAll=true; let b=null; frames.forEach(f=>{ const c=figFrameBox(f,opts); if(!b)b=Object.assign({},c); else { b.x0=Math.min(b.x0,c.x0);b.y0=Math.min(b.y0,c.y0);b.x1=Math.max(b.x1,c.x1);b.y1=Math.max(b.y1,c.y1); } }); b.floorAll=any; return b; }
function figFrameSvg(frame,size,opts){ const s=size||100; const pose=frame.pose; opts=opts||{}; const simple=opts.simple||s<40; const refs=JSON.stringify(frame.props||[]); const grips=[/"h0"|"mid"/.test(refs),/"h1"|"mid"/.test(refs)]; if(pose.v==='s'&&grips[0])grips[1]=true; const {svg,L,gripSvg}=_figurePaths(pose,{simple,muscle:opts.muscle,grips});
  if(opts.fit&&opts.fit.floorAll)opts=Object.assign({},opts,{floorAll:true}); const own=figFrameBox(frame,opts); const fit=opts.fit||own; L.floorY=own.floor?own.floorY:null;
  const propsAll=(frame.props||[]).filter(p=>p[0]!=='floor');
  const BEHIND=['bench','benchv','ball','box','wall','bike','stairs','rower','treadmill','step','machine','floor','door','pullbar','water','boat','sail','board','horse','wing','slope','holds','table','hoop','ski','blade'];
  const behind=propsAll.filter(p=>BEHIND.includes(p[0])).map(p=>_prop(p,L)).join('');
  const front=propsAll.filter(p=>!BEHIND.includes(p[0])).map(p=>_prop(p,L)).join('');
  const ak=s>150?0.65:s>90?0.85:1; const arrows=(opts&&opts.noArrows)?'':_fixedArrows(frame,L).map(a=>_arrow(a,ak)).join('');
  // floor: only with equipment, lying or hands-on-floor poses; spans the figure width (+margin)
  let floorSvg=''; if(own.floor){ const m=6; const fx0=pose.flip?100-fit.x1:fit.x0, fx1=pose.flip?100-fit.x0:fit.x1; floorSvg=`<path class="p" d="M${_n(fx0-m)} ${own.floorY}H${_n(fx1+m)}"/>`; }
  const HELD=['plate','db','kb','ball','band','bar']; const held=propsAll.filter(p=>HELD.includes(p[0])&&/h0|h1|mid/.test(JSON.stringify(p.slice(1)))); const frontRest=propsAll.filter(p=>!BEHIND.includes(p[0])&&!held.includes(p)).map(p=>_prop(p,L)).join('');
  const inner=`${floorSvg}${behind}${frontRest}${arrows}<g class="fg">${svg}</g>${held.map(p=>_prop(p,L)).join('')}<g class="fg">${gripSvg}</g>`;
  const flip=pose.flip?`<g transform="translate(100 0) scale(-1 1)">${inner}</g>`:inner;
  // auto-fit: scale and centre the (shared) box into the 100x100 view with padding
  // fixed scale for every figure (same human size everywhere); only shrink when a pose would not fit at all
  const pad=opts.pad==null?3:opts.pad; const w=Math.max(10,fit.x1-fit.x0+(own.floor?12:0)), h=Math.max(10,fit.y1-fit.y0);
  const K=opts.scale||FIG_SCALE; let k=Math.min(K,(100-pad*2)/w,(100-pad*2)/h);
  const cx=(fit.x0+fit.x1)/2, cy=(fit.y0+fit.y1)/2; const tx=50-cx*k, ty=50-cy*k;
  const fitted=`<g transform="translate(${_n(tx)} ${_n(ty)}) scale(${_n(k)})">${flip}</g>`;
  return `<svg class="pf" viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="${FIG.sw}" stroke-linecap="round" stroke-linejoin="round">${fitted}</g></svg>`; }
const FIG_CSS='.pf .fill{stroke:var(--card,#fff)}.pf .fillp{fill:var(--card,#fff)}.pf .hls{stroke:var(--hl,#e5484d)}.pf .hlf{fill:var(--hl,#e5484d);stroke:none}.pf .p{stroke:var(--equip,#555);stroke-width:3}.pf .ar{stroke:var(--accent,#2f6bff);opacity:.9}.pf .ah{fill:var(--accent,#2f6bff);stroke:none}.pf .band{stroke-dasharray:3 2}';
