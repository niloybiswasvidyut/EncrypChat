"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import MessageInput from "@/components/MessageInput";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
  } = useChat();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const title = useMemo(() => {
    if (!activeConversation) return "No conversation selected";
    return activeConversation.name || "Direct Chat";
  }, [activeConversation]);

  async function logout() {
    await signOut({ callbackUrl: "/" });
  }

  if (status !== "authenticated") {
    return (
      <main className="container-grid py-6">
        <section className="glass-panel rounded-2xl border border-slate p-6 text-sm text-silver/85">
          Checking authentication...
        </section>
      </main>
    );
  }

  return (
    <main className="container-grid py-4">
      <section className="glass-panel h-[85vh] overflow-hidden rounded-2xl border border-slate md:flex">
        <Sidebar
          conversations={conversations}
          selectedId={activeConversation?._id}
          onSelect={setActiveConversation}
        />

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate p-4 md:p-5">
            <div>
              <h1 className="text-lg font-semibold text-silver">{title}</h1>
              <p className="text-xs text-silver/65">Realtime + encrypted payload messaging</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </header>

          <ChatBox messages={messages} currentUserId={session?.user?.id} />
          <MessageInput onSend={sendMessage} />
        </div>
      </section>
    </main>
  );
}
