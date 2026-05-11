import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { getPusherServer } from "@/lib/pusher";
import { User } from "@/models/User";
import { Conversation } from "@/models/Conversation";

async function populateConversation(conversationDoc) {
  return Conversation.populate(conversationDoc, {
    path: "participants",
    select: "_id name email avatarUrl",
  });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { email } = payload || {};
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    const other = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!other) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(other._id) === String(session.user.id)) {
      return NextResponse.json({ error: "Cannot start a chat with yourself" }, { status: 400 });
    }

    // Try to find an existing direct conversation between the two users
    const existing = await Conversation.findOne({
      type: "direct",
      participants: { $all: [session.user.id, other._id] },
    }).lean();

    if (existing && Array.isArray(existing.participants) && existing.participants.length === 2) {
      const populatedExisting = await populateConversation(existing);
      return NextResponse.json({ conversation: populatedExisting }, { status: 200 });
    }

    const conversation = await Conversation.create({
      type: "direct",
      participants: [session.user.id, other._id],
      lastMessageAt: new Date(),
    });

    const populatedConversation = await populateConversation(conversation);

    // Notify both participants about the new conversation via Pusher
    const pusher = getPusherServer();
    if (pusher) {
      // Notify the current user
      await pusher.trigger(`user-${session.user.id}`, "new-conversation", {
        conversation: populatedConversation,
      });

      // Notify the other user
      await pusher.trigger(`user-${other._id}`, "new-conversation", {
        conversation: populatedConversation,
      });
    }

    return NextResponse.json({ conversation: populatedConversation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to start conversation" }, { status: 500 });
  }
}
