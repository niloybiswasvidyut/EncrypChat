import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const mongoose = await connectDB();
    const pingResult = await mongoose.connection.db.admin().command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      database: mongoose.connection.name,
      ping: pingResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}