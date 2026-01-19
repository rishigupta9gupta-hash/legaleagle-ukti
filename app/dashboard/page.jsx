"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Heart, Pill, FileText, Activity,
    HeartPulse, ChevronRight, Calendar, Settings,
    Droplets, TrendingUp, Clock, User
} from "lucide-react";
import { getMedications } from "@/app/utils/medication-api";
import { getSessions } from "@/app/utils/session-api";
import { getReports } from "@/app/utils/report-api";

// ... (existing imports)

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        healthChecks: 0,
        medications: 0,
        dayStreak: 0
    });
    const [sessions, setSessions] = useState([]);
    const [medications, setMedications] = useState([]);
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            const [medsRes, sessionsRes, reportsRes] = await Promise.all([
                getMedications(),
                getSessions(),
                getReports()
            ]);

            const meds = medsRes.success ? medsRes.data : [];
            const sess = sessionsRes.success ? sessionsRes.data : [];
            const reps = reportsRes.success ? reportsRes.data : [];

            setMedications(meds);
            setSessions(sess);
            setReports(reps);

            // Calculate Streak
            let streak = 0;
            if (sess.length > 0) {
                const dates = sess.map(s => new Date(s.created_at).toDateString());
                const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

                streak = 1; // At least today/last session
                // Simple streak logic (consecutive days) could be added here
                // For now, we'll just count recent active days or keep it simple
                streak = uniqueDates.length;
            }

            setStats({
                healthChecks: sess.length,
                medications: meds.length,
                dayStreak: streak
            });
        };

        loadDashboardData();
    }, []);

    const tabs = [
        { id: 'overview', name: 'Overview', icon: Activity },
        { id: 'checks', name: 'Health Checks', icon: Heart },
        { id: 'meds', name: 'Medications', icon: Pill },
        { id: 'reports', name: 'Reports', icon: FileText }
    ];

    const quickActions = [
        { name: 'Health Check', path: '/triage', icon: Heart, color: 'from-teal-500 to-cyan-500' },
        { name: 'Medications', path: '/medication', icon: Pill, color: 'from-orange-500 to-pink-500' },
        { name: 'Reports', path: '/reports', icon: FileText, color: 'from-blue-500 to-indigo-500' },
        { name: 'Programs', path: '/programs', icon: Activity, color: 'from-purple-500 to-pink-500' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <User size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-white">My Dashboard</div>
                    </div>
                </div>

                <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                    <Settings size={20} />
                </button>
            </header>

            <div className="max-w-5xl mx-auto p-6 md:p-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-8 mb-8 text-white">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, User!</h1>
                    <p className="text-white/80 mb-6">Your health journey at a glance</p>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.healthChecks}</div>
                            <div className="text-sm text-white/80">Health Checks</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.medications}</div>
                            <div className="text-sm text-white/80">Medications</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.dayStreak}</div>
                            <div className="text-sm text-white/80">Day Streak</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActions.map(action => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.name}
                                        onClick={() => router.push(action.path)}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon size={24} className="text-white" />
                                        </div>
                                        <h3 className="font-bold text-zinc-900 dark:text-white">{action.name}</h3>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold text-zinc-900 dark:text-white">Recent Activity</h3>
                                <Clock size={18} className="text-zinc-400" />
                            </div>
                            <div className="p-6">
                                {sessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {sessions.slice(0, 5).map((session, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                                    <Heart size={18} className="text-teal-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-zinc-900 dark:text-white">Health Check</div>
                                                    <div className="text-xs text-zinc-500">{new Date(session.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${session.severity === 'low' ? 'bg-green-100 text-green-700' :
                                                    session.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {session.severity || 'Low'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                            <Activity size={32} className="text-zinc-400" />
                                        </div>
                                        <p className="text-zinc-500">No activity yet</p>
                                        <button
                                            onClick={() => router.push('/triage')}
                                            className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-xl font-medium"
                                        >
                                            Start Health Check
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'checks' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        {sessions.length > 0 ? (
                            <div className="space-y-4">
                                {sessions.map((session, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                        <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                            <HeartPulse size={24} className="text-teal-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-zinc-900 dark:text-white">Health Assessment</div>
                                            <div className="text-sm text-zinc-500">{new Date(session.created_at).toLocaleString()}</div>
                                        </div>
                                        <ChevronRight size={20} className="text-zinc-400" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Heart size={48} className="mx-auto text-zinc-300 mb-4" />
                                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">No health checks yet</h3>
                                <p className="text-zinc-500 mb-4">Start a conversation with VIRA to track your health</p>
                                <button onClick={() => router.push('/triage')} className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold">
                                    Start Health Check
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'meds' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        {medications.length > 0 ? (
                            <div className="space-y-4">
                                {medications.map((med, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                            <Pill size={24} className="text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-zinc-900 dark:text-white">{med.name}</div>
                                            <div className="text-sm text-zinc-500">{med.dosage} • {med.frequency}</div>
                                        </div>
                                        <span className="text-sm text-zinc-500">{med.time}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Pill size={48} className="mx-auto text-zinc-300 mb-4" />
                                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">No medications tracked</h3>
                                <p className="text-zinc-500 mb-4">Add your medications to track them easily</p>
                                <button onClick={() => router.push('/medication')} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold">
                                    Add Medication
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-zinc-300 mb-4" />
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">No reports uploaded</h3>
                            <p className="text-zinc-500 mb-4">Upload medical reports for AI analysis</p>
                            <button onClick={() => router.push('/reports')} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold">
                                Upload Report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
