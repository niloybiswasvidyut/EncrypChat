"use client";

import { useEffect, useRef } from "react";
import PusherClient from "pusher-js";

let pusherInstance = null;

function getPusherInstance() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (key && cluster) {
      pusherInstance = new PusherClient(key, { cluster });
    }
  }

  return pusherInstance;
}

export function useConversationSocket({ userId, onNewConversation }) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId || !onNewConversation) {
      return undefined;
    }

    const pusher = getPusherInstance();
    if (!pusher) {
      return undefined;
    }

    const channelName = `user-${userId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("new-conversation", (payload) => {
      onNewConversation(payload.conversation);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind("new-conversation", onNewConversation);
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [userId, onNewConversation]);
}
