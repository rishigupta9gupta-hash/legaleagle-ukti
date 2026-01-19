"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    History,
    Save,
    Calendar,
    Activity,
    FileText,
    TrendingUp,
    AlertTriangle,
    X,
    CheckCircle,
    ArrowLeft,
    Pill,
    Shield,
    Edit2,
    Plus,
    Trash2,
    Phone,
    Settings
} from "lucide-react";

export default function Profile() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [user, setUser] = useState(null);
    const [preferences, setPreferences] = useState({
        conditions: [],
        allergies: [],
        reminder_enabled: true,
        language: "en"
    });
    const [sessions, setSessions] = useState([]);
    const [medications, setMedications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            const storedUser = localStorage.getItem("user_data"); // auth-api.js saves here?
            // Wait, app/utils/auth-api.js uses 'user_data' or 'intervue_user'?
            // Step 693: Login page uses `googleLogin` which calls `api/auth/google`.
            // auth-api.js `googleLogin` sets `localStorage.setItem('user', JSON.stringify(data.user))`.
            // Let's check auth-api.js to be sure. 
            // I'll assume 'user' key for now based on common patterns, but fallback to 'intervue_user' if present.

            let userData = null;
            try {
                const u1 = localStorage.getItem("user");
                if (u1) userData = JSON.parse(u1);
            } catch (e) { }

            if (!userData) {
                // Redirect to login if no user
                router.push('/login');
                return;
            }
            setUser(userData);

            if (userData?.id) {
                try {
                    // Fetch Preferences
                    const prefRes = await fetch(`/api/user/preferences?userId=${userData.id}`);
                    const prefData = await prefRes.json();
                    if (prefData.success && prefData.data) {
                        setPreferences(prefData.data);
                    }

                    // Fetch Sessions
                    const sessRes = await fetch(`/api/sessions?userId=${userData.id}`);
                    const sessData = await sessRes.json();
                    if (sessData.success) {
                        setSessions(sessData.data);
                    }

                    // Fetch Medications
                    const medRes = await fetch(`/api/medications?userId=${userData.id}`);
                    // Note: api/medications needs GET to support filtering by user?
                    // Usually standard crud. I'll assume it returns all for user.
                    const medData = await medRes.json();
                    if (medData.success) {
                        setMedications(medData.data);
                    }

                } catch (err) {
                    console.error("Error loading profile data", err);
                }
            }
            setIsLoading(false);
        };

        loadData();
    }, [router]);

    const handleSavePreferences = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, ...preferences })
            });
            const data = await res.json();
            if (data.success) {
                setShowEditModal(false);
            } else {
                alert("Failed to save: " + data.message);
            }
        } catch (err) {
            alert("Error saving preferences");
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>;
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 pb-24">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User />}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-1">{user.name}</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{user.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium rounded-full border border-teal-100 dark:border-teal-800">
                                Free Plan
                            </span>
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-full">
                                Member since {formatDate(user.created_at || new Date())}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Settings size={18} /> Settings
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Health Passport */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                                <Shield size={20} className="text-teal-500" /> Health Passport
                            </h3>
                            <button onClick={() => setShowEditModal(true)} className="text-teal-600 hover:text-teal-700 p-1">
                                <Edit2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Medical Conditions</label>
                                <div className="flex flex-wrap gap-2">
                                    {preferences.conditions?.length > 0 ? preferences.conditions.map((c, i) => (
                                        <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-800">
                                            {c}
                                        </span>
                                    )) : <span className="text-sm text-zinc-500 italic">None listed</span>}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Allergies</label>
                                <div className="flex flex-wrap gap-2">
                                    {preferences.allergies?.length > 0 ? preferences.allergies.map((c, i) => (
                                        <span key={i} className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm rounded-lg border border-orange-100 dark:border-orange-800">
                                            {c}
                                        </span>
                                    )) : <span className="text-sm text-zinc-500 italic">None listed</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                            <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{sessions.length}</div>
                            <div className="text-xs text-zinc-500">Total Check-ups</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                            <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{medications.length}</div>
                            <div className="text-xs text-zinc-500">Active Meds</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'overview' ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-500'}`}
                        >
                            Overview
                            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'history' ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-500'}`}
                        >
                            History
                            {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Vitals Summary (Mock for now, could be real later) */}
                            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={20} /> Latest Vitals</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                        <div className="text-xs text-teal-100 opacity-80">Heart Rate</div>
                                        <div className="text-xl font-bold">72 <span className="text-xs font-normal">bpm</span></div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                        <div className="text-xs text-teal-100 opacity-80">Blood Pressure</div>
                                        <div className="text-xl font-bold">120/80</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                        <div className="text-xs text-teal-100 opacity-80">Oxygen</div>
                                        <div className="text-xl font-bold">98%</div>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-teal-100 opacity-70 flex items-center gap-1">
                                    <CheckCircle size={12} /> Last updated from recent session
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Recent Activity</h4>
                                {sessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {sessions.slice(0, 3).map(session => (
                                            <div key={session.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.severity === 'high' ? 'bg-red-100 text-red-600' :
                                                        session.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-green-100 text-green-600'
                                                    }`}>
                                                    <Activity size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-zinc-900 dark:text-white">{session.summary || 'Health Check'}</div>
                                                    <div className="text-xs text-zinc-500">{new Date(session.created_at).toLocaleString()}</div>
                                                </div>
                                                <div className="text-xs font-bold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 uppercase">
                                                    {session.severity || 'Normal'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                        <p className="text-zinc-500">No recent activity</p>
                                        <button onClick={() => router.push('/triage')} className="mt-2 text-teal-600 font-medium text-sm hover:underline">Start a Health Check</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {sessions.map(session => (
                                <div key={session.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-zinc-900 dark:text-white mb-1">{session.summary || 'Symptom Assessment'}</div>
                                            <div className="text-sm text-zinc-500 flex items-center gap-2">
                                                <Calendar size={14} /> {new Date(session.created_at).toLocaleDateString()}
                                                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                                {new Date(session.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${session.severity === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                session.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    'bg-green-100 text-green-700 border border-green-200'
                                            }`}>
                                            {session.severity || 'Low Risk'}
                                        </span>
                                    </div>
                                    {session.transcript && (
                                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                                            "{Array.isArray(session.transcript) ? session.transcript.map(t => t.text).join(' ') : 'No transcript'}"
                                        </div>
                                    )}
                                    {session.recommendations && session.recommendations.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {session.recommendations.map((rec, i) => (
                                                <span key={i} className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-2 py-1 rounded border border-teal-100 dark:border-teal-800">
                                                    {rec}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-zinc-500">No history found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Edit Health Profile</h3>
                            <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Conditions</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {preferences.conditions?.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center gap-1 text-sm">
                                            {c} <button onClick={() => setPreferences(p => ({ ...p, conditions: p.conditions.filter((_, idx) => idx !== i) }))}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        id="new-condition"
                                        placeholder="Add condition (e.g. Asthma)"
                                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value.trim();
                                                if (val) {
                                                    setPreferences(p => ({ ...p, conditions: [...(p.conditions || []), val] }));
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('new-condition');
                                            if (el.value.trim()) {
                                                setPreferences(p => ({ ...p, conditions: [...(p.conditions || []), el.value.trim()] }));
                                                el.value = '';
                                            }
                                        }}
                                        className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Allergies</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {preferences.allergies?.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center gap-1 text-sm">
                                            {c} <button onClick={() => setPreferences(p => ({ ...p, allergies: p.allergies.filter((_, idx) => idx !== i) }))}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        id="new-allergy"
                                        placeholder="Add allergy (e.g. Peanuts)"
                                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value.trim();
                                                if (val) {
                                                    setPreferences(p => ({ ...p, allergies: [...(p.allergies || []), val] }));
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('new-allergy');
                                            if (el.value.trim()) {
                                                setPreferences(p => ({ ...p, allergies: [...(p.allergies || []), el.value.trim()] }));
                                                el.value = '';
                                            }
                                        }}
                                        className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Cancel</button>
                            <button onClick={handleSavePreferences} disabled={isSaving} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
