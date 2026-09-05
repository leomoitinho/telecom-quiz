// ============================================================
// FluTelecom Quiz — Lógica do Jogo (app.js)
// Autor: Wanderley & Claude (Anthropic)
// ============================================================

(function(){
const API='./api.php';
let MISSIONS=[],pid=null,pname=null,plvl=null,score=0;
let prog={},cur=null,Q=[],qp=0,errs=0,wait=false,refOn=false;

const $=id=>document.getElementById(id);
function show(id){['scLogin','scLevel','scRanking','scMenu','scIntro','scQuiz','scSummary'].forEach(s=>$(s).classList.toggle('hidden',s!==id))}
function setScore(s){score=s;$('pill').textContent='pontuação: '+score}

async function api(action,data={}){
  const fd=new FormData();fd.append('action',action);
  Object.entries(data).forEach(([k,v])=>fd.append(k,v));
  const r=await fetch(API,{method:'POST',body:fd});return r.json();
}
async function get(action,params={}){
  const qs=new URLSearchParams({action,...params}).toString();
  const r=await fetch(API+'?'+qs);return r.json();
}

function sw(pin){
  const c=pin.type==='striped'?'s':'l';
  const b=pin.b?`--b:${pin.b};`:'';
  return`<div class="sw ${c}" style="--a:${pin.a};${b}"></div>`;
}
function optHtml(o){
  if(o.port!==undefined)return`<div class="pb">${o.port}</div><span>Porta ${o.port}</span>`;
  if(o.type)return sw(o)+`<span>${o.name}</span>`;
  return`<span>${o.name}</span>`;
}
function nOpts(){return plvl==='junior'?3:plvl==='pleno'?4:5}
function distract(correct,pool){return[...pool].filter(p=>p.name!==correct.name).sort(()=>Math.random()-.5).slice(0,nOpts())}

// ---- CARREGAR MISSÕES ----
async function loadMissions(){
  $('mList').innerHTML='<div class="ld">Carregando missões...</div>';
  const r=await get('get_missions');
  if(r.error){$('mList').innerHTML='<div class="ld" style="color:var(--bd)">Erro ao carregar missões: '+r.error+'</div>';return;}
  MISSIONS=r.missions;
  renderMenu();
}

// ---- LOGIN ----
$('btnLogin').addEventListener('click',async()=>{
  const u=$('inName').value.trim();
  if(u.length<2){alert('Nome com pelo menos 2 caracteres');return;}
  pname=u;show('scLevel');
});
$('inName').addEventListener('keypress',e=>{if(e.key==='Enter')$('btnLogin').click()});

// ---- NÍVEL ----
document.querySelectorAll('[data-lvl]').forEach(btn=>btn.addEventListener('click',async()=>{
  plvl=btn.dataset.lvl;
  const r=await api('login',{username:pname,level:plvl});
  if(r.error){alert('Erro: '+r.error);return;}
  pid=r.player.id;
  const rp=await api('load_progress',{player_id:pid});
  if(!rp.error)prog=rp.progress||{};
  setScore(0);
  $('curPlayer').textContent=pname+' · '+{junior:'👶 Junior',pleno:'💼 Pleno',senior:'🔥 Senior'}[plvl];
  await loadRanking();
  show('scRanking');
}));

// ---- RANKING ----
async function loadRanking(){
  const lbl={junior:'👶 Junior',pleno:'💼 Pleno',senior:'🔥 Senior'};
  $('rkLabel').textContent=lbl[plvl];
  const r=await get('get_ranking',{level:plvl,limit:10});
  const list=$('rkList');
  if(r.error||!r.rankings?.length){
    list.innerHTML='<div style="color:var(--dm);font-family:IBM Plex Mono,monospace;font-size:.85rem;text-align:center">Nenhuma pontuação ainda. Seja o primeiro! 🏆</div>';return;
  }
  const md=['🥇','🥈','🥉'];
  list.innerHTML=r.rankings.map((x,i)=>`<div class="ri"><div>${md[i]||'#'+(i+1)} <strong>${x.username}</strong></div><div style="text-align:right"><div style="color:var(--ac);font-weight:700">${x.score} pts</div><div style="color:var(--dm);font-size:.75rem">⭐ ${x.total_stars||0}</div></div></div>`).join('');
}
$('btnRkCont').addEventListener('click',async()=>{await loadMissions();show('scMenu')});
$('btnChange').addEventListener('click',()=>{pid=null;pname=null;plvl=null;prog={};setScore(0);$('inName').value='';show('scLogin')});

// ---- MENU ----
function renderMenu(){
  const list=$('mList');list.innerHTML='';
  MISSIONS.forEach((m,i)=>{
    const locked=i>0&&!prog[MISSIONS[i-1].id]?.completed;
    const st=prog[m.id]?.stars||0;
    const el=document.createElement('div');
    el.className='mc'+(locked?' lk':'');
    el.innerHTML=`<div><div class="mn">${i+1}. ${m.title}</div><div class="md">${m.short||''}</div></div><div>${locked?'<span style="color:var(--dm);font-family:IBM Plex Mono,monospace;font-size:.85rem">🔒</span>':'<div class="st">'+[1,2,3].map(n=>`<span class="${n<=st?'':'o'}">★</span>`).join('')+'</div>'}</div>`;
    if(!locked)el.addEventListener('click',()=>openIntro(m));
    list.appendChild(el);
  });
}

// ---- INTRO ----
function openIntro(m){
  cur=m;
  const box=$('introBox');
  let h=`<h2>${m.title}</h2><p>${m.intro}</p>`;
  const px=m.positionPrefix||'P';
  if(m.type==='lookup'){
    h+=`<div class="rs"><div class="rl">Painel do rack — você vai ler essas etiquetas durante a fase</div><div class="rg">`;
    m.refData.forEach(e=>h+=`<div class="rpt"><div class="pn">PORTA ${e.port}</div><div class="pi">${e.cableId}</div></div>`);
    h+=`</div></div>`;
  } else if(m.type==='mcq'){
    h+=`<div class="rs"><div class="rl">Cola — disponível durante a fase</div><ul class="cn">${m.colaNotes.map(n=>`<li>${n}</li>`).join('')}</ul></div>`;
  } else if(m.sides){
    m.sides.forEach(side=>{
      h+=`<div class="rs"><div class="rl">${side.label}</div><div class="rf">`;
      side.pins.forEach((p,i)=>h+=`<div class="rfi"><div class="n">${px}${i+1}</div>${side.quiz?`<div class="sw l" style="--a:#213c4f"></div>`:sw(p)}</div>`);
      h+=`</div></div>`;
    });
  }
  box.innerHTML=h;show('scIntro');
}
$('btnStart').addEventListener('click',()=>startMission(cur));
$('btnBack').addEventListener('click',()=>{renderMenu();show('scMenu')});

// ---- QUIZ ----
function buildQ(m){
  if(m.type==='lookup'){
    const all=m.refData.map(r=>({name:'Porta '+r.port,port:r.port}));
    return[...m.refData].sort(()=>Math.random()-.5).map(e=>({sl:'Ordem de serviço',lu:true,ask:`Qual porta atende "${e.room}"?`,ctx:`Cabo: ${e.cableId}`,correct:{name:'Porta '+e.port,port:e.port},pool:all}));
  }
  if(m.type==='mcq'){
    return m.questions.map(q=>({sl:'Conceito',lu:true,ask:q.ask,ctx:q.context||'',correct:{name:q.correct},fixed:q.options.map(name=>({name}))}));
  }
  const q=[];
  m.sides?.forEach(side=>{
    if(!side.quiz)return;
    side.pins.forEach((pin,i)=>q.push({sl:side.label,pi:i,correct:pin,pool:side.pins}));
  });
  return q;
}

function startMission(m){
  Q=buildQ(m);qp=0;errs=0;wait=false;refOn=false;
  const rp=$('refPanel'),rl=$('refLabel'),rg=$('refGrid');
  const px=m.positionPrefix||'P';
  if(m.type==='lookup'){
    rl.textContent='PAINEL DO RACK';rg.className='rg';rg.innerHTML='';
    m.refData.forEach(e=>{const el=document.createElement('div');el.className='rpt';el.innerHTML=`<div class="pn">PORTA ${e.port}</div><div class="pi">${e.cableId}</div>`;rg.appendChild(el)});
    refOn=true;
  } else if(m.type==='mcq'){
    rl.textContent='COLA — conceitos-chave';rg.className='';
    rg.innerHTML=`<ul class="cn">${m.colaNotes.map(n=>`<li>${n}</li>`).join('')}</ul>`;refOn=true;
  } else {
    const fx=m.sides?.find(s=>!s.quiz);
    if(fx){
      rl.textContent='COLA — '+fx.label;rg.className='rg pc';rg.innerHTML='';
      fx.pins.forEach((p,i)=>{const el=document.createElement('div');el.className='rpt pk';el.innerHTML=`<div class="pn">${px}${i+1}</div>${sw(p)}`;rg.appendChild(el)});
      refOn=true;
    }
  }
  show('scQuiz');renderQ();
}

function renderQ(){
  wait=false;
  const item=Q[qp];
  $('qProg').textContent=`pergunta ${qp+1} de ${Q.length}`;
  $('qFill').style.width=Math.round((qp/Q.length)*100)+'%';
  $('qSide').textContent=item.sl||'';
  $('qAsk').textContent=item.lu?item.ask:(cur.pinQuestionText||'Qual fio vai no pino {n}?').replace('{n}',item.pi+1);
  $('qCtx').textContent=item.lu?item.ctx:cur.title;
  $('qFb').textContent='';$('qFb').className='fb';
  const showRef=refOn&&(plvl==='junior'||cur.type==='lookup'||cur.type==='mcq');
  $('refPanel').classList.toggle('hidden',!showRef);
  const opts=item.fixed?[...item.fixed].sort(()=>Math.random()-.5):[item.correct,...distract(item.correct,item.pool)].sort(()=>Math.random()-.5);
  const oc=$('qOpts');oc.innerHTML='';
  opts.forEach(o=>{const b=document.createElement('div');b.className='op';b.innerHTML=optHtml(o);b.addEventListener('click',()=>answ(b,o,item));oc.appendChild(b)});
}

function answ(el,chosen,item){
  if(wait)return;
  if(chosen.name===item.correct.name){
    wait=true;el.classList.add('ok_');
    document.querySelectorAll('.op').forEach(o=>o.classList.add('ds'));
    setScore(score+10);
    $('qFb').textContent='Correto — conexão estabelecida.';$('qFb').className='fb ok_';
    setTimeout(()=>{qp++;qp>=Q.length?finish():renderQ()},700);
  } else {
    errs++;el.classList.add('ng','ds');
    $('qFb').textContent='Errado — confira e tente outra opção.';$('qFb').className='fb ng';
  }
}

async function finish(){
  $('qFill').style.width='100%';
  let st=errs>=3?1:errs>=1?2:3;
  const prev=prog[cur.id];
  prog[cur.id]={stars:prev&&prev.stars>st?prev.stars:st,mistakes:errs,completed:true};
  await api('save_mission',{player_id:pid,mission_id:cur.id,stars:st,mistakes:errs});
  const all=MISSIONS.every(m=>prog[m.id]?.completed);
  if(all){
    const allSt=MISSIONS.map(m=>prog[m.id]?.stars||0);
    await api('finish_game',{player_id:pid,score,all_stars:JSON.stringify(allSt)});
  }
  $('sumTitle').textContent=cur.title;
  $('sumSt').innerHTML=[1,2,3].map(n=>`<span class="${n<=st?'':'o'}">★</span>`).join('');
  let tx=errs===0?'Nenhum erro. Perfeito!':errs+' erro(s) — refaça pra melhorar a nota.';
  if(all)tx+='\n\n🎓 Todas as fases concluídas! Resultado salvo no ranking.';
  $('sumTx').textContent=tx;
  show('scSummary');
}
$('btnRetry').addEventListener('click',()=>startMission(cur));
$('btnMenu').addEventListener('click',()=>{renderMenu();show('scMenu')});

show('scLogin');
})();