"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle, Lock } from "lucide-react";

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setStatus("error");
            setMessage("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setTimeout(() => router.push("/login?reset=1"), 3000);
            } else {
                setStatus("error");
                setMessage(data.message || "Failed to reset password.");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-red-500 mb-4">Invalid Link</h1>
                    <p className="text-zinc-600 mb-4">This password reset link is invalid or missing a token.</p>
                    <Link href="/login" className="text-teal-600 hover:underline">Return to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={24} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Reset Password</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Create a new strong password for your account.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                        <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">Password Reset!</h3>
                        <p className="text-sm text-green-600 dark:text-green-500">
                            Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        {status === "error" && (
                            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <AlertCircle size={16} /> {message}
                            </div>
                        )}

                        <button
                            disabled={status === "loading"}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {status === "loading" ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
