#!/usr/bin/env node
// Data-driven renderer for the portfolio-review skill.
// Usage: node render.mjs <data.json> <outDir>
//
// data.json shape:
// {
//   "generatedAt": "2026-06-07",
//   "username": "octocat",
//   "repoCount": 37,
//   "tldr": "optional markdown/plain string for the headline read",
//   "projects": [
//     { "name","group","lang","commits","release",
//       "tag","biz","verdict","improve":[...],"missing":[...],
//       "M":0-10,"K":0-10,"R":0-10,"D":0-10,"X":0-10 }
//   ]
// }
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const dataPath = process.argv[2];
const outDir = process.argv[3] || ".";
if (!dataPath) { console.error("usage: node render.mjs <data.json> <outDir>"); process.exit(1); }

const cfg = JSON.parse(readFileSync(resolve(dataPath), "utf8"));
const generatedAt = cfg.generatedAt || new Date().toISOString().slice(0, 10);
const username = cfg.username || "";
const repoCount = cfg.repoCount ?? cfg.projects.length;
const projects = cfg.projects;
mkdirSync(resolve(outDir), { recursive: true });

// ---- SCORING (single source of truth) -------------------------------------
// Potential: Market 30, Maturity 25, Moat 20, Monetization 15, low-risk 10
// Monetization: Monetization 45, Market 30, Maturity 25
const potential = p => Math.round((p.K * 0.30 + p.M * 0.25 + p.D * 0.20 + p.R * 0.15 + (10 - p.X) * 0.10) * 10);
const monetization = p => Math.round((p.R * 0.45 + p.K * 0.30 + p.M * 0.25) * 10);
const tierOf = s => s >= 70 ? "A — Push" : s >= 58 ? "B — Develop" : s >= 45 ? "C — Niche / Hold" : "D — Park / Harvest";
projects.forEach(p => { p.potential = potential(p); p.monetization = monetization(p); p.tier = tierOf(p.potential); });

const ranked = [...projects].sort((a, b) => b.potential - a.potential);
const rankedMoney = [...projects].sort((a, b) => b.monetization - a.monetization);
const bar = (v, max = 10) => { const n = Math.round(v / max * 10); return "█".repeat(n) + "░".repeat(10 - n); };

// ---- MARKDOWN --------------------------------------------------------------
let md = `# 📊 GitHub Portfolio Review — Potential & Monetization\n\n`;
md += `_Generated ${generatedAt}${username ? ` · @${username}` : ""} · ${repoCount} repositories analysed · scoring model documented at the end._\n\n`;
if (cfg.tldr) md += `> ${cfg.tldr}\n\n`;

md += `## 🏆 Ranked by Potential\n\n`;
md += `| # | Project | Potential | Monetization | Tier | Stack | Commits | What it is |\n`;
md += `|---|---------|:--------:|:-----------:|------|-------|:------:|------------|\n`;
ranked.forEach((p, i) => {
  md += `| ${i + 1} | **${p.name}** | ${p.potential} | ${p.monetization} | ${p.tier} | ${p.lang || "—"} | ${p.commits || "—"} | ${p.tag} |\n`;
});

md += `\n## 💰 Ranked by Monetization Readiness\n\n`;
md += `| # | Project | Monetization | Why |\n|---|---------|:-----------:|-----|\n`;
rankedMoney.slice(0, 10).forEach((p, i) => { md += `| ${i + 1} | **${p.name}** | ${p.monetization} | ${p.biz} |\n`; });

md += `\n## 📁 Full Project Cards\n\n`;
for (const p of ranked) {
  md += `### ${p.name}  \`${p.tier}\`\n`;
  md += `**${p.tag}**\n\n`;
  md += `| Metric | Score | |\n|---|:--:|---|\n`;
  md += `| Maturity | ${p.M}/10 | ${bar(p.M)} |\n`;
  md += `| Market | ${p.K}/10 | ${bar(p.K)} |\n`;
  md += `| Monetization readiness | ${p.R}/10 | ${bar(p.R)} |\n`;
  md += `| Differentiation / moat | ${p.D}/10 | ${bar(p.D)} |\n`;
  md += `| Execution risk | ${p.X}/10 | ${bar(p.X)} _(lower is better)_ |\n`;
  md += `| **Potential** | **${p.potential}/100** | |\n`;
  md += `| **Monetization** | **${p.monetization}/100** | |\n\n`;
  md += `**Context:** ${p.biz}\n\n`;
  md += `**Verdict:** ${p.verdict}\n\n`;
  md += `**Improvements:**\n`;
  (p.improve || []).forEach(i => { md += `- ${i}\n`; });
  md += `\n**Missing features:** ${(p.missing || []).join(" · ")}\n\n---\n\n`;
}

md += `## 🧮 Scoring Model\n\n`;
md += `Each project is rated 0-10 on five sub-metrics, combined into two headline scores.\n\n`;
md += `- **Maturity** — how complete/shipped it is (commits, releases, feature depth).\n`;
md += `- **Market** — size and willingness-to-pay of the target audience.\n`;
md += `- **Monetization readiness** — how close to charging money (billing wired? multi-tenant?).\n`;
md += `- **Differentiation / moat** — how hard to copy / how defensible.\n`;
md += `- **Execution risk** — legal, technical, or competitive risk (lower is better).\n\n`;
md += `**Potential** = Market×0.30 + Maturity×0.25 + Moat×0.20 + Monetization×0.15 + (10−Risk)×0.10, ×10.\n\n`;
md += `**Monetization** = Monetization×0.45 + Market×0.30 + Maturity×0.25, ×10.\n\n`;
md += `Tiers: **A — Push** (≥70) · **B — Develop** (58-69) · **C — Niche/Hold** (45-57) · **D — Park/Harvest** (<45).\n\n`;
md += `_Scores are directional judgement calls from READMEs, commit history, releases, and category knowledge — use them to prioritise, then trust your own read._\n`;

writeFileSync(join(resolve(outDir), "PORTFOLIO_REVIEW.md"), md);

// ---- HTML ------------------------------------------------------------------
const dataJson = JSON.stringify(projects.map(p => ({
  name: p.name, group: p.group, lang: p.lang || "—", commits: p.commits || 0,
  M: p.M, K: p.K, R: p.R, D: p.D, X: p.X,
  potential: p.potential, monetization: p.monetization, tier: p.tier,
  tag: p.tag, biz: p.biz, verdict: p.verdict, improve: p.improve || [], missing: p.missing || [],
})));
const langCounts = {};
projects.forEach(p => { if (p.lang && p.lang !== "—") langCounts[p.lang] = (langCounts[p.lang] || 0) + 1; });
const ideaCount = projects.filter(p => p.group === "Concept" || ((p.commits || 0) === 0 && p.group !== "Archive")).length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Portfolio Review — Potential & Monetization</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  :root{--bg:#0b0e14;--panel:#141925;--panel2:#1b2231;--line:#26304a;--txt:#e6ebf5;--mut:#8b97b0;--acc:#5b8def;--acc2:#21d4a8;--warn:#f5a623;--bad:#ef5a78}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--txt);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
  a{color:var(--acc);text-decoration:none}
  .wrap{max-width:1180px;margin:0 auto;padding:0 20px}
  header{padding:64px 0 36px;border-bottom:1px solid var(--line);background:radial-gradient(1200px 400px at 20% -10%,rgba(91,141,239,.18),transparent 60%)}
  h1{font-size:38px;font-weight:800;letter-spacing:-.02em;margin-bottom:10px}
  .sub{color:var(--mut);font-size:17px;max-width:760px}
  .meta{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}
  .pill{background:var(--panel);border:1px solid var(--line);padding:6px 12px;border-radius:999px;font-size:13px;color:var(--mut)}
  section{padding:40px 0;border-bottom:1px solid var(--line)}
  h2{font-size:24px;font-weight:700;margin-bottom:6px;letter-spacing:-.01em}
  h2 .em{color:var(--acc2)}
  .lead{color:var(--mut);margin-bottom:24px;max-width:820px}
  .grid{display:grid;gap:18px}
  .g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}
  @media(max-width:880px){.g2,.g3{grid-template-columns:1fr}}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px}
  .card h3{font-size:14px;color:var(--mut);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:14px}
  .chartbox{position:relative;height:300px}.chartbox.tall{height:420px}
  .tldr{background:linear-gradient(135deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:14px;padding:24px;margin-top:8px}
  .tldr b{color:var(--txt)}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
  th{color:var(--mut);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em;position:sticky;top:0;background:var(--panel)}
  td.num,th.num{text-align:center}
  tbody tr:hover{background:var(--panel2)}
  .score{display:inline-block;min-width:38px;text-align:center;padding:3px 8px;border-radius:7px;font-weight:700;font-size:13px}
  .badge{display:inline-block;padding:3px 9px;border-radius:7px;font-size:12px;font-weight:600}
  .t-A{background:rgba(33,212,168,.16);color:var(--acc2)}.t-B{background:rgba(91,141,239,.16);color:var(--acc)}
  .t-C{background:rgba(245,166,35,.16);color:var(--warn)}.t-D{background:rgba(139,151,176,.16);color:var(--mut)}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-top:8px}
  .pcard{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column}
  .pcard .top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px}
  .pcard .nm{font-size:17px;font-weight:700}
  .pcard .tg{color:var(--mut);font-size:13px;margin-bottom:14px}
  .pcard .scores{display:flex;gap:8px;margin-bottom:14px}
  .pcard .sc{flex:1;background:var(--panel2);border-radius:9px;padding:9px;text-align:center}
  .pcard .sc .v{font-size:20px;font-weight:800}
  .pcard .sc .l{font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em}
  .pcard .verdict{font-size:13px;color:var(--txt);background:var(--panel2);border-left:3px solid var(--acc);padding:8px 11px;border-radius:0 8px 8px 0;margin-bottom:12px}
  .pcard ul{list-style:none;font-size:13px;color:var(--mut)}
  .pcard li{padding:3px 0 3px 16px;position:relative}
  .pcard li::before{content:"›";position:absolute;left:0;color:var(--acc2)}
  .pcard .miss{margin-top:10px;font-size:12px;color:var(--mut)}
  .pcard .miss b{color:var(--bad);font-weight:600}
  .filterbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
  .fbtn{background:var(--panel);border:1px solid var(--line);color:var(--mut);padding:7px 14px;border-radius:999px;font-size:13px;cursor:pointer;transition:.15s}
  .fbtn:hover{border-color:var(--acc);color:var(--txt)}
  .fbtn.on{background:var(--acc);border-color:var(--acc);color:#fff}
  footer{padding:40px 0 80px;color:var(--mut);font-size:13px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
  @media(max-width:880px){.kpis{grid-template-columns:repeat(2,1fr)}}
  .kpi{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px}
  .kpi .v{font-size:30px;font-weight:800;letter-spacing:-.02em}
  .kpi .l{font-size:12px;color:var(--mut);margin-top:2px}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <h1>📊 Portfolio Review</h1>
    <p class="sub">Every GitHub project rated for <b style="color:var(--acc2)">potential</b> and <b style="color:var(--acc)">monetization</b> — with the metrics, the verdict, and what to build next.</p>
    <div class="meta">
      <span class="pill">Generated ${generatedAt}</span>
      ${username ? `<span class="pill">@${username}</span>` : ""}
      <span class="pill">${repoCount} repositories</span>
      <span class="pill">5-metric scoring model</span>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v" id="kTotal">—</div><div class="l">Projects scored</div></div>
      <div class="kpi"><div class="v" style="color:var(--acc2)" id="kA">—</div><div class="l">Tier-A "push now"</div></div>
      <div class="kpi"><div class="v" id="kCommits">—</div><div class="l">Total commits</div></div>
      <div class="kpi"><div class="v" style="color:var(--warn)" id="kIdea">${ideaCount}</div><div class="l">Idea-only / empty</div></div>
    </div>
  </div>
</header>

${cfg.tldr ? `<section><div class="wrap"><div class="tldr"><h2 style="margin-bottom:10px">🎯 The honest read</h2><p>${cfg.tldr}</p></div></div></section>` : ""}

<section>
  <div class="wrap">
    <h2>Potential vs <span class="em">Monetization</span></h2>
    <p class="lead">Top-right is the sweet spot: high potential <i>and</i> ready to charge. Bubble size = maturity. Hover for details.</p>
    <div class="grid g2">
      <div class="card"><h3>Opportunity map</h3><div class="chartbox tall"><canvas id="scatter"></canvas></div></div>
      <div class="card"><h3>Potential — ranked</h3><div class="chartbox tall"><canvas id="potBar"></canvas></div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>The metric breakdown</h2>
    <p class="lead">How the top contenders score across all five dimensions, plus where your build effort has gone.</p>
    <div class="grid g3">
      <div class="card"><h3>Top 6 — radar</h3><div class="chartbox"><canvas id="radar"></canvas></div></div>
      <div class="card"><h3>Languages</h3><div class="chartbox"><canvas id="lang"></canvas></div></div>
      <div class="card"><h3>Where the commits went</h3><div class="chartbox"><canvas id="commits"></canvas></div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Every project, scored</h2>
    <p class="lead">Sortable snapshot. Click a tier to filter.</p>
    <div class="filterbar" id="filters">
      <button class="fbtn on" data-f="all">All</button>
      <button class="fbtn" data-f="A">A — Push</button>
      <button class="fbtn" data-f="B">B — Develop</button>
      <button class="fbtn" data-f="C">C — Niche/Hold</button>
      <button class="fbtn" data-f="D">D — Park/Harvest</button>
    </div>
    <div class="card" style="padding:0;overflow:auto">
      <table id="tbl"><thead><tr>
        <th>Project</th><th class="num">Potential</th><th class="num">Monetize</th><th>Tier</th>
        <th class="num">Mat</th><th class="num">Mkt</th><th class="num">$Ready</th><th class="num">Moat</th><th class="num">Risk</th><th>Stack</th>
      </tr></thead><tbody></tbody></table>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Project cards</h2>
    <p class="lead">The verdict, what to do next, and what's missing for revenue — for each project.</p>
    <div class="cards" id="pcards"></div>
  </div>
</section>

<footer>
  <div class="wrap">
    <h2 style="font-size:18px;color:var(--txt);margin-bottom:10px">Scoring model</h2>
    <p>Five sub-metrics (0-10): <b>Maturity</b>, <b>Market</b>, <b>Monetization readiness</b>, <b>Differentiation/moat</b>, <b>Execution risk</b> (lower better).<br/>
    <b>Potential</b> = Market×0.30 + Maturity×0.25 + Moat×0.20 + Monetization×0.15 + (10−Risk)×0.10, ×10.<br/>
    <b>Monetization</b> = Monetization×0.45 + Market×0.30 + Maturity×0.25, ×10.<br/>
    Tiers: A ≥70 · B 58-69 · C 45-57 · D &lt;45. Directional judgement calls, not gospel.</p>
  </div>
</footer>

<script>
const DATA = ${dataJson};
const LANGS = ${JSON.stringify(langCounts)};
const C={txt:'#e6ebf5',mut:'#8b97b0',acc:'#5b8def',acc2:'#21d4a8',warn:'#f5a623',bad:'#ef5a78',line:'#26304a',bg:'#0b0e14'};
Chart.defaults.color=C.mut;Chart.defaults.borderColor=C.line;Chart.defaults.font.family="-apple-system,Segoe UI,Roboto,sans-serif";
const tierClass=t=>'t-'+t.trim().charAt(0);
const potColor=v=>v>=70?C.acc2:v>=58?C.acc:v>=45?C.warn:C.mut;
document.getElementById('kTotal').textContent=DATA.length;
document.getElementById('kA').textContent=DATA.filter(d=>d.tier.startsWith('A')).length;
document.getElementById('kCommits').textContent=DATA.reduce((s,d)=>s+(d.commits||0),0).toLocaleString();

new Chart(scatter,{type:'bubble',data:{datasets:DATA.map(d=>({label:d.name,data:[{x:d.monetization,y:d.potential,r:5+d.M*1.3}],
  backgroundColor:potColor(d.potential)+'cc',borderColor:potColor(d.potential)}))},
  options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const d=DATA[c.datasetIndex];return d.name+' — Pot '+d.potential+' / $ '+d.monetization+' / Mat '+d.M;}}}},
  scales:{x:{title:{display:true,text:'Monetization readiness →'},min:20,max:90,grid:{color:C.line}},
          y:{title:{display:true,text:'Potential →'},min:25,max:90,grid:{color:C.line}}}}});

const byPot=[...DATA].sort((a,b)=>b.potential-a.potential);
new Chart(potBar,{type:'bar',data:{labels:byPot.map(d=>d.name),datasets:[{data:byPot.map(d=>d.potential),
  backgroundColor:byPot.map(d=>potColor(d.potential)),borderRadius:5,barThickness:11}]},
  options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{min:0,max:100,grid:{color:C.line}},y:{grid:{display:false},ticks:{font:{size:11}}}}}});

const top6=[...DATA].sort((a,b)=>b.potential-a.potential).slice(0,6);
const cols=[C.acc2,C.acc,C.warn,C.bad,'#a78bfa','#22d3ee'];
new Chart(radar,{type:'radar',data:{labels:['Maturity','Market','$ Ready','Moat','Low risk'],
  datasets:top6.map((d,i)=>({label:d.name,data:[d.M,d.K,d.R,d.D,10-d.X],borderColor:cols[i],backgroundColor:cols[i]+'22',pointRadius:2}))},
  options:{plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}}},
   scales:{r:{min:0,max:10,grid:{color:C.line},angleLines:{color:C.line},pointLabels:{font:{size:11}},ticks:{display:false}}}}});

new Chart(lang,{type:'doughnut',data:{labels:Object.keys(LANGS),datasets:[{data:Object.values(LANGS),
  backgroundColor:[C.acc,C.acc2,C.warn,C.bad,'#a78bfa','#22d3ee','#f472b6','#facc15'],borderColor:C.bg,borderWidth:2}]},
  options:{plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:11}}}},cutout:'58%'}});

const byCommit=[...DATA].filter(d=>d.commits).sort((a,b)=>b.commits-a.commits).slice(0,12);
new Chart(commits,{type:'bar',data:{labels:byCommit.map(d=>d.name),datasets:[{data:byCommit.map(d=>d.commits),
  backgroundColor:C.acc,borderRadius:5,barThickness:13}]},
  options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:C.line}},y:{grid:{display:false},ticks:{font:{size:10}}}}}});

const tb=document.querySelector('#tbl tbody');
function renderTable(filter){
  tb.innerHTML='';
  [...DATA].sort((a,b)=>b.potential-a.potential).filter(d=>filter==='all'||d.tier.trim().startsWith(filter)).forEach(d=>{
    const tr=document.createElement('tr');
    tr.innerHTML='<td><b>'+d.name+'</b><br><span style="color:var(--mut);font-size:12px">'+d.tag+'</span></td>'+
      '<td class="num"><span class="score" style="background:'+potColor(d.potential)+'22;color:'+potColor(d.potential)+'">'+d.potential+'</span></td>'+
      '<td class="num"><span class="score" style="background:'+C.acc+'18;color:'+C.acc+'">'+d.monetization+'</span></td>'+
      '<td><span class="badge '+tierClass(d.tier)+'">'+d.tier+'</span></td>'+
      '<td class="num">'+d.M+'</td><td class="num">'+d.K+'</td><td class="num">'+d.R+'</td><td class="num">'+d.D+'</td><td class="num">'+d.X+'</td><td>'+d.lang+'</td>';
    tb.appendChild(tr);
  });
}
renderTable('all');
document.querySelectorAll('.fbtn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.fbtn').forEach(x=>x.classList.remove('on'));b.classList.add('on');renderTable(b.dataset.f);}));

const pc=document.getElementById('pcards');
[...DATA].sort((a,b)=>b.potential-a.potential).forEach(d=>{
  const el=document.createElement('div');el.className='pcard';
  el.innerHTML='<div class="top"><span class="nm">'+d.name+'</span><span class="badge '+tierClass(d.tier)+'">'+d.tier+'</span></div>'+
    '<div class="tg">'+d.tag+'</div>'+
    '<div class="scores"><div class="sc"><div class="v" style="color:'+potColor(d.potential)+'">'+d.potential+'</div><div class="l">Potential</div></div>'+
      '<div class="sc"><div class="v" style="color:'+C.acc+'">'+d.monetization+'</div><div class="l">Monetize</div></div>'+
      '<div class="sc"><div class="v">'+d.M+'</div><div class="l">Maturity</div></div></div>'+
    '<div class="verdict">'+d.verdict+'</div>'+
    '<ul>'+d.improve.map(i=>'<li>'+i+'</li>').join('')+'</ul>'+
    '<div class="miss"><b>Missing:</b> '+d.missing.join(' · ')+'</div>';
  pc.appendChild(el);
});
</script>
</body>
</html>`;

writeFileSync(join(resolve(outDir), "portfolio-review.html"), html);
console.log(`Wrote portfolio-review.html + PORTFOLIO_REVIEW.md to ${resolve(outDir)}`);
console.log(`Projects: ${projects.length} | Tier A: ${projects.filter(p => p.tier.startsWith("A")).length} | Idea-only: ${ideaCount}`);
