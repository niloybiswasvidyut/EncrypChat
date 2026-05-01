import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    transport: "pusher",
    status: "ready",
    note:
      "For App Router deployments, Pusher is used as the real-time transport. Socket.io package is installed for optional custom server migration.",
  });
}
