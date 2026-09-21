import { useEffect, useState } from "react";
import { getMessages, sendMessage as sendMessageRequest, addNote as addNoteRequest, mapMessage } from "../services/messagesService";
import { getSocket } from "../services/socket";

export function useChatMessages(activeId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    getMessages(activeId).then(setMessages);

    const socket = getSocket();
    socket.emit("conversation:join", activeId);

    const onNewMessage = (raw) => {
      const message = mapMessage(raw);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on("message:new", onNewMessage);
    return () => socket.off("message:new", onNewMessage);
  }, [activeId]);

  const sendMessage = async (contactId, text) => {
    const message = await sendMessageRequest(contactId, text);
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  const addNote = async (contactId, text) => {
    if (!text?.trim()) return;
    const message = await addNoteRequest(contactId, text);
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  return { messages, sendMessage, addNote };
}
