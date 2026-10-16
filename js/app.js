"use strict";
/* ================================================================
   341 农业知识综合三 · 考研学习站
   科目：C语言程序设计 / 农业机械与装备 / 数据库技术与应用（各 50 分）
   数据：data/{clang,agmech,db,exams,quiz,terms}.js
   ================================================================ */

const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const store={get(k,d){try{return JSON.parse(localStorage.getItem("a341_"+k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem("a341_"+k,JSON.stringify(v))}catch(e){}}};
const STARS=s=>"★".repeat(s)+"☆".repeat(5-s);

/* ===== 科目元数据 ===== */
const SUBJECTS=[
  {id:"clang", name:"C语言程序设计", sub:"程序设计 · 编程题", color:"blue", ic:"C",
   desc:"纯编程题，循环图形、级数求和、数组、矩阵转置、素数、进制转换等。基础语法+手写代码能力是拿分关键，近年难度稳定。",
   weight:"每年必考 50 分", star:"★★★★★"},
  {id:"agmech", name:"农业机械与装备", sub:"名词解释 · 问答题", color:"green", ic:"⚙",
   desc:"名词解释 3 分/个 + 问答题。土壤耕作、播种施肥、收获机械三大重点章，铧式犁、排种器、联合收割机等是重复率极高的考点。",
   weight:"每年必考 50 分", star:"★★★★★"},
  {id:"db", name:"数据库技术与应用", sub:"E-R图 · 关系代数 · SQL", color:"purple", ic:"DB",
   desc:"E-R 图与关系模型、关系代数、SQL 三块重头戏；2022 年起简答 20 分 + SQL 30 分。SQL 手写能力决定数据库部分的成败。",
   weight:"每年必考 50 分", star:"★★★★★"}
];
const ALL_CH=[...window.CLANG,...window.AGMECH,...window.DB];
const ALL_KP=[];ALL_CH.forEach(c=>c.kps.forEach(k=>ALL_KP.push({cid:c.id,no:c.no,ch:c.title,kp:k})));
const KP_MAP={};ALL_KP.forEach(x=>KP_MAP[x.kp.id]=x);

/* ===== 状态 ===== */
const state={
  view:"home", chapter:null, subject:"全部",
  examSub:"全部", examYear:"全部",
  termSub:"全部", termLearn:"全部", termQ:"",
  quizSub:"全部", quizDone:store.get("quizDone",{}),
  side:false
};

function parseHash(){
  const raw=location.hash.replace("#/","")||"home";
  const seg=raw.split("/");
  if(seg[0]==="chapter")return {view:"chapter",chapter:seg[1]||ALL_CH[0].id};
  return {view:seg[0],chapter:null};
}
function applyHash(){const p=parseHash();state.view=p.view;state.chapter=p.chapter;}
function findCh(id){return ALL_CH.find(c=>c.id===id)||ALL_CH[0];}
function chIdx(id){return ALL_CH.findIndex(c=>c.id===id);}

/* ===== 考点 ↔ 题目 关联索引 ===== */
/* kpIdx: 考点id -> 关联题目列表（真题优先、原创补充，最多2道） */
const kpIdx={};
[EXAMS,QUIZ].forEach(arr=>arr.forEach(t=>(t.kps||[]).forEach(k=>{
  if(!kpIdx[k])kpIdx[k]=[];
  const a=t.a||(t.type==="单选"?("正确答案："+(t.options[t.answer]||"")+"。解析："+(t.expl||"")):(t.answer+"（解析："+(t.expl||"")+"）"));
  kpIdx[k].push({id:t.id,tag:t.src==="真题"?"真题":"原创",y:t.year||"",q:t.q,a});
})));
Object.keys(kpIdx).forEach(k=>{
  const z=kpIdx[k].filter(x=>x.tag==="真题"), o=kpIdx[k].filter(x=>x.tag!=="真题");
  kpIdx[k]=[...z.slice(0,1),...o.slice(0,1)];
});
/* 题目 -> 考点列表 */
function kpsOf(t){return (t.kps||[]).map(id=>KP_MAP[id]).filter(Boolean);}

/* 考点 -> 悬浮关联题 */
function relqChips(kpId){
  const list=kpIdx[kpId]||[];
  if(!list.length)return"";
  return `<div class="relq">${list.map((r,i)=>`
    <span class="rq" data-rq="${kpId}-${i}"><span class="tg ${r.tag==="真题"?"z":"o"}">${r.tag}</span>${r.y?r.y+" · ":""}${esc(r.q.replace(/\n/g," ").slice(0,14))}${r.q.length>14?"…":""}<span class="kp-pop"><span class="kp-t">${r.tag==="真题"?"历年真题":"本站原创题"}${r.y?" · "+r.y:""}</span><div class="kp-q" style="white-space:pre-line">${esc(r.q)}</div><div class="kp-a" style="white-space:pre-line">${esc(plainA(r.a))}</div></span></span>`).join("")}</div>`;
}
/* 考点 -> 素材（图片/视频，可折叠：默认收起，展开后 PC 两列/手机单列） */
function mediaHtml(kpId){
  const m=(window.MEDIA||{})[kpId];
  if(!m||(!m.img&&!m.vid))return"";
  const cap=p=>String(p).split("/").pop().replace(/\.[^.]+$/,"");
  const n=(m.img||[]).length+(m.vid||[]).length;
  const figs=`${(m.img||[]).map(p=>`<figure><img src="${esc(p)}" alt="${esc(cap(p))}" loading="lazy"><figcaption class="cap">${esc(cap(p))}</figcaption></figure>`).join("")}${(m.vid||[]).map(p=>`<figure><video src="${esc(p)}" controls preload="metadata"></video><figcaption class="cap">▶ 动画演示 · ${esc(cap(p))}</figcaption></figure>`).join("")}`;
  return `<div class="media">
    <button class="media-toggle" type="button" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"></path></svg><span>示意图与演示 · ${n} 项</span><span class="cnt">${(m.vid||[]).length? (m.vid||[]).length+" 视频":"仅图片"}</span></button>
    <div class="media-grid">${figs}</div>
  </div>`;
}
function plainA(a){return String(a||"").replace(/<[^>]+>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");}

/* 题目 -> 考点悬浮 chip */
function kpChip(kp){
  if(!kp)return"";
  return `<span class="kp-link" data-kp="${kp.kp.id}"><span class="dot"></span>考点：${esc(kp.kp.name)}<span class="kp-pop"><span class="kp-t">${esc(kp.no)} ${esc(kp.kp.name)}</span><span class="kp-q">${esc((kp.kp.items[0]||{}).t||"")} · ${esc((kp.kp.items[0]||{}).d||"").slice(0,60)}…</span><span class="kp-go">点击进入该考点 →</span></span></span>`;
}
function goKp(kpId){
  closeSide();
  const x=KP_MAP[kpId];if(!x)return;
  const target="#/chapter/"+x.cid;
  if(location.hash===target){render();}else{location.hash=target;}
  setTimeout(()=>{
    const el=$("#kp-"+kpId);
    if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1800);}
  },90);
}

/* ===== 知识点内容格式化：序号换行 + 冒号前标题加粗 ===== */
function fmtD(d){
  let s=esc(d).replace(/[①-⑳]/g,m=>"<br>"+m);
  s=s.replace(/(^|[。\n；）]|<br>)([\u4e00-\u9fa5A-Za-z0-9]{1,16})([（(][^（）()]{0,16}[）)])?：/g,
    (m,a,b,br)=>a==="<br>"||a===""?a+"<b>"+b+"</b>"+(br||"")+"：":a+"<br><b>"+b+"</b>"+(br||"")+"：");
  return s.startsWith("<br>")?s.slice(4):s;
}
function fmtCode(c){return `<pre>${esc(c)}</pre>`;}

/* ===== 导航 ===== */
const NAV_MAIN=[
  {k:"home",t:"首页",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>'},
  {k:"subjects",t:"章节学习",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>'},
  {k:"terms",t:"名词解释",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6M9 16h4M7 3h14v18H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" stroke-linejoin="round"/></svg>'},
  {k:"exams",t:"历年真题",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18M3 9h18M3 13h18M3 17h12"/><circle cx="19" cy="17" r="2.5"/></svg>'},
  {k:"quiz",t:"自测练习",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'}
];
function subjBadge(id){const s=SUBJECTS.find(x=>x.id===id);return s?`<span class="badge ${s.color}">${esc(s.name)}</span>`:"";}

function nav(){
  const done=store.get("chDone",{});
  $("#sideNav").innerHTML=`
    <div class="grp">主菜单</div>
    ${NAV_MAIN.map(m=>`<div class="item ${state.view===m.k?"on":""}" data-go="${m.k}">${m.icon}<span>${m.t}</span></div>`).join("")}
    ${SUBJECTS.map(s=>`<div class="grp">${esc(s.name)}</div>${ALL_CH.filter(c=>c.id.startsWith(s.id+"-")).map(c=>`
      <div class="item ${state.view==="chapter"&&state.chapter===c.id?"on":""}" data-go="chapter" data-id="${c.id}"><span class="no">${c.no.replace("第","").replace("章","")}</span><span>${esc(c.title)}</span>${done[c.id]?'<span class="done">✓</span>':`<span class="star">${"★".repeat(c.stars)}</span>`}</div>`).join("")}`).join("")}`;
  $("#tabbar").innerHTML=NAV_MAIN.map(m=>`<a href="#/${m.k}" class="${state.view===m.k?"on":""}">${m.icon}<span>${m.t}</span></a>`).join("");
  updateProg();
}
function updateProg(){
  const done=store.get("chDone",{});
  const n=Object.keys(done).length,total=ALL_CH.length;
  $("#progBar").style.width=(n/total*100)+"%";
  $("#progTxt").textContent=`已完成 ${n} 章 · 共 ${total} 章 · ${(n/total*100)|0}%`;
}

/* ===== 渲染入口 ===== */
const charts=[];
function viewKey(){
  const v=state.view;
  if(v==="chapter")return"chapter/"+state.chapter;
  if(v==="terms")return"terms/"+state.termSub+"/"+state.termLearn+"/"+state.termQ;
  if(v==="exams")return"exams/"+state.examSub+"/"+state.examYear;
  if(v==="quiz")return"quiz/"+state.quizSub;
  return v;
}
let lastViewKey="";
function render(){
  charts.forEach(c=>{try{c.dispose()}catch(_){}});charts.length=0;
  const v=state.view;
  let html="";
  if(v==="home")html=viewHome();
  else if(v==="subjects")html=viewSubjects();
  else if(v==="chapter")html=viewChapter();
  else if(v==="terms")html=viewTerms();
  else if(v==="exams")html=viewExams();
  else if(v==="quiz")html=viewQuiz();
  else html=viewHome();
  $("#content").innerHTML=html;
  $("#topTitle").textContent=titleOf(v);
  $("#topCrumb").textContent=crumbOf(v);
  nav();bind();
  const k=viewKey();
  if(k!==lastViewKey)window.scrollTo({top:0,left:0});
  lastViewKey=k;
  if(v==="home")setTimeout(drawCharts,30);
}
function titleOf(v){
  if(v==="home")return"首页";
  if(v==="subjects")return"章节学习";
  if(v==="chapter"){const c=findCh(state.chapter);return c.no+" · "+c.title;}
  if(v==="terms")return"名词解释 · "+TERMS.length+" 个";
  if(v==="exams")return"历年真题";
  if(v==="quiz")return"自测练习";
  return"首页";
}
function crumbOf(v){
  if(v==="chapter"){const c=findCh(state.chapter);const s=SUBJECTS.find(x=>x.id===c.id.split("-")[0]);return s?esc(s.name):"";}
  if(v==="terms")return"点击卡片展开释义";
  if(v==="quiz")return"即做即判 · 对错都看解析";
  return"";
}

/* ===== 首页 ===== */
function viewHome(){
  const done=store.get("chDone",{});const n=Object.keys(done).length;
  const nExams=EXAMS.length, nQuiz=QUIZ.length, nTerms=TERMS.length;
  return `
  <div class="hero-card">
    <h1>341 农业知识综合三<br>零基础也能系统上岸</h1>
    <p>面向完全没学过本学科的 27 考研考生：以江西农业大学考纲为主线，把 <b>${ALL_CH.length}</b> 章考点、<b>${nTerms}</b> 个名词解释、<b>${nExams}</b> 道历年真题、<b>${nQuiz}</b> 道自测练习整理成一套可背诵、可刷题、可检验的学习系统。</p>
    <div class="stats">
      <div><b>150</b><span>总分（三科各 50）</span></div>
      <div><b>${ALL_CH.length}</b><span>核心章节</span></div>
      <div><b>${nExams}</b><span>真题（2020–2022）</span></div>
      <div><b>${nQuiz}</b><span>自测练习</span></div>
    </div>
  </div>

  <div class="section-t"><span class="en">三科概览</span><span class="sub">每科 50 分，点击进入章节学习</span></div>
  <hr class="divider">
  <div class="grid grid-3">
    ${SUBJECTS.map(s=>{const chs=ALL_CH.filter(c=>c.id.startsWith(s.id+"-"));const hot=chs.filter(c=>c.stars>=4).length;
      return `<div class="card subj-card" data-go="subject" data-id="${s.id}">
      <div class="ic ${s.color}">${s.ic}</div>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.desc)}</p>
      <div class="meta"><span>${chs.length} 章 · ${hot} 章重点</span><span class="star">${s.star}</span></div>
    </div>`;}).join("")}
  </div>

  <div class="section-t"><span class="en">零基础备考路线</span><span class="sub">按 4 阶段推进，每阶段目标明确</span></div>
  <hr class="divider">
  <div class="grid grid-2">
    ${[["阶段一 · 2 周","搭框架：先读三科「章节学习」，按考点卡片通读混脸熟，不做题、不强背；C 语言配合看参考代码，数据库先看懂 E-R 图示例。","建立全书知识地图"],
       ["阶段二 · 3 周","背重点：名词解释全部卡片过两遍；★★★★★ 考点逐条背诵；真题按年份先做旧年份感受题型与难度。","名词解释与高频考点过关"],
       ["阶段三 · 2 周","刷真题：2020-2022 真题逐题手写（C 语言上机敲代码、数据库手写 SQL、机械默写要点）；错题回章节定位盲区。","真题全部吃透、形成答题框架"],
       ["阶段四 · 考前","查漏补缺：自测练习全刷（对错都看解析）；按高频考点榜单自查；回归考纲读教材补漏。","高频考点零盲区"]]
    .map(p=>`<div class="card" style="padding:16px 18px"><div class="hd" style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="badge gold">${p[0]}</span></div><div style="font-size:13.5px;color:#33413A">${p[1]}</div><div class="tip" style="margin-top:10px"><b>目标 · </b>${p[2]}</div></div>`).join("")}
  </div>

  <div class="section-t"><span class="en">考试概况</span><span class="sub">真题规律 · 分值分布</span></div>
  <hr class="divider">
  <div class="grid grid-2">
    <div class="card" style="padding:16px"><div class="tt" style="font-weight:700;font-family:var(--serif)">科目分值结构</div><div class="s" style="font-size:12px;color:var(--ink-3);margin:4px 0 10px">三科各 50 分，共 150 分</div><div class="cv" id="chartSubj" style="height:230px"></div></div>
    <div class="card" style="padding:16px"><div class="tt" style="font-weight:700;font-family:var(--serif)">高频考点 TOP 12</div><div class="s" style="font-size:12px;color:var(--ink-3);margin:4px 0 10px">按 2020–2022 真题涉及频次统计</div><div class="cv" id="chartHot" style="height:230px"></div></div>
  </div>

  <div class="section-t"><span class="en">全部章节</span><span class="sub">${n}/${ALL_CH.length} 章已完成 · 点击进入学习</span></div>
  <hr class="divider">
  <div class="chap-list">
    ${ALL_CH.map(c=>{const s=SUBJECTS.find(x=>x.id===c.id.split("-")[0]);return `
    <div class="card chap-card ${s.color}" data-go="chapter" data-id="${c.id}">
      <div class="num ${s.color}">${c.no.replace("第","").replace("章","")}</div>
      <div class="bd"><h3>${esc(c.title)}</h3><p>${esc(c.brief)}</p>
        <div class="pts">${subjBadge(c.id.split("-")[0])}<i>${c.kps.length} 考点</i><i>${done[c.id]?"✓ 已完成":"考频 "+"★".repeat(c.stars)}</i></div>
      </div>
      <span class="go">›</span>
    </div>`;}).join("")}
  </div>
  <div style="height:10px"></div>`;
}

/* ===== 科目页（章节列表） ===== */
function viewSubjects(){
  const done=store.get("chDone",{});
  return `
  <div class="section-t"><span class="en">章节学习</span><span class="sub">按考纲顺序 · ★ 为真题考频</span></div>
  <hr class="divider">
  ${SUBJECTS.map(s=>{const chs=ALL_CH.filter(c=>c.id.startsWith(s.id+"-"));return `
  <div class="section-t" style="margin-top:24px"><span class="en" style="color:${s.color==="blue"?"var(--blue)":s.color==="purple"?"var(--purple)":"var(--green-700)"}">${esc(s.name)}</span><span class="sub">${s.sub} · 各章${chs.length}个章节</span></div>
  <div class="chap-list">${chs.map(c=>`
    <div class="card chap-card ${s.color}" data-go="chapter" data-id="${c.id}">
      <div class="num ${s.color}">${c.no.replace("第","").replace("章","")}</div>
      <div class="bd"><h3>${esc(c.title)}</h3><p>${esc(c.brief)}</p>
        <div class="pts"><i>${c.kps.length} 考点</i><i>考频 ${"★".repeat(c.stars)}${"☆".repeat(5-c.stars)}</i>${done[c.id]?`<i>✓ 已完成</i>`:""}</div>
      </div>
      <span class="go">›</span>
    </div>`).join("")}</div>`;}).join("")}
  <div class="section-t"><span class="en">学习建议</span></div>
  <hr class="divider">
  <div class="notice info">优先顺序：★★★★★ 章节必背（土壤耕作机械、播种施肥机械、谷物收获机械、SQL、E-R 图设计、循环与级数）；★★★ 章节掌握常考点；★★ 章节了解即可。三科按「数据库 → C 语言 → 农业机械」或按兴趣轮换均可，重点是每天保持 SQL 与 C 代码的手写手感。</div>`;
}

/* ===== 章节页 ===== */
function viewChapter(){
  const c=findCh(state.chapter);
  const s=SUBJECTS.find(x=>x.id===c.id.split("-")[0]);
  const done=store.get("chDone",{});
  const idx=chIdx(c.id), prev=idx>0?ALL_CH[idx-1]:null, next=idx<ALL_CH.length-1?ALL_CH[idx+1]:null;
  const nExam=EXAMS.filter(e=>e.subject===s.id&&e.kps.some(k=>c.kps.some(ck=>ck.id===k))).length;
  return `
  <div class="ch-head">
    <h1>${c.no} ${esc(c.title)}</h1>
    <p>${esc(c.brief)}</p>
    <div class="stars">考频 ${"★".repeat(c.stars)}${"☆".repeat(5-c.stars)} · ${c.kps.length} 个考点 · 真题涉及 ${nExam} 题</div>
  </div>
  ${c.kps.map(kp=>`
    <div class="pt ${kp.stars>=4?"s3":kp.stars===3?"s2":""}" id="kp-${kp.id}">
      <div class="hd">
        <span class="tt">${esc(kp.name)}</span>
        ${kp.stars>=4?`<span class="badge red">必背</span>`:kp.stars===3?`<span class="badge gold">重点</span>`:`<span class="badge green">了解</span>`}
        <span class="st">${STARS(kp.stars)}</span>
      </div>
      <div class="bd">
        ${kp.items.map(it=>`
          <p><b>${esc(it.t)}</b>：${fmtD(it.d)}</p>
          ${it.code?fmtCode(it.code):""}
        `).join("")}
      </div>
      ${kp.tip?`<div class="tip"><b>助记 · </b>${esc(kp.tip)}</div>`:""}
      ${mediaHtml(kp.id)}
      ${relqChips(kp.id)}
    </div>`).join("")}
  <div class="ch-nav">
    ${prev?`<a data-go="chapter" data-id="${prev.id}">← 上一章 · ${esc(prev.no)} ${esc(prev.title)}</a>`:`<a class="disabled" style="opacity:.4;cursor:default">← 已是第一章</a>`}
    ${next?`<a data-go="chapter" data-id="${next.id}">下一章 · ${esc(next.no)} ${esc(next.title)} →</a>`:`<a class="disabled" style="opacity:.4;cursor:default">已是最后一章 →</a>`}
  </div>
  <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
    <button class="btn pri" id="chDoneBtn" style="background:var(--green-700);color:#fff;border-radius:9px;padding:9px 20px;font-size:13.5px">${done[c.id]?"✓ 已完成本章（点击取消）":"标记本章已完成"}</button>
    <button class="btn ghost" data-go="quiz" data-qsub="${s.id}" style="border:1px solid var(--line);border-radius:9px;padding:9px 20px;font-size:13.5px;background:#fff">去本科目自测</button>
    <button class="btn ghost" data-go="exams" data-esub="${s.id}" style="border:1px solid var(--line);border-radius:9px;padding:9px 20px;font-size:13.5px;background:#fff">看本科目真题</button>
  </div>`;
}

/* ===== 名词解释 ===== */
function viewTerms(){
  const q=state.termQ.trim();
  const learned=store.get("termLearned",{});
  let list=TERMS.filter(t=>(state.termSub==="全部"||t.s===state.termSub)
    &&(state.termLearn==="全部"||(state.termLearn==="已背")===!!learned[t.t])
    &&(!q||t.t.includes(q)||t.d.includes(q)));
  const nLearned=Object.keys(learned).length;
  return `
  <div class="section-t"><span class="en">名词解释 · ${list.length}/${TERMS.length}</span><span class="sub">已背 ${nLearned} 个 · 点击卡片展开释义，可标记已背</span></div>
  <hr class="divider">
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
    <input id="termQ" placeholder="搜索名词…" value="${esc(state.termQ)}" style="flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;font-family:inherit;font-size:13px">
    <div style="display:flex;gap:8px">
      <button class="f ${state.termSub==="全部"?"on":""}" data-termsf="全部" style="padding:6px 12px;border-radius:8px;font-size:12.5px;${state.termSub==="全部"?"background:var(--green-700);color:#fff":"background:#fff;border:1px solid var(--line)"}">全部</button>
      ${SUBJECTS.map(s=>`<button class="f ${state.termSub===s.id?"on":""}" data-termsf="${s.id}" style="padding:6px 12px;border-radius:8px;font-size:12.5px;${state.termSub===s.id?"background:var(--green-700);color:#fff":"background:#fff;border:1px solid var(--line)"}">${esc(s.name)}</button>`).join("")}
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:14px">
    <button class="f ${state.termLearn==="全部"?"on":""}" data-learnf="全部" style="padding:5px 12px;border-radius:99px;font-size:12px;${state.termLearn==="全部"?"background:var(--green-100);color:var(--green-700)":"background:#fff;border:1px solid var(--line)"}">全部</button>
    <button class="f ${state.termLearn==="未背"?"on":""}" data-learnf="未背" style="padding:5px 12px;border-radius:99px;font-size:12px;${state.termLearn==="未背"?"background:var(--green-100);color:var(--green-700)":"background:#fff;border:1px solid var(--line)"}">未背</button>
    <button class="f ${state.termLearn==="已背"?"on":""}" data-learnf="已背" style="padding:5px 12px;border-radius:99px;font-size:12px;${state.termLearn==="已背"?"background:var(--green-100);color:var(--green-700)":"background:#fff;border:1px solid var(--line)"}">已背</button>
  </div>
  <div class="term-grid">
    ${list.map(t=>{const l=learned[t.t];const s=SUBJECTS.find(x=>x.id===t.s);return `
    <div class="card term-card ${l?"s2":""}" data-term="${esc(t.t)}" style="${l?"border-color:var(--green-500)":""}">
      <div class="t"><span class="badge ${s.color}">${esc(s.name.slice(0,4))}</span>${esc(t.t)}<span class="chev">▾</span></div>
      <div class="d">${esc(t.d)}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <button class="mark ${l?"on":""}" data-term="${esc(t.t)}" style="font-size:12px;padding:4px 12px;border-radius:99px;${l?"background:var(--green-700);color:#fff":"background:var(--green-50);color:var(--green-700)"}">${l?"已背 ✓ 点击取消":"标记已背"}</button>
      </div>
    </div>`;}).join("")}
  </div>
  ${list.length===0?`<div class="empty">没有匹配的名词，换个关键词试试</div>`:""}`;
}

/* ===== 真题 ===== */
function viewExams(){
  const years=[...new Set(EXAMS.map(e=>e.year))].sort((a,b)=>b-a);
  let list=EXAMS.filter(e=>(state.examSub==="全部"||e.subject===state.examSub)&&(state.examYear==="全部"||String(e.year)===String(state.examYear)));
  const subs=[["全部","全部科目"],...SUBJECTS.map(s=>[s.id,s.name])];
  return `
  <div class="section-t"><span class="en">历年真题 · ${list.length} 题</span><span class="sub">2020–2022 真题还原 · 答案完整展开</span></div>
  <hr class="divider">
  <div class="filter-row">
    <span class="f">科目</span>
    <select id="examSubSel">${subs.map(s=>`<option value="${s[0]}" ${state.examSub===s[0]?"selected":""}>${s[1]}</option>`).join("")}</select>
    <span class="f">年份</span>
    <select id="examYearSel">${["全部",...years].map(y=>`<option value="${y}" ${String(state.examYear)===String(y)?"selected":""}>${y==="全部"?"全部年份":y+" 年"}</option>`).join("")}</select>
  </div>
  <div class="notice info" style="margin-bottom:14px">使用建议：先盲答再看答案；编程与 SQL 题务必动手写，对照参考代码/语句检查得分点；机械问答题按「要点分条作答」。</div>
  ${list.length?list.map(e=>`
  <div class="card exam-card">
    <div class="meta">
      <span class="badge gold">${e.year}</span>
      ${subjBadge(e.subject)}
      <span class="badge ${e.type==="编程"||e.type==="SQL"?"blue":e.type==="设计"?"purple":"green"}">${e.type}</span>
      <span class="badge red" style="background:var(--gold-100);color:var(--gold-600)">${e.score} 分</span>
      <span class="kps">${kpsOf(e).map(k=>kpChip(k)).join("")}</span>
    </div>
    <div class="q">${esc(e.q)}</div>
    <div class="ans">
      <div class="a-t"><b>参考答案</b>${e.src?`<span class="badge green">${e.src}</span>`:""}</div>
      <div class="a-b">${e.a}</div>
    </div>
  </div>`).join(""):`<div class="empty">该筛选条件下暂无题目</div>`}`;
}

/* ===== 自测 ===== */
function viewQuiz(){
  const done=state.quizDone;
  let list=QUIZ.filter(q=>state.quizSub==="全部"||q.subject===state.quizSub);
  const subs=[["全部","全部科目"],...SUBJECTS.map(s=>[s.id,s.name])];
  const nDone=Object.keys(done).length;
  return `
  <div class="section-t"><span class="en">自测练习 · ${list.length} 题</span><span class="sub">即做即判 · 无论对错都显示解析 · 进度本地保存</span></div>
  <hr class="divider">
  <div class="filter-row">
    <span class="f">科目</span>
    <select id="quizSubSel">${subs.map(s=>`<option value="${s[0]}" ${state.quizSub===s[0]?"selected":""}>${s[1]}</option>`).join("")}</select>
    <span class="chip" style="background:var(--green-100);color:var(--green-700);padding:4px 10px;border-radius:99px;font-size:12px">已答 ${nDone} 题</span>
    <button class="btn ghost small" id="resetQuiz" style="font-size:12.5px;padding:5px 12px;border:1px solid var(--line);border-radius:8px;background:#fff">重置本科目答题记录</button>
  </div>
  ${list.length?list.map((q,i)=>{
    const d=done[q.id]||{};
    const kps=Object.values(kpChipsHtml(q)).join("")||kpsOf(q).map(k=>kpChip(k)).join("");
    let body="";
    if(q.type==="单选"){
      body=`<div class="opts">${q.options.map((o,oi)=>{
        const cls=d.sel===oi?(oi===q.answer?"right":"wrong"):(d.sel!==undefined&&oi===q.answer?"right":"");
        return `<div class="opt ${cls}" data-opt="${i},${oi}"><input type="radio" name="qz-${i}" ${d.sel===oi?"checked":""}><label>${esc(o)}</label></div>`;
      }).join("")}</div>
      <div class="expl ${d.sel!==undefined?"show":""} ${d.sel===q.answer?"ok":"no"}"><b>${d.sel!==undefined?(d.sel===q.answer?"回答正确 ✓ ":"回答错误 ✗ 正确答案是「"+esc(q.options[q.answer])+"」。"):""}</b>${esc(q.expl)}</div>`;
    }else{
      body=`<div class="notice info" style="margin:0 0 8px">先在纸上作答，再点击按钮对照参考答案。</div>
      <button class="ans-btn" data-ans="${i}">查看参考答案</button>
      <div class="expl ${d.show?"show":""} ok"><b>参考答案：</b><div style="white-space:pre-line">${esc(q.answer)}</div><div style="margin-top:8px"><b>解析：</b>${esc(q.expl)}</div></div>`;
    }
    return `<div class="card quiz-q">
      <div class="q-t"><span class="badge ${SUBJECTS.find(s=>s.id===q.subject).color}">${esc(SUBJECTS.find(s=>s.id===q.subject).name)}</span><span class="badge ${q.src==="真题"?"blue":"gold"}">${q.src==="真题"?"真题":"原创"}</span><span class="kps">${kps}</span></div>
      <div class="q">${esc(q.q)}</div>
      ${body}
    </div>`;}).join(""):`<div class="empty">该筛选条件下暂无题目</div>`}`;
}
function kpChipsHtml(q){return kpsOf(q).map(k=>kpChip(k));}

/* ===== 事件绑定 ===== */
function closeSide(){$("#sidebar").classList.remove("open");$("#mask").classList.remove("open");}
function bind(){
  $$("[data-go]").forEach(el=>el.addEventListener("click",()=>{
    const k=el.dataset.go;
    if(k==="subject"){const sid=el.dataset.id;const first=ALL_CH.find(c=>c.id.startsWith(sid+"-"));state.quizSub=sid;if(first)goChapter(first.id);return;}
    if(el.dataset.qsub)state.quizSub=el.dataset.qsub;
    if(el.dataset.esub)state.examSub=el.dataset.esub;
    if(k==="chapter"){goChapter(el.dataset.id);return;}
    const target="#/"+k;
    if(location.hash===target){applyHash();render();}else location.hash=target;
    closeSide();
  }));
  function goChapter(id){closeSide();const target="#/chapter/"+id;if(location.hash===target){applyHash();render();}else location.hash=target;}
  $("#menuBtn").addEventListener("click",()=>{$("#sidebar").classList.add("open");$("#mask").classList.add("open");});
  $("#mask").addEventListener("click",closeSide);
  $("#fab").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  /* 考点跳转 */
  $$(".kp-link").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();goKp(el.dataset.kp);}));
  /* 关联题悬浮（点击切换/点击外部关闭） */
  $$(".rq").forEach(el=>el.addEventListener("click",e=>{
    e.stopPropagation();
    $$(".rq.open").forEach(o=>{if(o!==el)o.classList.remove("open");});
    el.classList.toggle("open");
  }));
  /* 章节完成 */
  const cb=$("#chDoneBtn");
  if(cb)cb.addEventListener("click",()=>{
    const done=store.get("chDone",{});
    if(done[state.chapter])delete done[state.chapter];else done[state.chapter]=1;
    store.set("chDone",done);render();
  });
  /* 考点素材折叠/展开 */
  $$(".media-toggle").forEach(btn=>btn.addEventListener("click",()=>{
    const m=btn.closest(".media");
    const open=m.classList.toggle("open");
    btn.setAttribute("aria-expanded",open?"true":"false");
  }));
  /* 名词 */
  $$(".term-card").forEach(el=>el.addEventListener("click",e=>{
    if(e.target.closest(".mark"))return;
    el.classList.toggle("open");
  }));
  $$(".term-card .mark").forEach(el=>el.addEventListener("click",e=>{
    e.stopPropagation();
    const t=el.dataset.term,learned=store.get("termLearned",{});
    learned[t]?delete learned[t]:learned[t]=1;store.set("termLearned",learned);render();
  }));
  const tq=$("#termQ");
  if(tq)tq.addEventListener("input",()=>{state.termQ=tq.value;render();const el=$("#termQ");if(el){el.focus();}});
  $$("[data-termsf]").forEach(el=>el.addEventListener("click",()=>{state.termSub=el.dataset.termsf;render();}));
  $$("[data-learnf]").forEach(el=>el.addEventListener("click",()=>{state.termLearn=el.dataset.learnf;render();}));
  /* 真题筛选 */
  const es=$("#examSubSel");if(es)es.addEventListener("change",()=>{state.examSub=es.value;render();});
  const ey=$("#examYearSel");if(ey)ey.addEventListener("change",()=>{state.examYear=ey.value;render();});
  /* 自测 */
  const qs=$("#quizSubSel");if(qs)qs.addEventListener("change",()=>{state.quizSub=qs.value;render();});
  $$("[data-opt]").forEach(el=>el.addEventListener("click",()=>{
    const [i,oi]=el.dataset.opt.split(",").map(Number);
    const q=QUIZ[i];if(!q)return;
    const done=store.get("quizDone",{});done[q.id]={sel:oi};store.set("quizDone",done);state.quizDone=done;render();
  }));
  $$("[data-ans]").forEach(el=>el.addEventListener("click",()=>{
    const q=QUIZ[+el.dataset.ans];if(!q)return;
    const done=store.get("quizDone",{});done[q.id]={show:true};store.set("quizDone",done);state.quizDone=done;render();
  }));
  const rq=$("#resetQuiz");
  if(rq)rq.addEventListener("click",()=>{
    const done=store.get("quizDone",{});
    Object.keys(done).forEach(k=>{const q=QUIZ.find(x=>x.id===k);if(q&&(state.quizSub==="全部"||q.subject===state.quizSub))delete done[k];});
    store.set("quizDone",done);state.quizDone=done;render();
  });
}

/* ===== 图表 ===== */
window.__redraw=drawCharts;
function drawCharts(){
  const hot=$("#chartHot"),sj=$("#chartSubj");
  if(!hot||!sj)return;
  const mk=(dom,opt)=>{
    if(typeof echarts==="undefined")return null;
    let c=echarts.getInstanceByDom(dom);
    if(!c){c=echarts.init(dom);charts.push(c);}
    c.setOption(opt,true);return c;
  };
  const d=hotData();
  mk(hot,{
    grid:{left:110,right:26,top:8,bottom:26},
    xAxis:{type:"value",splitLine:{lineStyle:{color:"#EEE"}},axisLabel:{color:"#5A6B60",fontSize:11}},
    yAxis:{type:"category",data:d.map(x=>x.n),axisLabel:{color:"#24312B",fontSize:11.5},axisLine:{show:false},axisTick:{show:false}},
    series:[{type:"bar",data:d.map(x=>x.v),barWidth:13,itemStyle:{borderRadius:[0,6,6,0],color:(p)=>["#2E6B4F","#C9963D","#4C8C6A","#8FBFA4","#6B4E8C"][p.dataIndex%5]},label:{show:true,position:"right",color:"#5A6B60",fontSize:11}}],
    tooltip:{trigger:"axis",axisPointer:{type:"shadow"},confine:true}
  });
  mk(sj,{
    tooltip:{trigger:"item",confine:true},
    legend:{bottom:0,itemWidth:12,itemHeight:12,textStyle:{fontSize:11,color:"#5A6B60"}},
    series:[{type:"pie",radius:["42%","68%"],center:["50%","42%"],avoidLabelOverlap:true,
      itemStyle:{borderRadius:6,borderColor:"#fff",borderWidth:2},
      label:{show:false},emphasis:{scale:true},
      data:[
        {value:50,name:"C语言程序设计 50 分",itemStyle:{color:"#3E6B8C"}},
        {value:50,name:"农业机械与装备 50 分",itemStyle:{color:"#2E6B4F"}},
        {value:50,name:"数据库技术与应用 50 分",itemStyle:{color:"#6B4E8C"}}
      ]}]});
  if(typeof echarts==="undefined"){
    /* 降级静态版 */
    hot.innerHTML=`<div class="tt" style="font-weight:700">高频考点 TOP 12</div><div class="s" style="font-size:12px;color:var(--ink-3)">按 2020–2022 真题频次统计（降级静态版）</div>`+d.map(x=>`<div style="display:flex;align-items:center;gap:8px;margin:5px 0;font-size:12px"><span style="width:120px;text-align:right;flex:none">${esc(x.n)}</span><span style="flex:1;background:#E4EFE8;border-radius:4px;overflow:hidden"><i style="display:block;height:14px;width:${Math.max(8,x.v*100/d[0].v)}%;background:var(--green-500);border-radius:4px"></i></span><span style="width:20px">${x.v}</span></div>`).join("");
    sj.innerHTML=`<div class="tt" style="font-weight:700">科目分值结构</div><div class="s" style="font-size:12px;color:var(--ink-3)">三科各 50 分，共 150 分（降级静态版）</div>`+[["C语言 50 分","#3E6B8C"],["农业机械 50 分","#2E6B4F"],["数据库 50 分","#6B4E8C"]].map(x=>`<div style="display:flex;align-items:center;gap:8px;margin:8px 0;font-size:12px"><span style="width:120px;flex:none">${x[0]}</span><span style="flex:1;background:#E4EFE8;border-radius:4px;overflow:hidden"><i style="display:block;height:16px;width:100%;background:${x[1]};border-radius:4px"></i></span></div>`).join("");
  }
}
function hotData(){
  const m={};
  EXAMS.forEach(e=>e.kps.forEach(k=>{m[k]=(m[k]||0)+1;}));
  QUIZ.forEach(q=>q.kps.forEach(k=>{m[k]=(m[k]||0)+1;}));
  return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,v])=>({n:KP_MAP[id]?KP_MAP[id].kp.name:id,v}));
}

/* ===== 路由 ===== */
window.addEventListener("hashchange",()=>{applyHash();render();});
window.addEventListener("resize",()=>{charts.forEach(c=>{try{c.resize()}catch(_){}});});
/* 点击弹层外 / Esc 关闭关联题悬浮 */
document.addEventListener("click",e=>{
  if(e.target instanceof Element&&!e.target.closest(".rq"))
    $$(".rq.open").forEach(el=>el.classList.remove("open"));
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape")$$(".rq.open").forEach(el=>el.classList.remove("open"));
});

/* 启动 */
applyHash();
render();
