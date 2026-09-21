
import{useState}from"react";
import{createRoot}from"react-dom/client";
import{
MessageCircle,KanbanSquare,BookOpen,BarChart3,Settings,User,Columns3,LayoutDashboard,Webhook,Ticket
}from"lucide-react";
import"./styles.css";
import{FEATURES,VERSION}from"./config/features";
import{initialTickets as ticketsSeed}from"./data/tickets";
import{AtendimentoPage}from"./pages/AtendimentoPage";
import{QueuePage}from"./pages/QueuePage";
import{KanbanPage}from"./pages/KanbanPage";
import{TicketsPage}from"./pages/TicketsPage";
import{DashboardPage}from"./pages/DashboardPage";
import{ReportsPage}from"./pages/ReportsPage";
import{KnowledgePage}from"./pages/KnowledgePage";
import{WhatsAppPage}from"./pages/WhatsAppPage";

function App(){
const[page,setPage]=useState("atendimento");
const[tickets,setTickets]=useState(ticketsSeed);

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
{page==="atendimento"&&<AtendimentoPage tickets={tickets} setTickets={setTickets} setPage={setPage}/>}
{page==="filas"&&FEATURES.management&&<QueuePage/>}
{page==="kanban"&&FEATURES.tickets&&<KanbanPage tickets={tickets}/>}
{page==="tickets"&&FEATURES.tickets&&<TicketsPage tickets={tickets} setTickets={setTickets}/>}
{page==="dashboard"&&FEATURES.dashboard&&<DashboardPage/>}
{page==="relatorios"&&FEATURES.dashboard&&<ReportsPage/>}
{page==="base"&&<KnowledgePage/>}
{page==="whatsapp"&&FEATURES.whatsapp&&<WhatsAppPage/>}
</main>

<div className="version">V{VERSION}</div>
</div>
}

createRoot(document.getElementById("root")).render(<App/>);
