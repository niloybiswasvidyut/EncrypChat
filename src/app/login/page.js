"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiLock, FiMail } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!result || result.error) {
        throw new Error("Invalid credentials");
      }

      router.push("/chat");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-grid py-12">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold text-silver">Welcome back</h1>
        <p className="mt-1 text-sm text-silver/70">Sign in to continue secure chatting.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-xs text-silver/70">Email</span>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
              <Input
                type="email"
                required
                className="pl-10"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs text-silver/70">Password</span>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
              <Input
                type="password"
                required
                className="pl-10"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </div>
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/recover" className="text-silver hover:text-white hover:underline">
            Forgot password?
          </Link>
          <Link href="/register" className="text-silver/85 hover:text-white">
            Create account
          </Link>
        </div>
      </Card>
    </main>
  );
}
