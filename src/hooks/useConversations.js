import { useEffect, useMemo, useState } from "react";
import { getConversations } from "../services/conversationsService";
import { getSocket } from "../services/socket";

export function useConversations() {
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations().then((list) => {
      setContacts(list);
      setLoading(false);
    });

    const socket = getSocket();
    const refresh = () => getConversations().then(setContacts);
    socket.on("conversation:updated", refresh);
    socket.on("message:new", refresh);
    return () => {
      socket.off("conversation:updated", refresh);
      socket.off("message:new", refresh);
    };
  }, []);

  // Nenhuma conversa abre sozinha (como no WhatsApp Web): só ao clicar na lista.
  const active = contacts.find((c) => c.id === activeId) ?? null;
  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.company.toLowerCase().includes(query.toLowerCase())
      ),
    [contacts, query]
  );

  return { contacts, active, activeId, setActiveId, query, setQuery, filtered, loading };
}
