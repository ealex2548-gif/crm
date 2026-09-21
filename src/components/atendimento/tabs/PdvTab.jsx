export function PdvTab({active}){
return <section><h3>Ambiente do PDV</h3><label>Versão<input value={active.version} readOnly/></label><label>Terminais<input value={active.terminals} readOnly/></label><label>Banco<input value={active.db} readOnly/></label><label>Licença<select><option>Ativa</option><option>Bloqueada</option><option>Vencida</option></select></label><label>Acesso remoto<input defaultValue="AnyDesk 123 456 789"/></label></section>
}
