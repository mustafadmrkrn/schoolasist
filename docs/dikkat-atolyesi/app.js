/* Dikkat Atölyesi – 500 alıştırma, 50 gün x 10 sayfa */
(function(){
"use strict";

/* ================= Yardımcılar ================= */
function rngFrom(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
function shuffle(r,arr){arr=arr.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
const LET="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const $=s=>document.querySelector(s);

/* ================= Beceriler ================= */
// kod: [etiket, ad, simge, renk grubu]
const SKILLS={
  BA:["B.A","Bütünsel Algı","🌀","y"],
  O:["O","Organizasyon","🗂️","r"],
  EGK:["E.G.K","El-Göz Koordinasyonu","✋","r"],
  KBA:["K.B.A","Kavramsal Beceri Artışı","💡","r"],
  EZ:["E.Z","Eşzamanlılık","⏱️","r"],
  KSH:["K.S.H","Kısa Süreli Hafıza","🧠","r"],
  UMY:["U.M.Y","Uzaysal-Mekansal Yetenekler","🧭","y"],
  PL:["P.L","Planlama","📋","r"],
  AB:["AB","Aritmetik Beceriler","🔢","b"],
  GA:["G.A","Görsel Ayrımlaştırma","📦","y"],
  IMB:["İ.M.B","İnce Motor Becerisi","✏️","b"],
  GH:["G.H","Görsel Hafıza","👁️","y"],
  DBG:["D.B.G","Düşünce Becerileri Geliştirme","💭","b"],
  DSA:["D.S.A","Dikkat Süresi Artışı","⏳","b"],
  GY:["G.Y","Görsel Yoğunlaşma","🔍","b"],
  YY:["Y.Y","Yorumlama Yargılama","⚖️","b"],
  DYK:["D.Y.K","Dikkat Yoğunluğu ve Konsantrasyon","❗","b"],
  S:["S","Sıralama","📊","b"],
  DAV:["D.A.V","Dikkatin Ayrıntılara Verilmesi","🔎","b"],
  BEN:["BEN","Benzerlikler","🪞","b"],
  PBI:["P.B.İ","Parça Bütün İlişkisi","🧩","y"],
  SB:["S.B","Sözel Beceriler","💬","b"],
  B3A:["3B.A","3 Boyutlu Algı","🧊","y"]
};
function skName(k){const l=LG();return l==="tr"?SKILLS[k][1]:I18N.SKILL_NAMES[l][k];}
function skCode(k){const l=LG();return l==="tr"?SKILLS[k][0]:I18N.SKILL_CODES[l][k];}
function skillTile(k){const s=SKILLS[k];return `<span class="sk ${s[3]}" data-sk="${k}" title="${skName(k)}"><span class="e">${s[2]}</span><span class="c">${skCode(k)}</span></span>`;}

/* ================= Renkler & şekiller ================= */
const COLORS=[
  {k:"kirmizi",n:"Kırmızı",hex:"#e53935"},
  {k:"mavi",n:"Mavi",hex:"#1e88e5"},
  {k:"yesil",n:"Yeşil",hex:"#43a047"},
  {k:"sari",n:"Sarı",hex:"#fdd835"},
  {k:"turuncu",n:"Turuncu",hex:"#fb8c00"},
  {k:"mor",n:"Mor",hex:"#8e44ad"},
  {k:"pembe",n:"Pembe",hex:"#f06292"}
];
const CHEX={};COLORS.forEach(c=>CHEX[c.k]=c.hex);
const SIMILAR={sari:"turuncu",turuncu:"sari",kirmizi:"pembe",pembe:"kirmizi",mor:"mavi",mavi:"mor"};
const CNAME={};COLORS.forEach(c=>CNAME[c.k]=c.n);
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=x=>Math.max(0,Math.min(255,Math.round(x+(p<0?x*p:(255-x)*p))));return"#"+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1);}

// Şekiller: ad (yalın), belirtme hâli
const SHAPES={
  daire:{n:"daire",acc:"daireyi"},
  kare:{n:"kare",acc:"kareyi"},
  ucgen:{n:"üçgen",acc:"üçgeni"},
  yildiz:{n:"yıldız",acc:"yıldızı"},
  kalp:{n:"kalp",acc:"kalbi"},
  bulut:{n:"bulut",acc:"bulutu"}
};
const SHAPE_KEYS=Object.keys(SHAPES);
function starPts(cx,cy,R,r){let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;p.push((cx+rad*Math.cos(a)).toFixed(1)+","+(cy+rad*Math.sin(a)).toFixed(1));}return p.join(" ");}
function shapeEl(kind,color,cx,cy,s){
  const hex=CHEX[color]||color, f=`url(#g-${color})`, ln=shade(hex,-.45);
  const st=`stroke="${ln}" stroke-width="2" stroke-linejoin="round"`;
  const gl=(x,y,rx,ry,rot)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#fff" opacity=".55"/>`;
  const sh=`<ellipse cx="${cx}" cy="${cy+s*1.08}" rx="${s*.8}" ry="${s*.12}" fill="#000" opacity=".1"/>`;
  switch(kind){
    case"daire":return sh+`<circle cx="${cx}" cy="${cy}" r="${s}" fill="${f}" ${st}/>`+gl(cx-s*.38,cy-s*.42,s*.3,s*.16,-35);
    case"kare":return sh+`<rect x="${cx-s*.9}" y="${cy-s*.9}" width="${s*1.8}" height="${s*1.8}" rx="${s*.22}" fill="${f}" ${st}/>`+gl(cx-s*.45,cy-s*.6,s*.28,s*.1,0);
    case"ucgen":return sh+`<polygon points="${cx},${cy-s} ${cx+s*1.05},${cy+s*.8} ${cx-s*1.05},${cy+s*.8}" fill="${f}" ${st}/>`+gl(cx-s*.2,cy-s*.2,s*.1,s*.28,30);
    case"yildiz":return sh+`<polygon points="${starPts(cx,cy,s*1.1,s*.48)}" fill="${f}" ${st}/>`+gl(cx-s*.2,cy-s*.25,s*.1,s*.22,30);
    case"kalp":return sh+`<path transform="translate(${cx} ${cy+s*.1}) scale(${s})" d="M0 0.85 L-0.88 -0.05 A0.48 0.48 0 0 1 0 -0.6 A0.48 0.48 0 0 1 0.88 -0.05 Z" fill="${f}" stroke="${ln}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`+gl(cx-s*.45,cy-s*.3,s*.18,s*.1,-40);
    case"bulut":return sh+`<path d="M${cx-s} ${cy+s*.45} a${s*.42} ${s*.42} 0 0 1 ${s*.15} -${s*.8} a${s*.55} ${s*.55} 0 0 1 ${s*.95} -${s*.25} a${s*.45} ${s*.45} 0 0 1 ${s*.82} ${s*.45} a${s*.35} ${s*.35} 0 0 1 ${s*.08} ${s*.6} Z" fill="${f}" ${st}/>`+gl(cx-s*.15,cy-s*.4,s*.25,s*.1,-15);
  }
}
function shapeSVG(kind,color,scale){scale=scale||1;return`<svg viewBox="0 0 100 100" class="art">${shapeEl(kind,color,50,50,34*scale)}</svg>`;}

/* ================= Yaratık (canavarcık) çizimi ================= */
const BODIES=["round","square","tri","tall"],TOPS=["none","horns","antenna","ears","hair"],ARMS=["down","up","side"],MOUTHS=["smile","open","teeth"];
function randomCreature(r){return{body:pick(r,BODIES),color:pick(r,COLORS).k,eyes:ri(r,1,3),top:pick(r,TOPS),arms:pick(r,ARMS),mouth:pick(r,MOUTHS),spots:r()<.5,cheeks:r()<.5};}
const FEAT_VALUES={body:BODIES,color:COLORS.map(c=>c.k),eyes:[1,2,3],top:TOPS,arms:ARMS,mouth:MOUTHS,spots:[true,false],cheeks:[true,false]};
function mutate(r,c,feats){const n=Object.assign({},c);const f=pick(r,feats);const vals=FEAT_VALUES[f].filter(v=>v!==c[f]);n[f]=pick(r,vals);return n;}
const ckey=c=>[c.body,c.color,c.eyes,c.top,c.arms,c.mouth,c.spots,c.cheeks].join("|");
const skey=c=>[c.body,c.top,c.arms].join("|");
let animSeed=0;
function creature(c,opt){
  opt=opt||{};const sil=!!opt.sil;
  const hex=CHEX[c.color];
  const fill=sil?"url(#g-sil)":`url(#g-${c.color})`, dark=sil?"#24243a":shade(hex,-.35), line=sil?"none":shade(hex,-.5);
  const gold=sil?"#24243a":"url(#g-gold)";
  const delay=(-(animSeed++%7)*0.37).toFixed(2);
  const flip=opt.flip?` transform="translate(100 0) scale(-1 1)"`:"";
  let s=`<svg viewBox="0 0 100 100" class="art"><ellipse cx="50" cy="95" rx="27" ry="3.6" fill="#000" opacity=".13"/><g${flip}><g class="${opt.still?"":"bob"}" style="animation-delay:${delay}s">`;
  if(c.top==="horns")s+=`<path d="M34 33 Q24 22 28 7 Q36 20 45 27 Z" fill="${gold}" stroke="${sil?"none":"#b8860b"}" stroke-width="1.5" stroke-linejoin="round"/><path d="M66 33 Q76 22 72 7 Q64 20 55 27 Z" fill="${gold}" stroke="${sil?"none":"#b8860b"}" stroke-width="1.5" stroke-linejoin="round"/>`;
  if(c.top==="antenna")s+=`<path d="M42 32 Q38 18 33 10" stroke="${sil?"#24243a":"#4a4a5a"}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 32 Q62 18 67 10" stroke="${sil?"#24243a":"#4a4a5a"}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="33" cy="9" r="5.5" fill="${gold}"/><circle cx="67" cy="9" r="5.5" fill="${gold}"/>${sil?"":`<circle cx="31.5" cy="7.5" r="1.8" fill="#fff"/><circle cx="65.5" cy="7.5" r="1.8" fill="#fff"/>`}`;
  if(c.top==="ears")s+=`<circle cx="29" cy="30" r="11" fill="${fill}" stroke="${line}" stroke-width="2"/><circle cx="71" cy="30" r="11" fill="${fill}" stroke="${line}" stroke-width="2"/>${sil?"":`<circle cx="29" cy="30" r="5.5" fill="#ffb3c1" opacity=".8"/><circle cx="71" cy="30" r="5.5" fill="#ffb3c1" opacity=".8"/>`}`;
  if(c.top==="hair")s+=`<path d="M33 35 L36 11 L44 26 L50 5 L56 26 L64 11 L67 35 Z" fill="${sil?"#24243a":"url(#g-hair)"}" stroke="${sil?"none":"#4e342e"}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const A={down:[[28,60,13,80],[72,60,87,80]],up:[[28,52,12,30],[72,52,88,30]],side:[[28,58,7,56],[72,58,93,56]]}[c.arms];
  A.forEach((a,i)=>{s+=`<g class="${!sil&&!opt.still&&c.arms==="up"&&i===1?"wave":""}"><path d="M${a[0]} ${a[1]} Q${(a[0]+a[2])/2+(i?3:-3)} ${(a[1]+a[3])/2-4} ${a[2]} ${a[3]}" stroke="${dark}" stroke-width="6.5" fill="none" stroke-linecap="round"/><circle cx="${a[2]}" cy="${a[3]}" r="5" fill="${fill}" stroke="${line}" stroke-width="1.5"/></g>`;});
  s+=`<ellipse cx="38" cy="90" rx="10.5" ry="6" fill="${dark}"/><ellipse cx="62" cy="90" rx="10.5" ry="6" fill="${dark}"/>`;
  if(!sil)s+=`<ellipse cx="35" cy="88" rx="4" ry="1.6" fill="#fff" opacity=".3"/><ellipse cx="59" cy="88" rx="4" ry="1.6" fill="#fff" opacity=".3"/>`;
  const bs=`fill="${fill}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"`;
  let ey=50,sp=1,gl="",bel="";
  if(c.body==="round"){s+=`<ellipse cx="50" cy="58" rx="28" ry="30" ${bs}/>`;gl=`<ellipse cx="38" cy="40" rx="9" ry="5" transform="rotate(-35 38 40)"/>`;bel=`<ellipse cx="50" cy="72" rx="16" ry="11"/>`;}
  if(c.body==="square"){s+=`<rect x="24" y="28" width="52" height="58" rx="11" ${bs}/>`;ey=48;gl=`<rect x="29" y="32" width="14" height="6" rx="3"/>`;bel=`<rect x="36" y="64" width="28" height="17" rx="8"/>`;}
  if(c.body==="tri"){s+=`<path d="M50 20 Q53 20 55 25 L83 82 Q85 87 79 87 L21 87 Q15 87 17 82 L45 25 Q47 20 50 20 Z" ${bs}/>`;ey=63;sp=.75;gl=`<ellipse cx="43" cy="40" rx="3.5" ry="7" transform="rotate(25 43 40)"/>`;bel=`<ellipse cx="50" cy="79" rx="14" ry="6"/>`;}
  if(c.body==="tall"){s+=`<rect x="31" y="22" width="38" height="66" rx="19" ${bs}/>`;ey=44;sp=.8;gl=`<ellipse cx="39" cy="33" rx="4" ry="7" transform="rotate(20 39 33)"/>`;bel=`<ellipse cx="50" cy="72" rx="12" ry="11"/>`;}
  if(!sil){
    s+=`<g fill="#fff" opacity=".22">${bel}</g><g fill="#fff" opacity=".55">${gl}</g>`;
    if(c.spots)s+=`<g fill="${shade(hex,-.25)}" opacity=".55"><circle cx="${50-15*sp}" cy="${ey+22}" r="3.6"/><circle cx="${50+14*sp}" cy="${ey+26}" r="3"/><circle cx="${50+4*sp}" cy="${ey+31}" r="2.4"/><circle cx="${50-6*sp}" cy="${ey+30}" r="1.8"/></g>`;
    const ex=c.eyes===1?[50]:c.eyes===2?[50-10*sp,50+10*sp]:[50-14*sp,50,50+14*sp];
    const er=c.eyes===1?9.5:c.eyes===2?7.2:5.6;
    s+=`<g class="${opt.still?"":"blink"}" style="animation-delay:${(-(animSeed%5)*0.9).toFixed(1)}s">`;
    ex.forEach(x=>{s+=`<circle cx="${x}" cy="${ey}" r="${er}" fill="url(#g-eye)" stroke="${line}" stroke-width="1.4"/><circle cx="${x+er*.12}" cy="${ey+er*.1}" r="${er*.55}" fill="#1d1b2e"/><circle cx="${x-er*.12}" cy="${ey-er*.18}" r="${er*.2}" fill="#fff"/><circle cx="${x+er*.3}" cy="${ey+er*.32}" r="${er*.09}" fill="#fff"/>`;});
    s+=`</g>`;
    const my=ey+15;
    if(c.mouth==="smile")s+=`<path d="M41 ${my} Q50 ${my+9} 59 ${my}" fill="none" stroke="#3a1f2b" stroke-width="2.6" stroke-linecap="round"/>`;
    if(c.mouth==="open")s+=`<ellipse cx="50" cy="${my+2}" rx="6.5" ry="5.5" fill="#7a1022"/><ellipse cx="50" cy="${my+5}" rx="4" ry="2.4" fill="#ff6b81"/>`;
    if(c.mouth==="teeth")s+=`<path d="M40 ${my-1} Q50 ${my+12} 60 ${my-1} Z" fill="#7a1022" stroke="#3a1f2b" stroke-width="1.4" stroke-linejoin="round"/><path d="M43.5 ${my} h4 l-2 4 z M52.5 ${my} h4 l-2 4 z" fill="#fff"/>`;
    if(c.cheeks)s+=`<ellipse cx="${50-18*sp}" cy="${my-2}" rx="4.5" ry="3" fill="#ff7a93" opacity=".6"/><ellipse cx="${50+18*sp}" cy="${my-2}" rx="4.5" ry="3" fill="#ff7a93" opacity=".6"/>`;
  }
  return s+`</g></g></svg>`;
}

/* Balık (yön alıştırmaları için) */
function fish(color,dir,stripe){
  const f=CHEX[color],d=shade(f,-.35),ln=shade(f,-.5);
  const t=dir==="left"?` transform="translate(100 0) scale(-1 1)"`:dir==="up"?` transform="rotate(-90 50 50)"`:dir==="down"?` transform="rotate(90 50 50)"`:"";
  return`<svg viewBox="0 0 100 100" class="art"><g${t}><g class="swim"><path d="M24 50 Q12 36 4 32 Q9 50 4 68 Q12 64 24 50 Z" fill="${d}" stroke="${ln}" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="52" cy="50" rx="34" ry="21" fill="url(#g-${color})" stroke="${ln}" stroke-width="2"/>${stripe?`<path d="M44 31 Q38 50 44 69" stroke="#fff" stroke-width="5" fill="none" opacity=".55"/><path d="M58 30 Q53 50 58 70" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>`:""}<ellipse cx="44" cy="40" rx="12" ry="4" fill="#fff" opacity=".45" transform="rotate(-12 44 40)"/><path d="M46 30 Q56 14 66 31 Z" fill="${d}" stroke="${ln}" stroke-width="1.5" stroke-linejoin="round"/><path d="M50 60 Q56 72 62 62" fill="${d}" stroke="${ln}" stroke-width="1.5"/><circle cx="72" cy="45" r="6" fill="url(#g-eye)" stroke="${ln}" stroke-width="1.4"/><circle cx="73.5" cy="45.5" r="3.2" fill="#1d1b2e"/><circle cx="72" cy="43.5" r="1.2" fill="#fff"/><path d="M81 56 Q77 60 72 57" stroke="#3a1f2b" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="92" cy="40" r="2.5" fill="none" stroke="#7cc4ff" stroke-width="1.2" class="bub"/><circle cx="95" cy="30" r="1.6" fill="none" stroke="#7cc4ff" stroke-width="1.2" class="bub b2"/></g></g></svg>`;
}

/* Ortak SVG tanımları (degradeler) */
function svgDefs(){
  let g="";COLORS.forEach(c=>{g+=`<radialGradient id="g-${c.k}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${shade(c.hex,.55)}"/><stop offset=".45" stop-color="${c.hex}"/><stop offset="1" stop-color="${shade(c.hex,-.3)}"/></radialGradient>`;});
  g+=`<radialGradient id="g-sil" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#4a4a68"/><stop offset="1" stop-color="#1d1d30"/></radialGradient>
  <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff59d"/><stop offset="1" stop-color="#ffb300"/></linearGradient>
  <linearGradient id="g-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a1887f"/><stop offset="1" stop-color="#5d4037"/></linearGradient>
  <radialGradient id="g-eye" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3e6f3"/></radialGradient>`;
  const d=document.createElement("div");d.style.cssText="position:absolute;width:0;height:0;overflow:hidden";
  d.innerHTML=`<svg width="0" height="0"><defs>${g}</defs></svg>`;document.body.appendChild(d);
}

/* ================= Alıştırma tipleri ================= */
const TYPE_INFO={
  twins:{skills:["GA","GY","GH","DYK","DSA","PBI","BEN","BA","DAV"],min:2},
  shadow:{skills:["S","GA","GY","GH","DYK","DSA","PBI","BEN","BA","DAV"],min:2},
  odd:{skills:["GA","DAV","DYK","GY","BEN","YY"],min:2},
  count:{skills:["AB","GY","DYK","DSA","S"],min:2},
  color:{skills:["GA","DYK","GY","KBA","SB"],min:1},
  size:{skills:["S","UMY","GA","YY","KBA"],min:1},
  pattern:{skills:["S","DBG","PBI","PL","O"],min:2},
  memory:{skills:["KSH","GH","DYK","EZ","DSA"],min:1},
  direction:{skills:["UMY","GA","DAV","DYK","B3A"],min:1},
  category:{skills:["KBA","DBG","YY","SB","O"],min:1},
  more:{skills:["AB","YY","GA","GY","S"],min:2},
  match:{skills:["GA","BEN","DAV","GY","DSA","EGK"],min:2}
};
const TYPE_ORDER=["twins","count","shadow","color","odd","position","pattern","memory","size","search","match","add","category","half","direction","diff","more"];

const FEATS_D=[["color","body"],["color","body","top","arms"],["top","arms","eyes","mouth"],["eyes","mouth","spots","top","arms"],["spots","cheeks","mouth","eyes"]];
const SIL_D=[["body"],["body","top"],["body","top","arms"],["top","arms"],["top","arms"]];

function distinctMutations(r,base,feats,n,keyFn){
  const out=[],seen=new Set([keyFn(base)]);let guard=0;
  while(out.length<n&&guard++<400){const m=mutate(r,base,feats);const k=keyFn(m);if(!seen.has(k)){seen.add(k);out.push(m);}}
  return out;
}
function placeAnswer(r,correct,wrongs){const all=shuffle(r,[{c:true,v:correct}].concat(wrongs.map(w=>({c:false,v:w}))));return{items:all.map(x=>x.v),answer:all.findIndex(x=>x.c)};}

const GEN={
  twins(r,d){
    const n=d<1?3:d<3?4:5;
    const pairs=[];const correct=randomCreature(r);
    const usedColors=new Set([correct.color]);
    for(let i=0;i<n-1;i++){
      let b=randomCreature(r);
      const m=distinctMutations(r,b,FEATS_D[d],1,ckey)[0];
      pairs.push([b,m]);
    }
    const p=placeAnswer(r,[correct,correct],pairs.map(pp=>r()<.5?pp:[pp[1],pp[0]]));
    return{pr:{k:"twins"},
      options:p.items.map(pr=>`<div class="pair">${creature(pr[0])}${creature(pr[1])}</div>`),answer:p.answer,cols:"cols2"};
  },
  shadow(r,d){
    const n=d<1?3:4;const c=randomCreature(r);
    const w=distinctMutations(r,c,SIL_D[d],n-1,skey);
    const p=placeAnswer(r,c,w);
    return{pr:{k:"shadow",c:c.color},
      stim:creature(c),options:p.items.map(x=>creature(x,{sil:true})),answer:p.answer,cols:n===4?"cols4":"cols3"};
  },
  odd(r,d){
    const n=d<1?4:d<3?5:6;const c=randomCreature(r);
    const w=distinctMutations(r,c,FEATS_D[d],1,ckey)[0];
    const items=Array(n-1).fill(c);const pos=ri(r,0,n-1);items.splice(pos,0,w);
    return{pr:{k:"odd"},
      options:items.map(x=>creature(x)),answer:pos,cols:n===4?"cols4":"cols3"};
  },
  match(r,d){
    const n=d<2?3:4;const c=randomCreature(r);
    const w=distinctMutations(r,c,FEATS_D[Math.min(4,d+1)],n-1,ckey);
    const p=placeAnswer(r,c,w);
    return{pr:{k:"match"},
      stim:creature(c),options:p.items.map(x=>creature(x)),answer:p.answer,cols:n===4?"cols4":"cols3"};
  },
  count(r,d){
    const target=pick(r,SHAPE_KEYS);const tc=pick(r,COLORS).k;
    const max=[4,5,7,8,9][d];const cnt=ri(r,Math.max(1,max-4),max);
    const nd=d<1?ri(r,0,2):d<3?ri(r,2,4):ri(r,4,6);
    const others=[];
    for(let i=0;i<nd;i++){let k=pick(r,SHAPE_KEYS.filter(x=>x!==target));let col=d>=3&&r()<.5?tc:pick(r,COLORS).k;others.push([k,col]);}
    const items=shuffle(r,Array(cnt).fill([target,tc]).concat(others));
    const cols=5,rows=3,cells=shuffle(r,[...Array(cols*rows).keys()]);
    let svg=`<svg viewBox="0 0 300 180" class="art" style="width:100%;max-height:220px">`;
    items.forEach((it,i)=>{const c=cells[i];const x=30+(c%cols)*60+ri(r,-8,8),y=30+Math.floor(c/cols)*60+ri(r,-6,6);svg+=shapeEl(it[0],it[1],x,y,ri(r,17,22));});
    svg+=`</svg>`;
    const set=new Set([cnt]);const cands=shuffle(r,[cnt-2,cnt-1,cnt+1,cnt+2].filter(x=>x>0));
    const nOpt=d<1?3:4;for(const x of cands){if(set.size>=nOpt)break;set.add(x);}
    const opts=[...set].sort((a,b)=>a-b);
    return{pr:{k:"count",s:target},stim:svg,
      options:opts.map(x=>`<div class="num">${x}</div>`),answer:opts.indexOf(cnt),cols:opts.length===4?"cols4":"cols3"};
  },
  color(r,d){
    const n=d<1?3:d<2?4:d<3?5:6;
    const tk=pick(r,SHAPE_KEYS),tc=pick(r,COLORS).k;
    const seen=new Set([tk+tc]);const w=[];let g=0;
    while(w.length<n-1&&g++<300){
      let k,c;const m=r();
      if(d>=1&&m<.45){k=tk;c=pick(r,COLORS).k;}       // aynı şekil, başka renk
      else if(d>=1&&m<.9){k=pick(r,SHAPE_KEYS);c=tc;}  // aynı renk, başka şekil
      else{k=pick(r,SHAPE_KEYS);c=pick(r,COLORS).k;}
      if(d<1&&k===tk)continue;
      if(!seen.has(k+c)){seen.add(k+c);w.push([k,c]);}
    }
    const p=placeAnswer(r,[tk,tc],w);
    const nm=d<1?SHAPES[tk].acc:`${CNAME[tc].toLowerCase()} ${SHAPES[tk].acc}`;
    return{pr:{k:"color",c:tc,s:tk,easy:d<1},
      options:p.items.map(x=>shapeSVG(x[0],x[1],.9)),answer:p.answer,cols:n<=3?"cols3":n===4?"cols4":"cols3 wide"};
  },
  size(r,d){
    const n=d<1?3:d<3?4:5;const k=pick(r,SHAPE_KEYS),c=pick(r,COLORS).k;
    const gap=[.25,.2,.15,.12,.1][d];
    const scales=[];for(let i=0;i<n;i++)scales.push(+(1-i*gap).toFixed(2));
    const big=r()<.5;const order=shuffle(r,scales);
    const ans=order.indexOf(big?scales[0]:scales[n-1]);
    return{pr:{k:"size",s:k,big},
      options:order.map(s=>shapeSVG(k,c,s)),answer:ans,cols:n===3?"cols3":n===4?"cols4":"cols3 wide"};
  },
  pattern(r,d){
    const T=[["AB"],["AB","AAB"],["ABC","ABB","AAB"],["AABB","ABC","ABCB"],["AABB","ABCB","ABBC","ABCD"]][d];
    const tpl=pick(r,T);const letters=[...new Set(tpl.split(""))];
    const mode=d<1?"color":d<2?pick(r,["color","shape"]):"both";
    const elems=[];const seen=new Set();const baseShape=pick(r,SHAPE_KEYS),baseColor=pick(r,COLORS).k;
    let pg=0;while(elems.length<letters.length+3&&pg++<500){
      const e=mode==="color"?[baseShape,pick(r,COLORS).k]:mode==="shape"?[pick(r,SHAPE_KEYS),baseColor]:[pick(r,SHAPE_KEYS),pick(r,COLORS).k];
      const close=elems.some(x=>x[0]===e[0]&&SIMILAR[x[1]]===e[1]);
      if(!close&&!seen.has(e.join()))seen.add(e.join()),elems.push(e);
    }
    const map={};letters.forEach((L,i)=>map[L]=elems[i]);
    const len=Math.max(6,tpl.length*2+ (tpl.length<3?2:1));
    const seq=[];for(let i=0;i<len;i++)seq.push(tpl[i%tpl.length]);
    const correct=map[seq[len-1]];
    const nOpt=d<1?2:3;
    const wrongPool=shuffle(r,letters.filter(L=>map[L]!==correct).map(L=>map[L]).concat(elems.slice(letters.length)));
    const p=placeAnswer(r,correct,wrongPool.slice(0,nOpt-1+(d>=2?1:0)));
    const w=len*44+10;
    let svg=`<svg viewBox="0 0 ${w} 56" class="art" style="width:100%">`;
    seq.forEach((L,i)=>{const cx=27+i*44;if(i===len-1){svg+=`<rect x="${cx-19}" y="9" width="38" height="38" rx="9" fill="#fff" stroke="#ff7a3d" stroke-width="3" stroke-dasharray="5 4"/><text x="${cx}" y="37" font-size="24" font-weight="800" text-anchor="middle" fill="#ff7a3d">?</text>`;}else svg+=shapeEl(map[L][0],map[L][1],cx,28,15);});
    svg+=`</svg>`;
    return{pr:{k:"pattern"},stim:svg,
      options:p.items.map(x=>shapeSVG(x[0],x[1],.85)),answer:p.answer,cols:p.items.length===4?"cols4":"cols3"};
  },
  memory(r,d){
    const n=d<1?3:4;const c=randomCreature(r);
    const w=distinctMutations(r,c,FEATS_D[Math.min(4,d+(d<2?0:-1))],n-1,ckey);
    const p=placeAnswer(r,c,w);
    const secs=[5,5,4,4,3][d];
    return{pr:{k:"memory",secs},
      memory:{html:creature(c),secs},options:p.items.map(x=>creature(x)),answer:p.answer,cols:n===4?"cols4":"cols3"};
  },
  direction(r,d){
    const n=d<1?3:d<2?4:5;const col=pick(r,COLORS).k;
    const vertical=d>=3&&r()<.5;const main=vertical?pick(r,["up","down"]):pick(r,["left","right"]);
    const other=vertical?(main==="up"?"down":"up"):(main==="left"?"right":"left");
    const pos=ri(r,0,n-1);const stripe=r()<.5;
    const items=[];for(let i=0;i<n;i++)items.push(fish(d>=2?pick(r,COLORS).k:col,i===pos?other:main,stripe));
    return{pr:{k:"direction"},
      options:items,answer:pos,cols:n===3?"cols3":n===4?"cols4":"cols3 wide"};
  },
  category(r,d){
    const G={
      meyve:["🍎","🍌","🍇","🍓","🍐","🍊","🍉","🍒","🍑","🍍"],
      hayvan:["🐶","🐱","🐰","🐻","🐸","🐵","🐮","🐷","🦁","🐔"],
      tasit:["🚗","🚌","🚲","✈️","🚂","🚀","🚁","⛵","🚜","🚑"],
      giysi:["👕","👖","👗","🧦","👟","🧢","🧤","🧣","👒","🩳"],
      oyuncak:["⚽","🧸","🪀","🎈","🪁","🎲","🏀","🪅"],
      sebze:["🥕","🥦","🌽","🍆","🥒","🥔","🧅","🫑"]
    };
    const keys=Object.keys(G);const g1=pick(r,keys);
    let pool=keys.filter(k=>k!==g1);
    if(d<2)pool=pool.filter(k=>!((g1==="meyve"&&k==="sebze")||(g1==="sebze"&&k==="meyve")));
    const g2=pick(r,pool);const n=d<1?3:d<3?4:5;
    const same=shuffle(r,G[g1]).slice(0,n-1);const odd=pick(r,G[g2]);
    const p=placeAnswer(r,odd,same);
    return{pr:{k:"category"},
      options:p.items.map(x=>`<div class="emo">${x}</div>`),answer:p.answer,cols:n===3?"cols3":n===4?"cols4":"cols3 wide"};
  },
  more(r,d){
    const n=d<2?2:3;const k=pick(r,SHAPE_KEYS),c=pick(r,COLORS).k;
    const minDiff=[3,2,2,1,1][d];const mx=[5,6,7,8,9][d];
    let counts;let g=0;
    do{counts=[];for(let i=0;i<n;i++)counts.push(ri(r,1,mx));const s=[...counts].sort((a,b)=>b-a);if(s[0]-s[1]>=minDiff)break;}while(g++<200);
    const fewest=d>=2&&r()<.4;
    const target=fewest?Math.min(...counts):Math.max(...counts);
    if(counts.filter(x=>x===target).length>1){counts[counts.indexOf(target)]=fewest?Math.max(1,target-1):target+1;}
    const ans=counts.indexOf(fewest?Math.min(...counts):Math.max(...counts));
    const opts=counts.map(cnt=>{
      const cells=shuffle(r,[...Array(9).keys()]);let s=`<svg viewBox="0 0 120 120" class="art">`;
      for(let i=0;i<cnt;i++){const cc=cells[i];s+=shapeEl(k,c,20+(cc%3)*40+ri(r,-4,4),20+Math.floor(cc/3)*40+ri(r,-4,4),13);}
      return s+`</svg>`;
    });
    return{pr:{k:"more",s:k,few:fewest},
      options:opts,answer:ans,cols:n===2?"cols2":"cols3"};
  }
};

/* ===== Yeni alıştırma türleri ===== */
function halfCreature(c){
  return creature(c,{still:true}).replace('viewBox="0 0 100 100" class="art"','viewBox="0 0 51 100" class="art" style="overflow:hidden;max-height:200px"').replace(/<\/svg>$/,'<line x1="50.5" y1="2" x2="50.5" y2="98" stroke="#ff7a3d" stroke-width="1.4" stroke-dasharray="3 3"/></svg>');
}
const SEARCH_PAIRS=[
  [["🍎","🍌"],["🐶","🐱"],["⭐","❤️"],["🚗","🚀"],["🌞","🌧️"]],
  [["🐱","🐶"],["🍓","🍒"],["🌞","🌙"],["🐸","🐢"],["🎈","⚽"]],
  [["🍊","🍑"],["🐻","🐼"],["🚗","🚕"],["🐝","🐞"],["🌷","🌹"]],
  [["😀","😃"],["🐟","🐠"],["🌳","🌲"],["🍏","🍎"],["🐮","🐷"]],
  [["😊","🙂"],["🐭","🐹"],["⚽","🏐"],["🌼","🌻"],["🐤","🐥"]]
];
Object.assign(TYPE_INFO,{
  position:{skills:["UMY","GA","SB","KBA","DYK"],min:1},
  add:{skills:["AB","DBG","GY","S"],min:1},
  diff:{skills:["DAV","GA","DSA","GY","BEN"],min:2},
  half:{skills:["PBI","BA","GA","GH","UMY"],min:1},
  search:{skills:["DYK","GY","DAV","GA","DSA","EGK"],min:1}
});
Object.assign(GEN,{
  position(r,d){
    const n=[4,5,6,7,8][d];const cells=shuffle(r,[...Array(9).keys()]).slice(0,n);
    const items=[];const seen=new Set();let g=0;
    const shapes=shuffle(r,SHAPE_KEYS);
    while(items.length<n&&g++<300){
      const k=d<2?shapes[items.length%shapes.length]:pick(r,SHAPE_KEYS),c=pick(r,COLORS).k;
      if(d<2&&items.some(x=>x[0]===k))continue;
      if(!seen.has(k+c)){seen.add(k+c);items.push([k,c]);}
    }
    while(items.length<n){items.push([pick(r,SHAPE_KEYS),pick(r,COLORS).k]);}
    const at={};cells.forEach((c,i)=>at[c]=i);
    const rels=d<1?["above","below"]:["above","below","left","right"];
    const cands=[];
    cells.forEach((c,i)=>{const x=c%3,y=Math.floor(c/3);rels.forEach(rel=>{const nc=rel==="above"?(y>0?c-3:-1):rel==="below"?(y<2?c+3:-1):rel==="left"?(x>0?c-1:-1):(x<2?c+1:-1);if(nc>=0&&at[nc]!==undefined)cands.push([i,at[nc],rel]);});});
    let ref,tgt,rel;
    if(cands.length){[ref,tgt,rel]=pick(r,cands);}else{ref=0;tgt=1;rel="above";}
    const others=items.filter((_,i)=>i!==ref&&i!==tgt);
    const nOpt=d<1?3:4;
    const p=placeAnswer(r,items[tgt],shuffle(r,others).slice(0,nOpt-1));
    let svg=`<svg viewBox="0 0 240 240" class="art" style="width:100%;max-width:300px">`;
    for(let c=0;c<9;c++)svg+=`<rect x="${4+(c%3)*78}" y="${4+Math.floor(c/3)*78}" width="76" height="76" rx="14" fill="${(c+Math.floor(c/3))%2?"#fff":"#fff3dc"}" stroke="#ffd28a" stroke-width="2"/>`;
    cells.forEach((c,i)=>{svg+=shapeEl(items[i][0],items[i][1],42+(c%3)*78,40+Math.floor(c/3)*78,24);});
    svg+=`</svg>`;
    return{pr:{k:"position",s:items[ref][0],c:items[ref][1],rel},stim:svg,
      options:p.items.map(x=>shapeSVG(x[0],x[1],.85)),answer:p.answer,cols:p.items.length===4?"cols4":"cols3"};
  },
  add(r,d){
    const mx=[5,6,8,10,12][d];const k=pick(r,SHAPE_KEYS),c=pick(r,COLORS).k;
    const a=ri(r,1,Math.min(5,mx-1)),b=ri(r,1,Math.min(6,mx-a)),t=a+b;
    const box=(cnt,x0)=>{const cells=shuffle(r,[...Array(9).keys()]);let s=`<rect x="${x0}" y="4" width="112" height="112" rx="16" fill="#fff" stroke="#ffd28a" stroke-width="3"/>`;for(let i=0;i<cnt;i++){const cc=cells[i];s+=shapeEl(k,c,x0+20+(cc%3)*36,24+Math.floor(cc/3)*36,12);}return s;};
    let svg=`<svg viewBox="0 0 280 120" class="art" style="width:100%">${box(a,4)}<text x="140" y="74" font-size="44" font-weight="800" text-anchor="middle" fill="#ff7a3d">+</text>${box(b,164)}</svg>`;
    const set=new Set([t]);for(const x of shuffle(r,[t-2,t-1,t+1,t+2].filter(x=>x>0))){if(set.size>=(d<1?3:4))break;set.add(x);}
    const opts=[...set].sort((x,y)=>x-y);
    return{pr:{k:"add",s:k},stim:svg,options:opts.map(x=>`<div class="num">${x}</div>`),answer:opts.indexOf(t),cols:opts.length===4?"cols4":"cols3"};
  },
  diff(r,d){
    const base=randomCreature(r);
    const pool=d<1?["color","top","arms","body","eyes"]:d<3?["top","arms","eyes","mouth","spots","body"]:["top","arms","eyes","mouth","spots","cheeks"];
    const maxN=d<1?2:d<3?3:4;const n=ri(r,1,maxN);
    const feats=shuffle(r,pool).slice(0,n);let m=Object.assign({},base);
    feats.forEach(f=>{m[f]=pick(r,FEAT_VALUES[f].filter(v=>v!==base[f]));});
    const opts=d<1?[1,2,3]:[1,2,3,4];
    const stim=`<div class="duo"><div>${creature(base,{still:true})}</div><div class="vs">≠</div><div>${creature(m,{still:true})}</div></div>`;
    return{pr:{k:"diff"},stim,options:opts.map(x=>`<div class="num">${x}</div>`),answer:opts.indexOf(n),cols:opts.length===4?"cols4":"cols3"};
  },
  half(r,d){
    const FE=[["color","body"],["body","top","arms","color"],["top","arms","eyes","spots"],["top","arms","eyes","spots","cheeks"],["eyes","spots","cheeks","arms"]][d];
    const n=d<1?3:4;const c=randomCreature(r);
    const w=distinctMutations(r,c,FE,n-1,ckey);
    const p=placeAnswer(r,c,w);
    return{pr:{k:"half"},stim:halfCreature(c),options:p.items.map(x=>creature(x)),answer:p.answer,cols:n===4?"cols4":"cols3"};
  },
  search(r,d){
    const pr=pick(r,SEARCH_PAIRS[d]);const sw=r()<.5;const same=sw?pr[1]:pr[0],odd=sw?pr[0]:pr[1];
    const n=[6,9,12,16,20][d];const pos=ri(r,0,n-1);
    const opts=[];for(let i=0;i<n;i++)opts.push(`<div class="emo">${i===pos?odd:same}</div>`);
    return{pr:{k:"search"},options:opts,answer:pos,cols:(n<=9?"cols3":n<=16?"cols4":"cols5")+" emogrid"};
  }
});

const TOTAL=500,PER_DAY=10,DAYS=TOTAL/PER_DAY;
const cache={};
function getExercise(i){
  if(cache[i])return cache[i];
  const type=TYPE_ORDER[i%TYPE_ORDER.length];
  const d=Math.min(4,Math.floor(i/100));
  const r=rngFrom(1000+i*7919);
  const ex=GEN[type](r,d);
  ex.type=type;ex.d=d;ex.no=i+1;ex.skills=TYPE_INFO[type].skills;ex.min=TYPE_INFO[type].min+(d>=3?1:0);
  return cache[i]=ex;
}
const LEVELS=["Seviye 1 · 3 yaş","Seviye 2 · 3-4 yaş","Seviye 3 · 4 yaş","Seviye 4 · 4-5 yaş","Seviye 5 · 5+ yaş"];
const dayLevel=day=>Math.min(4,Math.floor(((day-1)*PER_DAY)/100));

/* ================= Kayıt: cihaz ayarları, aile verisi, aktif çocuk ================= */
const CFG_KEY="dikkat-atolyesi-cfg";
function lsGet(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
let cfg=lsGet(CFG_KEY,{});
(function(){const o=lsGet("dikkat-atolyesi-v2",null)||lsGet("dikkat-atolyesi-v1",null);if(o){if(cfg.lang==null&&o.lang)cfg.lang=o.lang;if(cfg.mute==null&&o.mute)cfg.mute=o.mute;}})();
function saveCfg(){lsSet(CFG_KEY,cfg);}
const famKey=()=>"dikkat-atolyesi-fam:"+(cfg.mode==="account"?cfg.user:"guest");
let fam={children:[]};
function loadFam(){fam=lsGet(famKey(),{children:[]});if(!fam.children)fam.children=[];}
function saveFam(){lsSet(famKey(),fam);}
let store={days:{},usage:{},bonus:{}}; /* aktif çocuk */
function save(){store.ts=Date.now();saveFam();markDirty(store.id);}

/* ================= Ses efektleri ================= */
let AC=null;
function tone(freq,dur,type,when,vol,slide){
  if(cfg.mute)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
    const t=AC.currentTime+(when||0),o=AC.createOscillator(),g=AC.createGain();
    o.type=type||"sine";o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||.18,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.05);}catch(e){}
}
const SFX={
  pop:()=>{tone(520,.12,"sine",0,.22,980);tone(1300,.08,"triangle",.05,.08);},
  tap:()=>tone(700,.07,"triangle",0,.1,500),
  swoosh:()=>tone(300,.18,"sine",0,.08,900),
  tick:()=>tone(880,.06,"square",0,.05),
  go:()=>{[523,659,784].forEach((f,i)=>tone(f,.15,"triangle",i*.08,.12));},
  win:()=>{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,.22,"triangle",i*.12,.15));tone(1568,.5,"sine",.75,.08);},
  ok:()=>{[392,523].forEach((f,i)=>tone(f,.2,"triangle",i*.1,.12));}
};

/* ================= Durum ================= */
let S=null,memTimer=null;
const MASCOT={body:"round",color:"turuncu",eyes:2,top:"antenna",arms:"up",mouth:"teeth",spots:true,cheeks:true};
function LG(){return cfg.lang||"tr";}
function U(){return I18N.UI[LG()];}
const titleOf=ex=>I18N.TITLES[LG()][ex.type];
const promptOf=ex=>I18N.prompt(LG(),ex.pr);
if(!cfg.lang){const nl=(navigator.language||"tr").slice(0,2).toLowerCase();cfg.lang=I18N.LANGS.includes(nl)?nl:"tr";}
const voiceCache={},voiceWarned={};
function pickVoice(lang){try{const pre=lang.slice(0,2),vs=speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.slice(0,2).toLowerCase()===pre);
  return vs.find(v=>v.lang.replace("_","-").toLowerCase()===lang.toLowerCase()&&/google|natural|premium|enhanced|yelda|anna|milena|samantha/i.test(v.name))||vs.find(v=>v.lang.replace("_","-").toLowerCase()===lang.toLowerCase())||vs[0]||null;}catch(e){return null;}}
try{speechSynthesis.onvoiceschanged=()=>{for(const k in voiceCache)delete voiceCache[k];};}catch(e){}
function speak(t,force){
  if(!force&&cfg.mute)return;
  const L=U().voice;
  try{
    if(!window.speechSynthesis){toast(U().noTTS);return;}
    if(!voiceCache[L])voiceCache[L]=pickVoice(L);
    const v=voiceCache[L];
    if(!v&&!voiceWarned[L]&&speechSynthesis.getVoices().length){voiceWarned[L]=1;toast(U().noVoice);}
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);u.lang=L;if(v)u.voice=v;u.rate=.88;u.pitch=1.15;
    u.onstart=()=>document.body.classList.add("talking");
    u.onend=u.onerror=()=>document.body.classList.remove("talking");
    setTimeout(()=>speechSynthesis.speak(u),60);
  }catch(e){toast(U().noTTS);}
}
/* iPad/iPhone: ilk dokunuşta sesi aç */
function unlockSpeech(){try{const u=new SpeechSynthesisUtterance(" ");u.volume=0;speechSynthesis.speak(u);}catch(e){}document.removeEventListener("touchend",unlockSpeech);document.removeEventListener("click",unlockSpeech);}
document.addEventListener("touchend",unlockSpeech,{once:true});document.addEventListener("click",unlockSpeech,{once:true});
const bigSpeaker=(id,label)=>`<button class="spkbig" id="${id}" aria-label="${U().listen}"><span class="spk-ic"><svg viewBox="0 0 48 48"><path d="M8 18h8l11-9v30l-11-9H8z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path class="w1" d="M32 17q5 7 0 14" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path class="w2" d="M37 12q9 12 0 24" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg></span><span class="spk-l">${label||U().listenS}</span></button>`;
function toast(t){document.querySelectorAll(".toast").forEach(e=>e.remove());const el=document.createElement("div");el.className="toast";el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2200);}
const starCount=(c,t)=>{const p=c/t;return p>=.9?3:p>=.6?2:p>0?1:0;};
function starsHTML(n,cls){let h="";for(let i=0;i<3;i++)h+=`<span class="st ${i<n?"on":""} ${cls||""}" style="animation-delay:${.15*i}s">★</span>`;return h;}
function fmtTime(ms){const s=Math.round(ms/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
const muteBtn=()=>`<button class="iconbtn" id="mute" aria-label="Ses">${cfg.mute?"🔇":"🔊"}</button>`;
function bindMute(){const m=$("#mute");if(m)m.onclick=()=>{cfg.mute=!cfg.mute;saveCfg();m.textContent=cfg.mute?"🔇":"🔊";if(!cfg.mute)SFX.tap();};}

/* ================= Arka plan & efektler ================= */
function buildBg(){
  const bg=document.createElement("div");bg.id="bg";
  let h=`<div class="sun"></div>`;
  for(let i=0;i<5;i++)h+=`<svg class="cloud c${i}" viewBox="0 0 120 60"><path d="M20 50 a16 16 0 0 1 6 -30 a22 22 0 0 1 40 -8 a18 18 0 0 1 32 12 a14 14 0 0 1 2 26 Z" fill="#fff"/></svg>`;
  for(let i=0;i<14;i++)h+=`<i class="bubble" style="left:${(i*7.3+3)%100}%;width:${10+(i*13)%26}px;height:${10+(i*13)%26}px;animation-duration:${9+(i*5)%10}s;animation-delay:${-(i*1.7)}s"></i>`;
  h+=`<svg class="hills" viewBox="0 0 400 80" preserveAspectRatio="none"><path d="M0 50 Q60 20 120 45 T240 40 T400 35 V80 H0 Z" fill="#9be38b"/><path d="M0 62 Q80 40 170 60 T400 55 V80 H0 Z" fill="#6fcf6a"/></svg>`;
  bg.innerHTML=h;document.body.prepend(bg);
}
function burst(x,y,colors){
  colors=colors||["#ff7a3d","#ffd23d","#7c5cff","#3dd6ff","#ff5c8a","#4cd964"];
  for(let i=0;i<16;i++){
    const p=document.createElement("i");p.className="spark";
    const a=Math.PI*2*i/16+Math.random()*.4,d=50+Math.random()*50;
    p.style.cssText=`left:${x}px;top:${y}px;background:${colors[i%colors.length]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;${i%3===0?"border-radius:2px;":""}`;
    document.body.appendChild(p);setTimeout(()=>p.remove(),750);
  }
  const s=document.createElement("i");s.className="ring";s.style.left=x+"px";s.style.top=y+"px";document.body.appendChild(s);setTimeout(()=>s.remove(),600);
}
function confetti(){
  const c=document.createElement("canvas");c.className="confetti";document.body.appendChild(c);
  const W=c.width=innerWidth*devicePixelRatio,H=c.height=innerHeight*devicePixelRatio,x=c.getContext("2d");
  const cols=["#ff7a3d","#ffd23d","#7c5cff","#3dd6ff","#ff5c8a","#4cd964"];
  const P=[];for(let i=0;i<180;i++)P.push({x:W/2+(Math.random()-.5)*W*.3,y:H*.35,vx:(Math.random()-.5)*W*.025,vy:-Math.random()*H*.025-H*.005,r:(6+Math.random()*8)*devicePixelRatio,c:cols[i%6],a:Math.random()*6,va:(Math.random()-.5)*.3,sh:i%3});
  let t=0;(function f(){x.clearRect(0,0,W,H);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=H*.0006;p.vx*=.99;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;if(p.sh===0){x.beginPath();x.arc(0,0,p.r/2,0,7);x.fill();}else x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2*(p.sh));x.restore();});
    if(t++<220)requestAnimationFrame(f);else c.remove();})();
}

/* ================= Ekranlar ================= */
function render(html,anim){clearTimeout(memTimer);try{speechSynthesis.cancel();document.body.classList.remove("talking");}catch(e){}const a=$("#app");a.innerHTML=`<div class="screen ${anim||"in-up"}">${html}</div>`;window.scrollTo(0,0);bindMute();}
function currentDay(){for(let d=1;d<=DAYS;d++)if(!store.days[d])return d;return DAYS;}
const LCOL=["#2fbf71","#2f9bff","#8a5cff","#ff8a2f","#ff4f6d"];
const LNAME=["Çayır Vadisi","Mavi Göl","Mor Orman","Turuncu Kanyon","Yıldız Tepesi"];
const LICON=["🌼","💧","🍄","🏜️","⭐"];

function home(){
  S=null;
  const done=Object.keys(store.days).length;
  let correct=0,starsTot=0;Object.values(store.days).forEach(v=>{correct+=v.lastCorrect;starsTot+=starCount(v.best,PER_DAY);});
  const cur=currentDay();
  let li=0;const title=U().title.map(w=>[...w].map(ch=>`<span style="animation-delay:${(li++)*.08}s">${ch}</span>`).join("")).join("<br>");
  document.documentElement.lang=LG();document.title=U().title.join(" ").replace("- ","-")+" – 500";
  const langs=I18N.LANGS.map(l=>`<button class="lang ${l===LG()?"on":""}" data-lang="${l}"><span class="fl">${I18N.UI[l].flag}</span><span>${I18N.UI[l].name}</span></button>`).join("");
  let h=`<div class="topbar"><button class="iconbtn lockbtn" id="lock" aria-label="${U().parent}">🔒</button>${store.name?`<span class="kidchip">${avatar(store,"sm")}<b>${esc(store.name)}</b></span>`:""}<span class="flex"></span><span class="chip">⭐ ${starsTot}</span>${muteBtn()}</div>
  <div class="langbar"><span class="lglbl">🌍 ${U().lang}</span>${langs}</div>
  <div class="hero">
    <div class="hero-txt"><h1 class="wavy">${title}</h1>
      <div class="speechrow"><div class="speech">${store.name?U().helloKid(esc(store.name),U().mascot):U().hello(U().mascot,done)}</div>${bigSpeaker("hspk","")}</div>
      <button class="cta" id="play">${U().start(cur)}</button></div>
    <div class="hero-mascot">${creature(MASCOT)}</div>
  </div>
  <div class="statrow"><div class="statc"><b>${done}</b><small>${U().days}</small></div><div class="statc"><b>${done?Math.round(correct/(done*PER_DAY)*100):0}%</b><small>${U().success}</small></div><div class="statc"><b>${starsTot}</b><small>${U().stars}</small></div></div>
  <div class="row-btns"><button class="pill" data-go="report"><span>📈</span>${U().report}</button><button class="pill" data-go="legend"><span>🏷️</span>${U().legend}</button></div>`;
  // ---- harita
  const nodes=[];let y=40;const XS=[50,80,50,20];let k=0;let html="";
  for(let L=0;L<5;L++){
    html+=`<div class="zone" style="top:${y}px;--c:${LCOL[L]}"><span>${LICON[L]}</span><b>${U().zones[L]}</b><small>${U().levels[L]}</small></div>`;y+=150;
    for(let day=1;day<=DAYS;day++){if(dayLevel(day)!==L)continue;
      const x=XS[k++%4];nodes.push({x,y,day,L});y+=118;}
  }
  const H=y;let path="";
  nodes.forEach((n,i)=>{if(!i){path+=`M${n.x} ${n.y}`;return;}const p=nodes[i-1],dy=n.y-p.y;path+=` C${p.x} ${p.y+dy*.55} ${n.x} ${n.y-dy*.55} ${n.x} ${n.y}`;});
  let deco="";const DECO=["🌳","🌷","🍄","🌻","🪨","🌲","🦋","🐞","🌵","⭐"];
  nodes.forEach((n,i)=>{if(i%2===0){const dx=n.x>50?18:n.x<50?82:(i%4?14:86);deco+=`<span class="deco" style="left:${dx}%;top:${n.y+20}px;animation-delay:${-i*.4}s">${DECO[(i+n.L*2)%DECO.length]}</span>`;}});
  html+=`<svg class="road" viewBox="0 0 100 ${H}" preserveAspectRatio="none" style="height:${H}px"><path d="${path}" class="road-b" vector-effect="non-scaling-stroke"/><path d="${path}" class="road-m" vector-effect="non-scaling-stroke"/><path d="${path}" class="road-d" vector-effect="non-scaling-stroke"/></svg>`+deco;
  nodes.forEach(n=>{const st=store.days[n.day];const isCur=n.day===cur;
    html+=`<button class="node ${st?"done":""} ${isCur?"current":""}" data-day="${n.day}" style="left:${n.x}%;top:${n.y}px;--c:${LCOL[n.L]}">
      ${isCur?`<span class="pin">${creature(MASCOT,{still:false})}</span>`:""}
      <span class="disc"><span class="num">${n.day}</span></span>
      <span class="nst">${st?starsHTML(starCount(st.best,PER_DAY)):isCur?`<span class="go">${U().go}</span>`:""}</span></button>`;});
  h+=`<h2 class="sec">🗺️ ${U().map}</h2><div class="map" style="height:${H}px">${html}</div>
  <div class="card how"><h3>${U().parent}</h3>${U().parentP.map(p=>`<p>${p}</p>`).join("")}</div>
  <p class="hint">${U().saved}</p>`;
  render(h,"in-up");
  $("#play").onclick=()=>{SFX.go();startDay(cur);};
  $("#hspk").onclick=()=>speak(store.name?U().helloKidSay(store.name,U().mascot):U().helloSay(U().mascot,done),true);
  $("#lock").onclick=()=>{SFX.tap();parentGate(()=>parentPanel());};
  document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{cfg.lang=b.dataset.lang;saveCfg();SFX.tap();home();speak(U().chosen+". "+(store.name?U().helloKidSay(store.name,U().mascot):U().helloSay(U().mascot,done)),true);});
  document.querySelectorAll("[data-day]").forEach(b=>b.onclick=e=>{const r=b.querySelector(".disc").getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2);SFX.go();setTimeout(()=>startDay(+b.dataset.day),260);});
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{SFX.tap();b.dataset.go==="report"?report():legend();});
  const c=document.querySelector(".node.current");if(c&&cur>1)setTimeout(()=>c.scrollIntoView({behavior:"smooth",block:"center"}),500);
}

function startDay(day){S={day,idx:0,answers:Array(PER_DAY).fill(null),start:Date.now(),review:false,memShown:{}};quiz("in-up");}

function sayText(ex,showMem){
  if(ex.memory){return S&&S.review?promptOf(ex):I18N.memSay(LG(),ex.memory.secs,showMem);}
  return promptOf(ex);
}
function quiz(anim){
  const i=(S.day-1)*PER_DAY+S.idx;const ex=getExercise(i);const sel=S.answers[S.idx];
  const showMem=ex.memory&&!S.review&&!S.memShown[S.idx];
  const pct=(S.idx+(S.review?1:0))/PER_DAY*100;
  let dots="";for(let k=0;k<PER_DAY;k++){let c="";if(S.review){c=S.answers[k]===getExercise((S.day-1)*PER_DAY+k).answer?"ok":"no";}else if(S.answers[k]!==null)c="a";dots+=`<b class="${c} ${k===S.idx?"cur":""}"></b>`;}
  const L=dayLevel(S.day);
  let h=`<div class="topbar"><button class="iconbtn" id="x" aria-label="Kapat">✕</button>
    <div class="track"><div class="track-fill" style="width:${Math.max(4,(S.idx+1)/PER_DAY*100)}%"></div><span class="runner" style="left:${(S.idx+1)/PER_DAY*100}%">${creature(MASCOT,{still:true})}</span><span class="flag">🏁</span></div>
    ${muteBtn()}</div>
  <div class="dots">${dots}</div>
  <div class="ask"><div class="ask-m">${creature(Object.assign({},MASCOT,{arms:"side",mouth:"open"}))}</div>
    <div class="ask-b"><div class="ask-top"><span class="badge" style="background:${LCOL[L]}">${U().day} ${S.day} · ${S.idx+1}/${PER_DAY}${S.review?" · "+U().review:""}</span></div><h3>${titleOf(ex)}</h3><p>${sayText(ex,showMem)}</p></div>
    ${bigSpeaker("spk",U().listen)}</div>
  <div class="page">`;
  if(ex.stim)h+=`<div class="stim">${ex.stim}</div>`;
  if(ex.memory){
    if(showMem)h+=`<div class="stim memo"><div class="lab">${U().memLook}</div><div class="memo-art">${ex.memory.html}</div>
      <div class="ringwrap"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="rbg"/><circle cx="22" cy="22" r="19" class="rfg" style="animation-duration:${ex.memory.secs}s"/></svg><b id="cd">${ex.memory.secs}</b></div></div>`;
    else if(S.review)h+=`<div class="stim"><div class="lab">${U().memShown}</div><div style="width:120px">${ex.memory.html}</div></div>`;
  }
  if(!showMem){
    h+=`<div class="opts ${ex.cols||"cols3"}">`;
    ex.options.forEach((o,k)=>{
      let cls="",mark="";
      if(S.review){if(k===ex.answer){cls="right";mark="✓";}else if(k===sel){cls="wrong";mark="✗";}}
      else if(k===sel)cls="sel";
      h+=`<button class="opt ${cls}" data-k="${k}" style="animation-delay:${k*.06}s"><span class="letter">${LET[k]}</span>${mark?`<span class="mark">${mark}</span>`:""}${o}</button>`;
    });
    h+=`</div>`;
  }
  h+=`<div class="skillbar">${ex.skills.map(skillTile).join("")}<span class="mins">${ex.min}<small>${U().min}</small></span><span class="pageno">${ex.no}</span></div>
    <div class="skname" id="skn"></div></div>`;
  const last=S.idx===PER_DAY-1;
  h+=`<div class="nav"><button class="btn" id="prev" ${S.idx===0?"disabled":""}>◀</button>`;
  if(S.review)h+=last?`<button class="btn primary" id="res">${U().results}</button>`:`<button class="btn primary" id="next">${U().next}</button>`;
  else h+=last?`<button class="btn green" id="fin">${U().finish}</button>`:`<button class="btn primary ${sel!==null?"glow":""}" id="next">${U().next}</button>`;
  h+=`</div>`;
  render(h,anim||"in-right");

  $("#x").onclick=()=>{SFX.tap();if(S.review){results(true);return;}if(S.answers.some(a=>a!==null)&&!confirmLeave())return;home();};
  const said=sayText(ex,showMem);
  $("#spk").onclick=()=>{speak(said,true);};
  document.querySelector(".ask-m").onclick=()=>speak(said,true);
  document.querySelector(".ask-b").onclick=()=>speak(said,true);
  if(!S.review&&!(S.spoken||{})[S.idx+(showMem?"m":"")]){S.spoken=S.spoken||{};S.spoken[S.idx+(showMem?"m":"")]=1;setTimeout(()=>{if(S&&!S.review)speak(said);},450);}
  document.querySelectorAll(".sk").forEach(el=>el.onclick=()=>{const s=SKILLS[el.dataset.sk];$("#skn").textContent=s[2]+" "+skCode(el.dataset.sk)+" · "+skName(el.dataset.sk);el.classList.remove("jig");void el.offsetWidth;el.classList.add("jig");SFX.tap();});
  if($("#prev"))$("#prev").onclick=()=>{SFX.swoosh();S.idx--;quiz("in-left");};
  if($("#next"))$("#next").onclick=()=>{SFX.swoosh();S.idx++;quiz("in-right");};
  if($("#res"))$("#res").onclick=()=>results(true);
  if($("#fin"))$("#fin").onclick=finish;
  if(!S.review)document.querySelectorAll(".opt").forEach(b=>b.onclick=e=>{
    S.answers[S.idx]=+b.dataset.k;SFX.pop();
    const r=b.getBoundingClientRect();burst(e.clientX||r.left+r.width/2,e.clientY||r.top+r.height/2);
    document.querySelectorAll(".opt").forEach(o=>{o.classList.toggle("sel",o===b);o.classList.remove("boing");});
    void b.offsetWidth;b.classList.add("boing");
    document.querySelectorAll(".dots b")[S.idx].classList.add("a");
    const n=$("#next");if(n)n.classList.add("glow");
  });
  if(showMem){let t=ex.memory.secs;const tick=()=>{t--;const cd=$("#cd");if(!cd)return;SFX.tick();if(t<=0){S.memShown[S.idx]=true;quiz("in-fade");}else{cd.textContent=t;memTimer=setTimeout(tick,1000);}};memTimer=setTimeout(tick,1000);}
}
let leaveAsked=false;
function confirmLeave(){if(leaveAsked){leaveAsked=false;return true;}leaveAsked=true;toast(U().leave);setTimeout(()=>leaveAsked=false,2500);return false;}
let finAsked=false;
function finish(){
  const empty=S.answers.filter(a=>a===null).length;
  if(empty&&!finAsked){finAsked=true;toast(U().empty(empty));setTimeout(()=>finAsked=false,3000);return;}
  finAsked=false;S.time=Date.now()-S.start;S.review=true;
  const res=dayResult(S.day,S.answers);const prev=store.days[S.day];
  store.days[S.day]={best:Math.max(prev?prev.best:0,res.correct),lastCorrect:res.correct,answers:S.answers.slice(),time:S.time,ts:Date.now(),date:new Date().toISOString().slice(0,10)};
  save();results(false);
}
function dayResult(day,answers){
  let correct=0;const sk={};
  answers.forEach((a,k)=>{const ex=getExercise((day-1)*PER_DAY+k);const ok=a===ex.answer;if(ok)correct++;ex.skills.forEach(s=>{sk[s]=sk[s]||{c:0,t:0};sk[s].t++;if(ok)sk[s].c++;});});
  return{correct,wrong:answers.length-correct,sk};
}
function skillRows(sk){
  const ks=Object.keys(sk).sort((a,b)=>sk[b].c/sk[b].t-sk[a].c/sk[a].t||sk[b].t-sk[a].t);
  if(!ks.length)return`<p class="empty">${U().noData}</p>`;
  return ks.map((k,i)=>{const p=Math.round(sk[k].c/sk[k].t*100);const cls=p>=80?"good":p>=50?"mid":"low";
    return`<div class="skrow" style="animation-delay:${i*.04}s">${skillTile(k)}<div class="nm">${skName(k)} <small>(${sk[k].c}/${sk[k].t})</small></div><div class="bar"><i class="${cls}" data-w="${p}"></i></div><div class="pc">%${p}</div></div>`;}).join("");
}
function growBars(){setTimeout(()=>document.querySelectorAll(".bar>i[data-w]").forEach(b=>b.style.width=b.dataset.w+"%"),120);}
function results(quiet){
  const res=dayResult(S.day,S.answers);const n=starCount(res.correct,PER_DAY);
  const M=U().msgs,msg=res.correct>=9?M[0]:res.correct>=7?M[1]:res.correct>=5?M[2]:M[3];
  let h=`<div class="topbar"><button class="iconbtn" id="x">🏠</button><span class="flex ttl">${U().resOf(S.day)}</span>${muteBtn()}</div>
  <div class="score">
    <div class="rays"></div>
    <div class="score-m ${n>=2?"dance":""}">${creature(Object.assign({},MASCOT,{mouth:n>=2?"teeth":"smile"}))}</div>
    <div class="msgrow"><div class="msg">${msg}</div>${bigSpeaker("rspk","")}</div>
    <div class="bigstars">${starsHTML(n,"pop")}</div>
    <div class="big"><span id="cnt">0</span><small> / ${PER_DAY}</small></div>
    <div class="sub"><span class="ok">✅ ${U().correct} <b>${res.correct}</b></span><span class="no">❌ ${U().wrong} <b>${res.wrong}</b></span><span>🎯 %${res.correct*10}</span>${S.time?`<span>⏱️ ${fmtTime(S.time)}</span>`:""}</div>
  </div>
  <h2 class="sec">${U().pages} <small>${U().tapReview}</small></h2><div class="grid10">`;
  S.answers.forEach((a,k)=>{const ex=getExercise((S.day-1)*PER_DAY+k);const ok=a===ex.answer;
    h+=`<button class="tile ${ok?"ok":"no"}" data-k="${k}" style="animation-delay:${.6+k*.07}s"><span class="ic">${ok?"✓":"✗"}</span><b>${k+1}</b><small>${titleOf(ex)}</small><em>${a===null?U().blank:LET[a]} → ${LET[ex.answer]}</em></button>`;});
  h+=`</div><h2 class="sec">${U().todaySkills}</h2>${skillRows(res.sk)}
  <div class="nav"><button class="btn" id="again">${U().again}</button>${S.day<DAYS?`<button class="btn primary glow" id="nextday">${U().nextDay(S.day+1)}</button>`:""}</div>`;
  render(h,"in-up");growBars();
  $("#x").onclick=()=>{SFX.tap();home();};
  $("#again").onclick=()=>{SFX.go();startDay(S.day);};
  if($("#nextday"))$("#nextday").onclick=()=>{SFX.go();startDay(S.day+1);};
  document.querySelectorAll(".tile").forEach(b=>b.onclick=()=>{SFX.tap();S.idx=+b.dataset.k;S.review=true;quiz("in-up");});
  // sayaç
  let c=0;const el=$("#cnt");const step=()=>{if(c>=res.correct)return;c++;el.textContent=c;el.parentNode.classList.remove("bump");void el.offsetWidth;el.parentNode.classList.add("bump");if(!quiet)tone(500+c*60,.08,"triangle",0,.1);setTimeout(step,110);};
  setTimeout(step,400);
  const sayRes=U().sayRes(msg.replace(/[^\p{L}\p{N}\s!.,]/gu,"").trim(),res.correct);
  if(!quiet){setTimeout(()=>{n>=2?SFX.win():SFX.ok();},300);if(n>=1)setTimeout(confetti,350);setTimeout(()=>speak(sayRes),1700);}
  $("#rspk").onclick=()=>speak(sayRes,true);
}
function report(){
  const sk={};let days=0;
  Object.entries(store.days).forEach(([day,v])=>{days++;const r=dayResult(+day,v.answers);Object.entries(r.sk).forEach(([k,x])=>{sk[k]=sk[k]||{c:0,t:0};sk[k].c+=x.c;sk[k].t+=x.t;});});
  let h=`<div class="topbar"><button class="iconbtn" id="x">🏠</button><span class="flex ttl">📈 ${U().report}${store.name?" · "+esc(store.name):""}</span>${muteBtn()}</div>
  <div class="card intro"><div class="intro-m">${creature({body:"tall",color:"mavi",eyes:2,top:"ears",arms:"up",mouth:"smile",spots:false,cheeks:true})}</div><p>${U().repIntro(days)}<br>🟢 %80+ · 🟡 %50–79 · 🔴 %50 altı</p></div>${weekChart(store)}${skillRows(sk)}`;
  if(days)h+=`<div class="nav"><button class="btn" id="reset">${U().reset}</button></div>`;
  render(h,"in-up");growBars();$("#x").onclick=()=>{SFX.tap();back();};
  let ask=false;if($("#reset"))$("#reset").onclick=()=>{if(!ask){ask=true;toast(U().sure);return;}store.days={};save();report();};
}
function legend(){
  let h=`<div class="topbar"><button class="iconbtn" id="x">🏠</button><span class="flex ttl">🏷️ ${U().legend}</span>${muteBtn()}</div>
  <div class="card intro"><div class="intro-m">${creature({body:"square",color:"mor",eyes:3,top:"horns",arms:"up",mouth:"teeth",spots:true,cheeks:false})}</div><p>${U().legIntro}</p></div><div class="legend">`;
  Object.keys(SKILLS).forEach((k,i)=>h+=`<div class="li" style="animation-delay:${i*.03}s">${skillTile(k)}<span>${skName(k)}</span></div>`);
  h+=`</div>`;render(h,"in-up");$("#x").onclick=()=>{SFX.tap();back();};
}

/* ================= Hesap, aile paneli, ebeveyn kilidi, süre sayacı ================= */
const API=(window.DIKKAT_CONFIG&&window.DIKKAT_CONFIG.API)||"";
const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KID_LOOKS=[["round","antenna"],["square","ears"],["tall","horns"],["tri","hair"],["round","ears"],["square","horns"],["tall","antenna"],["tri","horns"]];
function avatar(ch,cls){const lk=KID_LOOKS[(ch.look||0)%KID_LOOKS.length];return`<span class="av ${cls||""}">${creature({body:lk[0],color:ch.color||"mavi",eyes:2,top:lk[1],arms:"up",mouth:"teeth",spots:true,cheeks:true},{still:cls==="sm"})}</span>`;}
function todayKey(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function dayKeyAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
const newId=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
let ctx="child"; /* "child" | "parent" */
function back(){ctx==="parent"?parentPanel():home();}
function childStats(ch){const days=ch.days||{};const done=Object.keys(days).length;let c=0,st=0;Object.values(days).forEach(v=>{c+=v.lastCorrect||0;st+=starCount(v.best||0,PER_DAY);});
  let cur=DAYS;for(let d=1;d<=DAYS;d++)if(!days[d]){cur=d;break;}
  return{done,stars:st,pct:done?Math.round(c/(done*PER_DAY)*100):0,cur,todayMin:Math.round(((ch.usage||{})[todayKey()]||0)/60)};}

/* ---------- Sunucu ---------- */
async function api(obj){
  if(!API)throw{hata:"ag"};
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),25000);
  try{
    const r=await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(obj),signal:ctl.signal,redirect:"follow"});
    const j=await r.json();clearTimeout(to);
    if(!j.ok)throw{hata:j.hata||"sunucu_hatasi"};
    return j;
  }catch(e){clearTimeout(to);if(e&&e.hata)throw e;throw{hata:"ag"};}
}
const errText=e=>(U().err[e&&e.hata]||U().err.sunucu_hatasi);

/* İki kopyayı birleştir (sunucudaki ile aynı kural) */
function mergeChild(a,b){
  if(!a)return b;if(!b)return a;
  const s=Object.assign({},a,b);
  s.days=Object.assign({},a.days||{});
  for(const k in (b.days||{})){const x=b.days[k],y=s.days[k];if(!y||(x.ts||0)>=(y.ts||0)){s.days[k]=Object.assign({},x,{best:Math.max(x.best||0,(y&&y.best)||0)});}}
  ["usage","bonus"].forEach(f=>{s[f]=Object.assign({},a[f]||{});for(const t in (b[f]||{}))s[f][t]=Math.max(s[f][t]||0,b[f][t]||0);});
  return s;
}

/* ---------- Eşitleme ---------- */
let syncState="ok",syncTimer=null,syncing=false;
function markDirty(id){if(cfg.mode!=="account"||!id)return;cfg.dirty=cfg.dirty||[];if(!cfg.dirty.includes(id))cfg.dirty.push(id);saveCfg();scheduleSync(4000);}
function scheduleSync(ms){clearTimeout(syncTimer);syncTimer=setTimeout(syncNow,ms);}
async function syncNow(){
  if(cfg.mode!=="account"||syncing||!(cfg.dirty||[]).length){showSync();return;}
  syncing=true;syncState="busy";showSync();
  try{
    for(const id of cfg.dirty.slice()){
      const ch=fam.children.find(c=>c.id===id);
      if(!ch){cfg.dirty=cfg.dirty.filter(x=>x!==id);continue;}
      const r=await api({action:"saveChild",token:cfg.token,child:ch});
      const merged=mergeChild(r.child,ch);
      Object.keys(ch).forEach(k=>delete ch[k]);Object.assign(ch,merged);
      cfg.dirty=cfg.dirty.filter(x=>x!==id);
    }
    saveFam();saveCfg();syncState="ok";
  }catch(e){
    if(e.hata==="oturum_yok"){syncing=false;sessionExpired();return;}
    syncState="off";scheduleSync(60000);
  }
  syncing=false;showSync();
}
function showSync(){const el=document.getElementById("sync");if(!el)return;
  el.textContent=cfg.mode!=="account"?U().local:syncState==="busy"?U().syncing:syncState==="off"?U().offline:U().synced;el.className="sync "+syncState;}
window.addEventListener("online",()=>scheduleSync(500));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){flushUsage();syncNow();}});
function sessionExpired(){const lang=cfg.lang,mute=cfg.mute;cfg={lang,mute};saveCfg();stopTimer();welcome(U().err.oturum_yok);}

/* ---------- Açılış ---------- */
async function boot(){
  if(!cfg.mode){welcome();return;}
  loadFam();
  if(cfg.mode==="account"&&API){
    if(!fam.children.length){welcome("",true);}
    api({action:"load",token:cfg.token}).then(r=>{
      const local=fam.children;const out=[];
      r.data.children.forEach(sc=>{const lc=local.find(c=>c.id===sc.id);out.push(lc?mergeChild(sc,lc):sc);});
      local.forEach(lc=>{if(!out.find(c=>c.id===lc.id)&&(cfg.dirty||[]).includes(lc.id))out.push(lc);});
      fam.children=out;saveFam();syncState="ok";
      if(ctx==="child"&&cfg.active){const ch=fam.children.find(c=>c.id===cfg.active);if(ch)store=ch;}
      if(document.querySelector(".ppanel")||document.querySelector(".welcome"))openStart();else showSync();
      scheduleSync(1000);
    }).catch(e=>{if(e.hata==="oturum_yok")sessionExpired();else{syncState="off";showSync();if(document.querySelector(".welcome"))openStart();}});
    if(!fam.children.length)return;
  }
  openStart();
}
function openStart(){
  const ch=cfg.active&&fam.children.find(c=>c.id===cfg.active);
  if(ch)openChild(ch,true);else parentPanel();
}
function openChild(ch,silent){
  store=ch;store.days=store.days||{};store.usage=store.usage||{};store.bonus=store.bonus||{};
  cfg.active=ch.id;saveCfg();ctx="child";startTimer();home();
  if(!silent)setTimeout(()=>speak(U().helloKidSay(ch.name,U().mascot)),700);
}

/* ---------- Karşılama, giriş, kayıt ---------- */
function langBar(){return`<div class="langbar"><span class="lglbl">🌍 ${U().lang}</span>${I18N.LANGS.map(l=>`<button class="lang ${l===LG()?"on":""}" data-lang="${l}"><span class="fl">${I18N.UI[l].flag}</span><span>${I18N.UI[l].name}</span></button>`).join("")}</div>`;}
function bindLang(again){document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{cfg.lang=b.dataset.lang;saveCfg();SFX.tap();again();});}
function welcome(msg,loading){
  stopTimer();ctx="parent";
  let li=0;const title=U().title.map(w=>[...w].map(ch=>`<span style="animation-delay:${(li++)*.08}s">${ch}</span>`).join("")).join("<br>");
  let h=`<div class="welcome">${langBar()}
  <div class="hero wl"><div class="hero-txt"><h1 class="wavy">${title}</h1><p class="wsub">${U().welcomeSub}</p></div><div class="hero-mascot">${creature(MASCOT)}</div></div>
  ${msg?`<div class="alert">${esc(msg)}</div>`:""}
  ${loading?`<div class="card center"><div class="spin"></div></div>`:`<div class="wbtns">
    <button class="btn primary big" id="wlogin" ${API?"":"disabled"}>${U().login}</button>
    <button class="btn big" id="wreg" ${API?"":"disabled"}>${U().register}</button>
    ${API?"":`<p class="note">${U().noServer}</p>`}
    <button class="btn ghost" id="wguest">${U().guest}<small>${U().guestNote}</small></button></div>`}</div>`;
  render(h,"in-up");bindLang(()=>welcome(msg,loading));
  if(loading)return;
  $("#wlogin").onclick=()=>{SFX.tap();authForm("login");};
  $("#wreg").onclick=()=>{SFX.tap();authForm("register");};
  $("#wguest").onclick=()=>{SFX.tap();cfg.mode="guest";saveCfg();loadFam();migrateOld();parentPanel();};
}
function migrateOld(){
  const o=lsGet("dikkat-atolyesi-v2",null);
  if(o&&o.days&&Object.keys(o.days).length&&!fam.children.length){fam.children.push({id:newId(),name:U().kid+" 1",color:"mavi",look:0,limit:0,days:o.days,usage:{},bonus:{}});saveFam();}
}
function authForm(mode,carry){
  const reg=mode==="register";
  let h=`<div class="topbar"><button class="iconbtn" id="x">◀</button><span class="flex ttl">${reg?U().register:U().login}</span></div>
  <form class="card form" id="af" autocomplete="on">
    <div class="formm">${creature(Object.assign({},MASCOT,{arms:"side",mouth:"smile"}))}</div>
    <label>${U().user}<input id="fu" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" required></label>
    ${reg?`<small class="hint2">${U().userHint}</small>`:""}
    <label>${U().pass}<span class="pw"><input id="fp" name="password" type="password" autocomplete="${reg?"new-password":"current-password"}" maxlength="100" required><button type="button" class="eye" data-for="fp">👁️</button></span></label>
    ${reg?`<small class="hint2">${U().passHint}</small><label>${U().pass2}<input id="fp2" type="password" autocomplete="new-password" maxlength="100" required></label>`:""}
    <div class="ferr" id="ferr"></div>
    <button class="btn primary big" id="fgo" type="submit">${reg?U().doRegister:U().doLogin}</button>
    <button class="linkbtn" type="button" id="fswap">${reg?U().haveAcc:U().noAcc}</button>
  </form>`;
  render(h,"in-right");
  $("#x").onclick=()=>{SFX.tap();carry?parentPanel():welcome();};
  $("#fswap").onclick=()=>authForm(reg?"login":"register",carry);
  document.querySelectorAll(".eye").forEach(b=>b.onclick=()=>{const i=$("#"+b.dataset.for);i.type=i.type==="password"?"text":"password";});
  $("#fu").focus();
  $("#af").onsubmit=async e=>{
    e.preventDefault();const u=$("#fu").value.trim().toLowerCase(),p=$("#fp").value;const er=$("#ferr");er.textContent="";
    if(reg&&p!==$("#fp2").value){er.textContent=U().err.ayni_degil;return;}
    if(reg&&!/^[a-z0-9._-]{3,24}$/.test(u)){er.textContent=U().err.kullanici_gecersiz;return;}
    if(reg&&p.length<6){er.textContent=U().err.sifre_kisa;return;}
    const btn=$("#fgo");btn.disabled=true;btn.innerHTML=`<span class="spin sm"></span>`;
    try{
      const r=await api({action:reg?"register":"login",u,p});
      const guestKids=carry?fam.children.slice():[];
      cfg.mode="account";cfg.user=r.user;cfg.token=r.token;cfg.active=null;cfg.dirty=[];saveCfg();
      fam={children:r.data.children||[]};
      guestKids.forEach(g=>{if(!fam.children.find(c=>c.id===g.id)){fam.children.push(g);cfg.dirty.push(g.id);}});
      saveFam();saveCfg();SFX.go();
      if(carry){try{localStorage.removeItem("dikkat-atolyesi-fam:guest");}catch(_){}}
      parentPanel();if(cfg.dirty.length)scheduleSync(300);
    }catch(err){btn.disabled=false;btn.textContent=reg?U().doRegister:U().doLogin;er.textContent=errText(err);SFX.tap();}
  };
}

/* ---------- Aile paneli ---------- */
function weekChart(ch){
  const u=ch.usage||{};const vals=[];for(let i=6;i>=0;i--)vals.push(Math.round((u[dayKeyAgo(i)]||0)/60));
  const mx=Math.max(ch.limit||0,...vals,5);
  const dn=i=>{const d=new Date();d.setDate(d.getDate()-i);return d.toLocaleDateString(LG(),{weekday:"short"});};
  return`<div class="week"><div class="wk-t">${U().week}</div><div class="wk-bars">${vals.map((v,i)=>`<div class="wk"><b style="height:${Math.max(3,v/mx*100)}%" class="${ch.limit&&v>=ch.limit?"full":""}"></b><span>${v||""}</span><small>${dn(6-i)}</small></div>`).join("")}${ch.limit?`<i class="wk-lim" style="bottom:${ch.limit/mx*100}%"></i>`:""}</div></div>`;
}
function parentPanel(){
  stopTimer();ctx="parent";cfg.active=null;saveCfg();
  const acc=cfg.mode==="account";
  let h=`<div class="ppanel">
  <div class="topbar"><span class="logo">👨‍👩‍👧</span><span class="flex ttl">${U().panel}</span>${muteBtn()}</div>
  ${langBar()}
  <div class="card acct"><div><small>${U().account}</small><b>${acc?esc(cfg.user):U().guest}</b></div><span class="sync" id="sync"></span></div>
  ${acc?"":`<div class="alert info">${U().guestBanner}${API?`<button class="btn primary sm" id="mkacc">${U().makeAcc}</button>`:""}</div>`}
  <h2 class="sec">🧒 ${U().children}</h2>
  ${fam.children.length?"":`<p class="empty">${U().firstChild}</p>`}
  <div class="kids">`;
  fam.children.forEach(ch=>{const st=childStats(ch);
    h+=`<div class="kid" style="--kc:${CHEX[ch.color]||"#3fa9f5"}">
      <div class="kid-top">${avatar(ch)}<div class="kid-info"><b>${esc(ch.name)}</b><span>${U().progress(st.cur,st.stars,st.pct)}</span>
        <span class="kid-time">⏱️ ${U().today}: <b>${st.todayMin}</b>${ch.limit?` / ${ch.limit}`:""} ${U().min}</span></div>
        <button class="iconbtn" data-edit="${ch.id}" aria-label="⚙️">⚙️</button></div>
      ${weekChart(ch)}
      <div class="kid-btns"><button class="btn" data-rep="${ch.id}">📈 ${U().report}</button><button class="btn primary" data-open="${ch.id}">${U().openChild}</button></div>
    </div>`;});
  h+=`</div><button class="btn big addkid" id="add">${U().addChild}</button>
  <p class="hint">${U().kidsHint}</p>
  <div class="row-btns">${acc?`<button class="pill" id="chpw">${U().changePass}</button><button class="pill" id="out">🚪 ${U().logout}</button>`:`<button class="pill" id="out">◀ ${U().back}</button>`}<button class="pill" id="leg">🏷️ ${U().legend}</button></div></div>`;
  render(h,"in-up");showSync();bindLang(parentPanel);
  $("#add").onclick=()=>{SFX.tap();childForm(null);};
  if($("#mkacc"))$("#mkacc").onclick=()=>authForm("register",true);
  $("#leg").onclick=()=>{SFX.tap();legend();};
  if($("#chpw"))$("#chpw").onclick=()=>passForm();
  $("#out").onclick=async()=>{SFX.tap();if(acc){await syncNow();try{api({action:"logout",token:cfg.token});}catch(e){}}const lang=cfg.lang,mute=cfg.mute;cfg={lang,mute};saveCfg();welcome();};
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{SFX.go();openChild(fam.children.find(c=>c.id===b.dataset.open));});
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{SFX.tap();childForm(fam.children.find(c=>c.id===b.dataset.edit));});
  document.querySelectorAll("[data-rep]").forEach(b=>b.onclick=()=>{SFX.tap();store=fam.children.find(c=>c.id===b.dataset.rep);ctx="parent";report();});
  if(acc&&(cfg.dirty||[]).length)scheduleSync(500);
}
function childForm(ch){
  const isNew=!ch;ch=ch?Object.assign({},ch):{id:newId(),name:"",color:pick(Math.random,COLORS).k,look:fam.children.length%KID_LOOKS.length,limit:20,days:{},usage:{},bonus:{}};
  const LIM=[0,10,15,20,30,45,60];
  const draw=()=>{
    let h=`<div class="topbar"><button class="iconbtn" id="x">◀</button><span class="flex ttl">${isNew?U().addChild:esc(ch.name)}</span></div>
    <div class="card form">
      <div class="kidprev" id="kp">${avatar(ch)}</div>
      <div class="looks">${KID_LOOKS.map((_,i)=>`<button class="lk ${i===(ch.look||0)?"on":""}" data-look="${i}">${avatar(Object.assign({},ch,{look:i}),"sm")}</button>`).join("")}</div>
      <label>${U().childName}<input id="cn" maxlength="30" value="${esc(ch.name)}" autocomplete="off"></label>
      <div class="lbl">${U().color}</div><div class="colors">${COLORS.map(c=>`<button class="cl ${c.k===ch.color?"on":""}" data-col="${c.k}" style="background:${c.hex}"></button>`).join("")}</div>
      <div class="lbl">⏳ ${U().limit}</div><div class="lims">${LIM.map(m=>`<button class="lm ${m===(ch.limit||0)?"on":""}" data-lim="${m}">${m?m+" "+U().min:U().noLimit}</button>`).join("")}</div>
      <div class="ferr" id="ferr"></div>
      <button class="btn primary big" id="sv">${U().save}</button>
      ${isNew?"":`<div class="row-btns"><button class="pill" id="rs">${U().resetP}</button><button class="pill danger" id="dl">${U().del}</button></div>`}
    </div>`;
    render(h,"in-fade");
    $("#x").onclick=()=>{SFX.tap();parentPanel();};
    $("#cn").oninput=e=>{ch.name=e.target.value;};
    document.querySelectorAll("[data-look]").forEach(b=>b.onclick=()=>{ch.look=+b.dataset.look;ch.name=$("#cn").value;SFX.tap();draw();});
    document.querySelectorAll("[data-col]").forEach(b=>b.onclick=()=>{ch.color=b.dataset.col;ch.name=$("#cn").value;SFX.tap();draw();});
    document.querySelectorAll("[data-lim]").forEach(b=>b.onclick=()=>{ch.limit=+b.dataset.lim;ch.name=$("#cn").value;SFX.tap();draw();});
    $("#sv").onclick=()=>{
      ch.name=$("#cn").value.trim();if(!ch.name){$("#ferr").textContent=U().childName+" ?";$("#cn").focus();return;}
      if(isNew&&fam.children.length>=8){$("#ferr").textContent=U().err.cok_cocuk;return;}
      const i=fam.children.findIndex(c=>c.id===ch.id);ch.ts=Date.now();
      if(i<0)fam.children.push(ch);else fam.children[i]=ch;
      saveFam();markDirty(ch.id);SFX.ok();parentPanel();
    };
    let dAsk=false,rAsk=false;
    if($("#dl"))$("#dl").onclick=async()=>{if(!dAsk){dAsk=true;toast(U().delSure);return;}
      fam.children=fam.children.filter(c=>c.id!==ch.id);saveFam();cfg.dirty=(cfg.dirty||[]).filter(x=>x!==ch.id);saveCfg();
      if(cfg.mode==="account"){try{await api({action:"deleteChild",token:cfg.token,id:ch.id});}catch(e){}}parentPanel();};
    if($("#rs"))$("#rs").onclick=()=>{if(!rAsk){rAsk=true;toast(U().sure);return;}const i=fam.children.findIndex(c=>c.id===ch.id);
      fam.children[i].days={};fam.children[i].resetAt=Date.now();fam.children[i].ts=Date.now();saveFam();markDirty(ch.id);parentPanel();};
  };
  draw();
}
function passForm(){
  let h=`<div class="topbar"><button class="iconbtn" id="x">◀</button><span class="flex ttl">${U().changePass}</span></div>
  <form class="card form" id="pf"><label>${U().oldPass}<input id="po" type="password" autocomplete="current-password" required></label>
  <label>${U().newPass}<input id="pn" type="password" autocomplete="new-password" required></label><small class="hint2">${U().passHint}</small>
  <div class="ferr" id="ferr"></div><button class="btn primary big" id="pg" type="submit">${U().save}</button></form>`;
  render(h,"in-right");$("#x").onclick=()=>parentPanel();
  $("#pf").onsubmit=async e=>{e.preventDefault();const er=$("#ferr");er.textContent="";
    if($("#pn").value.length<6){er.textContent=U().err.sifre_kisa;return;}
    try{await api({action:"changePassword",token:cfg.token,old:$("#po").value,p:$("#pn").value});toast(U().passChanged);parentPanel();}catch(err){er.textContent=errText(err);}};
}

/* ---------- Ebeveyn kilidi ---------- */
function parentGate(onOk){
  const a=ri(Math.random,11,19),b=ri(Math.random,3,9);let val="";
  const ov=document.createElement("div");ov.className="overlay";
  const draw=()=>{ov.innerHTML=`<div class="gate"><button class="gx" id="gx">✕</button><h3>${U().gateTitle}</h3><p>${U().gateHint}</p>
    <div class="gq">${a} + ${b} = <span class="gv">${val||"?"}</span></div><div class="gerr" id="gerr"></div>
    <div class="keys">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✓"].map(k=>`<button class="key ${k==="✓"?"ok":""}" data-k="${k}">${k}</button>`).join("")}</div></div>`;
    ov.querySelector("#gx").onclick=()=>ov.remove();
    ov.querySelectorAll(".key").forEach(btn=>btn.onclick=()=>{const k=btn.dataset.k;SFX.tap();
      if(k==="⌫")val=val.slice(0,-1);else if(k==="✓"){if(+val===a+b){ov.remove();onOk();return;}val="";draw();ov.querySelector("#gerr").textContent=U().gateWrong;return;}else if(val.length<3)val+=k;
      ov.querySelector(".gv").textContent=val||"?";});};
  draw();document.body.appendChild(ov);
}

/* ---------- Süre sayacı ---------- */
let tick=null,lastTick=0,warned=false,lastSave=0,lastSync=0;
function remaining(){if(!store.limit)return Infinity;const t=todayKey();return store.limit*60+((store.bonus||{})[t]||0)*60-((store.usage||{})[t]||0);}
function startTimer(){
  stopTimer();lastTick=Date.now();warned=remaining()<=60;
  let el=document.getElementById("tmr");if(!el){el=document.createElement("div");el.id="tmr";document.body.appendChild(el);}
  updateTimer();
  tick=setInterval(()=>{
    const now=Date.now();const dt=Math.min(5,Math.round((now-lastTick)/1000));lastTick=now;
    if(document.visibilityState!=="visible"||ctx!=="child"||document.querySelector(".overlay.timeup"))return;
    const t=todayKey();store.usage[t]=(store.usage[t]||0)+dt;
    if(now-lastSave>10000){lastSave=now;saveFam();}
    if(now-lastSync>60000){lastSync=now;markDirty(store.id);}
    updateTimer();
  },1000);
}
function stopTimer(){clearInterval(tick);tick=null;const el=document.getElementById("tmr");if(el)el.remove();document.querySelectorAll(".overlay.timeup").forEach(o=>o.remove());}
function flushUsage(){if(ctx==="child"&&store.id){saveFam();markDirty(store.id);}}
function updateTimer(){
  const el=document.getElementById("tmr");if(!el)return;
  const rem=remaining();
  if(rem===Infinity){const m=Math.floor(((store.usage||{})[todayKey()]||0)/60);el.className="tmr free";el.innerHTML=`⏱️ ${m} ${U().min}`;return;}
  const r=Math.max(0,rem);el.className="tmr"+(r<=60?" warn":"");el.innerHTML=`⏳ ${Math.floor(r/60)}:${String(r%60).padStart(2,"0")}`;
  if(r<=60&&r>0&&!warned){warned=true;toast(U().oneMin);speak(U().oneMinSay);}
  if(r<=0)timeUp();
}
function timeUp(){
  if(document.querySelector(".overlay.timeup"))return;
  clearTimeout(memTimer);saveFam();markDirty(store.id);syncNow();
  const ov=document.createElement("div");ov.className="overlay timeup";
  ov.innerHTML=`<div class="tu"><div class="tu-m">${creature(Object.assign({},MASCOT,{arms:"down",mouth:"smile"}))}<span class="zz">Z<i>z</i><b>z</b></span></div>
    <h2>🌙 ${U().timeUp}</h2><p>${esc(store.name||"")}</p>${bigSpeaker("tuspk","")}
    <button class="btn" id="tup">🔒 ${U().parent}</button></div>`;
  document.body.appendChild(ov);
  const say=U().timeUpSay(store.name||"");setTimeout(()=>speak(say),400);
  ov.querySelector("#tuspk").onclick=()=>speak(say,true);
  ov.querySelector("#tup").onclick=()=>parentGate(()=>{
    const box=ov.querySelector(".tu");box.innerHTML=`<h2>🔓 ${U().parent}</h2><div class="lims">${[5,10,20,30].map(m=>`<button class="lm" data-more="${m}">${U().more(m)}</button>`).join("")}</div><button class="btn primary" id="tpp">👨‍👩‍👧 ${U().panel}</button>`;
    box.querySelectorAll("[data-more]").forEach(b=>b.onclick=()=>{const t=todayKey();store.bonus[t]=(store.bonus[t]||0)+(+b.dataset.more);store.ts=Date.now();saveFam();markDirty(store.id);warned=false;ov.remove();updateTimer();});
    box.querySelector("#tpp").onclick=()=>{ov.remove();parentPanel();};
  });
}

window.__DA={getExercise,TOTAL,TYPE_ORDER,get fam(){return fam;},get cfg(){return cfg;},syncNow,mergeChild};
svgDefs();buildBg();boot();
})();
