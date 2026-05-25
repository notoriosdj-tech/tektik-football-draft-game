const MODEL=process.env.OPENAI_MODEL||'gpt-4.1-mini';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin',process.env.ALLOWED_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

function safeJson(text){try{return JSON.parse(text)}catch{return null}}

function systemPrompt(){return `You are the AI referee for TEK-Tik Football Draft, a football draft strategy game.
You must judge the match fairly using football logic, not fame alone.
Evaluate position fit, formation balance, midfield control, defensive structure, chance creation, finishing, goalkeeper impact, tactical matchups, and out-of-position risks.
Return ONLY valid JSON. No markdown. No prose outside JSON.
Do not mention players who are not present in the submitted userTeam or cpuTeam.
Do not invent unavailable players.
The match must have one winner: YOU or CPU.
The score must match the winner.
Provide realistic match minutes with tactical causes.`}

function userPrompt(body){return JSON.stringify({task:'Decide the TEK-Tik match and generate premium referee analysis.',constraints:{winnerOnly:['YOU','CPU'],minutes:'4 to 8 events, realistic football timing, use only drafted players when naming players',tone:'concise but tactical, mobile game friendly'},match:body},null,2)}

function validate(data){
  if(!data||typeof data!=='object')return null;
  const winner=data.winner==='CPU'?'CPU':data.winner==='YOU'?'YOU':null;
  if(!winner)return null;
  const score=data.score||{};
  const you=Number(score.you),cpu=Number(score.cpu);
  if(!Number.isFinite(you)||!Number.isFinite(cpu))return null;
  if(winner==='YOU'&&you<=cpu)return null;
  if(winner==='CPU'&&cpu<=you)return null;
  const minutes=Array.isArray(data.minutes)?data.minutes:[];
  if(minutes.length<4)return null;
  const normalized=minutes.slice(0,8).map(m=>Array.isArray(m)?[String(m[0]||''),String(m[1]||'')]:[String(m.minute||''),String(m.description||m.event||'')]).filter(m=>m[0]&&m[1]);
  if(normalized.length<4)return null;
  const explanation=String(data.explanation||data.refereeVerdict||data.verdict||'').trim();
  if(explanation.length<40)return null;
  return {winner,score:{you,cpu},headline:String(data.headline||''),explanation,minutes:normalized,fairnessNote:String(data.fairnessNote||''),aiPowered:true};
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:'OPENAI_API_KEY missing'});
  try{
    const body=req.body||{};
    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({
        model:MODEL,
        temperature:0.45,
        messages:[
          {role:'system',content:systemPrompt()},
          {role:'user',content:userPrompt(body)}
        ],
        response_format:{type:'json_object'}
      })
    });
    if(!response.ok){const t=await response.text();return res.status(502).json({error:'OpenAI request failed',details:t.slice(0,300)})}
    const json=await response.json();
    const content=json.choices?.[0]?.message?.content||'';
    const parsed=safeJson(content);
    const valid=validate(parsed);
    if(!valid)return res.status(422).json({error:'Invalid AI referee response'});
    return res.status(200).json(valid);
  }catch(err){
    return res.status(500).json({error:'AI referee failed',details:String(err?.message||err)});
  }
}
