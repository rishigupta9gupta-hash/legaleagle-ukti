"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import {
  loginUser
} from "@/app/utils/auth-api";
import {
  parseJwt,
  googleAuthenticate,
} from "@/app/utils/auth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Success message from signup → /login?success=1
  useEffect(() => {
    if (searchParams.get("success")) {
      setSuccessMessage("Account created successfully. Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const result = await loginUser(email, password);
      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        setError(result.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  const handleGoogleCallback = async (response) => {
    // Handled by Google Button script
  };

  useEffect(() => {
    // Initialize Google Sign-In
    /* global google */
    if (typeof window !== 'undefined' && !window.google?.accounts) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = initializeGoogle;
    } else if (window.google?.accounts) {
      initializeGoogle();
    }

    function initializeGoogle() {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            // This logic matches the previous handleGoogleCallback implementation
            try {
              // We need googleLogin from utils/auth-api which I saw earlier, 
              // but imports here are mixed. Let's stick to existing logic pattern.
              // But wait, in Step 801 I saw 'googleLogin' imported from 'auth-api'.
              // Let's assume we import googleLogin.
              const { googleLogin } = await import("@/app/utils/auth-api");
              if (response.credential) {
                const result = await googleLogin(response.credential);
                if (result.success) {
                  window.location.href = "/dashboard";
                } else {
                  setError(result.message || "Google authentication failed.");
                }
              }
            } catch (e) {
              setError("Google authentication failed.");
            }
          }
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    }
  }, []);


  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Branding */}
      <div className="hidden md:flex flex-col bg-zinc-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/50 to-cyan-900/50" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-20">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full" />
            </div>
            VIRA
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Welcome back to your health companion.</h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Track your holistic health journey, manage conditions, and get AI-powered insights tailored just for you.
            </p>

            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800" />
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold">Trusted by thousands</div>
                <div className="text-zinc-500">Join our community</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto text-sm text-zinc-500">
          © 2024 Vira Health AI. All rights reserved.
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-white dark:bg-zinc-950">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="md:hidden flex items-center gap-2 mb-8 text-zinc-500">
            <ArrowLeft size={20} /> Back
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Login</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Enter your credentials to access your account.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl flex items-center gap-2 border border-green-100 dark:border-green-800">
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-800">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-teal-600 hover:text-teal-700">Forgot Password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <span className="text-xs text-zinc-500 font-medium uppercase">Or continue with</span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          </div>

          <div id="google-signin-btn" className="w-full"></div>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-teal-600 hover:text-teal-700">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}

