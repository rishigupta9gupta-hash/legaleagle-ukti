"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setMessage("If an account exists, a reset link has been sent.");
            } else {
                setStatus("error");
                setMessage(data.message || "Something went wrong.");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
            <Link
                href="/login"
                className="absolute top-6 left-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Login</span>
            </Link>

            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={24} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Forgot Password?</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Enter your email and we'll send you instructions to reset your password.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                        <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                        <p className="text-green-700 dark:text-green-400 font-medium">{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        {status === "error" && (
                            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <AlertCircle size={16} /> {message}
                            </div>
                        )}

                        <button
                            disabled={status === "loading"}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {status === "loading" ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
