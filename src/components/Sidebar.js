"use client";

import { useState } from "react";
import { FiHash, FiMessageCircle, FiUsers, FiX, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Sidebar({
  conversations,
  selectedId,
  onSelect,
  onCreateConversation,
  onDeleteConversation,
  className = "",
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupEmails, setGroupEmails] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredConversations = conversations.filter((conversation) => {
    if (activeTab === "individual") {
      return conversation.type === "direct";
    }

    return conversation.type === "group";
  });

  function handleSelectConversation(conversation) {
    setActiveTab(conversation.type === "group" ? "group" : "individual");
    if (onSelect) onSelect(conversation);
  }

  async function handleStartDirect(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat/conversations/by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start chat");
        setLoading(false);
        return;
      }

      const conversation = data.conversation;
      if (onCreateConversation) onCreateConversation(conversation);
      handleSelectConversation(conversation);
      setEmail("");
    } catch (err) {
      alert(err.message || "Failed to start chat");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!groupName.trim() || !groupEmails.trim()) {
      alert("Group name and participant emails are required");
      return;
    }

    const emails = groupEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      alert("Please enter at least one email");
      return;
    }

    setGroupLoading(true);
    try {
      // First, resolve emails to user IDs
      const userRes = await fetch("/api/users/by-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        alert(userData.error || "Failed to find users");
        setGroupLoading(false);
        return;
      }

      const participantIds = userData.users.map((u) => u._id);

      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name: groupName.trim(),
          participantIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create group");
        setGroupLoading(false);
        return;
      }

      const conversation = data.conversation;
      if (onCreateConversation) onCreateConversation(conversation);
      handleSelectConversation(conversation);
      setShowGroupModal(false);
      setGroupName("");
      setGroupEmails("");
    } catch (err) {
      alert(err.message || "Failed to create group");
    } finally {
      setGroupLoading(false);
    }
  }

  async function handleDeleteConversation(conversationId) {
    setDeleting(true);
    try {
      const success = await onDeleteConversation(conversationId);
      if (success) {
        setDeleteConfirm(null);
      } else {
        alert("Failed to delete conversation");
      }
    } catch (err) {
      alert(err.message || "Failed to delete conversation");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <aside className={`w-full bg-black md:w-80 ${className}`.trim()}>
      <div className="border-b border-[#1f1f1f] p-5">
        <h2 className="text-lg font-semibold text-white">Conversations</h2>
        <p className="text-xs text-white/70">Private + group channels</p>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#141414] p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("individual")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "individual"
                ? "bg-[#3a3a3a] text-white"
                : "text-white/75 hover:bg-white/10"
            }`}
          >
            Individual
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("group")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "group"
                ? "bg-[#3a3a3a] text-white"
                : "text-white/75 hover:bg-white/10"
            }`}
          >
            Group
          </Button>
        </div>

        {activeTab === "individual" ? (
          <form onSubmit={handleStartDirect} className="mt-3 flex items-center gap-2">
            <Input
              placeholder="Start chat by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={loading} className="h-9">
              Start
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => setShowGroupModal(true)}
            variant="outline"
            className="mt-3 w-full"
          >
            <FiUsers className="mr-2" /> Create Group
          </Button>
        )}
      </div>
      <div className="max-h-[62vh] space-y-2 overflow-y-auto p-3 md:max-h-[calc(100vh-180px)]">
        {filteredConversations.map((conversation) => {
          const active = selectedId === conversation._id;
          const icon = conversation.type === "group" ? <FiUsers /> : <FiMessageCircle />;

          return (
            <div
              key={conversation._id}
              className="group relative flex items-center rounded-xl transition-colors hover:bg-white/5"
            >
              <Button
                variant="ghost"
                className={`flex-1 justify-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  active
                      ? "bg-[#3a3a3a] text-white"
                      : "text-white/85 hover:bg-transparent"
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <span className="text-base">{icon}</span>
                <span className="truncate text-sm font-medium">
                  {conversation.displayName || conversation.name || "Direct chat"}
                </span>
                {conversation.type === "group" && <FiHash className="ml-auto text-xs" />}
              </Button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(conversation);
                }}
                className="mr-2 rounded-lg p-2 text-white/50 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 cursor-pointer"
                title="Delete conversation"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-black p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create Group Chat</h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-white/65 hover:text-white cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/85">Group Name</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="My Team"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/85">
                  Participant Emails (comma-separated)
                </label>
                <textarea
                  value={groupEmails}
                  onChange={(e) => setGroupEmails(e.target.value)}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full rounded-lg border border-gray-600 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-white/50"
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={groupLoading} className="flex-1">
                  {groupLoading ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-black p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold text-white">Delete Conversation?</h3>
            <p className="mb-4 text-sm text-white/75">
              This will remove the conversation from your chat list. You can still create a new chat with this user.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={() => handleDeleteConversation(deleteConfirm._id)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
