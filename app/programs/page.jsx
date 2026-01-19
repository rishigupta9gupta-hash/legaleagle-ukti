"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Heart, Activity, Brain, Scale, Droplets, Smile,
    HeartPulse, CheckCircle, ChevronRight, Calendar, TrendingUp
} from "lucide-react";

const PROGRAMS = [
    {
        id: 'pcos',
        name: 'PCOS Care',
        description: 'Manage PCOS symptoms with daily exercises, diet tips, and mood tracking',
        icon: Heart,
        color: 'from-pink-500 to-rose-500',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        borderColor: 'border-pink-200 dark:border-pink-800',
        activities: [
            { id: 1, name: 'Morning yoga (15 mins)', type: 'exercise' },
            { id: 2, name: 'Drink 2L water', type: 'hydration' },
            { id: 3, name: 'Low-GI breakfast', type: 'diet' },
            { id: 4, name: 'Evening walk (20 mins)', type: 'exercise' },
            { id: 5, name: 'Track mood', type: 'wellness' },
            { id: 6, name: 'Sleep by 10:30 PM', type: 'sleep' }
        ]
    },
    {
        id: 'diabetes',
        name: 'Diabetes Management',
        description: 'Track blood sugar, manage diet, and stay active for better control',
        icon: Activity,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        activities: [
            { id: 1, name: 'Check fasting sugar', type: 'checkup' },
            { id: 2, name: 'Low-carb breakfast', type: 'diet' },
            { id: 3, name: 'Post-meal walk (15 mins)', type: 'exercise' },
            { id: 4, name: 'Check post-meal sugar', type: 'checkup' },
            { id: 5, name: 'Evening exercise (30 mins)', type: 'exercise' },
            { id: 6, name: 'Light dinner before 8 PM', type: 'diet' }
        ]
    },
    {
        id: 'stress',
        name: 'Stress Relief',
        description: 'Daily meditation, breathing exercises, and anxiety management',
        icon: Brain,
        color: 'from-purple-500 to-indigo-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        activities: [
            { id: 1, name: 'Morning meditation (10 mins)', type: 'wellness' },
            { id: 2, name: 'Deep breathing (5 mins)', type: 'breathing' },
            { id: 3, name: 'Screen break every hour', type: 'wellness' },
            { id: 4, name: 'Gratitude journaling', type: 'wellness' },
            { id: 5, name: 'Evening relaxation', type: 'wellness' },
            { id: 6, name: 'No screens 1hr before bed', type: 'sleep' }
        ]
    },
    {
        id: 'weight',
        name: 'Weight Management',
        description: 'Balanced diet, regular exercise, and healthy lifestyle habits',
        icon: Scale,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        activities: [
            { id: 1, name: 'Morning weigh-in', type: 'checkup' },
            { id: 2, name: 'Protein-rich breakfast', type: 'diet' },
            { id: 3, name: 'Morning workout (30 mins)', type: 'exercise' },
            { id: 4, name: 'Drink 3L water', type: 'hydration' },
            { id: 5, name: 'Avoid sugar/junk', type: 'diet' },
            { id: 6, name: 'Track calories', type: 'diet' }
        ]
    }
];

export default function ProgramsPage() {
    const router = useRouter();
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [progress, setProgress] = useState({});
    const [moodLog, setMoodLog] = useState([]);
    const [waterIntake, setWaterIntake] = useState(0);

    // Load progress from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('viraProgramProgress');
        if (saved) setProgress(JSON.parse(saved));

        const savedMood = localStorage.getItem('viraMoodLog');
        if (savedMood) setMoodLog(JSON.parse(savedMood));

        const savedWater = localStorage.getItem('viraWater');
        if (savedWater) {
            const data = JSON.parse(savedWater);
            if (data.date === new Date().toDateString()) {
                setWaterIntake(data.glasses);
            }
        }
    }, []);

    // Save progress
    useEffect(() => {
        localStorage.setItem('viraProgramProgress', JSON.stringify(progress));
    }, [progress]);

    const today = new Date().toDateString();

    const toggleActivity = (programId, activityId) => {
        setProgress(prev => {
            const key = `${programId}-${today}`;
            const current = prev[key] || [];
            const updated = current.includes(activityId)
                ? current.filter(id => id !== activityId)
                : [...current, activityId];
            return { ...prev, [key]: updated };
        });
    };

    const getCompletedCount = (programId) => {
        const key = `${programId}-${today}`;
        return progress[key]?.length || 0;
    };

    const addWater = () => {
        const newIntake = waterIntake + 1;
        setWaterIntake(newIntake);
        localStorage.setItem('viraWater', JSON.stringify({ date: today, glasses: newIntake }));
    };

    const logMood = (mood) => {
        const entry = { mood, date: new Date().toISOString() };
        const updated = [...moodLog, entry];
        setMoodLog(updated);
        localStorage.setItem('viraMoodLog', JSON.stringify(updated));
    };

    const program = selectedProgram ? PROGRAMS.find(p => p.id === selectedProgram) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => selectedProgram ? setSelectedProgram(null) : router.push('/')}
                    className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">{selectedProgram ? 'Programs' : 'Back'}</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <HeartPulse size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-white">Care Programs</div>
                        <div className="text-xs text-zinc-500">Daily wellness activities</div>
                    </div>
                </div>

                <div className="w-20" />
            </header>

            <div className="max-w-4xl mx-auto p-6 md:p-8">
                {!selectedProgram ? (
                    <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Droplets className="text-cyan-500" size={20} />
                                    <span className="text-sm text-zinc-500">Water Today</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">{waterIntake}/8 glasses</span>
                                    <button onClick={addWater} className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-lg hover:bg-cyan-200">+</button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Smile className="text-amber-500" size={20} />
                                    <span className="text-sm text-zinc-500">How are you?</span>
                                </div>
                                <div className="flex gap-2">
                                    {['😊', '😐', '😔', '😫'].map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => logMood(emoji)}
                                            className="text-2xl hover:scale-125 transition-transform"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Program Cards */}
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Choose a Program</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PROGRAMS.map(prog => {
                                const Icon = prog.icon;
                                const completed = getCompletedCount(prog.id);
                                const total = prog.activities.length;
                                const percentage = Math.round((completed / total) * 100);

                                return (
                                    <button
                                        key={prog.id}
                                        onClick={() => setSelectedProgram(prog.id)}
                                        className={`${prog.bgColor} ${prog.borderColor} border rounded-2xl p-6 text-left hover:shadow-lg transition-all group`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prog.color} flex items-center justify-center`}>
                                                <Icon size={24} className="text-white" />
                                            </div>
                                            <ChevronRight size={20} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">{prog.name}</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{prog.description}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-white/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r ${prog.color}`} style={{ width: `${percentage}%` }} />
                                            </div>
                                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{completed}/{total}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : program && (
                    <>
                        {/* Program Detail */}
                        <div className={`${program.bgColor} ${program.borderColor} border rounded-3xl p-6 mb-6`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center`}>
                                    <program.icon size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{program.name}</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Today's Activities</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-zinc-500" />
                                <span className="text-sm text-zinc-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Activities */}
                        <div className="space-y-3">
                            {program.activities.map(activity => {
                                const key = `${program.id}-${today}`;
                                const isCompleted = progress[key]?.includes(activity.id);

                                return (
                                    <button
                                        key={activity.id}
                                        onClick={() => toggleActivity(program.id, activity.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCompleted
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                            }`}>
                                            <CheckCircle size={20} />
                                        </div>
                                        <span className={`flex-1 text-left font-medium ${isCompleted ? 'text-green-700 dark:text-green-400 line-through' : 'text-zinc-900 dark:text-white'
                                            }`}>
                                            {activity.name}
                                        </span>
                                        <span className="text-xs text-zinc-400 capitalize px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                            {activity.type}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Progress Summary */}
                        <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp size={20} className="text-teal-500" />
                                <span className="font-bold text-zinc-900 dark:text-white">Today's Progress</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${program.color}`}
                                        style={{ width: `${(getCompletedCount(program.id) / program.activities.length) * 100}%` }}
                                    />
                                </div>
                                <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                    {getCompletedCount(program.id)}/{program.activities.length}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
