// ---------- Body muscle map: front/back figure, primary (p) and secondary (s) muscles ----------
/* Male hair: "ShortHairShortFlat" from avataaars, https://github.com/fangpenlin/avataaars

   MIT License

   Copyright (c) 2017 Pablo Stanley, Fang-Pen Lin

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
*/
// Female hair (fringe + top bun) is drawn here in head units (head centre 0,0, radius 1).
// Rules: key -> [view, slug, pick, clip]. pick: 'big' | 'small' piece by area. clip: ['y',from,to] horizontal band of the piece, ['x',from,to] from the midline outward.
const BODY_RULES={
 traps:[['f','trapezius'],['b','trapezius',null,['y',0,.62]]], rhomboids:[['b','trapezius',null,['y',.62,1]]], rotator:[['b','upper-back','small']], lats:[['b','upper-back','big']], erectors:[['b','lower-back']],
 chest_upper:[['f','chest',null,['y',0,.34]]], chest_mid:[['f','chest',null,['y',.34,.68]]], chest_lower:[['f','chest',null,['y',.68,1]]],
 delt_front:[['f','deltoids',null,['x',0,.5]]], delt_side:[['f','deltoids',null,['x',.5,1]],['b','deltoids',null,['x',.5,1]]], delt_rear:[['b','deltoids',null,['x',0,.5]]],
 biceps:[['f','biceps']], triceps:[['f','triceps'],['b','triceps']], forearms:[['f','forearm'],['b','forearm']],
 abs:[['f','abs']], core_deep:[['f','abs','big']], obliques:[['f','obliques']], hip_flexors:[['f','quadriceps','big',['y',0,.22]]],
 quads:[['f','quadriceps']], adductors:[['f','adductors'],['b','adductors']], hams:[['b','hamstring']], glute_max:[['b','gluteal','big']], glute_med:[['b','gluteal','small']], calves:[['f','calves'],['b','calves']],
 full_body:[['f','*'],['b','*']], heart:[]};
const BODY_DECOR={hair:1,head:1,neck:1,hands:1,feet:1,ankles:1,knees:1};
const BODY_HAIR={
 f:{f:['M-.92 .56A1.04 1.04 0 1 1 .92 .56Q.9 .4 .88 .28Q.9 -.1 .76 -.37Q.66 -.47 .55 -.48C.2 -.42 -.3 -.22 -.8 -.04Q-.88 .1 -.88 .3Q-.9 .45 -.92 .56Z','M-.52 -1.16a.6 .47 0 1 0 1.2 0a.6 .47 0 1 0 -1.2 0z'],
    b:['M-1.04 0A1.04 1.04 0 0 1 1.04 0Q1.02 .55 .7 .86Q0 1.06 -.7 .86Q-1.02 .55 -1.04 0Z','M-.52 -1.16a.6 .47 0 1 0 1.2 0a.6 .47 0 1 0 -1.2 0z']},
 m:[{"d":"M180.14998,39.9204083 C177.390206,37.1003988 174.185913,34.7068297 171.069252,32.3065503 C170.381566,31.777442 169.682843,31.2610833 169.010544,30.7118441 C168.857687,30.5870323 167.291999,29.4657388 167.104691,29.0530544 C166.653816,28.0602634 166.915042,28.8332916 166.977255,27.6485857 C167.055857,26.150508 170.11064,21.9193194 167.831176,20.9490079 C166.828413,20.522232 165.039628,21.6579526 164.077671,22.0330592 C162.196235,22.7671676 160.291721,23.3932399 158.346734,23.9330847 C159.278588,22.0763407 161.055333,18.3594977 157.71591,19.3543018 C155.114345,20.1293431 152.690052,22.1219709 150.075777,23.0594018 C150.940735,21.6415124 154.399901,17.2479341 151.274209,17.0023366 C150.301549,16.925839 147.471201,18.7503735 146.423952,19.1395717 C143.287223,20.3054888 140.083264,21.0590571 136.789999,21.6525844 C125.59203,23.6707114 112.497238,23.0953019 102.1368,28.1934632 C94.1494796,32.1236942 86.262502,38.2220278 81.648386,45.987539 C77.2011742,53.472559 75.537818,61.6641751 74.6069673,70.2412987 C73.9239644,76.535909 73.8684412,83.0425652 74.1878671,89.3599905 C74.2922241,91.4297869 74.5250203,100.970847 77.5319724,98.0813859 C79.0300967,96.641688 79.019059,90.8282073 79.3963495,88.8604076 C80.1472513,84.9452748 80.870057,81.0126951 82.122006,77.2227096 C84.3282191,70.5439339 86.9307879,63.4296587 92.4269209,58.8297383 C95.9539853,55.8782066 98.4307906,51.8889248 101.806002,48.9112229 C103.322188,47.5738572 102.165231,47.7130963 104.602902,47.888571 C106.240504,48.006337 107.885464,48.0512961 109.52641,48.0942421 C113.322394,48.1928837 117.124399,48.16772 120.921387,48.1811407 C128.56821,48.208653 136.179243,48.316689 143.818708,47.9164188 C147.213653,47.7385955 150.617965,47.6423024 154.00388,47.3282597 C155.895349,47.152785 159.251496,45.9405668 160.808488,46.8669256 C162.233362,47.7144383 163.71309,50.4817719 164.736257,51.615144 C167.153525,54.2935659 170.035717,56.3392052 172.862385,58.5354911 C178.756547,63.114945 181.732392,68.8666908 183.522515,76.023241 C185.305949,83.1532854 184.805905,89.76815 187.013456,96.78479 C187.401784,98.0184813 188.428965,100.14498 189.695296,98.2389151 C189.930434,97.8849461 189.869559,95.9390277 189.869559,94.819339 C189.869559,90.2995934 191.014141,86.9083772 190.999758,82.3591197 C190.943566,68.5271489 190.49637,50.4908308 180.14998,39.9204083 Z","tx":-1.0,"ty":0.0}]};
function bodyHairSvg(sex,view){ const [cx,cy,rx,ry]=BODY_HEAD[sex][view];
  if(sex==='m'){ const base=view==='b'?`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`:''; return `<g class="hair">${base}<g transform="translate(${cx-rx} ${cy-ry}) scale(${(2*rx/112).toFixed(4)} ${(2*ry/144).toFixed(4)}) translate(-76 -36)">${BODY_HAIR.m.map(u=>`<path d="${u.d}" transform="translate(${u.tx} ${u.ty})"/>`).join('')}</g></g>`; }
  return `<g class="hair" transform="translate(${cx} ${cy}) scale(${rx} ${ry})">${BODY_HAIR.f[view].map(d=>`<path d="${d}"/>`).join('')}</g>`; }
let _bodyUid=0;
// opts: sex 'm'|'f', weights {key: 0..1} (opacity of primary keys, for the weekly map)
function bodyMapSvg(view,prim,sec,size,opts){ opts=opts||{}; const sex=opts.sex==='f'?'f':'m'; const parts=BODY_PARTS[sex][view]; const vb=BODY_VB[sex][view]; const vbx=vb.split(' ').map(Number); const mid=vbx[0]+vbx[2]/2; const weights=opts.weights||null;
  const bySlug={}; parts.forEach(([slug,pieces])=>{ bySlug[slug]=pieces; });
  const uid='bm'+(++_bodyUid); let defs=''; const overlays=[]; const base={}; const bands=[];
  const alpha=(cls,w)=>(cls==='s'?.42:1)*w; const op=(cls,w)=>w<1?` style="opacity:${alpha(cls,w).toFixed(2)}"`:'';
  const apply=(key,cls)=>{ (BODY_RULES[key]||[]).forEach(([v,slug,pick,clip])=>{ if(v!==view)return; const slugs=slug==='*'?Object.keys(bySlug).filter(s=>!BODY_DECOR[s]):[slug]; slugs.forEach(sl=>{ const pieces=bySlug[sl]; if(!pieces)return; const maxA=Math.max(...pieces.map(p=>p[1][2]*p[1][3]));
    pieces.forEach((p,i)=>{ const a=p[1][2]*p[1][3]; if(pick==='big'&&a<maxA*.5)return; if(pick==='small'&&a>=maxA*.5)return; const w=weights?(weights[key]||0):1; const k=sl+'#'+i;
      if(!clip){ if(!base[k]||alpha(cls,w)>alpha(base[k].cls,base[k].w))base[k]={cls,w}; return; }
      const [x,y,bw,bh]=p[1]; let r; if(clip[0]==='y')r=[x-5,y+bh*clip[1],bw+10,bh*(clip[2]-clip[1])]; else { const lat=x+bw/2>mid; const x0=lat?x+bw*clip[1]:x+bw*(1-clip[2]); r=[x0,y-5,bw*(clip[2]-clip[1]),bh+10]; }
      bands.push({d:p[0],k,cls,w,r}); }); }); }); };
  (sec||[]).forEach(k=>apply(k,'s')); (prim||[]).forEach(k=>apply(k,'p'));
  // a band drawn over an already coloured piece only adds what is needed to reach the larger of the two values
  bands.forEach(c=>{ const b=base[c.k]; let style=op(c.cls,c.w); if(b){ const a1=alpha(b.cls,b.w), a2=alpha(c.cls,c.w); if(a2<=a1+1e-6||a1>=1)return; style=` style="opacity:${(1-(1-a2)/(1-a1)).toFixed(2)}"`; }
    const id=uid+'c'+overlays.length; defs+=`<clipPath id="${id}"><rect x="${c.r[0].toFixed(1)}" y="${c.r[1].toFixed(1)}" width="${c.r[2].toFixed(1)}" height="${c.r[3].toFixed(1)}"/></clipPath>`; overlays.push(`<path d="${c.d}" class="r ${c.cls}" clip-path="url(#${id})"${style}/>`); });
  let body=''; parts.forEach(([slug,pieces])=>pieces.forEach((p,i)=>{ const b=base[slug+'#'+i]; const cls=BODY_DECOR[slug]?'d':b?b.cls:'n'; body+=`<path d="${p[0]}" class="r ${cls}"${b?op(b.cls,b.w):''}/>`; }));
  const heart=(prim||[]).includes('heart')&&view==='f'?`<path d="M${mid} 470l-38-38a27 27 0 0 1 38-30a27 27 0 0 1 38 30z" class="r p"/>`:'';
  return `<svg viewBox="${vb}" width="${(size/2).toFixed(0)}" height="${size}" class="bm" data-sex="${sex}" aria-hidden="true"><defs>${defs}</defs>${body}${overlays.join('')}${heart}${bodyHairSvg(sex,view)}</svg>`; }
// which side to show: the one holding the primary muscles (both when they span front and back, or for opts.both)
function bodyViewsFor(prim,sec){ const has=(keys,v)=>(keys||[]).some(k=>(BODY_RULES[k]||[]).some(r=>r[0]===v)||(k==='heart'&&v==='f')); const pf=has(prim,'f'), pb=has(prim,'b'); if(pf!==pb)return [pf?'f':'b']; if(pf&&pb)return ['f','b']; const sf=has(sec,'f'), sb=has(sec,'b'); if(sf!==sb)return [sf?'f':'b']; return ['f','b']; }
function muscleMapHtml(prim,sec,size,opts){ opts=opts||{}; const views=opts.both?['f','b']:bodyViewsFor(prim,sec); return `<span class="bmwrap">${views.map(v=>bodyMapSvg(v,prim,sec,size,opts)).join('')}</span>`; }
const BODY_CSS='.bm{display:inline-block;vertical-align:middle}.bm .r{fill:var(--bm-rest,#d9dde3);stroke:var(--bm-gap,#fff);stroke-width:1.5}.bm .r.d{fill:var(--bm-decor,#e8ebef)}.bm .r.p{fill:var(--hl,#e5484d)}.bm .r.s{fill:var(--hl,#e5484d);opacity:.42}.bm .hair path,.bm .hair ellipse{fill:var(--bm-hair,#b8bfc9);stroke:none}.bmwrap{display:inline-flex;gap:4px;align-items:center}';
