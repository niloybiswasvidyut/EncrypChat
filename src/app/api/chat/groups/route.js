import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const groups = await Conversation.find({
    type: "group",
    participants: session.user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ groups });
}
