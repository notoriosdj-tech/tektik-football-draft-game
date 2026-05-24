const fs=require('fs');
let c=fs.readFileSync('src/App.jsx','utf8');
const smart=`function scoreCpuPlayer(p,pos,banned,drafted,difficulty,cpuPicks={},humanPicks={},style='Balanced'){
  const prof={EASY:{r:18,m:.22},MEDIUM:{r:7,m:.08},HARD:{r:2,m:.02}}[difficulty]||{r:7,m:.08};
  const picks=Object.entries(cpuPicks||{}).filter(([,x])=>x);
  const fam=family(pos);
  const counts={GK:0,DEF:0,MID:0,ATT:0};picks.forEach(([r])=>counts[family(role(r))]++);
  let s=effective(p,pos)*3+p.rating*.8-penalty(p,pos)*3+Math.random()*prof.r;
  if(pos==='GK'&&counts.GK===0)s+=55;
  if(fam==='DEF'&&counts.DEF<3)s+=30;
  if(fam==='MID'&&counts.MID<3)s+=28;
  if(fam==='ATT'&&counts.ATT<3)s+=24;
  const eliteLeft=PLAYERS.filter(x=>!banned.includes(x.id)&&!drafted.includes(x.id)&&penalty(x,pos)<=4&&x.rating>=88).length;
  if(eliteLeft<=2)s+=26;else if(eliteLeft<=4)s+=16;
  const current=Object.values(cpuPicks||{}).filter(Boolean);
  const avg=(k)=>current.length?current.reduce((a,x)=>a+(x.t?.[k]||0),0)/current.length:0;
  if(avg('pas')<78)s+=(p.t?.pas||0)*.18;if(avg('def')<74)s+=(p.t?.def||0)*.18;if(avg('sho')<80)s+=(p.t?.sho||0)*.16;
  if(current.some(x=>(x.t?.pas||0)>90)&&(p.t?.sho||0)>90)s+=18;
  if(current.some(x=>(x.t?.sho||0)>90)&&(p.t?.pas||0)>90)s+=18;
  if(style==='Star Hunter')s+=p.rating*.35;if(style==='Tactical Purist'&&penalty(p,pos)===0)s+=28;if(style==='Defensive Wall'&&['GK','CB','LB','RB','LWB','RWB','CDM'].includes(pos))s+=(p.t?.def||0)*.35+(p.t?.gk||0)*.25;if(style==='High Press')s+=(p.t?.pac||0)*.2+(p.t?.phy||0)*.18;if(style==='Counter Attack'&&['LW','RW','ST','CF'].includes(pos))s+=(p.t?.pac||0)*.35+(p.t?.sho||0)*.18;
  const h=Object.entries(humanPicks||{}).map(([r,x])=>({r:role(r),p:x})).filter(x=>x.p);
  if(h.some(x=>['LW','RW','ST','CAM'].includes(x.r)&&(x.p.t?.sho||0)>90)&&['CB','LB','RB','CDM'].includes(pos))s+=(p.t?.def||0)*.22;
  if(Object.keys(cpuPicks||{}).length>=6&&counts.GK===0&&pos!=='GK')s-=40;
  if(Object.keys(cpuPicks||{}).length>=4&&counts.DEF<2&&fam==='ATT')s-=18;
  return s;
}
function smartCpuDecision(pos,banned,drafted,difficulty,cpuPicks={},humanPicks={},style='Balanced'){
  const blocked=new Set([...banned,...drafted]);const available=PLAYERS.filter(p=>!blocked.has(p.id));
  const natural=available.filter(p=>penalty(p,pos)===0).sort((a,b)=>b.rating-a.rating).slice(0,28);
  const good=available.filter(p=>penalty(p,pos)===4).sort((a,b)=>b.rating-a.rating).slice(0,12);
  const risky=available.filter(p=>penalty(p,pos)===10).sort((a,b)=>b.rating-a.rating).slice(0,5);
  let scored=[...natural,...good,...risky].map(p=>({p,s:scoreCpuPlayer(p,pos,banned,drafted,difficulty,cpuPicks,humanPicks,style)})).sort((a,b)=>b.s-a.s);
  const mistake={EASY:.22,MEDIUM:.08,HARD:.02}[difficulty]??.08;let pick=scored[0];if(Math.random()<mistake&&scored[3])pick=scored[Math.floor(Math.random()*Math.min(5,scored.length))];
  return {player:pick?.p||null,explanation:pick?('CPU chose '+pick.p.short+' for tactical fit + squad balance.'): 'CPU found no player.'};
}
function chooseCpu(pos,banned,drafted,difficulty,cpuPicks={},humanPicks={},style='Balanced'){return smartCpuDecision(pos,banned,drafted,difficulty,cpuPicks,humanPicks,style).player}`;
c=c.replace(/function chooseCpu\(pos,banned,drafted,difficulty\)\{[\s\S]*?\}\nfunction searchPlayers/,smart+'\nfunction searchPlayers');
c=c.replace("const player=chooseCpu(role(r),banned,already,difficulty); if(!player)return; const nextCpu={...currentCpu,[r]:player}; setView('cpu'); setPending({human:h,cpu:nextCpu}); setCutscene({player,role:r,position:role(r)})","const decision=smartCpuDecision(role(r),banned,already,difficulty,currentCpu,h,cpuStyle); const player=decision.player; if(!player)return; const nextCpu={...currentCpu,[r]:player}; setView('cpu'); setPending({human:h,cpu:nextCpu}); setToast(decision.explanation); setCutscene({player,role:r,position:role(r),explanation:decision.explanation})");
c=c.replace("const player=chooseCpu(role(r),banned,blocked,'HARD'); if(player){h[r]=player; blocked.push(player.id)}}","const player=chooseCpu(role(r),banned,blocked,'HARD',h,c,'Tactical Purist'); if(player){h[r]=player; blocked.push(player.id)}}");
c=c.replace("const player=chooseCpu(role(r),banned,blocked,difficulty); if(player){c[r]=player; blocked.push(player.id)}} setHuman(h); setCpu(c); finish(h,c)}","const player=chooseCpu(role(r),banned,blocked,difficulty,c,h,cpuStyle); if(player){c[r]=player; blocked.push(player.id)}} setHuman(h); setCpu(c); finish(h,c)}");
c=c.replace('<p>CPU locked this player into its XI. Continue when ready.</p>',"<p>{data.explanation || 'CPU locked this player into its XI. Continue when ready.'}</p>");
try{require('./patch-series-flow.cjs')}catch(e){console.log('Series patch skipped:',e.message)}
fs.writeFileSync('src/App.jsx',c);
console.log('Smart CPU patch applied');