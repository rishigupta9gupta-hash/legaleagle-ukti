"use client";

import React, { useState, useEffect } from "react";
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

export default function Login() {
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

  useEffect(() => {
    const initializeGoogleAuth = () => {
      if (window.google?.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
            use_fedcm_for_prompt: true,
          });

          window.google.accounts.id.renderButton(
            document.getElementById("googleSignInDiv"),
            {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "continue_with",
            }
          );
        } catch (err) {
          console.error("Google Auth Init Failed", err);
        }
      } else {
        setTimeout(initializeGoogleAuth, 100);
      }
    };

    initializeGoogleAuth();
  }, []);

  const handleGoogleCallback = async (response) => {
    try {
      if (response.credential) {
        const result = await googleLogin(response.credential);
        if (result.success) {
          router.push("/?loginSuccess=1");
        } else {
          setError(result.message || "Google authentication failed.");
        }
      }
    } catch {
      setError("Google authentication failed. Please try again.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    const result = await loginUser(email, password);
    if (result.success) {
      router.push("/?loginSuccess=1");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 relative">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft size={20} />
        <span className="hidden sm:inline font-medium">Back to Home</span>
      </button>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to your InterVue X account
          </p>
        </div>

        {/* Google Sign-in */}
        <div className="mb-6">
          <div id="googleSignInDiv" className="w-full" />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border bg-zinc-50 dark:bg-zinc-950"
          />

          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border bg-zinc-50 dark:bg-zinc-950"
          />

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              Forgot password?
            </Link>
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              <CheckCircle size={16} /> {successMessage}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
            Log in <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-zinc-900 dark:text-white font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
