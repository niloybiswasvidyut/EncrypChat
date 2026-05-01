import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyOtpSchema } from "@/lib/validators";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";

export async function POST(request) {
  try {
    const payload = await request.json();
    const parsed = verifyOtpSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the most recent reset token for this user
    const resetDoc = await PasswordResetToken.findOne({
      userId: user._id,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!resetDoc) {
      return NextResponse.json(
        { error: "No active password reset request found" },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (resetDoc.otpExpiresAt < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Check if max attempts exceeded
    if (resetDoc.otpAttempts >= resetDoc.maxOtpAttempts) {
      return NextResponse.json(
        { error: "Maximum OTP attempts exceeded. Please request a new password reset." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (resetDoc.otp !== otp) {
      resetDoc.otpAttempts += 1;
      await resetDoc.save();

      const attemptsLeft = resetDoc.maxOtpAttempts - resetDoc.otpAttempts;
      return NextResponse.json(
        {
          error: `Invalid OTP. ${attemptsLeft} attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // OTP verified - Mark as verified and extend token expiration
    resetDoc.otpVerified = true;
    resetDoc.expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes to reset password
    await resetDoc.save();

    // Generate a new token to return to client for password reset
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Update the existing token hash with the new verification token
    resetDoc.tokenHash = verificationTokenHash;
    await resetDoc.save();

    return NextResponse.json({
      message: "OTP verified successfully",
      resetToken: verificationToken,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "OTP verification failed" },
      { status: 500 }
    );
  }
}
