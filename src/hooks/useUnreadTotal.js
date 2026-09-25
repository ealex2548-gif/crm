import { useEffect, useState } from "react";
import { getConversations } from "../services/conversationsService";
import { getSocket } from "../services/socket";

// Total de mensagens não lidas nas conversas em andamento que este usuário vê
// (a API já filtra por permissão) — para o contador do ícone de Atendimento.
export function useUnreadTotal() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = () =>
      getConversations()
        .then((list) => setTotal(list.filter((c) => c.status !== "Finalizado").reduce((sum, c) => sum + (c.unread || 0), 0)))
        .catch(() => {});
    load();
    const socket = getSocket();
    socket.on("conversation:updated", load);
    socket.on("message:new", load);
    return () => {
      socket.off("conversation:updated", load);
      socket.off("message:new", load);
    };
  }, []);

  return total;
}
