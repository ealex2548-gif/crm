
import{useState}from"react";
import{createRoot}from"react-dom/client";
import{
MessageCircle,KanbanSquare,BookOpen,BarChart3,Settings,Columns3,LayoutDashboard,Webhook,Ticket,LogOut,ShieldCheck
}from"lucide-react";
import"./styles.css";
import{FEATURES,VERSION}from"./config/features";
import{useTickets}from"./hooks/useTickets";
import{AuthProvider,useAuth}from"./contexts/AuthContext";
import{LoginPage}from"./pages/LoginPage";
import{AtendimentoPage}from"./pages/AtendimentoPage";
import{QueuePage}from"./pages/QueuePage";
import{KanbanPage}from"./pages/KanbanPage";
import{TicketsPage}from"./pages/TicketsPage";
import{DashboardPage}from"./pages/DashboardPage";
import{ReportsPage}from"./pages/ReportsPage";
import{KnowledgePage}from"./pages/KnowledgePage";
import{WhatsAppPage}from"./pages/WhatsAppPage";
import{AdminPage}from"./pages/AdminPage";

function Root(){
const{user,loading,logout}=useAuth();
if(loading)return null;
if(!user)return <LoginPage/>;
return <App user={user} onLogout={logout}/>;
}

function App({user,onLogout}){
const[page,setPage]=useState("atendimento");
const{tickets,createTicket,updateTicketStatus,loading:ticketsLoading}=useTickets();
const canSeeAdmin=user.role==="ADMIN"||user.role==="SUPERVISOR";

const sidebar=[
["atendimento","Atendimento",MessageCircle],
...(FEATURES.management?[["filas","Filas",Columns3]]:[]),
...(FEATURES.tickets?[["kanban","Kanban",KanbanSquare],["tickets","Tickets",Ticket]]:[]),
...(FEATURES.dashboard?[["dashboard","Dashboard",LayoutDashboard],["relatorios","Relatórios",BarChart3]]:[]),
["base","Base",BookOpen],
...(FEATURES.whatsapp?[["whatsapp","WhatsApp",Webhook]]:[]),
...(canSeeAdmin?[["admin","Administração",ShieldCheck]]:[]),
];

return <div className="shell">
<aside className="sidebar">
<div className="logo"><MessageCircle/></div>
<nav>{sidebar.map(([k,label,I])=><button className={page===k?"active":""} onClick={()=>setPage(k)} key={k}><I/><small>{label}</small>{k==="atendimento"&&<em>12</em>}</button>)}</nav>
<div className="side-bottom"><button title={user.name}><Settings/><small>Config</small></button><button onClick={onLogout} title={`Sair (${user.name})`}><LogOut/><small>Sair</small></button></div>
</aside>

<main className="main">
{page==="atendimento"&&<AtendimentoPage user={user} createTicket={createTicket} setPage={setPage}/>}
{page==="filas"&&FEATURES.management&&<QueuePage/>}
{page==="kanban"&&FEATURES.tickets&&<KanbanPage tickets={tickets} updateTicketStatus={updateTicketStatus}/>}
{page==="tickets"&&FEATURES.tickets&&<TicketsPage tickets={tickets} createTicket={createTicket} updateTicketStatus={updateTicketStatus}/>}
{page==="dashboard"&&FEATURES.dashboard&&<DashboardPage/>}
{page==="relatorios"&&FEATURES.dashboard&&<ReportsPage/>}
{page==="base"&&<KnowledgePage/>}
{page==="whatsapp"&&FEATURES.whatsapp&&<WhatsAppPage/>}
{page==="admin"&&canSeeAdmin&&<AdminPage user={user}/>}
</main>

<div className="version">V{VERSION}</div>
</div>
}

createRoot(document.getElementById("root")).render(<AuthProvider><Root/></AuthProvider>);
