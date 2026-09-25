
import{useState}from"react";
import{createRoot}from"react-dom/client";
import{
Menu,MessageCircle,KanbanSquare,BookOpen,BarChart3,Settings,Columns3,LayoutDashboard,Webhook,Ticket,LogOut,ShieldCheck
}from"lucide-react";
import"./styles.css";
import{FEATURES,VERSION}from"./config/features";
import{useTickets}from"./hooks/useTickets";
import{useUnreadTotal}from"./hooks/useUnreadTotal";
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
import{ProfileModal}from"./components/ProfileModal";

function Root(){
const{user,loading,logout}=useAuth();
if(loading)return null;
if(!user)return <LoginPage/>;
return <App user={user} onLogout={logout}/>;
}

function App({user,onLogout}){
const[page,setPage]=useState("atendimento");
const[profileOpen,setProfileOpen]=useState(false);
const[moreOpen,setMoreOpen]=useState(false);
// Celular = versão enxuta para a recepção: só Conversas no menu inferior; o resto em "Mais".
const MOBILE_PRIMARY=["atendimento"];
const{tickets,createTicket,updateTicketStatus,loading:ticketsLoading}=useTickets();
const unreadTotal=useUnreadTotal();
const canSeeAdmin=user.role==="ADMIN"||user.role==="SUPERVISOR";
// Atendente só atende: fica com Atendimento, Filas, Kanban e Base.
// Gestão de tickets em tabela, métricas e configuração ficam pra
// Supervisor/Admin.
const canSeeManagement=user.role!=="AGENT";
const ticketsPageTarget=canSeeManagement?"tickets":"kanban";

const sidebar=[
["atendimento","Atendimento",MessageCircle],
...(FEATURES.management?[["filas","Filas",Columns3]]:[]),
...(FEATURES.tickets?[["kanban","Kanban",KanbanSquare],...(canSeeManagement?[["tickets","Tickets",Ticket]]:[])]:[]),
...(FEATURES.dashboard&&canSeeManagement?[["dashboard","Dashboard",LayoutDashboard],["relatorios","Relatórios",BarChart3]]:[]),
["base","Base",BookOpen],
...(FEATURES.whatsapp&&canSeeManagement?[["whatsapp","WhatsApp",Webhook]]:[]),
...(canSeeAdmin?[["admin","Administração",ShieldCheck]]:[]),
];

return <div className="shell">
<aside className="sidebar">
<div className="logo"><MessageCircle/></div>
<nav>{sidebar.map(([k,label,I])=><button className={page===k?"active":""} onClick={()=>setPage(k)} key={k}><I/><small>{label}</small>{k==="atendimento"&&unreadTotal>0&&<em>{unreadTotal>99?"99+":unreadTotal}</em>}</button>)}</nav>
<div className="side-bottom"><button title={user.name} onClick={()=>setProfileOpen(true)}><Settings/><small>Config</small></button><button onClick={onLogout} title={`Sair (${user.name})`}><LogOut/><small>Sair</small></button></div>
</aside>

<main className="main">
{page==="atendimento"&&<AtendimentoPage user={user} createTicket={createTicket} setPage={setPage} ticketsPageTarget={ticketsPageTarget}/>}
{page==="filas"&&FEATURES.management&&<QueuePage/>}
{page==="kanban"&&FEATURES.tickets&&<KanbanPage tickets={tickets} updateTicketStatus={updateTicketStatus}/>}
{page==="tickets"&&FEATURES.tickets&&canSeeManagement&&<TicketsPage tickets={tickets} createTicket={createTicket} updateTicketStatus={updateTicketStatus}/>}
{page==="dashboard"&&FEATURES.dashboard&&canSeeManagement&&<DashboardPage/>}
{page==="relatorios"&&FEATURES.dashboard&&canSeeManagement&&<ReportsPage/>}
{page==="base"&&<KnowledgePage user={user}/>}
{page==="whatsapp"&&FEATURES.whatsapp&&canSeeManagement&&<WhatsAppPage/>}
{page==="admin"&&canSeeAdmin&&<AdminPage user={user}/>}
</main>

{/* Celular: menu inferior (como o WhatsApp) com os principais + "Mais". Some
    dentro de uma conversa (ver .workspace.in-chat no CSS). */}
<nav className="bottom-nav">
{sidebar.filter(([k])=>MOBILE_PRIMARY.includes(k)).map(([k,label,I])=><button className={page===k?"active":""} onClick={()=>setPage(k)} key={k}><I/><small>{label}</small>{k==="atendimento"&&unreadTotal>0&&<em>{unreadTotal>99?"99+":unreadTotal}</em>}</button>)}
<button className={moreOpen?"active":""} onClick={()=>setMoreOpen(true)}><Menu/><small>Mais</small></button>
</nav>
{moreOpen&&<div className="modal-backdrop more-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setMoreOpen(false)}><div className="more-sheet">
{sidebar.filter(([k])=>!MOBILE_PRIMARY.includes(k)).map(([k,label,I])=><button key={k} className={page===k?"active":""} onClick={()=>{setPage(k);setMoreOpen(false)}}><I/>{label}</button>)}
<button onClick={()=>{setProfileOpen(true);setMoreOpen(false)}}><Settings/>Configurações</button>
<button onClick={onLogout}><LogOut/>Sair ({user.name})</button>
</div></div>}

<div className="version">V{VERSION}</div>
{profileOpen&&<ProfileModal user={user} onClose={()=>setProfileOpen(false)}/>}
</div>
}

createRoot(document.getElementById("root")).render(<AuthProvider><Root/></AuthProvider>);
