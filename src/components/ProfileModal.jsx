import{useState}from"react";
import{X,User}from"lucide-react";
import{changeMyPassword}from"../services/authService";

const ROLE_LABELS={ADMIN:"Administrador",SUPERVISOR:"Supervisor",AGENT:"Atendente"};

export function ProfileModal({user,onClose}){
const[currentPassword,setCurrentPassword]=useState("");
const[newPassword,setNewPassword]=useState("");
const[confirmPassword,setConfirmPassword]=useState("");
const[message,setMessage]=useState(null);
const[saving,setSaving]=useState(false);

const handleSubmit=async(e)=>{
e.preventDefault();
setMessage(null);
if(newPassword!==confirmPassword){
setMessage({type:"error",text:"As senhas novas não coincidem."});
return;
}
setSaving(true);
try{
await changeMyPassword(currentPassword,newPassword);
setMessage({type:"success",text:"Senha atualizada com sucesso."});
setCurrentPassword("");setNewPassword("");setConfirmPassword("");
}catch(err){
setMessage({type:"error",text:err.message});
}finally{
setSaving(false);
}
};

return <div className="modal-backdrop"><div className="finish-modal">
<div className="finish-head"><div><User/><span><strong>Meu perfil</strong><small>{user.name}</small></span></div><button onClick={onClose}><X/></button></div>
<label>Nome<input value={user.name} readOnly/></label>
<label>E-mail<input value={user.email} readOnly/></label>
<label>Papel<input value={ROLE_LABELS[user.role]??user.role} readOnly/></label>
<form onSubmit={handleSubmit}>
<label>Senha atual<input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required/></label>
<label>Nova senha<input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} minLength={6} required/></label>
<label>Confirmar nova senha<input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} minLength={6} required/></label>
{message&&<div className={message.type==="error"?"login-error":"admin-success"}>{message.text}</div>}
<div className="modal-actions"><button type="button" onClick={onClose}>Fechar</button><button type="submit" className="confirm" disabled={saving}>{saving?"Salvando...":"Trocar senha"}</button></div>
</form>
</div></div>
}
