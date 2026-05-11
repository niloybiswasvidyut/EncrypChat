"use client";

import { useEffect, useRef } from "react";
import { FiLock } from "react-icons/fi";

export default function ChatBox({
  messages,
  currentUserId,
  hasMoreMessages,
  loadingMoreMessages,
  onLoadOlderMessages,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const uniqueMessages = messages.filter((message, index, arr) => {
    const id = message?._id ? String(message._id) : null;
    if (!id) {
      return true;
    }

    return arr.findIndex((item) => String(item?._id) === id) === index;
  });

  useEffect(() => {
    if (!containerRef.current || !bottomRef.current) {
      return;
    }

    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [uniqueMessages.length]);

  return (
    <div
      ref={containerRef}
      className="hide-scrollbar flex-1 space-y-3 overflow-y-auto bg-black p-4 md:p-6"
    >
      {hasMoreMessages && (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={onLoadOlderMessages}
            disabled={loadingMoreMessages}
            className="rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-medium text-white hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {loadingMoreMessages ? "Loading older messages..." : "Load older messages"}
          </button>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 text-xs text-white/70">
        <span className="inline-flex h-2 w-2 rounded-full bg-online" />
        <FiLock className="text-online" /> End-to-end payload encryption enabled
      </div>

      {uniqueMessages.map((message) => {
        const senderValue = message.senderId;
        const senderId =
          senderValue && typeof senderValue === "object"
            ? String(senderValue._id || "")
            : String(senderValue || "");
        const senderName =
          senderValue && typeof senderValue === "object"
            ? senderValue.name || senderValue.email || senderId
            : senderId;
        const isOutgoing = currentUserId && senderId === String(currentUserId);
        const senderLabel = isOutgoing ? "You" : senderName;

        return (
          <article
            key={message._id}
            className={`max-w-[88%] rounded-2xl p-3 ${
              isOutgoing
                ? "ml-auto bg-[#373737] text-white"
                : "bg-[#212121] text-white"
            }`}
          >
            <p className="mb-1 text-xs text-white/70">{senderLabel}</p>
            <p className="text-sm">{message.body}</p>
            {message.attachments?.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-white underline underline-offset-2 hover:text-gray-200"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
