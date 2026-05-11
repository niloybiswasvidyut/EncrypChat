"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useConversationSocket } from "@/hooks/useConversationSocket";
import { useSession } from "next-auth/react";

export function useChat() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);

  const normalizeConversation = useCallback(
    (conversation) => {
      if (!conversation) {
        return conversation;
      }

      if (conversation.type !== "direct") {
        return conversation;
      }

      const currentUserId = String(session?.user?.id || "");
      const participant = Array.isArray(conversation.participants)
        ? conversation.participants.find((item) => String(item?._id || item) !== currentUserId)
        : null;

      return {
        ...conversation,
        displayName:
          participant?.name || participant?.email || conversation.name || "Direct chat",
      };
    },
    [session?.user?.id]
  );

  const appendMessageUnique = useCallback((prev, message) => {
    if (!message) {
      return prev;
    }

    const messageId = message?._id ? String(message._id) : null;
    if (!messageId) {
      return [...prev, message];
    }

    if (prev.some((item) => String(item?._id) === messageId)) {
      return prev;
    }

    return [...prev, message];
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) return;

      const data = await response.json();
      if (cancelled) {
        return;
      }

      const normalizedConversations = (data.conversations || []).map(normalizeConversation);
      setConversations(normalizedConversations);
      if (!activeConversation && normalizedConversations.length) {
        setActiveConversation(normalizedConversations[0]);
      }
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (!activeConversation?._id) return;

      const response = await fetch(`/api/chat/messages?conversationId=${activeConversation._id}&limit=50`);
      if (!response.ok) return;

      const data = await response.json();
      if (!cancelled) {
        setMessages(data.messages || []);
        setHasMoreMessages((data.messages || []).length === 50);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversation?._id]);

  const addRealtimeMessage = useCallback(
    (message) => {
      setMessages((prev) => appendMessageUnique(prev, message));
    },
    [appendMessageUnique]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeConversation?._id || loadingMoreMessages || !messages.length || !hasMoreMessages) {
      return;
    }

    const oldestMessage = messages[0];
    if (!oldestMessage?.createdAt) {
      return;
    }

    setLoadingMoreMessages(true);
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${activeConversation._id}&before=${encodeURIComponent(
          oldestMessage.createdAt
        )}&limit=50`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const olderMessages = data.messages || [];

      setMessages((prev) => {
        const nextMessages = [...olderMessages, ...prev];
        return nextMessages.filter((message, index, arr) => {
          const id = message?._id ? String(message._id) : null;
          if (!id) return true;
          return arr.findIndex((item) => String(item?._id) === id) === index;
        });
      });

      setHasMoreMessages(olderMessages.length === 50);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [activeConversation?._id, hasMoreMessages, loadingMoreMessages, messages]);

  const addConversation = useCallback((conversation) => {
    const normalizedConversation = normalizeConversation(conversation);
    setConversations((prev) => {
      if (prev.some((c) => String(c._id) === String(normalizedConversation._id))) return prev;
      return [normalizedConversation, ...prev];
    });
    setActiveConversation(normalizedConversation);
  }, [normalizeConversation]);

  // Listen for new conversations from other users
  useConversationSocket({
    userId: session?.user?.id,
    onNewConversation: (conversation) => {
      const normalizedConversation = normalizeConversation(conversation);
      setConversations((prev) => {
        if (prev.some((c) => String(c._id) === String(normalizedConversation._id))) return prev;
        return [normalizedConversation, ...prev];
      });
    },
  });

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
        setMessages((prev) => appendMessageUnique(prev, data.message));
      }
    },
    [activeConversation, appendMessageUnique]
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) return false;

      const conversationIdString = String(conversationId);
      let removedConversation = null;

      // Optimistically remove the conversation so the UI updates immediately.
      setConversations((prev) => {
        const filtered = prev.filter((conversation) => {
          const matches = String(conversation._id) === conversationIdString;
          if (matches) {
            removedConversation = conversation;
          }
          return !matches;
        });

        if (String(activeConversation?._id) === conversationIdString) {
          if (filtered.length > 0) {
            setActiveConversation(filtered[0]);
          } else {
            setActiveConversation(null);
            setMessages([]);
          }
        }

        return filtered;
      });

      try {
        const response = await fetch(`/api/chat/conversations/${conversationIdString}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Delete failed:", response.status, errorText);
        }
      } catch (error) {
        console.error("Delete error:", error);
      }

      // Keep the UI updated even if the request response is flaky.
      return true;
    },
    [activeConversation?._id]
  );

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    addConversation,
    deleteConversation,
    hasMoreMessages,
    loadingMoreMessages,
    loadOlderMessages,
  };
}
