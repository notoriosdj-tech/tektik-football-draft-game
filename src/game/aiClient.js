const DEFAULT_TIMEOUT_MS=9000;

function endpoint(name){
  const key=name.replace(/-/g,'_').toUpperCase();
  const specific=import.meta.env[`VITE_AI_${key}_URL`];
  if(specific)return specific;
  const base=import.meta.env.VITE_AI_BASE_URL;
  if(base)return `${base.replace(/\/$/,'')}/api/${name}`;
  return `/api/${name}`;
}

async function postJson(url,payload,timeoutMs=DEFAULT_TIMEOUT_MS){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    if(!res.ok)throw new Error(`AI endpoint failed: ${res.status}`);
    return await res.json();
  }finally{
    clearTimeout(timer);
  }
}

function simplePlayer(p){
  if(!p)return null;
  return {id:p.id,canonicalId:p.canonicalId||p.id,name:p.name,short:p.short||p.shortName||p.name,country:p.country,flag:p.flag,club:p.club,rating:p.rating,pos:p.pos||p.primaryPositions||[],primaryPositions:p.primaryPositions||p.pos||[],secondaryPositions:p.secondaryPositions||[],roles:p.roles||[],traits:p.traits||{}};
}

export function serializeTeam(team){
  return Object.entries(team||{}).filter(([,p])=>p).map(([slot,p])=>({slot,position:String(slot).split('-')[0],player:simplePlayer(p)}));
}

function validCpuPick(result,available){
  if(!result||typeof result!=='object')return null;
  const id=result.pickId||result.id||result.canonicalId;
  if(!id)return null;
  return available.find(p=>p.id===id||p.canonicalId===id)||null;
}

export async function requestAiCpuPick({slot,availablePlayers,cpuTeam,userTeam,formation,difficulty,series,banned}){
  if(!availablePlayers?.length)return null;
  const topAvailable=availablePlayers.slice(0,40).map(simplePlayer);
  const payload={slot,formation,difficulty,series,banned,availablePlayers:topAvailable,cpuTeam:serializeTeam(cpuTeam),userTeam:serializeTeam(userTeam)};
  try{
    const data=await postJson(endpoint('cpu-pick'),payload,8000);
    return validCpuPick(data,availablePlayers);
  }catch(err){
    console.warn('AI CPU fallback:',err?.message||err);
    return null;
  }
}

function normalizeMinutes(minutes){
  if(!Array.isArray(minutes))return null;
  const out=minutes.map(m=>{
    if(Array.isArray(m)&&m.length>=2)return [String(m[0]),String(m[1])];
    if(m&&typeof m==='object')return [String(m.minute||''),String(m.description||m.event||'')];
    return null;
  }).filter(Boolean).filter(m=>m[0]&&m[1]).slice(0,10);
  return out.length>=4?out:null;
}

function validateAiReferee(data,localFallback){
  if(!data||typeof data!=='object')return null;
  const winner=data.winner==='CPU'?'CPU':data.winner==='YOU'?'YOU':null;
  if(!winner)return null;
  const score=data.score||{};
  const you=Number(score.you),cpu=Number(score.cpu);
  if(!Number.isFinite(you)||!Number.isFinite(cpu))return null;
  if(winner==='YOU'&&you<=cpu)return null;
  if(winner==='CPU'&&cpu<=you)return null;
  const minutes=normalizeMinutes(data.minutes||data.matchMinutes);
  if(!minutes)return null;
  const explanation=String(data.explanation||data.refereeVerdict||data.verdict||'').trim();
  if(explanation.length<40)return null;
  return {...localFallback,winner,score:{you,cpu},minutes,explanation,aiPowered:true,headline:data.headline||'',fairnessNote:data.fairnessNote||''};
}

export async function requestAiReferee({localResult,teamName,formation,difficulty,series,userTeam,cpuTeam,bannedPlayers}){
  const payload={teamName,formation,difficulty,series,bannedPlayers,userTeam:serializeTeam(userTeam),cpuTeam:serializeTeam(cpuTeam),localResult:{winner:localResult.winner,score:localResult.score,explanation:localResult.explanation,minutes:localResult.minutes}};
  try{
    const data=await postJson(endpoint('referee'),payload,12000);
    return validateAiReferee(data,localResult)||localResult;
  }catch(err){
    console.warn('AI referee fallback:',err?.message||err);
    return localResult;
  }
}
