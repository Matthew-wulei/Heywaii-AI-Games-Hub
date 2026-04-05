"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn("resend", { email, callbackUrl: "/" });
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const node = (
    <>
      <div
        className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm transition-all duration-100"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="fixed z-[201] grid w-[min(100%-2rem,480px)] max-h-[min(90dvh,calc(100vh-2rem))] overflow-y-auto gap-8 border border-white/10 bg-[#1c1c1c] p-8 shadow-2xl duration-200 rounded-3xl"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="w-10 shrink-0" aria-hidden />
            <h2
              id="login-modal-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-white text-center min-w-0 flex-1"
            >
              Welcome to HeyWaii Gameshub
            </h2>
            <div className="w-10 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-white/10 transition-colors text-text-secondary hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-text-secondary">
            Log in or sign up to explore more content
          </p>
        </div>

        <div className="flex flex-col space-y-5">
          <button
            type="button"
            onClick={() => signIn("dev-mock", { callbackUrl: "/" })}
            className="flex items-center justify-center gap-3 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-4 py-4 text-sm font-bold text-white transition-colors"
          >
            Quick Login (Dev)
          </button>
          
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs font-bold text-gray-400">
              <span className="bg-[#1c1c1c] px-4 tracking-widest">OR</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full rounded-2xl bg-white px-4 py-4 text-sm font-bold text-black hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1c]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs font-bold text-gray-400">
              <span className="bg-[#1c1c1c] px-4 tracking-widest">OR</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col space-y-3">
            <div className="space-y-2 p-[1px] rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 pb-0 mb-3">
              <input
                type="email"
                placeholder="coolperson@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-14 w-full rounded-[15px] border-0 bg-[#2a2a2a] px-5 py-2 text-[15px] text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {error && (
              <p className="text-sm text-status-error px-1 -mt-2 mb-2">{error}</p>
            )}
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-red-500 to-pink-500">
              <button
                type="submit"
                disabled={loading || !email}
                className="inline-flex h-14 w-full items-center justify-center rounded-[15px] bg-[#333333] hover:bg-[#444444] px-4 py-2 text-[15px] font-bold text-white transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Login
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-text-secondary mt-2">
          By continuing, you confirm that you are at least 18 years old and
          <br />
          agree to our{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-text-primary"
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </>
  );

  return createPortal(node, document.body);
}
