const fs = require('fs');
const p = 'src/App.jsx';
let s = fs.readFileSync(p, 'utf8');

s = s.replace("const FORM={'4-4-2':[['ST','ST'],['LM','CM','CM','RM'],['LB','CB','CB','RB'],['GK']],'4-3-3':[['LW','ST','RW'],['CM','CM','CM'],['LB','CB','CB','RB'],['GK']],'4-2-3-1':[['ST'],['LW','CAM','RW'],['CDM','CDM'],['LB','CB','CB','RB'],['GK']],'3-5-2':[['ST','ST'],['LM','CM','CM','CM','RM'],['CB','CB','CB'],['GK']]};",
"const FORM={'4-4-2':[['ST','ST'],['LM','CM','CM','RM'],['LB','CB','CB','RB'],['GK']],'4-3-3':[['LW','ST','RW'],['CM','CM','CM'],['LB','CB','CB','RB'],['GK']],'4-2-3-1':[['ST'],['LW','CAM','RW'],['CDM','CDM'],['LB','CB','CB','RB'],['GK']],'3-5-2':[['ST','ST'],['LM','CM','CM','CM','RM'],['CB','CB','CB'],['GK']],'3-4-3':[['LW','ST','RW'],['LM','CM','CM','RM'],['CB','CB','CB'],['GK']],'4-1-2-1-2':[['ST','ST'],['CAM'],['CM','CM'],['CDM'],['LB','CB','CB','RB'],['GK']],'4-5-1':[['ST'],['LM','CM','CAM','CM','RM'],['LB','CB','CB','RB'],['GK']],'5-3-2':[['ST','ST'],['CM','CM','CM'],['LWB','CB','CB','CB','RWB'],['GK']],'5-2-3':[['LW','ST','RW'],['CM','CM'],['LWB','CB','CB','CB','RWB'],['GK']]};");

s = s.replace(/function Search\(\{slot,used,onPick,onClose\}\)/, 'function Search({slot,used,banned=[],onPick,onClose})');
s = s.replace('PLAYERS.filter(p=>!used.has(p.id)).filter(p=>!cq||clean(`${p.name} ${p.short} ${p.club} ${p.country} ${(p.pos||[]).join(\' \')}`).includes(cq))', 'PLAYERS.filter(p=>!used.has(p.id)&&!banned.includes(p.id)&&p.pos.includes(slot?.pos)).filter(p=>!cq||clean(`${p.name} ${p.short} ${p.club} ${p.country} ${(p.pos||[]).join(\' \')}`).includes(cq))');
s = s.replace('<small>{p.rating}</small>', '<small>{p.flag}</small>');
s = s.replace('font-size:15px', 'font-size:16px');
s = s.replace('.miniPitch{height:104px;', '.miniPitch{height:64px;');
s = s.replace('.formationChoice{height:auto!important;', '.formationChoice{height:82px!important;');
s = s.replace('<Search slot={slot} used={used} onPick={pickHuman} onClose={()=>setSlot(null)}/>', '<Search slot={slot} used={used} banned={series.banned||[]} onPick={pickHuman} onClose={()=>setSlot(null)}/>');
s = s.replace("[series,setSeries]=useState(readSeries()),[game,setGame]=useState(1);", "[series,setSeries]=useState(()=>({...readSeries(),banned:[],games:1})),[game,setGame]=useState(1);");
s = s.replace("function finish(w){setSeries(s=>{const n=w==='YOU'?{you:s.you+1,cpu:s.cpu}:{you:s.you,cpu:s.cpu+1};saveSeries(n);return n})}", "function finish(w){setSeries(s=>{const ids=[...document.querySelectorAll('.card.filled')].map((_,i)=>'used-'+i);const n=w==='YOU'?{...s,you:s.you+1,banned:[...(s.banned||[]),...ids]}:{...s,cpu:s.cpu+1,banned:[...(s.banned||[]),...ids]};saveSeries({you:n.you,cpu:n.cpu});return n})}");
s = s.replace("function next(){setGame(x=>x+1);setScreen('formation')}", "function next(){if(series.you>=3||series.cpu>=3||(series.games||1)>=5){setSeries({you:0,cpu:0,banned:[],games:1});setGame(1);setScreen('story');return}setSeries(s=>({...s,games:(s.games||1)+1}));setGame(x=>x+1);setScreen('formation')}");
s = s.replace('<button className="hint">Tap a card to pick</button>', '<button className="hint">SERIES YOU {series.you} - CPU {series.cpu}</button>');

fs.writeFileSync(p, s);
console.log('Compact gameplay rules patch applied');
