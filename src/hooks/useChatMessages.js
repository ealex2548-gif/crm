import { useEffect, useState } from "react";
import { getMessages, sendMessage as sendMessageRequest, addNote as addNoteRequest, sendMedia as sendMediaRequest, mapMessage } from "../services/messagesService";
import { getSocket } from "../services/socket";

export function useChatMessages(activeId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    // Limpa a conversa anterior na hora (senão ela aparece até a nova carregar).
    setMessages([]);
    getMessages(activeId).then(setMessages);

    const socket = getSocket();
    socket.emit("conversation:join", activeId);

    // O socket pode estar em salas de outras conversas — só aceita as desta.
    const onNewMessage = (raw) => {
      if (raw.conversationId !== activeId) return;
      const message = mapMessage(raw);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    // Tiques (entregue/lido) chegam depois, pelo webhook de status.
    const onUpdatedMessage = (raw) => {
      if (raw.conversationId !== activeId) return;
      const updated = mapMessage(raw);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, status: updated.status } : m)));
    };
    socket.on("message:new", onNewMessage);
    socket.on("message:updated", onUpdatedMessage);
    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:updated", onUpdatedMessage);
      socket.emit("conversation:leave", activeId);
    };
  }, [activeId]);

  // Mostra a mensagem na hora (🕓) e troca pela confirmada quando o WhatsApp
  // responde — o envio pela CoverCut leva 1–2s. O socket pode entregar a
  // confirmada antes da resposta HTTP, por isso a checagem de duplicada.
  const sendMessage = async (contactId, text) => {
    const tempId = `tmp-${Date.now()}`;
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { id: tempId, side: "out", text, mediaUrl: null, time, createdAt: new Date().toISOString(), pending: true }]);
    try {
      const message = await sendMessageRequest(contactId, text);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === message.id) ? withoutTemp : [...withoutTemp, message];
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    }
  };

  const addNote = async (contactId, text) => {
    if (!text?.trim()) return;
    const message = await addNoteRequest(contactId, text);
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  const sendMedia = async (contactId, file) => {
    const message = await sendMediaRequest(contactId, file);
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  return { messages, sendMessage, addNote, sendMedia };
}
