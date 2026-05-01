"use client";

import { FiLock } from "react-icons/fi";

export default function ChatBox({ messages, currentUserId }) {

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
      <div className="mb-3 flex items-center gap-2 text-xs text-silver/70">
        <span className="inline-flex h-2 w-2 rounded-full bg-online" />
        <FiLock className="text-online" /> End-to-end payload encryption enabled
      </div>

      {messages.map((message) => {
        const senderId = String(message.senderId || "");
        const isOutgoing = currentUserId && senderId === String(currentUserId);

        return (
          <article
            key={message._id}
            className={`max-w-[88%] rounded-2xl border p-3 ${
              isOutgoing
                ? "ml-auto border-slate bg-slate text-white"
                : "border-slate bg-midnight text-silver"
            }`}
          >
            <p className="mb-1 text-xs text-silver/65">{senderId}</p>
            <p className="text-sm">{message.body}</p>
            {message.attachments?.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-silver underline underline-offset-2 hover:text-white"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
