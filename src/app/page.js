"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginForm.email,
        password: loginForm.password,
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

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setStatus("Account created successfully. Please log in to open chat.");
      setAuthMode("login");
      setLoginForm({ email: registerForm.email, password: "" });
      setRegisterForm({ name: "", email: "", password: "" });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-grid flex flex-1 py-8 md:py-12">
      <section className="flex min-h-[80vh] w-full flex-col rounded-3xl border border-transparent bg-blackcore p-4 md:flex-row md:p-6">
        <div className="flex flex-1 flex-col items-center justify-center p-5 text-center md:p-8 lg:p-10">
          <h1 className="mesh-title max-w-xl text-3xl font-semibold leading-tight text-silver md:text-5xl">
            EncrypChat: secure real-time communication for direct and group conversations.
          </h1>
          <p className="mt-5 max-w-xl text-base text-silver/60 md:text-lg">
            Registration, login, password recovery, encrypted messages, hashed passwords,
            file attachments, and realtime delivery.
          </p>
        </div>

        <div className="my-3 h-px w-full bg-silver/85 md:my-6 md:mx-8 md:h-auto md:w-0.75 md:rounded-full" />

        <div className="flex w-full items-center justify-center p-2 md:w-[38%] md:p-4 lg:w-[36%]">
          <div className="w-full rounded-2xl border border-transparent bg-transparent p-5 md:max-w-md md:p-6">
            <h2 className="text-center text-2xl font-semibold text-silver">
              {authMode === "login" ? "Login" : "Create Account"}
            </h2>
            <p className="mt-1 text-center text-sm text-silver/70">
              {authMode === "login"
                ? "Login is required to open the chat box."
                : "After account creation, login is still required."}
            </p>

            {authMode === "login" ? (
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <label className="block space-y-2">
                  <span className="text-xs text-silver/70">Email</span>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
                    <Input
                      type="email"
                      required
                      className="bg-transparent pl-10"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                      }
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
                      className="bg-transparent pl-10"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                    />
                  </div>
                </label>

                {error && <p className="text-center text-sm text-red-300">{error}</p>}
                {status && <p className="text-center text-sm text-online">{status}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                <label className="block space-y-2">
                  <span className="text-xs text-silver/70">Name</span>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-3 top-3.5 text-silver/70" />
                    <Input
                      required
                      className="bg-transparent pl-10"
                      value={registerForm.name}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                      }
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
                      className="bg-transparent pl-10"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                      }
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
                      className="bg-transparent pl-10"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                    />
                  </div>
                </label>

                {error && <p className="text-center text-sm text-red-300">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            )}

            <div className="mt-5 flex items-center justify-between text-sm text-silver/80">
              {authMode === "login" ? (
                <>
                  <Link href="/recover" className="text-silver hover:text-white hover:underline">
                    Forgot password?
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setError("");
                      setStatus("");
                    }}
                    className="font-medium text-silver hover:text-white hover:underline"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setError("");
                  }}
                  className="font-medium text-silver hover:text-white hover:underline"
                >
                  Back to login
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
