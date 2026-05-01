"use client";

import { useState } from "react";
import Link from "next/link";
import { FiKey, FiMail, FiLock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password

  async function requestReset(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/auth/recover/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to request password reset");
        return;
      }

      setStatus(data.message || "OTP has been sent to your email address.");
      setStep(2); // Move to OTP step
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/auth/recover/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify OTP");
        return;
      }

      setResetToken(data.resetToken);
      setStatus(data.message);
      setStep(3); // Move to password reset step
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/auth/recover/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setStatus(data.message);
      // Reset form for another attempt
      setTimeout(() => {
        setEmail("");
        setOtp("");
        setNewPassword("");
        setResetToken("");
        setStep(1);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    }
  }

  return (
    <main className="container-grid py-10">
      <div className="mx-auto w-full max-w-md">
        {/* Step 1: Email */}
        {step === 1 && (
          <Card>
            <h2 className="text-xl font-semibold text-silver">Request Password Reset</h2>
            <p className="mt-2 text-sm text-silver/70">
              Enter your email address to receive an OTP code.
            </p>
            <form className="mt-5 space-y-4" onSubmit={requestReset}>
              <label className="block space-y-2">
                <span className="text-xs text-silver/70">Email</span>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
                  <Input
                    type="email"
                    required
                    className="pl-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </label>
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
            </form>
          </Card>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <Card>
            <h2 className="text-xl font-semibold text-silver">Verify OTP</h2>
            <p className="mt-2 text-sm text-silver/70">
              Enter the 6-digit OTP sent to <span className="font-semibold">{email}</span>
            </p>
            <form className="mt-5 space-y-4" onSubmit={verifyOtp}>
              <label className="block space-y-2">
                <span className="text-xs text-silver/70">OTP Code</span>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
                  <Input
                    type="text"
                    required
                    maxLength="6"
                    className="pl-10 text-center text-lg tracking-widest"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                  />
                </div>
              </label>
              <Button type="submit" className="w-full">
                Verify OTP
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setStatus("");
                  setError("");
                }}
              >
                Back to Email
              </Button>
            </form>
          </Card>
        )}

        {/* Step 3: Password Reset */}
        {step === 3 && (
          <Card>
            <h2 className="text-xl font-semibold text-silver">Set New Password</h2>
            <p className="mt-2 text-sm text-silver/70">
              Enter your new password to complete the password reset.
            </p>
            <form className="mt-5 space-y-4" onSubmit={resetPassword}>
              <label className="block space-y-2">
                <span className="text-xs text-silver/70">New Password</span>
                <div className="relative">
                  <FiKey className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
                  <Input
                    type="password"
                    required
                    minLength="8"
                    className="pl-10"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </label>
              <p className="text-xs text-silver/50">
                Password must be at least 8 characters long.
              </p>
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setStep(2);
                  setNewPassword("");
                  setStatus("");
                  setError("");
                }}
              >
                Back to OTP Verification
              </Button>
            </form>
          </Card>
        )}

        {/* Status Messages */}
        {status && (
          <div className="mt-4 rounded-xl border border-green-900/50 bg-green-950/20 p-3 text-sm text-green-200">
            {status}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-silver/70">
          <p>
            Remember your password?{" "}
            <Link href="/login" className="text-cyan-400 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
