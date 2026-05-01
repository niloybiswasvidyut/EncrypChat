import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { encryptText, decryptText } from "@/lib/encryption";
import { createMessageSchema } from "@/lib/validators";
import { getPusherServer } from "@/lib/pusher";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

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

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  const mapped = messages.map((message) => ({
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

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(`conversation-${conversationId}`, "new-message", {
        message: {
          ...message.toObject(),
          body,
        },
      });
    }

    return NextResponse.json(
      {
        message: {
          ...message.toObject(),
          body,
        },
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
