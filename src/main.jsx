
import React,{useMemo,useState,useEffect}from"react";
import{createRoot}from"react-dom/client";
import{
MessageCircle,Users,KanbanSquare,BookOpen,BarChart3,Settings,User,Search,Plus,MoreVertical,Phone,
Paperclip,Camera,Send,ArrowLeft,Ticket,StickyNote,Zap,Smile,Monitor,Clock3,PanelRightClose,
PanelRightOpen,Mic,ChevronDown,ChevronUp,CheckCircle2,Circle,Copy,Reply,Star,FilePlus2,X,
ClipboardList,CircleAlert,Keyboard,Pin,AudioLines,FileImage,FileText,Filter,UserPlus,Shield,
Columns3,TimerReset,MoveRight,GripVertical,CalendarClock,History,LayoutDashboard,ChartNoAxesColumnIncreasing,
Gauge,Webhook,MessagesSquare,Workflow,WalletCards,Building2,Bell,Play,Pause,RefreshCw
}from"lucide-react";
import"./styles.css";
import{FEATURES,VERSION}from"./config/features";
import{contacts}from"./data/contacts";
import{initialMessages as seed}from"./data/messages";
import{quickReplies as quick}from"./data/quickReplies";
import{knowledgeBase as kb}from"./data/knowledgeBase";
import{initialTickets as ticketsSeed}from"./data/tickets";

function Avatar({c,small=false}){return <div className={"avatar "+(small?"small ":"")+(c.online?"online":"")}>{c.initials}</div>}
function Badge({children,tone=""}){return <span className={"badge "+tone}>{children}</span>}

function App(){
const[page,setPage]=useState("atendimento");
const[activeId,setActiveId]=useState(1),[query,setQuery]=useState(""),[messages,setMessages]=useState(seed),[draft,setDraft]=useState("");
const[detailsOpen,setDetailsOpen]=useState(true),[mobile,setMobile]=useState("list"),[tab,setTab]=useState("cliente");
const[summaryOpen,setSummaryOpen]=useState(true),[quickOpen,setQuickOpen]=useState(false),[quickCat,setQuickCat]=useState("PDV");
const[finishOpen,setFinishOpen]=useState(false),[searchChat,setSearchChat]=useState(""),[typing,setTyping]=useState(true),[audio,setAudio]=useState(false);
const[supervisor,setSupervisor]=useState(false),[queueFilter,setQueueFilter]=useState("Todos");
const[tickets,setTickets]=useState(ticketsSeed);
const active=contacts.find(c=>c.id===activeId)||contacts[0];
const filtered=useMemo(()=>contacts.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())||c.company.toLowerCase().includes(query.toLowerCase())),[query]);

useEffect(()=>{
  const h=(e)=>{if(e.ctrlKey&&e.key.toLowerCase()==="k"){e.preventDefault();document.querySelector(".search input")?.focus()}if(e.ctrlKey&&e.key==="Enter")send()};
  window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)
},[draft,activeId]);

const send=()=>{const t=draft.trim();if(!t)return;setMessages(m=>({...m,[activeId]:[...(m[activeId]||[]),{id:Date.now(),side:"out",text:t,time:"agora"}]}));setDraft("")};
const note=()=>{const t=window.prompt("Digite a nota interna:");if(!t)return;setMessages(m=>({...m,[activeId]:[...(m[activeId]||[]),{id:Date.now(),side:"note",text:t,time:"equipe"}]}))};
const newTicket=(text="Novo chamado")=>setTickets(t=>[{id:"#"+(2550+t.length),client:active.company,title:text,status:"Novo",priority:active.priority,owner:active.agent,deadline:"Hoje 17:00"},...t]);

const sidebar=[
["atendimento","Atendimento",MessageCircle],
...(FEATURES.management?[["filas","Filas",Columns3]]:[]),
...(FEATURES.tickets?[["kanban","Kanban",KanbanSquare],["tickets","Tickets",Ticket]]:[]),
...(FEATURES.dashboard?[["dashboard","Dashboard",LayoutDashboard],["relatorios","Relatórios",BarChart3]]:[]),
["base","Base",BookOpen],
...(FEATURES.whatsapp?[["whatsapp","WhatsApp",Webhook]]:[]),
];

return <div className="shell">
<aside className="sidebar">
<div className="logo"><MessageCircle/></div>
<nav>{sidebar.map(([k,label,I])=><button className={page===k?"active":""} onClick={()=>setPage(k)} key={k}><I/><small>{label}</small>{k==="atendimento"&&<em>12</em>}</button>)}</nav>
<div className="side-bottom"><button><Settings/><small>Config</small></button><button><User/><small>Perfil</small></button></div>
</aside>

<main className="main">
{page==="atendimento"&&<div className={"workspace "+(detailsOpen?"details-open":"details-closed")}>
<section className={"list-panel "+(mobile==="list"?"mobile-show":"")}>
<div className="list-head">
<div className="title-row"><h1>Conversas</h1><div><button><Plus/></button><button><MoreVertical/></button></div></div>
<div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar conversa (Ctrl+K)"/></div>
<div className="filters"><span className="active">Todas</span><span>Não lidas</span><span>Meus atendimentos</span><span>SLA crítico</span></div>
</div>
<div className="conversations">{filtered.map(c=><button key={c.id} className={"conversation "+(c.id===activeId?"active":"")} onClick={()=>{setActiveId(c.id);setMobile("chat")}}>
<Avatar c={c}/><div className="conv-main"><div className="conv-top"><strong>{c.name}</strong><span>{c.time}</span></div><div className="preview"><span>{c.preview}</span>{c.unread>0&&<b>{c.unread}</b>}</div><div className="waitline"><Clock3/> esperando {c.waiting}{c.hasNote&&<span>• nota interna</span>}</div><div className="tags"><i>{c.sector}</i><i className={(c.priority==="Alta"||c.priority==="Urgente")?"danger":"warning"}>{c.priority}</i><i className="muted">{c.agent.split(" ")[0]}</i><i className="sla">SLA {c.sla}</i></div></div>
</button>)}</div>
</section>

<section className={"chat-panel "+(mobile==="chat"?"mobile-show":"")}>
<header className="chat-head"><button className="mobile-back" onClick={()=>setMobile("list")}><ArrowLeft/></button><Avatar c={active} small/><button className="identity" onClick={()=>{setDetailsOpen(true);setMobile("details")}}><strong>{active.name}</strong><small>{active.online?"online · ":""}{active.company}</small></button><div className="chat-actions">{FEATURES.productivity&&<button onClick={()=>setSearchChat(searchChat?"":" ")}><Search/></button>}<button><Phone/></button><button className="desktop-toggle" onClick={()=>setDetailsOpen(v=>!v)}>{detailsOpen?<PanelRightClose/>:<PanelRightOpen/>}</button><button className="mobile-more" onClick={()=>setMobile("details")}><MoreVertical/></button></div></header>

{FEATURES.productivity&&searchChat!==""&&<div className="chat-search"><Search/><input autoFocus placeholder="Buscar nesta conversa..." onChange={e=>setSearchChat(e.target.value)}/><button onClick={()=>setSearchChat("")}><X/></button></div>}

<div className="statusbar"><span><b className="green">SLA</b> {active.sla}</span><span><b className="orange">24h</b> 18h 42m</span><span><b>Atendente</b> {active.agent}</span><span><b className="red">Prioridade</b> {active.priority}</span>{FEATURES.management&&<span><b>Fila</b> {active.sector}</span>}<button className="finish-btn" onClick={()=>setFinishOpen(true)}><CheckCircle2/>Finalizar</button></div>

<div className="tools"><button className="ticket" onClick={()=>FEATURES.tickets&&setPage("tickets")}><Ticket/>#2541</button><button onClick={()=>{setDetailsOpen(true);setMobile("details")}}>⇄ Transferir</button><button onClick={note}><StickyNote/>Nota</button><button onClick={()=>setQuickOpen(v=>!v)}><Zap/>Respostas rápidas</button><button onClick={()=>setPage("base")}><BookOpen/>Base</button>{FEATURES.productivity&&<button><Pin/>Fixadas</button>}</div>

<section className="messages"><div className="day">HOJE</div><div className={"summary "+(!summaryOpen?"collapsed":"")}><button onClick={()=>setSummaryOpen(v=>!v)}><span><b>☆ Resumo do caso</b><small>Última ação: cliente respondeu · Próximo passo: validar serviço</small></span>{summaryOpen?<ChevronUp/>:<ChevronDown/>}</button>{summaryOpen&&<div><p><b>Problema:</b> erro na tela de vendas.</p><p><b>Última ação:</b> solicitado print e validação local.</p><p><b>Próximo passo:</b> verificar serviço, banco e versão do PDV.</p></div>}</div>
{(messages[activeId]||[]).filter(m=>!searchChat.trim()||m.text.toLowerCase().includes(searchChat.trim().toLowerCase())).map(m=><div key={m.id} className={"bubble-wrap "+m.side}><div className={"bubble "+m.side}>{m.side==="note"&&<b>📝 Nota interna</b>}<span>{m.text}</span><small>{m.time}{m.side==="out"?" ✓✓":""}</small></div>{FEATURES.productivity&&m.side!=="note"&&<div className="msg-actions"><button onClick={()=>setDraft(`Respondendo: ${m.text.slice(0,40)} — `)}><Reply/></button><button onClick={()=>navigator.clipboard?.writeText(m.text)}><Copy/></button><button><Star/></button><button onClick={()=>newTicket(m.text.slice(0,42))}><FilePlus2/></button></div>}</div>)}
{FEATURES.productivity&&typing&&<div className="typing">Maria está digitando<span>•••</span></div>}
</section>

{quickOpen&&<div className="quick-popover"><div className="quick-head"><strong>Respostas rápidas</strong><button onClick={()=>setQuickOpen(false)}><X/></button></div><div className="quick-cats">{Object.keys(quick).map(k=><button className={k===quickCat?"active":""} onClick={()=>setQuickCat(k)} key={k}>{k}</button>)}</div><div className="quick-list">{quick[quickCat].map(q=><button key={q} onClick={()=>{setDraft(q);setQuickOpen(false)}}>{q}</button>)}</div></div>}

<footer className="composer">{FEATURES.productivity&&<button className="plus" title="Anexos"><Plus/></button>}<div className="input"><Smile/><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Digite uma mensagem"/>{FEATURES.productivity&&<><Paperclip/><Camera/></>}</div>{FEATURES.productivity&&<button className={"audio "+(audio?"recording":"")} onClick={()=>setAudio(v=>!v)}>{audio?<Pause/>:<AudioLines/>}</button>}<button className="send" onClick={send}>{draft.trim()?<Send/>:<Mic/>}</button></footer>
</section>

<aside className={"details "+(mobile==="details"?"mobile-show":"")}>
<div className="details-head"><button className="mobile-back" onClick={()=>setMobile("chat")}><ArrowLeft/></button><strong>Dados do cliente</strong></div><div className="profile"><Avatar c={active}/><h2>{active.name}</h2><p>{active.phone} · {active.company}</p></div><div className="quick"><button><MessageCircle/>Mensagem</button><button><Phone/>Ligar</button><button><Monitor/>Remoto</button><button onClick={()=>FEATURES.tickets&&setPage("tickets")}><Ticket/>Chamados</button></div>
<div className="tabs"><button className={tab==="cliente"?"active":""} onClick={()=>setTab("cliente")}>Cliente</button><button className={tab==="pdv"?"active":""} onClick={()=>setTab("pdv")}>PDV</button><button className={tab==="checklist"?"active":""} onClick={()=>setTab("checklist")}>Checklist</button><button className={tab==="historico"?"active":""} onClick={()=>setTab("historico")}>Histórico</button></div>
<div className="detail-scroll">{tab==="cliente"&&<><section><h3>Atendimento atual</h3><label>Responsável<select defaultValue={active.agent}><option>João Silva</option><option>Ana Souza</option><option>Carlos Lima</option></select></label><label>Setor<select defaultValue={active.sector}><option>Suporte</option><option>Financeiro</option><option>Comercial</option><option>Implantação</option></select></label><label>Status<select><option>Em atendimento</option><option>Aguardando cliente</option><option>Aguardando equipe</option><option>Finalizado</option></select></label><label>Prioridade<select defaultValue={active.priority}><option>Alta</option><option>Normal</option><option>Urgente</option></select></label></section><section><h3>Empresa</h3><label>Empresa<input value={active.company} readOnly/></label><label>Telefone<input value={active.phone} readOnly/></label><label>Cidade<input value={active.city} readOnly/></label><label>Plano<input value={active.plan} readOnly/></label></section></>}
{tab==="pdv"&&<section><h3>Ambiente do PDV</h3><label>Versão<input value={active.version} readOnly/></label><label>Terminais<input value={active.terminals} readOnly/></label><label>Banco<input value={active.db} readOnly/></label><label>Licença<select><option>Ativa</option><option>Bloqueada</option><option>Vencida</option></select></label><label>Acesso remoto<input defaultValue="AnyDesk 123 456 789"/></label></section>}
{tab==="checklist"&&<section><h3>Checklist visual</h3>{["Serviço do PDV","Internet / rede","Impressora","Certificado","Banco / servidor","Licença","Versão"].map((x,i)=><label className="check" key={x}><input type="checkbox" defaultChecked={i%2===0}/><span>{x}</span></label>)}</section>}
{tab==="historico"&&<section><h3>Histórico pesquisável</h3><div className="history"><div><b>Hoje</b><span>Erro na tela de vendas</span></div><div><b>12/09/2026</b><span>Impressora sem comunicação</span></div><div><b>03/09/2026</b><span>Atualização do sistema</span></div></div></section>}<section><h3>Observação interna</h3><textarea placeholder="Adicione uma observação..."/></section></div>
</aside>
</div>}

{page==="filas"&&FEATURES.management&&<QueuePage supervisor={supervisor} setSupervisor={setSupervisor} filter={queueFilter} setFilter={setQueueFilter}/>}
{page==="kanban"&&FEATURES.tickets&&<KanbanPage tickets={tickets}/>}
{page==="tickets"&&FEATURES.tickets&&<TicketsPage tickets={tickets} setTickets={setTickets}/>}
{page==="dashboard"&&FEATURES.dashboard&&<DashboardPage/>}
{page==="relatorios"&&FEATURES.dashboard&&<ReportsPage/>}
{page==="base"&&<KnowledgePage/>}
{page==="whatsapp"&&FEATURES.whatsapp&&<WhatsAppPage/>}
</main>

{finishOpen&&<div className="modal-backdrop"><div className="finish-modal"><div className="finish-head"><div><CircleAlert/><span><strong>Finalizar atendimento</strong><small>Registre o resultado antes de encerrar.</small></span></div><button onClick={()=>setFinishOpen(false)}><X/></button></div><label>Motivo<select><option>Resolvido</option><option>Orientação concluída</option><option>Sem retorno</option><option>Encaminhado</option></select></label><label>Solução aplicada<textarea placeholder="Descreva a solução..."/></label>{FEATURES.management&&<label>Categoria<select><option>PDV</option><option>Fiscal</option><option>Impressão</option><option>Financeiro</option></select></label>}<label className="checkline"><input type="checkbox" defaultChecked/> Enviar avaliação</label><div className="modal-actions"><button onClick={()=>setFinishOpen(false)}>Cancelar</button><button className="confirm" onClick={()=>setFinishOpen(false)}>Finalizar</button></div></div></div>}

<div className="version">V{VERSION}</div>
</div>
}

function QueuePage({supervisor,setSupervisor,filter,setFilter}){const sectors=["Todos","Suporte","Financeiro","Comercial","Implantação"];return <div className="page"><div className="page-head"><div><h2>Filas e distribuição</h2><p>Gestão visual da operação por setor e atendente.</p></div><label className="supervisor"><input type="checkbox" checked={supervisor} onChange={e=>setSupervisor(e.target.checked)}/><Shield/>Modo supervisor</label></div><div className="queue-filters">{sectors.map(s=><button className={filter===s?"active":""} onClick={()=>setFilter(s)} key={s}>{s}</button>)}</div><div className="cards-grid">{["Suporte","Financeiro","Comercial","Implantação"].filter(s=>filter==="Todos"||filter===s).map((s,i)=><div className="queue-card" key={s}><div className="queue-head"><strong>{s}</strong><Badge tone={i===0?"danger":"warning"}>{[31,8,5,4][i]} aguardando</Badge></div><div className="agent-row"><span>João Silva</span><b>6 ativos</b></div><div className="agent-row"><span>Ana Souza</span><b>4 ativos</b></div><div className="agent-row"><span>Carlos Lima</span><b>5 ativos</b></div><button className="wide-btn"><UserPlus/>Distribuir automaticamente</button></div>)}</div></div>}

function KanbanPage({tickets}){const cols=["Novo","Em atendimento","Aguardando cliente","Finalizado"];return <div className="page"><div className="page-head"><div><h2>Kanban de chamados</h2><p>Estrutura visual para drag and drop.</p></div><button className="primary"><Plus/>Novo chamado</button></div><div className="kanban">{cols.map(c=><div className="col" key={c}><div className="col-head"><strong>{c}</strong><span>{tickets.filter(t=>t.status===c).length}</span></div>{tickets.filter(t=>t.status===c).map(t=><div className="ticket-card" key={t.id}><div className="drag"><GripVertical/></div><strong>{t.id} · {t.client}</strong><p>{t.title}</p><div className="tags"><i className={t.priority==="Urgente"||t.priority==="Alta"?"danger":"warning"}>{t.priority}</i><i>{t.owner}</i></div><small><CalendarClock/> {t.deadline}</small></div>)}</div>)}</div></div>}

function TicketsPage({tickets,setTickets}){return <div className="page"><div className="page-head"><div><h2>Tickets</h2><p>Chamados ligados às conversas e mensagens.</p></div><button className="primary" onClick={()=>setTickets(t=>[{id:"#2555",client:"Novo cliente",title:"Novo chamado",status:"Novo",priority:"Normal",owner:"Sem responsável",deadline:"A definir"},...t])}><Plus/>Novo</button></div><div className="table"><div className="tr th"><span>ID</span><span>Cliente</span><span>Título</span><span>Status</span><span>Prioridade</span><span>Responsável</span><span>Prazo</span></div>{tickets.map(t=><div className="tr" key={t.id}><span>{t.id}</span><span>{t.client}</span><span>{t.title}</span><span><Badge>{t.status}</Badge></span><span><Badge tone={t.priority==="Urgente"||t.priority==="Alta"?"danger":"warning"}>{t.priority}</Badge></span><span>{t.owner}</span><span>{t.deadline}</span></div>)}</div></div>}

function DashboardPage(){return <div className="page"><div className="page-head"><div><h2>Dashboard</h2><p>Indicadores operacionais do suporte.</p></div><button className="secondary"><RefreshCw/>Atualizar</button></div><div className="metrics">{[["Conversas abertas","42","+12%"],["Acima do SLA","3","atenção"],["1ª resposta","2m 18s","-24%"],["Resolvidos hoje","128","+8%"],["CSAT","4,8","excelente"]].map(([a,b,c])=><div className="metric" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div><div className="dash-grid"><div className="panel"><h3>Fila por setor</h3>{[["Suporte",76],["Financeiro",34],["Comercial",22],["Implantação",16]].map(([n,p])=><div className="bar" key={n}><span>{n}</span><div><i style={{width:p+"%"}}/></div><b>{p}%</b></div>)}</div><div className="panel"><h3>SLA por prioridade</h3>{[["Urgente","5 min"],["Alta","10 min"],["Normal","30 min"],["Baixa","2h"]].map(x=><div className="line" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></div></div>}

function ReportsPage(){return <div className="page"><div className="page-head"><div><h2>Relatórios</h2><p>Visão visual por atendente, setor e período.</p></div><div><button className="secondary"><Filter/>Filtros</button></div></div><div className="reports"><div className="panel"><h3>Atendimentos por atendente</h3>{[["João Silva",38],["Ana Souza",31],["Carlos Lima",26]].map(([n,v])=><div className="bar" key={n}><span>{n}</span><div><i style={{width:v*2+"%"}}/></div><b>{v}</b></div>)}</div><div className="panel"><h3>Tempo médio</h3><div className="big-number">18m 42s</div><small>tempo médio de resolução</small></div><div className="panel"><h3>Clientes com mais chamados</h3>{["Mercado Silva · 12","Mercado Oliveira · 9","Padaria do João · 7"].map(x=><div className="line" key={x}>{x}</div>)}</div></div></div>}

function KnowledgePage(){return <div className="page"><div className="page-head"><div><h2>Base de conhecimento</h2><p>Soluções prontas para o suporte.</p></div><button className="primary"><Plus/>Novo artigo</button></div><div className="kb-grid">{kb.map(([c,t,d])=><div className="kb-card" key={t}><Badge>{c}</Badge><h3>{t}</h3><p>{d}</p><button>Ler artigo</button></div>)}</div></div>}

function WhatsAppPage(){return <div className="page"><div className="page-head"><div><h2>WhatsApp oficial</h2><p>Estrutura visual para Cloud API, templates, custos e automações.</p></div><Badge tone="success">Conectado</Badge></div><div className="wh-grid"><div className="panel"><h3>Conexão</h3><label>Número<input defaultValue="+55 92 99999-9999"/></label><label>WABA<input defaultValue="SeuCRM Suporte"/></label><label>Webhook<input defaultValue="https://seudominio.com/webhook"/></label><button className="primary"><Webhook/>Testar webhook</button></div><div className="panel"><h3>Janela de 24h</h3><div className="big-number">18h 42m</div><small>janela ativa do atendimento selecionado</small><div className="line"><span>Templates disponíveis</span><b>12</b></div><div className="line"><span>Mensagens este mês</span><b>8.420</b></div></div><div className="panel"><h3>Templates</h3>{["Retorno de suporte","Cobrança","Aviso de licença","Agendamento"].map(t=><div className="template" key={t}><MessagesSquare/><span>{t}</span><button><Play/></button></div>)}</div><div className="panel"><h3>Custo estimado</h3><div className="big-number">R$ 248,30</div><small>simulação visual mensal</small><div className="line"><span>Serviço</span><b>R$ 102,20</b></div><div className="line"><span>Utilidade</span><b>R$ 61,10</b></div><div className="line"><span>Marketing</span><b>R$ 85,00</b></div></div><div className="panel"><h3>Automações</h3>{["Boas-vindas","Ausência","Triagem por setor","SLA crítico"].map((x,i)=><label className="switch" key={x}><span>{x}</span><input type="checkbox" defaultChecked={i<3}/></label>)}</div><div className="panel"><h3>Setores</h3>{["Suporte","Financeiro","Comercial","Implantação"].map(x=><div className="line" key={x}><Building2/><span>{x}</span><b>Ativo</b></div>)}</div></div></div>}

createRoot(document.getElementById("root")).render(<App/>);
