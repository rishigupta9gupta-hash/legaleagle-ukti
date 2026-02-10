"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, MessageCircle, Users, Calendar, Settings,
    Stethoscope, ChevronRight, Clock, Activity, Phone, Star
} from "lucide-react";
import { getClientSession } from "@/app/utils/auth-api";

export default function DoctorDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getClientSession();
        if (!session) {
            router.push('/login');
            return;
        }
        if (session.role !== 'doctor') {
            router.push('/dashboard');
            return;
        }
        setUser(session);

        // Load conversations
        const loadConversations = async () => {
            try {
                const res = await fetch(`/api/chat?user=${encodeURIComponent(session.email)}`);
                const data = await res.json();
                if (Array.isArray(data.clients)) {
                    setConversations(data.clients);
                }
            } catch (err) {
                console.error('Failed to load conversations:', err);
            } finally {
                setLoading(false);
            }
        };
        loadConversations();
    }, [router]);

    const quickActions = [
        { name: 'My Chats', path: '/chat', icon: MessageCircle, color: 'from-emerald-500 to-teal-500', desc: 'Connect with patients' },
        { name: 'My Profile', path: '/profile', icon: Settings, color: 'from-blue-500 to-indigo-500', desc: 'Update your info' },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Home</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Stethoscope size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-white">Doctor Dashboard</div>
                    </div>
                </div>

                <button onClick={() => router.push('/profile')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                    <Settings size={20} />
                </button>
            </header>

            <div className="max-w-5xl mx-auto p-6 md:p-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-8 mb-8 text-white">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, Dr. {user.name}!</h1>
                    <p className="text-white/80 mb-4">{user.specialization || 'Healthcare Provider'}</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold">{conversations.length}</div>
                            <div className="text-sm text-white/80">Active Chats</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold">—</div>
                            <div className="text-sm text-white/80">Patients Today</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center hidden md:block">
                            <div className="flex items-center justify-center gap-1 text-3xl font-bold">
                                <Star size={24} /> 5.0
                            </div>
                            <div className="text-sm text-white/80">Rating</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {quickActions.map(action => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.name}
                                onClick={() => router.push(action.path)}
                                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all group text-left"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} className="text-white" />
                                </div>
                                <h3 className="font-bold text-zinc-900 dark:text-white">{action.name}</h3>
                                <p className="text-sm text-zinc-500 mt-1">{action.desc}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Recent Patient Chats */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900 dark:text-white">Recent Patient Conversations</h3>
                        <button
                            onClick={() => router.push('/chat')}
                            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                        >
                            View All →
                        </button>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                            </div>
                        ) : conversations.length > 0 ? (
                            <div className="space-y-3">
                                {conversations.slice(0, 5).map((conv, i) => (
                                    <button
                                        key={conv.email || i}
                                        onClick={() => router.push(`/chat?with=${encodeURIComponent(conv.email)}`)}
                                        className="w-full flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                                            {conv.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-zinc-900 dark:text-white">{conv.username || 'Patient'}</div>
                                            <div className="text-xs text-zinc-500">{conv.email}</div>
                                        </div>
                                        <ChevronRight size={20} className="text-zinc-400" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle size={32} className="text-zinc-400" />
                                </div>
                                <p className="text-zinc-500">No patient conversations yet</p>
                                <p className="text-sm text-zinc-400 mt-1">Patients will be able to find and chat with you</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
