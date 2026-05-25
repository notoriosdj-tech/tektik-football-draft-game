const fs=require('fs');
const file='src/StableGame.jsx';
let s=fs.readFileSync(file,'utf8');

// normalize England flag display and use flags in card centers
s=s.replace("const norm=p=>({id:p.id,name:p.name,short:p.short||p.name,flag:p.flag||'',country:p.country||'',club:p.club||'All-Time XI',pos:p.pos||['CM'],rating:p.rating||85,photo:p.photo||String(p.short||p.name||'?').split(' ').map(x=>x[0]).join('').slice(0,3).toUpperCase()});",
"const norm=p=>({id:p.id,name:p.name,short:p.short||p.name,flag:(p.country==='ENG'?'ENG':(p.flag||'')),country:p.country||'',club:p.club||'All-Time XI',pos:p.pos||['CM'],rating:p.rating||85,photo:p.photo||String(p.short||p.name||'?').split(' ').map(x=>x[0]).join('').slice(0,3).toUpperCase()});");
s=s.replace(/flag:'🏴'/g,"flag:'ENG'");
s=s.replace("<em>{p?.photo||''}</em>","<em>{p?.flag||''}</em>");
s=s.replace("<em>{data.player.photo}</em>","<em>{data.player.flag}</em>");

// compatibility helper for wingbacks and related roles
s=s.replace("function cpuPick(pos,blocked,diff){const noise={EASY:12,MEDIUM:5,HARD:1}[diff]??5;return PLAYERS.filter(p=>!blocked.has(p.id)&&p.pos.includes(pos)).map(p=>({p,s:p.rating+Math.random()*noise})).sort((a,b)=>b.s-a.s)[0]?.p}",
"function fits(p,pos){const a=p.pos||[];if(a.includes(pos))return true;if(pos==='RWB')return a.includes('RB')||a.includes('RM')||a.includes('RW');if(pos==='LWB')return a.includes('LB')||a.includes('LM')||a.includes('LW');if(pos==='RM')return a.includes('RW')||a.includes('RWB');if(pos==='LM')return a.includes('LW')||a.includes('LWB');if(pos==='CF')return a.includes('ST')||a.includes('CAM');return false}function cpuPick(pos,blocked,diff){const noise={EASY:12,MEDIUM:5,HARD:1}[diff]??5;return PLAYERS.filter(p=>!blocked.has(p.id)&&fits(p,pos)).map(p=>({p,s:p.rating+(p.pos.includes(pos)?8:0)+Math.random()*noise})).sort((a,b)=>b.s-a.s)[0]?.p}");
s=s.replace("p.pos.includes(slot?.pos)).filter", "fits(p,slot?.pos)).filter");
s=s.replace("x.pos.includes(s.pos));if(p)", "fits(x,s.pos));if(p)");

// Top: remove duplicated top-right series and move view controls/menu to field
s=s.replace("function Top({view,setView,series,team,hc,cc,total,open}){const[m,setM]=useState(false);return <header><div><h1>TEK-<span>Tik</span></h1><p>{team} FOOTBALL DRAFT</p></div><aside><div className=\"tabs\"><button className={view==='YOU'?'on you':'you'} onClick={()=>setView('YOU')}>YOU <small>{hc}/{total}</small></button><button className={view==='CPU'?'on cpu':'cpu'} onClick={()=>setView('CPU')}>CPU <small>{cc}/{total}</small></button></div><button className={m?'music on':'music'} onClick={()=>bgm(setM)}>{m?'♫ ON':'♫ OFF'}</button><button className=\"hamb\" onClick={open}>☰</button><div className=\"series\">SERIES <b>{series.you}</b>-<b>{series.cpu}</b></div></aside></header>}",
"function Top({team}){const[m,setM]=useState(false);return <header><div><h1>TEK-<span>Tik</span></h1><p>{team} FOOTBALL DRAFT</p></div><aside><button className={m?'music on':'music'} onClick={()=>bgm(setM)}>{m?'♫ ON':'♫ OFF'}</button></aside></header>}");
s=s.replace("function Pitch({formation,teamObj,view,onSlot,selected,shine}){return <section className={`pitch ${view==='YOU'?'you':'cpu'}`}><div className=\"tag\">{view==='YOU'?'YOUR XI':'CPU XI'}</div><div className=\"mid\"/>",
"function Pitch({formation,teamObj,view,onSlot,selected,shine,setView,open}){return <section className={`pitch ${view==='YOU'?'you':'cpu'}`}><button className=\"fieldMenu\" onClick={open}>☰</button><div className=\"tag\">{view==='YOU'?'YOUR XI':'CPU XI'}</div><div className=\"fieldSwitch\"><button className={view==='YOU'?'on you':'you'} onClick={()=>setView('YOU')}>YOU</button><button className={view==='CPU'?'on cpu':'cpu'} onClick={()=>setView('CPU')}>CPU</button></div><div className=\"mid\"/>");
s=s.replace("<Top view={view} setView={setView} series={series} team={team} hc={Object.keys(human).length} cc={Object.keys(cpu).length} total={order.length} open={()=>setDrawer(true)}/><Pitch formation={formation} teamObj={view==='YOU'?human:cpu} view={view} selected={selected} shine={shine} onSlot={handleSlot}/>",
"<Top team={team}/><Pitch formation={formation} teamObj={view==='YOU'?human:cpu} view={view} selected={selected} shine={shine} setView={setView} open={()=>setDrawer(true)} onSlot={handleSlot}/>");

// turn change overlay/state
s=s.replace("[summon,setSummon]=useState(null),[shine,setShine]=useState(null),[drawer,setDrawer]=useState(false),[auto,setAuto]=useState(false);",
"[summon,setSummon]=useState(null),[shine,setShine]=useState(null),[turn,setTurn]=useState(null),[drawer,setDrawer]=useState(false),[auto,setAuto]=useState(false);");
s=s.replace("function pickPlayer(p){const h={...human,[pickSlot.id]:p};let c={...cpu};const blocked=new Set([...banned,...ids(h),...ids(c)]);flash(pickSlot.id,'you',p,pickSlot.pos,900);const cs=order.find(s=>!c[s.id]);if(cs){const cp=cpuPick(cs.pos,blocked,difficulty);if(cp){c[cs.id]=cp;setTimeout(()=>{setView('CPU');flash(cs.id,'cpu',cp,cs.pos,2200)},600);setTimeout(()=>setView('YOU'),3000)}}setHuman(h);setCpu(c);setPickSlot(null);if(Object.keys(h).length>=order.length)setTimeout(()=>finish(h,c),3300)}",
"function pickPlayer(p){const h={...human,[pickSlot.id]:p};let c={...cpu};const blocked=new Set([...banned,...ids(h),...ids(c)]);flash(pickSlot.id,'you',p,pickSlot.pos,1100);const cs=order.find(s=>!c[s.id]);if(cs){const cp=cpuPick(cs.pos,blocked,difficulty);if(cp){c[cs.id]=cp;setTimeout(()=>{setTurn('CPU TURN')},1000);setTimeout(()=>{setTurn(null);setView('CPU');flash(cs.id,'cpu',cp,cs.pos,2600)},1800);setTimeout(()=>setView('YOU'),4700)}}setHuman(h);setCpu(c);setPickSlot(null);if(Object.keys(h).length>=order.length)setTimeout(()=>finish(h,c),5000)}");
s=s.replace("<Summon data={summon}/></main>","{turn&&<div className=\"turnBanner\"><b>{turn}</b></div>}<Summon data={summon}/></main>");

fs.writeFileSync(file,s);
console.log('Field controls and turn animation patch applied');
