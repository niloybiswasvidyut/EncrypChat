import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = params.id;
    const userId = session.user.id;

    await connectDB();

    // Ensure conversation exists and user is a participant
    const existing = await Conversation.findById(conversationId);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = Array.isArray(existing.participants)
      ? existing.participants.some((p) => p.toString() === userId)
      : false;

    if (!isParticipant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Atomically add user to deletedBy
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { deletedBy: userId } },
      { new: true }
    ).lean();

    // If every participant has deleted the conversation, remove it and its messages from DB
    const participants = Array.isArray(updatedConversation.participants)
      ? updatedConversation.participants.map((p) => String(p))
      : [];

    const deletedBy = Array.isArray(updatedConversation.deletedBy)
      ? updatedConversation.deletedBy.map((d) => String(d))
      : [];

    const allDeleted = participants.length > 0 && participants.every((p) => deletedBy.includes(p));

    if (allDeleted) {
      await Message.deleteMany({ conversationId: updatedConversation._id });
      await Conversation.deleteOne({ _id: updatedConversation._id });
      return NextResponse.json({ success: true, removed: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
