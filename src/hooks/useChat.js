"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) return;

      const data = await response.json();
      if (cancelled) {
        return;
      }

      setConversations(data.conversations || []);
      if (!activeConversation && data.conversations?.length) {
        setActiveConversation(data.conversations[0]);
      }
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [activeConversation]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (!activeConversation?._id) return;

      const response = await fetch(`/api/chat/messages?conversationId=${activeConversation._id}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!cancelled) {
        setMessages(data.messages || []);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversation?._id]);

  const addRealtimeMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  useSocket({
    conversationId: activeConversation?._id,
    onMessage: addRealtimeMessage,
  });

  const sendMessage = useCallback(
    async ({ body, file }) => {
      if (!activeConversation?._id) {
        return;
      }

      const attachments = [];

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploaded = await uploadResponse.json();

        if (uploaded.url) {
          attachments.push(uploaded);
        }
      }

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          body: body || "[attachment]",
          attachments,
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    },
    [activeConversation]
  );

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
  };
}
