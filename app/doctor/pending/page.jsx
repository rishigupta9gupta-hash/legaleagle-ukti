"use client";

import React from "react";
import Link from "next/link";
import { Clock, ArrowLeft, ShieldCheck } from "lucide-react";

export default function PendingApproval() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="bg-amber-500/10 p-8 flex flex-col items-center text-center border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                        <Clock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Application Under Review</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Thank you for registering with Vira. Your application is currently being reviewed by our administrative team.
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-500" />
                            What happens next?
                        </h3>
                        <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <li className="flex gap-2">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
                                We will verify your medical certification and credentials.
                            </li>
                            <li className="flex gap-2">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
                                This process usually takes 24-48 hours.
                            </li>
                            <li className="flex gap-2">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
                                Once approved, you will be able to log in and access your dashboard.
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-center rounded-xl font-medium transition-colors"
                        >
                            Return to Home
                        </Link>
                        <p className="text-center text-xs text-zinc-400">
                            Questions? Contact support@vira.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
