"use client";

import { FiHash, FiMessageCircle, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function Sidebar({ conversations, selectedId, onSelect }) {
  return (
    <aside className="w-full border-r border-slate bg-carbon md:w-80">
      <div className="border-b border-slate p-5">
        <h2 className="text-lg font-semibold text-silver">Conversations</h2>
        <p className="text-xs text-silver/65">Private + group channels</p>
      </div>
      <div className="max-h-[62vh] space-y-2 overflow-y-auto p-3 md:max-h-[calc(100vh-180px)]">
        {conversations.map((conversation) => {
          const active = selectedId === conversation._id;
          const icon = conversation.type === "group" ? <FiUsers /> : <FiMessageCircle />;

          return (
            <Button
              key={conversation._id}
              variant="ghost"
              className={`w-full justify-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                active
                  ? "border-l-[3px] border-silver bg-[rgba(50,74,95,.45)] text-silver"
                  : "text-silver/85"
              }`}
              onClick={() => onSelect(conversation)}
            >
              <span className="text-base">{icon}</span>
              <span className="truncate text-sm font-medium">
                {conversation.name || "Direct chat"}
              </span>
              {conversation.type === "group" && <FiHash className="ml-auto text-xs" />}
            </Button>
          );
        })}
      </div>
    </aside>
  );
}
