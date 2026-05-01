import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { resetPasswordSchema } from "@/lib/validators";
import { encryptText } from "@/lib/encryption";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";

export async function POST(request) {
  try {
    const payload = await request.json();
    const parsed = resetPasswordSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await connectDB();

    const resetDoc = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
      otpVerified: true, // Ensure OTP was verified
    });

    if (!resetDoc) {
      return NextResponse.json(
        { error: "Invalid, expired, or unverified reset token. Please verify your OTP." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const passwordCipher = encryptText(newPassword);

    await User.findByIdAndUpdate(resetDoc.userId, {
      passwordHash,
      passwordCipher,
      lastSeenAt: new Date(),
    });

    resetDoc.used = true;
    await resetDoc.save();

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Reset failed" },
      { status: 500 }
    );
  }
}
