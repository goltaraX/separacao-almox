(() => {
'use strict';

const STORAGE_KEY = 'almox-manut-state-v1';
const SESSION_KEY = 'almox-manut-session-v1';
const STATUS_ORDER = ['Aguardando','Em separação','Separado','Entregue'];
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const nowISO = () => new Date().toISOString();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const esc = (value='') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const initials = (name='') => name.trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()).join('') || 'US';
const normalize = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const statusClass = status => `status-${status.replaceAll(' ','-')}`;
const brDate = (iso, withTime=false) => {
  if(!iso) return '—';
  const date = new Date(iso);
  if(Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', withTime ? {dateStyle:'short',timeStyle:'short'} : {dateStyle:'short'}).format(date);
};
const relativeDate = iso => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff/60000);
  if(minutes < 1) return 'agora';
  if(minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes/60);
  if(hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours/24);
  return `há ${days} dia${days>1?'s':''}`;
};
const download = (name, content, type='text/plain;charset=utf-8') => {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:name});
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};

function seedState(){
  const base = [
    {
      id:'SOL-2026-0048', requester:'Thaina Alves', executor:'Ednaldo', activity:'Troca de rolamentos do elevador 20', os:'45001892', type:'Verificação e separação', priority:'Urgente', neededAt:'2026-11-16T15:30:00-03:00', status:'Separado', createdAt:'2026-11-16T11:06:19-03:00', updatedAt:'2026-11-16T11:50:10-03:00', separatedAt:'2026-11-16T11:50:10-03:00', deliveredAt:null, notes:'Confirmar medida do rolamento antes da entrega.',
      items:[{id:uid(),qty:2,unit:'UN',description:'Rolamento 6312 C3',code:'10023456',source:'SAP'},{id:uid(),qty:5,unit:'L',description:'Óleo para redutor ISO VG 220',code:'10044512',source:'SAP'},{id:uid(),qty:2,unit:'M',description:'Papel para junta 1 mm',code:'',source:'CD'}]
    },
    {
      id:'SOL-2026-0047', requester:'Erick Santos', executor:'Erick', activity:'Rosca silo 10', os:'45001875', type:'Verificação e separação', priority:'Normal', neededAt:'2026-11-16T16:00:00-03:00', status:'Separado', createdAt:'2026-11-16T09:18:00-03:00', updatedAt:'2026-11-16T11:00:20-03:00', separatedAt:'2026-11-16T11:00:20-03:00', deliveredAt:null, notes:'',
      items:[{id:uid(),qty:12,unit:'UN',description:'Parafuso sextavado M12 x 50',code:'10012490',source:'SAP'},{id:uid(),qty:12,unit:'UN',description:'Porca travante M12',code:'10012504',source:'SAP'}]
    },
    {
      id:'SOL-2026-0046', requester:'Julio César', executor:'Julio César', activity:'Manutenção preventiva elevadores 009 e 010', os:'45001861', type:'Programada', priority:'Programada', neededAt:'2026-11-17T08:00:00-03:00', status:'Em separação', createdAt:'2026-11-15T14:20:00-03:00', updatedAt:'2026-11-16T08:14:00-03:00', separatedAt:null, deliveredAt:null, notes:'Parada programada no primeiro turno.',
      items:[{id:uid(),qty:4,unit:'UN',description:'Correia B-72',code:'10009102',source:'SAP'},{id:uid(),qty:1,unit:'KG',description:'Graxa grau alimentício',code:'',source:'CD'}]
    },
    {
      id:'SOL-2026-0045', requester:'Equipe Elétrica', executor:'Carlos', activity:'Instalação de sensor de nível', os:'45001840', type:'Verificação e separação', priority:'Normal', neededAt:'2026-11-16T17:00:00-03:00', status:'Aguardando', createdAt:'2026-11-16T07:42:00-03:00', updatedAt:'2026-11-16T07:42:00-03:00', separatedAt:null, deliveredAt:null, notes:'',
      items:[{id:uid(),qty:1,unit:'UN',description:'Sensor capacitivo M30',code:'10039002',source:'SAP'},{id:uid(),qty:10,unit:'M',description:'Cabo PP 4 x 1,5 mm²',code:'10035531',source:'SAP'}]
    },
    {
      id:'SOL-2026-0044', requester:'PCM', executor:'Marcos', activity:'Fixação de talha', os:'45001812', type:'Retirada imediata', priority:'Urgente', neededAt:'2026-11-15T12:00:00-03:00', status:'Entregue', createdAt:'2026-11-15T08:05:00-03:00', updatedAt:'2026-11-15T11:48:00-03:00', separatedAt:'2026-11-15T09:10:00-03:00', deliveredAt:'2026-11-15T11:48:00-03:00', notes:'',
      items:[{id:uid(),qty:4,unit:'UN',description:'Chumbador químico M16',code:'10055771',source:'SAP'}]
    }
  ];
  const audit = [];
  base.forEach(r => {
    audit.push({id:uid(),requestId:r.id,type:'created',message:`Solicitação ${r.id} criada por ${r.requester}.`,actor:r.requester,at:r.createdAt});
    if(r.separatedAt) audit.push({id:uid(),requestId:r.id,type:'status',message:`Status alterado para Separado.`,actor:'Almoxarifado',at:r.separatedAt});
    if(r.deliveredAt) audit.push({id:uid(),requestId:r.id,type:'status',message:`Retirada confirmada e solicitação concluída.`,actor:'Almoxarifado',at:r.deliveredAt});
  });
  return {version:1, pin:'2468', requests:base, audit, settings:{teamsWebhook:'',teamsEnabled:false,m365ApiUrl:'',m365Enabled:false,storageMode:'local'}, sequence:49};
}

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved?.requests && saved?.audit) return saved;
  }catch(err){ console.warn('Falha ao carregar dados',err); }
  const fresh = seedState();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(fresh));
  return fresh;
}
let state = loadState();
let session = (()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY))||null}catch{return null}})();
let deferredInstall = null;

function persist(){
  state.settings ||= {};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  updateStorageSummary();
}
function addAudit(requestId,type,message,actor=session?.name||'Sistema'){
  state.audit.push({id:uid(),requestId,type,message,actor,at:nowISO()});
}
function getRequest(id){ return state.requests.find(r=>r.id===id); }
function isAdmin(){ return session?.role==='admin'; }

function toast(title,message='',type='success'){
  const el=document.createElement('div'); el.className=`toast ${type}`;
  el.innerHTML=`<div><b>${esc(title)}</b>${message?`<p>${esc(message)}</p>`:''}</div>`;
  $('#toast-region').appendChild(el);
  setTimeout(()=>el.remove(),4200);
}

function showLogin(){
  $('#app').classList.add('hidden'); $('#login-screen').classList.remove('hidden');
  if(session?.name) $('#login-name').value=session.name;
  setTimeout(()=>$('#login-name').focus(),50);
}
function showApp(){
  $('#login-screen').classList.add('hidden'); $('#app').classList.remove('hidden');
  applyRole(); route(); renderAll();
  if(state.settings?.m365Enabled && state.settings?.m365ApiUrl) syncFromM365(true);
}
function applyRole(){
  const admin=isAdmin();
  $$('.admin-only').forEach(el=>el.classList.toggle('hidden',!admin));
  $('#profile-name').textContent=session.name;
  $('#profile-avatar').textContent=initials(session.name);
  $('#profile-role').textContent=admin?'Almoxarifado':'Solicitante';
  $('#welcome-name').textContent=session.name.split(' ')[0];
  $('#req-requester').value=session.name;
}

function route(){
  let view=location.hash.slice(1)||'dashboard';
  if(!['dashboard','requests','history','reports','settings'].includes(view)) view='dashboard';
  if((view==='reports'||view==='settings')&&!isAdmin()) view='dashboard';
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.nav===view));
  closeSidebar();
  $('#main').focus({preventScroll:true});
  if(view==='reports') renderReports();
  if(view==='settings') renderSettings();
}

function renderAll(){
  renderDashboard(); renderRequests(); renderHistory(); renderReports(); renderSettings();
}
function sortedRequests(){ return [...state.requests].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)); }
function renderDashboard(){
  const waiting=state.requests.filter(r=>['Aguardando','Em separação'].includes(r.status)).length;
  const separated=state.requests.filter(r=>r.status==='Separado').length;
  const now=new Date();
  const delivered=state.requests.filter(r=>r.status==='Entregue'&&new Date(r.deliveredAt||r.updatedAt).getMonth()===now.getMonth()&&new Date(r.deliveredAt||r.updatedAt).getFullYear()===now.getFullYear()).length;
  const times=state.requests.filter(r=>r.separatedAt).map(r=>new Date(r.separatedAt)-new Date(r.createdAt)).filter(v=>v>=0);
  const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length:null;
  $('#stat-waiting').textContent=waiting; $('#stat-separated').textContent=separated; $('#stat-delivered').textContent=delivered;
  $('#stat-average').textContent=avg==null?'—':avg<3600000?`${Math.round(avg/60000)} min`:`${(avg/3600000).toFixed(1).replace('.',',')}h`;
  $('#pending-badge').textContent=waiting;
  const list=$('#dashboard-list'); list.innerHTML='';
  sortedRequests().slice(0,5).forEach(r=>list.appendChild(requestRow(r)));
  if(!state.requests.length) list.innerHTML='<div class="empty-state"><span>+</span><h2>Nenhuma solicitação</h2><p>Crie o primeiro pedido para começar.</p></div>';
}
function requestRow(r){
  const el=document.createElement('article');
  el.className=`request-row ${r.priority==='Urgente'?'urgent':''}`; el.tabIndex=0; el.dataset.id=r.id;
  el.innerHTML=`<i class="priority-line"></i><div class="main-info"><b>${esc(r.activity)}</b><small>${esc(r.id)} • ${r.items.length} ${r.items.length===1?'material':'materiais'}</small></div><div class="secondary-info"><b>${esc(r.executor)}</b><small>Executante</small></div><div class="date-info"><b>${brDate(r.neededAt,true)}</b><small>Necessário até</small></div><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span><span aria-hidden="true">›</span>`;
  el.addEventListener('click',()=>openDetail(r.id)); el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(r.id)}});
  return el;
}
function requestCard(r){
  const el=document.createElement('article'); el.className=`request-card ${r.priority==='Urgente'?'urgent':''}`; el.tabIndex=0;
  el.innerHTML=`<div class="request-card-head"><div><h3>${esc(r.activity)}</h3><span class="id-line">${esc(r.id)} ${r.os?`• OS ${esc(r.os)}`:''}</span></div><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span></div><div class="request-meta"><div><span>Executante</span><b>${esc(r.executor)}</b></div><div><span>Necessário até</span><b>${brDate(r.neededAt,true)}</b></div><div><span>Prioridade</span><b>${esc(r.priority)}</b></div><div><span>Solicitante</span><b>${esc(r.requester)}</b></div></div><div class="request-card-foot"><div class="avatar-stack"><span class="avatar-mini">${esc(initials(r.requester))}</span><span class="avatar-mini">${esc(initials(r.executor))}</span></div><span class="item-count">${r.items.length} ${r.items.length===1?'item':'itens'} • atualizado ${relativeDate(r.updatedAt)}</span></div>`;
  el.addEventListener('click',()=>openDetail(r.id)); el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(r.id)}}); return el;
}
function renderRequests(){
  const q=normalize($('#request-search')?.value||''); const status=$('#request-status-filter')?.value||'all'; const priority=$('#request-priority-filter')?.value||'all';
  const data=sortedRequests().filter(r=>{
    const hay=normalize([r.id,r.activity,r.os,r.requester,r.executor,...r.items.map(i=>i.description)].join(' '));
    return (!q||hay.includes(q))&&(status==='all'||r.status===status)&&(priority==='all'||r.priority===priority);
  });
  const grid=$('#requests-grid'); if(!grid)return; grid.innerHTML=''; data.forEach(r=>grid.appendChild(requestCard(r)));
  $('#requests-empty').classList.toggle('hidden',data.length>0);
}
function renderHistory(){
  if(!$('#history-body'))return;
  const q=normalize($('#history-search').value); const sap=$('#filter-sap').checked; const cd=$('#filter-cd').checked;
  const from=$('#history-from').value?new Date(`${$('#history-from').value}T00:00:00`):null; const to=$('#history-to').value?new Date(`${$('#history-to').value}T23:59:59`):null;
  const data=sortedRequests().filter(r=>{
    const hay=normalize([r.id,r.activity,r.os,r.requester,r.executor,...r.items.flatMap(i=>[i.description,i.code,i.source])].join(' '));
    const d=new Date(r.createdAt); const sourceMatch=(!sap&&!cd)||(sap&&r.items.some(i=>i.source==='SAP'))||(cd&&r.items.some(i=>i.source==='CD'));
    return (!q||hay.includes(q))&&sourceMatch&&(!from||d>=from)&&(!to||d<=to);
  });
  const body=$('#history-body'); body.innerHTML='';
  data.forEach(r=>{
    const sources=[...new Set(r.items.map(i=>i.source))]; const tr=document.createElement('tr');
    tr.innerHTML=`<td><div class="table-main"><b>${esc(r.id)}</b><small>${brDate(r.createdAt,true)}</small></div></td><td><div class="table-main"><b>${esc(r.activity)}</b><small>${r.os?`OS ${esc(r.os)}`:'Sem OS'}</small></div></td><td>${esc(r.requester)}</td><td>${r.items.length} ${r.items.length===1?'item':'itens'}</td><td><div class="source-pills">${sources.map(s=>`<span class="source-pill ${s.toLowerCase()}">${esc(s==='Pendente'?'A definir':s)}</span>`).join('')}</div></td><td><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span></td><td>${brDate(r.updatedAt,true)}</td><td><button class="icon-btn history-open" aria-label="Abrir ${esc(r.id)}">›</button></td>`;
    tr.querySelector('button').addEventListener('click',()=>openDetail(r.id)); body.appendChild(tr);
  });
  $('#history-empty').classList.toggle('hidden',data.length>0);
}
function renderReports(){
  const counts=Object.fromEntries([...STATUS_ORDER,'Cancelado'].map(s=>[s,state.requests.filter(r=>r.status===s).length]));
  const max=Math.max(1,...Object.values(counts));
  if($('#status-bars')) $('#status-bars').innerHTML=Object.entries(counts).map(([s,n])=>`<div class="bar-row"><span>${esc(s)}</span><div class="bar-track"><div class="bar-fill" style="width:${n/max*100}%;background:${s==='Aguardando'?'#d58a19':s==='Em separação'?'#2e84b9':s==='Separado'||s==='Entregue'?'#26956f':'#82909a'}"></div></div><b>${n}</b></div>`).join('');
  const sap=state.requests.flatMap(r=>r.items).filter(i=>i.source==='SAP').length; const cd=state.requests.flatMap(r=>r.items).filter(i=>i.source==='CD').length; const pending=state.requests.flatMap(r=>r.items).filter(i=>i.source==='Pendente').length; const total=sap+cd+pending;
  const sapPct=total?sap/total*100:0, cdPct=total?cd/total*100:0;
  if($('#source-donut')) $('#source-donut').innerHTML=`<div><div class="donut" style="background:conic-gradient(#1975aa 0 ${sapPct}%,#8b59b8 ${sapPct}% ${sapPct+cdPct}%,#dfe5e9 ${sapPct+cdPct}% 100%)"><div class="donut-center"><strong>${total}</strong><span>itens classificados</span></div></div><div class="donut-legend"><span><i style="background:#1975aa"></i>SAP ${sap}</span><span><i style="background:#8b59b8"></i>CD ${cd}</span><span><i style="background:#dfe5e9"></i>A definir ${pending}</span></div></div>`;
  if($('#audit-list')) $('#audit-list').innerHTML=[...state.audit].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,10).map(a=>`<div class="audit-item"><span class="audit-icon">${a.type==='created'?'+':a.type==='source'?'S':'✓'}</span><p><b>${esc(a.requestId)}</b> — ${esc(a.message)}<br><small>por ${esc(a.actor)}</small></p><small>${brDate(a.at,true)}</small></div>`).join('')||'<div class="empty-state"><p>Sem atividade registrada.</p></div>';
}
function renderSettings(){
  if(!$('#teams-webhook'))return;
  $('#teams-webhook').value=state.settings.teamsWebhook||''; $('#teams-enabled').checked=!!state.settings.teamsEnabled; updateStorageSummary();
  $('#m365-api-url').value=state.settings.m365ApiUrl||''; $('#m365-enabled').checked=!!state.settings.m365Enabled;
}
function updateStorageSummary(){
  const bytes=new Blob([JSON.stringify(state)]).size;
  if($('#settings-requests-count')) $('#settings-requests-count').textContent=state.requests.length;
  if($('#settings-events-count')) $('#settings-events-count').textContent=state.audit.length;
  if($('#settings-size')) $('#settings-size').textContent=`${(bytes/1024).toFixed(1).replace('.',',')} KB`;
  if($('#storage-mode-label')) $('#storage-mode-label').textContent=state.settings.m365Enabled?'Microsoft 365':'Neste dispositivo';
}

function nextRequestId(){
  const year=new Date().getFullYear(); const n=state.sequence||1; state.sequence=n+1; return `SOL-${year}-${String(n).padStart(4,'0')}`;
}
function openRequest(){
  $('#request-form').reset(); $('#req-requester').value=session.name;
  const needed=new Date(Date.now()+4*3600000); needed.setMinutes(0,0,0); $('#req-needed').value=new Date(needed.getTime()-needed.getTimezoneOffset()*60000).toISOString().slice(0,16);
  $('#materials-rows').innerHTML=''; addMaterialRow();
  $('#request-dialog').showModal(); setTimeout(()=>$('#req-requester').focus(),50);
}
function addMaterialRow(item={}){
  const row=$('#material-row-template').content.firstElementChild.cloneNode(true); row.dataset.id=item.id||uid();
  $('.item-qty',row).value=item.qty||''; $('.item-unit',row).value=item.unit||'UN'; $('.item-description',row).value=item.description||''; $('.item-code',row).value=item.code||''; $('.item-source',row).value=item.source||'Pendente';
  $('.remove-item',row).addEventListener('click',()=>{ if($$('.material-row',$('#materials-rows')).length<=1){toast('Mantenha pelo menos uma linha','A solicitação precisa de um material.','error');return;} row.remove(); });
  $('#materials-rows').appendChild(row); setTimeout(()=>$('.item-description',row).focus(),0);
}
async function submitRequest(e){
  e.preventDefault();
  const rows=$$('.material-row',$('#materials-rows'));
  const items=rows.map(row=>({id:row.dataset.id,qty:Number($('.item-qty',row).value),unit:$('.item-unit',row).value,description:$('.item-description',row).value.trim(),code:$('.item-code',row).value.trim(),source:$('.item-source',row).value}));
  if(items.some(i=>!i.qty||!i.description)){toast('Revise os materiais','Informe quantidade e descrição em todas as linhas.','error');return;}
  const createdAt=nowISO();
  const req={id:nextRequestId(),requester:$('#req-requester').value.trim(),executor:$('#req-executor').value.trim(),activity:$('#req-activity').value.trim(),os:$('#req-os').value.trim(),type:$('#req-type').value,priority:$('#req-priority').value,neededAt:new Date($('#req-needed').value).toISOString(),status:'Aguardando',createdAt,updatedAt:createdAt,separatedAt:null,deliveredAt:null,notes:$('#req-notes').value.trim(),items};
  state.requests.push(req); addAudit(req.id,'created',`Solicitação criada com ${items.length} ${items.length===1?'material':'materiais'}.`,session.name); persist(); renderAll(); $('#request-dialog').close();
  toast('Solicitação criada',`${req.id} entrou na fila como Aguardando.`); await syncRequestM365(req); await notifyTeams('created',req);
  location.hash='requests'; openDetail(req.id);
}

function statusTimeline(r){
  const current=STATUS_ORDER.indexOf(r.status); if(r.status==='Cancelado') return '<div class="empty-state"><span>×</span><h2>Solicitação cancelada</h2><p>Consulte a auditoria para detalhes.</p></div>';
  return `<div class="timeline">${STATUS_ORDER.map((s,i)=>`<div class="timeline-step ${i<current?'done':i===current?'active':''}"><span class="timeline-dot">${i<current?'✓':i+1}</span><b>${esc(s)}</b><small>${i===0?brDate(r.createdAt,true):i===2&&r.separatedAt?brDate(r.separatedAt,true):i===3&&r.deliveredAt?brDate(r.deliveredAt,true):''}</small></div>`).join('')}</div>`;
}
function openDetail(id){
  const r=getRequest(id); if(!r)return;
  const sources=r.items.map(i=>i.source);
  const adminControl=isAdmin()?`<div class="admin-status-box"><div><h3>Controle do almoxarifado</h3><p>Este controle é visível apenas no perfil Almoxarifado.</p></div><div class="admin-status-actions"><select id="detail-status">${[...STATUS_ORDER,'Cancelado'].map(s=>`<option ${s===r.status?'selected':''}>${esc(s)}</option>`).join('')}</select><button id="confirm-status" class="btn btn-primary">Confirmar</button></div></div>`:'';
  const materialRows=r.items.map(i=>`<div class="detail-material" data-item-id="${esc(i.id)}"><b>${esc(i.qty)}</b><span>${esc(i.unit)}</span><div><b>${esc(i.description)}</b><small style="display:block;color:#7d8b96">${i.code?`SAP ${esc(i.code)}`:'Sem código informado'}</small></div><span>${esc(i.code||'—')}</span><div class="source-checkboxes"><label title="Estoque SAP"><input type="checkbox" data-source="SAP" ${i.source==='SAP'?'checked':''} ${isAdmin()?'':'disabled'}> SAP</label><label title="Compra direta"><input type="checkbox" data-source="CD" ${i.source==='CD'?'checked':''} ${isAdmin()?'':'disabled'}> CD</label></div></div>`).join('');
  const audit=state.audit.filter(a=>a.requestId===r.id).sort((a,b)=>new Date(b.at)-new Date(a.at));
  $('#detail-content').innerHTML=`<div class="detail-top"><div class="detail-topline"><div><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span><h2>${esc(r.activity)}</h2><div class="detail-sub"><span>${esc(r.id)}</span><span>${r.os?`OS ${esc(r.os)}`:'Sem OS'}</span><span>${esc(r.priority)}</span><span>Criada em ${brDate(r.createdAt,true)}</span></div></div><button class="icon-btn" id="close-detail" aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div><div class="detail-body"><section class="detail-section"><h3>Andamento</h3>${statusTimeline(r)}</section>${adminControl}<section class="detail-section"><h3>Dados da solicitação</h3><div class="request-meta"><div><span>Solicitante</span><b>${esc(r.requester)}</b></div><div><span>Executante</span><b>${esc(r.executor)}</b></div><div><span>Tipo</span><b>${esc(r.type)}</b></div><div><span>Necessário até</span><b>${brDate(r.neededAt,true)}</b></div></div></section><section class="detail-section"><h3>Materiais (${r.items.length})</h3><div class="detail-material" style="color:#7d8b96;text-transform:uppercase;font-size:8px"><b>Qtd.</b><span>Un.</span><b>Descrição</b><span>Código</span><span>Origem SAP / CD</span></div>${materialRows}${isAdmin()?'<small style="display:block;margin-top:10px;color:#687786">Marque SAP ou CD. As opções são exclusivas e salvam automaticamente.</small>':''}</section>${r.notes?`<section class="detail-section"><h3>Observações</h3><p class="detail-notes">${esc(r.notes)}</p></section>`:''}<section class="detail-section"><h3>Últimas movimentações</h3>${audit.slice(0,6).map(a=>`<div class="audit-item"><span class="audit-icon">${a.type==='created'?'+':a.type==='source'?'S':'✓'}</span><p>${esc(a.message)}<br><small>${esc(a.actor)}</small></p><small>${brDate(a.at,true)}</small></div>`).join('')}</section></div><div class="detail-foot"><button id="copy-summary" class="btn btn-secondary">Copiar resumo</button><button id="print-request" class="btn btn-secondary">Imprimir</button><button id="close-detail-foot" class="btn btn-primary">Fechar</button></div>`;
  $('#close-detail').onclick=$('#close-detail-foot').onclick=()=>$('#detail-dialog').close();
  $('#copy-summary').onclick=()=>copySummary(r); $('#print-request').onclick=()=>window.print();
  if(isAdmin()){
    $('#confirm-status').onclick=()=>updateStatus(r.id,$('#detail-status').value);
    $$('.source-checkboxes input',$('#detail-content')).forEach(cb=>cb.addEventListener('change',()=>updateItemSource(r.id,cb.closest('.detail-material').dataset.itemId,cb.dataset.source,cb.checked)));
  }
  $('#detail-dialog').showModal();
}
async function updateStatus(id,newStatus){
  const r=getRequest(id); if(!r||newStatus===r.status){toast('Nenhuma alteração','Selecione um status diferente.','error');return;}
  const old=r.status; r.status=newStatus; r.updatedAt=nowISO();
  if(newStatus==='Separado'&&!r.separatedAt) r.separatedAt=r.updatedAt;
  if(newStatus==='Entregue'&&!r.deliveredAt) r.deliveredAt=r.updatedAt;
  addAudit(r.id,'status',`Status alterado de ${old} para ${newStatus}.`); persist(); renderAll(); openDetail(id);
  toast('Status atualizado',`${r.id}: ${newStatus}.`); await syncRequestM365(r); await notifyTeams('status',r,{oldStatus:old});
}
async function updateItemSource(requestId,itemId,source,checked){
  const r=getRequest(requestId); const item=r?.items.find(i=>i.id===itemId); if(!item)return;
  item.source=checked?source:'Pendente'; r.updatedAt=nowISO(); addAudit(r.id,'source',`${item.description}: origem definida como ${item.source==='Pendente'?'A definir':item.source}.`); persist(); renderAll(); openDetail(requestId); toast('Origem atualizada',`${item.description}: ${item.source}.`); await syncRequestM365(r);
}

async function callM365(action, payload={}){
  const url=state.settings?.m365ApiUrl;
  if(!state.settings?.m365Enabled || !url) return null;
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,actor:session?.name||'Sistema',...payload})});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const text=await response.text();
  return text ? JSON.parse(text) : {};
}
async function syncRequestM365(request){
  if(!state.settings?.m365Enabled || !state.settings?.m365ApiUrl) return;
  try{
    await callM365('upsert',{request,audit:state.audit.filter(a=>a.requestId===request.id)});
    state.settings.storageMode='m365'; persist();
  }catch(err){
    console.error(err); toast('Salvo neste dispositivo','A sincronização com o Microsoft 365 falhou; tente novamente nas configurações.','error');
  }
}
async function syncFromM365(silent=false){
  if(!state.settings?.m365Enabled || !state.settings?.m365ApiUrl){ if(!silent) toast('Conexão não configurada','Informe a URL da API do Workflow.','error'); return; }
  try{
    const data=await callM365('list');
    const remote=Array.isArray(data)?data:data?.requests;
    if(!Array.isArray(remote)) throw new Error('Resposta sem a lista requests');
    const map=new Map(state.requests.map(r=>[r.id,r]));
    remote.forEach(r=>{const local=map.get(r.id);if(!local||new Date(r.updatedAt)>new Date(local.updatedAt))map.set(r.id,r)});
    state.requests=[...map.values()];
    if(Array.isArray(data.audit)) state.audit=[...new Map([...state.audit,...data.audit].map(a=>[a.id,a])).values()];
    state.settings.storageMode='m365'; persist(); renderAll();
    if(!silent) toast('Microsoft 365 sincronizado',`${remote.length} solicitações recebidas.`);
  }catch(err){
    console.error(err); if(!silent) toast('Falha na sincronização',err.message,'error');
  }
}
async function copySummary(r){
  const text=[`${r.id} — ${r.activity}`,`Status: ${r.status}`,`OS: ${r.os||'não informada'}`,`Solicitante: ${r.requester}`,`Executante: ${r.executor}`,'Materiais:',...r.items.map(i=>`- ${i.qty} ${i.unit} — ${i.description}${i.code?` (SAP ${i.code})`:''} [${i.source}]`)].join('\n');
  try{await navigator.clipboard.writeText(text);toast('Resumo copiado','Pronto para colar no Teams.')}catch{download(`${r.id}.txt`,text)}
}

function csvData(){
  const header=['Solicitação','Criada em','Atualizada em','Status','Prioridade','Solicitante','Executante','Atividade','OS','Tipo','Necessário até','Quantidade','Unidade','Material','Código SAP','Origem','Observações'];
  const rows=sortedRequests().flatMap(r=>r.items.map(i=>[r.id,r.createdAt,r.updatedAt,r.status,r.priority,r.requester,r.executor,r.activity,r.os,r.type,r.neededAt,i.qty,i.unit,i.description,i.code,i.source,r.notes]));
  const quote=v=>`"${String(v??'').replaceAll('"','""')}"`; return '\ufeff'+[header,...rows].map(row=>row.map(quote).join(';')).join('\r\n');
}
function exportCSV(){download(`historico-almox-${new Date().toISOString().slice(0,10)}.csv`,csvData(),'text/csv;charset=utf-8');toast('Planilha gerada','O histórico foi exportado em CSV.')}

async function notifyTeams(event,request,extra={}){
  const url=state.settings.teamsWebhook; if(!state.settings.teamsEnabled||!url) return;
  const isCreated=event==='created';
  const title=isCreated?`Nova solicitação ${request.id}`:`Status atualizado: ${request.status}`;
  const body=isCreated?`Solicitação de materiais para “${request.activity}” criada por ${request.requester}.`:`A solicitação ${request.id}, atividade “${request.activity}”, foi alterada de ${extra.oldStatus||'status anterior'} para ${request.status}.`;
  const facts=[{title:'Solicitação',value:request.id},{title:'Atividade',value:request.activity},{title:'Executante',value:request.executor},{title:'OS',value:request.os||'Não informada'},{title:'Status',value:request.status},{title:'Materiais',value:String(request.items.length)}];
  const payload={event,requestId:request.id,title,text:body,status:request.status,activity:request.activity,requester:request.requester,executor:request.executor,os:request.os||'',materials:request.items,occurredAt:nowISO(),type:'message',attachments:[{contentType:'application/vnd.microsoft.card.adaptive',contentUrl:null,content:{$schema:'http://adaptivecards.io/schemas/adaptive-card.json',type:'AdaptiveCard',version:'1.4',body:[{type:'TextBlock',size:'Medium',weight:'Bolder',text:title,wrap:true},{type:'TextBlock',text:body,wrap:true},{type:'FactSet',facts}]}}]};
  try{
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    toast('Teams notificado',title);
  }catch(err){
    console.error(err); toast('Solicitação salva; Teams não confirmou',`Verifique a URL/CORS do Workflow (${err.message}).`,'error');
  }
}

function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#sidebar-backdrop').classList.add('hidden'); $('#menu-button').setAttribute('aria-expanded','false'); }
function bindEvents(){
  $('#login-form').addEventListener('submit',e=>{
    e.preventDefault(); const name=$('#login-name').value.trim(); const role=$('input[name="role"]:checked').value;
    if(role==='admin'&&$('#login-pin').value!==state.pin){toast('PIN incorreto','Use o PIN configurado para o almoxarifado.','error');return;}
    session={name,role}; sessionStorage.setItem(SESSION_KEY,JSON.stringify(session)); showApp();
  });
  $$('input[name="role"]').forEach(r=>r.addEventListener('change',()=>{const admin=$('input[name="role"]:checked').value==='admin';$('#pin-wrap').classList.toggle('hidden',!admin);$('#login-pin').required=admin;}));
  $('#logout-button').addEventListener('click',()=>{sessionStorage.removeItem(SESSION_KEY);session=null;$('#profile-menu').classList.add('hidden');showLogin()});
  $('#switch-profile').addEventListener('click',()=>{sessionStorage.removeItem(SESSION_KEY);session=null;$('#profile-menu').classList.add('hidden');showLogin()});
  $('#profile-button').addEventListener('click',()=>{$('#profile-menu').classList.toggle('hidden');$('#profile-button').setAttribute('aria-expanded',String(!$('#profile-menu').classList.contains('hidden')))});
  document.addEventListener('click',e=>{if(!e.target.closest('.profile-button')&&!e.target.closest('.profile-menu'))$('#profile-menu').classList.add('hidden')});
  window.addEventListener('hashchange',route);
  $$('[data-nav]').forEach(a=>a.addEventListener('click',e=>{const v=e.currentTarget.dataset.nav;if(v){e.preventDefault();location.hash=v;route()}}));
  $$('[data-open-request]').forEach(b=>b.addEventListener('click',openRequest));
  $$('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>$('#request-dialog').close()));
  $('#add-item').addEventListener('click',()=>addMaterialRow()); $('#request-form').addEventListener('submit',submitRequest);
  $('#menu-button').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#sidebar-backdrop').classList.toggle('hidden',!open);$('#menu-button').setAttribute('aria-expanded',String(open))});
  $('#sidebar-backdrop').addEventListener('click',closeSidebar);
  ['request-search','request-status-filter','request-priority-filter'].forEach(id=>$('#'+id).addEventListener('input',renderRequests));
  ['history-search','filter-sap','filter-cd','history-from','history-to'].forEach(id=>$('#'+id).addEventListener('input',renderHistory));
  $('#clear-history-filters').addEventListener('click',()=>{['history-search','history-from','history-to'].forEach(id=>$('#'+id).value='');$('#filter-sap').checked=$('#filter-cd').checked=false;renderHistory()});
  ['history-export','quick-export','reports-export'].forEach(id=>$('#'+id)?.addEventListener('click',exportCSV));
  $('#teams-form').addEventListener('submit',e=>{e.preventDefault();state.settings.teamsWebhook=$('#teams-webhook').value.trim();state.settings.teamsEnabled=$('#teams-enabled').checked;persist();toast('Integração salva','As próximas movimentações usarão esta configuração.')});
  $('#m365-form').addEventListener('submit',e=>{e.preventDefault();state.settings.m365ApiUrl=$('#m365-api-url').value.trim();state.settings.m365Enabled=$('#m365-enabled').checked;state.settings.storageMode=state.settings.m365Enabled?'m365':'local';persist();toast('Conexão salva',state.settings.m365Enabled?'O histórico compartilhado foi ativado.':'O modo local foi mantido.');if(state.settings.m365Enabled)syncFromM365(false)});
  $('#sync-m365').addEventListener('click',()=>{state.settings.m365ApiUrl=$('#m365-api-url').value.trim();state.settings.m365Enabled=$('#m365-enabled').checked;persist();syncFromM365(false)});
  $('#test-teams').addEventListener('click',async()=>{state.settings.teamsWebhook=$('#teams-webhook').value.trim();state.settings.teamsEnabled=true;if(!state.settings.teamsWebhook){toast('Informe uma URL','Cole primeiro a URL do Workflow do Teams.','error');return;}await notifyTeams('test',{id:'TESTE',activity:'Teste de integração Almox',requester:session.name,executor:session.name,os:'',status:'Teste',items:[]})});
  $('#security-form').addEventListener('submit',e=>{e.preventDefault();if($('#current-pin').value!==state.pin){toast('PIN atual incorreto','','error');return;}if($('#new-pin').value!==$('#confirm-pin').value){toast('Os novos PINs não coincidem','','error');return;}state.pin=$('#new-pin').value;persist();e.target.reset();toast('PIN alterado','Use o novo PIN no próximo acesso.')});
  $('#export-json').addEventListener('click',()=>download(`backup-almox-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2),'application/json'));
  $('#import-json').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data.requests)||!Array.isArray(data.audit))throw new Error('Formato inválido');state=data;persist();renderAll();toast('Backup importado',`${state.requests.length} solicitações restauradas.`)}catch(err){toast('Não foi possível importar',err.message,'error')}};reader.readAsText(file)});
  $('#reset-demo').addEventListener('click',()=>{if(!confirm('Restaurar os dados de demonstração? O conteúdo atual será substituído.'))return;state=seedState();persist();renderAll();toast('Demonstração restaurada')});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#install-button').classList.remove('hidden')});
  $('#install-button').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#install-button').classList.add('hidden')});
  [$('#request-dialog'),$('#detail-dialog')].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
}

bindEvents();
if('serviceWorker' in navigator && location.protocol!=='file:') window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
if(session?.name&&session?.role) showApp(); else showLogin();
})();
