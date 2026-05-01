import mongoose, { Schema } from "mongoose";

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false },
    otp: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpVerified: { type: Boolean, default: false },
    otpAttempts: { type: Number, default: 0 },
    maxOtpAttempts: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const PasswordResetToken =
  mongoose.models.PasswordResetToken ||
  mongoose.model("PasswordResetToken", PasswordResetTokenSchema);
