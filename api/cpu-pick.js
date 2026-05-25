const MODEL=process.env.OPENAI_MODEL||'gpt-4.1-mini';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin',process.env.ALLOWED_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

function safeJson(text){try{return JSON.parse(text)}catch{return null}}

function systemPrompt(){return `You are the AI CPU manager for TEK-Tik Football Draft.
Your job is to choose ONE legal player from availablePlayers.
Think like a sophisticated football draft opponent.
Prioritize formation fit, position fit, scarcity, tactical balance, role coverage, opponent denial, and long-term series strategy.
Do not choose unavailable players.
Do not invent players.
Return ONLY valid JSON. No markdown. No prose outside JSON.`}

function userPrompt(body){return JSON.stringify({task:'Choose the best CPU pick for this draft turn.',rules:{output:'Return exactly one pickId from availablePlayers',style:'smart football reasoning',difficulty:body.difficulty},context:body},null,2)}

function validate(data,available){
  if(!data||typeof data!=='object')return null;
  const id=String(data.pickId||data.id||data.canonicalId||'');
  if(!id)return null;
  const pick=available.find(p=>p.id===id||p.canonicalId===id);
  if(!pick)return null;
  return {pickId:pick.id,canonicalId:pick.canonicalId||pick.id,reason:String(data.reason||data.explanation||''),strategy:String(data.strategy||'')};
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:'OPENAI_API_KEY missing'});
  try{
    const body=req.body||{};
    const available=Array.isArray(body.availablePlayers)?body.availablePlayers:[];
    if(!available.length)return res.status(400).json({error:'availablePlayers missing'});
    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({
        model:MODEL,
        temperature:0.25,
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
    const valid=validate(parsed,available);
    if(!valid)return res.status(422).json({error:'Invalid AI CPU pick response'});
    return res.status(200).json(valid);
  }catch(err){
    return res.status(500).json({error:'AI CPU pick failed',details:String(err?.message||err)});
  }
}
