"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setStatus("Account created successfully. Please login to continue.");
      router.push("/login");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-grid py-12">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold text-silver">Create account</h1>
        <p className="mt-1 text-sm text-silver/70">Join EncrypChat in seconds.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-xs text-silver/70">Name</span>
            <div className="relative">
              <FiUser className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
              <Input
                required
                className="pl-10"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
          </label>

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
          {status && <p className="text-sm text-online">{status}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-right text-sm">
          <Link href="/login" className="text-silver/85 hover:text-white">
            Already have an account?
          </Link>
        </div>
      </Card>
    </main>
  );
}
