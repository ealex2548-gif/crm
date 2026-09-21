export function ChecklistTab(){
return <section><h3>Checklist visual</h3>{["Serviço do PDV","Internet / rede","Impressora","Certificado","Banco / servidor","Licença","Versão"].map((x,i)=><label className="check" key={x}><input type="checkbox" defaultChecked={i%2===0}/><span>{x}</span></label>)}</section>
}
