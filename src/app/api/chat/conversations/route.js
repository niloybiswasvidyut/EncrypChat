import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { createConversationSchema } from "@/lib/validators";
import { Conversation } from "@/models/Conversation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const conversations = await Conversation.find({
    participants: session.user.id,
  })
    .sort({ lastMessageAt: -1 })
    .lean();

  return NextResponse.json({ conversations });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = createConversationSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { type, name, participantIds } = parsed.data;
    await connectDB();

    const uniqueParticipants = Array.from(new Set([session.user.id, ...participantIds]));

    const conversation = await Conversation.create({
      type,
      name: type === "group" ? name : undefined,
      participants: uniqueParticipants,
      admins: type === "group" ? [session.user.id] : [],
      lastMessageAt: new Date(),
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Conversation creation failed" },
      { status: 500 }
    );
  }
}
