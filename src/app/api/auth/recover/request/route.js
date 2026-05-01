import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { recoverRequestSchema } from "@/lib/validators";
import { sendOTPEmail } from "@/lib/email";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const parsed = recoverRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({
        message: "If the account exists, an OTP has been sent to the email address.",
      });
    }

    // Generate OTP and token hash
    const otp = generateOTP();
    const tokenHash = crypto
      .createHash("sha256")
      .update(crypto.randomBytes(32).toString("hex"))
      .digest("hex");

    // Create password reset token with OTP
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      otp,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
      otpExpiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes for OTP
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({
      message: "OTP has been sent to your email address.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Recovery request failed" },
      { status: 500 }
    );
  }
}
