const fs=require('fs');
let c=fs.readFileSync('src/App.jsx','utf8');

const identity=`function playerKey(p){return normalize(p?.name||p?.short||p?.id||'')}
function hasPlayer(listOrSet,player){const key=playerKey(player);if(!key)return false;if(listOrSet instanceof Set){for(const item of listOrSet){if(String(item)===String(player?.id)||normalize(item)===key)return true}return false}return (listOrSet||[]).some(item=>String(item)===String(player?.id)||normalize(item)===key)}
function blockedKeysFrom(ids){const s=new Set();(ids||[]).forEach(id=>{s.add(String(id));const p=PLAYERS.find(x=>String(x.id)===String(id)||normalize(x.name)===normalize(id));if(p)s.add(playerKey(p));else s.add(normalize(id));});return s}
function usedKeysFromPlayers(players){const s=new Set();(players||[]).filter(Boolean).forEach(p=>{s.add(String(p.id));s.add(playerKey(p));});return s}
`;

if(!c.includes('function playerKey(p)')){
  c=c.replace("function family(pos){return Object.entries(FAMILIES).find(([,v])=>v.includes(pos))?.[0]||'MID'}", "function family(pos){return Object.entries(FAMILIES).find(([,v])=>v.includes(pos))?.[0]||'MID'}\n"+identity);
}

// De-dupe database by normalized name, not only ID.
c=c.replace(
  "const PLAYERS = [...BASE_PLAYERS,...EXTRA_PLAYERS].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).sort((a,b)=>b.rating-a.rating);",
  "const PLAYERS = [...BASE_PLAYERS,...EXTRA_PLAYERS].filter((x,i,a)=>a.findIndex(y=>normalize(y.name)===normalize(x.name))===i).sort((a,b)=>b.rating-a.rating);"
);

// Make CPU block by ID and normalized name.
c=c.replace(
  "const blocked=new Set([...banned,...drafted]);const available=PLAYERS.filter(p=>!blocked.has(p.id));",
  "const blocked=new Set([...blockedKeysFrom(banned),...blockedKeysFrom(drafted)]);const available=PLAYERS.filter(p=>!blocked.has(String(p.id))&&!blocked.has(playerKey(p)));"
);

// Make search unavailable block by ID and normalized name.
c=c.replace(
  "return PLAYERS.filter(p=>!unavailable.has(p.id)).filter(p=>!q||normalize(`${p.name} ${p.short} ${p.id}`).includes(q))",
  "return PLAYERS.filter(p=>!unavailable.has(p.id)&&!unavailable.has(playerKey(p))).filter(p=>!q||normalize(`${p.name} ${p.short} ${p.id}`).includes(q))"
);

// Make drafted set include IDs and normalized names.
c=c.replace(
  "const drafted=useMemo(()=>new Set([...Object.values(human),...Object.values(cpu)].map(p=>p.id)),[human,cpu]); const unavailable=useMemo(()=>new Set([...banned,...Object.values(cpu).map(p=>p.id)]),[banned,cpu]);",
  "const drafted=useMemo(()=>usedKeysFromPlayers([...Object.values(human),...Object.values(cpu)]),[human,cpu]); const unavailable=useMemo(()=>new Set([...blockedKeysFrom(banned),...usedKeysFromPlayers(Object.values(cpu))]),[banned,cpu]);"
);

// Make already drafted list include IDs and normalized names before CPU pick.
c=c.replace(
  "const already=[...Object.values(h),...Object.values(currentCpu)].map(p=>p.id);",
  "const already=[...usedKeysFromPlayers([...Object.values(h),...Object.values(currentCpu)])];"
);

// Human pick duplicate check by identity.
c=c.replace(
  "if(!selected||result||champion||drafted.has(player.id)||banned.includes(player.id))return;",
  "if(!selected||result||champion||drafted.has(player.id)||drafted.has(playerKey(player))||hasPlayer(banned,player))return;"
);

// Autofill blocked list should include names too.
c=c.replace(
  "let h={...human}, c={...cpu}, blocked=[...drafted];",
  "let h={...human}, c={...cpu}, blocked=[...drafted];"
);

fs.writeFileSync('src/App.jsx',c);
console.log('Patched duplicate player blocking by normalized name');
