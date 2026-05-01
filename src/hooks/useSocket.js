"use client";

import { useEffect } from "react";
import PusherClient from "pusher-js";

export function useSocket({ conversationId, onMessage }) {
  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      return undefined;
    }

    const pusher = new PusherClient(key, { cluster });
    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (payload) => {
      onMessage(payload.message);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
      pusher.disconnect();
    };
  }, [conversationId, onMessage]);
}
