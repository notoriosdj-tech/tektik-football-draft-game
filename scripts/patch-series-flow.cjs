const fs = require('fs');
const file = 'src/App.jsx';
let s = fs.readFileSync(file, 'utf8');

s = s.replace("import React, { useMemo, useState } from 'react';", "import React, { useEffect, useMemo, useState } from 'react';");

s = s.replace("const BANNED=[{name:'Messi',pos:'RW',flag:'🇦🇷'},{name:'Cristiano Ronaldo',pos:'ST',flag:'🇵🇹'},{name:'Neymar Jr',pos:'LW',flag:'🇧🇷'}];", "const BANNED=[{name:'Messi',pos:'RW',flag:'🇦🇷'},{name:'Cristiano Ronaldo',pos:'ST',flag:'🇵🇹'},{name:'Neymar Jr',pos:'LW',flag:'🇧🇷'}];\nconst DEFAULT_SERIES={you:0,cpu:0};\nfunction readSeries(){try{const v=JSON.parse(localStorage.getItem('tektik-series-score'));return v&&Number.isFinite(v.you)&&Number.isFinite(v.cpu)?v:DEFAULT_SERIES}catch{return DEFAULT_SERIES}}\nfunction saveSeries(v){try{localStorage.setItem('tektik-series-score',JSON.stringify(v))}catch{}}");

s = s.replace("function Formation({go,formation,setFormation}){return", "function Formation({go,formation,setFormation,series}){return");
s = s.replace("<div className=\"label\">TACTICS ROOM</div><h2>Pick formation</h2>", "<div className=\"setupScore\">SERIES <b>YOU {series.you}</b> - <b>CPU {series.cpu}</b></div><div className=\"label\">TACTICS ROOM</div><h2>Pick formation</h2>");
s = s.replace("<button onClick={()=>go('game')}>ENTER PITCH</button>", "<button onClick={()=>go('game')}>START NEXT GAME</button>");

s = s.replace("const [screen,setScreen]=useState('story'),[difficulty,setDifficulty]=useState('MEDIUM'),[formation,setFormation]=useState('4-4-2'),[gameId,setGameId]=useState(1),[series,setSeries]=useState({you:0,cpu:0});function finish(w){setSeries(s=>w==='YOU'?{...s,you:s.you+1}:{...s,cpu:s.cpu+1})}function next(){setGameId(x=>x+1);setScreen('formation')}", "const [screen,setScreen]=useState('story'),[difficulty,setDifficulty]=useState('MEDIUM'),[formation,setFormation]=useState('4-4-2'),[gameId,setGameId]=useState(1),[series,setSeries]=useState(readSeries);useEffect(()=>saveSeries(series),[series]);function finish(w){setSeries(s=>{const n=w==='YOU'?{you:s.you+1,cpu:s.cpu}:{you:s.you,cpu:s.cpu+1};saveSeries(n);return n})}function next(){setGameId(x=>x+1);setScreen('formation')}");

s = s.replace("<Formation go={setScreen} formation={formation} setFormation={setFormation}/>", "<Formation go={setScreen} formation={formation} setFormation={setFormation} series={series}/>");

s = s.replace(".pitch{position:relative;min-height:0;border:3px solid #ff5f82;border-radius:26px;background:linear-gradient(180deg,#7f2434,#3d111d 65%,#160813);", ".pitch{position:relative;min-height:0;border:3px solid #66f28a;border-radius:26px;background:linear-gradient(180deg,#174d2a,#0b2b19 65%,#06120d);");
s = s.replace(".pitch.cpu{border-color:#66f28a;background:linear-gradient(180deg,#174d2a,#0b2b19 65%,#06120d)}", ".pitch.cpu{border-color:#ff5f82;background:linear-gradient(180deg,#7f2434,#3d111d 65%,#160813)}");
s = s.replace(".pitch.you{color:#ff91a9}", ".pitch.you{color:#66f28a}");
s = s.replace(".pitch.cpu{color:#66f28a}", ".pitch.cpu{color:#ff91a9}");

s = s.replace(".score{height:44px;border:2px solid #26344f;border-radius:18px;background:#071324;display:flex;align-items:center;justify-content:center;gap:22px;text-transform:uppercase;color:#9fb0c7}.score b{font-size:25px;color:#66f28a}", ".score{height:44px;border:2px solid #26344f;border-radius:18px;background:#071324;display:flex;align-items:center;justify-content:center;gap:10px;text-transform:uppercase;color:#9fb0c7}.score b{font-size:15px}.score .green{color:#66f28a}.score .red{color:#ff7b9b}.score i{font-style:normal;color:#9fb0c7}");
s = s.replace("<div className=\"game-score\"><span>Game Score</span><b>{gameScore.you} - {gameScore.cpu}</b></div>", "<div className=\"game-score score\"><span>Match Score</span><b className=\"green\">YOU {gameScore.you}</b><i>-</i><b className=\"red\">CPU {gameScore.cpu}</b></div>");
s = s.replace("<div className=\"score\"><span>Game Score</span><b>{score.you} - {score.cpu}</b></div>", "<div className=\"score\"><span>Match Score</span><b className=\"green\">YOU {score.you}</b><i>-</i><b className=\"red\">CPU {score.cpu}</b></div>");

s += "\n/* series patch active */\n";
fs.writeFileSync(file, s);
console.log('Series flow patch applied');
