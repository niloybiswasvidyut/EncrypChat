import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { encryptText, decryptText } from "@/lib/encryption";
import { createMessageSchema } from "@/lib/validators";
import { getPusherServer } from "@/lib/pusher";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

async function populateMessage(messageDoc, body) {
  const populatedMessage = await Message.populate(messageDoc, {
    path: "senderId",
    select: "_id name email avatarUrl",
  });

  return {
    ...populatedMessage.toObject(),
    body,
  };
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const before = searchParams.get("before");
  const limitParam = Number(searchParams.get("limit") || "50");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  await connectDB();

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: session.user.id,
  });

  if (!conversation) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = { conversationId };
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "_id name email avatarUrl")
    .lean();

  const mapped = messages.reverse().map((message) => ({
    ...message,
    body: decryptText(message.encryptedBody),
  }));

  return NextResponse.json({ messages: mapped });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = createMessageSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { conversationId, body, attachments = [] } = parsed.data;

    await connectDB();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: session.user.id,
    });

    if (!conversation) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await Message.create({
      conversationId,
      senderId: session.user.id,
      encryptedBody: encryptText(body),
      attachments,
      readBy: [session.user.id],
    });

    const populatedMessage = await populateMessage(message, body);

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const pusher = getPusherServer();
    console.log(`[Pusher] Server instance:`, !!pusher);
    if (pusher) {
      const channelName = `conversation-${conversationId}`;
      console.log(`[Pusher] Triggering on channel: ${channelName}`);
      await pusher.trigger(channelName, "new-message", {
        message: populatedMessage,
      });
      console.log(`[Pusher] Event triggered successfully`);
    } else {
      console.log(`[Pusher] No server instance available`);
    }

    return NextResponse.json(
      {
        message: populatedMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Message send failed" },
      { status: 500 }
    );
  }
}
