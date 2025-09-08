"use client";
import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileMenu from "../component/profile";
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Simple one-step login (no 2FA)
  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpStep, setFpStep] = useState<"request" | "reset">("request");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpMessage, setFpMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) setError(res.error);
    else router.push("/");
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpMessage("");
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      setFpMessage("If the email exists, a reset code was sent.");
      setFpStep("reset");
    } catch {
      setError("Failed to send reset code");
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpMessage("");
    setError("");
    if (fpNewPassword !== fpConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, code: fpCode, newPassword: fpNewPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Reset failed");
        return;
      }
      setFpMessage("Password reset successful. Signing you in...");
      // Auto sign-in after reset
      const signInRes = await signIn("credentials", { email: fpEmail, password: fpNewPassword, redirect: false });
      if (signInRes?.error) {
        // If 2FA is required or fails, just route to login
        router.push("/login");
      } else {
        router.push("/");
      }
    } catch {
      setError("Reset failed");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 px-3 py-2 rounded-lg transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="mr-1 w-4 h-4" />
        Back
      </button>
      <ProfileMenu session={null} userScores={null} isDark={false} signOut={function (): void {
        throw new Error("Function not implemented.");
      } }/>
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-sm p-8 bg-transparent">
          <h1 className="text-3xl font-bold text-center">Yoo, welcome back!</h1>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            First time here?{" "}
            <Link
              href="/register"
              className="cursor-pointer hover:underline text-neutral-900 dark:text-neutral-100"
            >
              Sign up for free
            </Link>
          </p>

          {error && (
            <p className="text-red-600 dark:text-red-400 mb-4 text-center">{error}</p>
          )}

          {!showForgot && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Your email"
              className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
            <button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-neutral-900 font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Sign In
            </button>
            <div className="flex justify-end">
              <button type="button" onClick={() => { setShowForgot(true); setFpEmail(email); setError(""); setFpMessage(""); }} className="text-sm text-neutral-600 dark:text-neutral-300 hover:underline">
                Forgot password?
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 my-6">
              <hr className="flex-grow border-t border-neutral-300 dark:border-neutral-700" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">OR</span>
              <hr className="flex-grow border-t border-neutral-300 dark:border-neutral-700" />
            </div>
          </form>
          )}

          {showForgot && (
            <div className="mt-8 space-y-4">
              {fpStep === "request" ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    required
                    placeholder="Your email"
                    className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                  <button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-neutral-900 font-semibold py-2 px-4 rounded-md transition-colors">
                    Send reset code
                  </button>
                  <button type="button" onClick={() => { setShowForgot(false); setFpStep("request"); setFpCode(""); setFpNewPassword(""); setFpConfirmPassword(""); setFpMessage(""); }} className="w-full text-sm text-neutral-600 dark:text-neutral-300 hover:underline">
                    Back to sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <input
                    type="text"
                    value={fpCode}
                    onChange={(e) => setFpCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    required
                    placeholder="6-digit code"
                    className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-center tracking-widest"
                  />
                  <input
                    type="password"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    required
                    placeholder="New password"
                    className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                  <input
                    type="password"
                    value={fpConfirmPassword}
                    onChange={(e) => setFpConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setFpStep("request"); setFpCode(""); setFpNewPassword(""); setFpConfirmPassword(""); setFpMessage(""); }} className="w-1/3 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 font-semibold py-2 px-4 rounded-md transition-colors">Back</button>
                    <button type="submit" className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-neutral-900 font-semibold py-2 px-4 rounded-md transition-colors">Reset & Sign In</button>
                  </div>
                  <button type="button" onClick={() => { setShowForgot(false); setFpStep("request"); setFpCode(""); setFpNewPassword(""); setFpConfirmPassword(""); setFpMessage(""); }} className="w-full text-sm text-neutral-600 dark:text-neutral-300 hover:underline">
                    Back to sign in
                  </button>
                </form>
              )}
              {fpMessage && <p className="text-green-600 dark:text-green-400 text-sm">{fpMessage}</p>}
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
            </div>
          )}

          {!showForgot && (
            <button
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-100 font-semibold py-2 px-4 rounded-md transition-colors border border-neutral-300 dark:border-neutral-700 flex items-center justify-center"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              type="button"
            >
              <Image src="/assets/googlelogo.webp" alt="Google" height={20} width={20} />
              <span className="ml-2">Sign in with Google</span>
            </button>
          )}

          <p className="text-center text-sm text-stone-400 mt-4">
            By signing up, you agree to our{" "}
            <Link className="cursor-pointer hover:underline text-neutral-900 dark:text-neutral-100" href="/terms&conditions">
              Terms and Conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
