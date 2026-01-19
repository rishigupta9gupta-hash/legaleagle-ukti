"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Heart,
    Shield,
    Mic,
    Camera,
    Bell,
    Globe,
    Pill,
    AlertTriangle,
    HeartPulse,
    Clock,
    Check
} from "lucide-react";

const STEPS = [
    { id: 1, title: "Welcome", icon: HeartPulse },
    { id: 2, title: "Consent", icon: Shield },
    { id: 3, title: "Preferences", icon: Globe },
    { id: 4, title: "Health Profile", icon: Heart },
    { id: 5, title: "Reminders", icon: Bell }
];

export default function Onboarding() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        consentGiven: false,
        microphoneConsent: false,
        cameraConsent: false,
        dataConsent: false,
        language: "english",
        conditions: [],
        medications: [],
        allergies: "",
        reminderTime: "09:00",
        reminderEnabled: true
    });

    const conditions = [
        "Diabetes", "Hypertension", "Asthma", "PCOS", "Thyroid",
        "Heart Condition", "Arthritis", "Migraine", "None"
    ];

    const handleConditionToggle = (condition) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.includes(condition)
                ? prev.conditions.filter(c => c !== condition)
                : [...prev.conditions, condition]
        }));
    };

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Save preferences to localStorage
            localStorage.setItem('viraPreferences', JSON.stringify(formData));
            router.push('/triage');
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: return true;
            case 2: return formData.consentGiven && formData.microphoneConsent;
            case 3: return true;
            case 4: return true;
            case 5: return true;
            default: return false;
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="text-center space-y-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                            <HeartPulse size={48} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
                                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">VIRA</span>
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                                Your AI health companion. Let's set up your experience in just a few steps.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            {[
                                { icon: Mic, title: "Voice Talks", desc: "Natural health conversations" },
                                { icon: Shield, title: "Private & Secure", desc: "Your data stays safe" },
                                { icon: Heart, title: "Personalized", desc: "Tailored to your needs" }
                            ].map((item, i) => (
                                <div key={i} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl">
                                    <item.icon size={24} className="text-teal-500 mb-2 mx-auto" />
                                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{item.title}</h4>
                                    <p className="text-xs text-zinc-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Consent & Permissions</h2>
                            <p className="text-zinc-600 dark:text-zinc-400">Help us understand what access you're comfortable with</p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-amber-800 dark:text-amber-300">Important</h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        VIRA is an AI assistant, <strong>not a doctor</strong>. Always consult healthcare professionals for medical decisions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.consentGiven}
                                    onChange={e => setFormData(prev => ({ ...prev, consentGiven: e.target.checked }))}
                                    className="w-5 h-5 mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Shield size={18} className="text-teal-500" />
                                        <span className="font-medium text-zinc-900 dark:text-white">I understand & agree</span>
                                        <span className="text-red-500">*</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        I understand VIRA provides health guidance only, not medical diagnoses or prescriptions.
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.microphoneConsent}
                                    onChange={e => setFormData(prev => ({ ...prev, microphoneConsent: e.target.checked }))}
                                    className="w-5 h-5 mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Mic size={18} className="text-teal-500" />
                                        <span className="font-medium text-zinc-900 dark:text-white">Microphone Access</span>
                                        <span className="text-red-500">*</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        Allow voice conversations with VIRA for symptom assessment.
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.cameraConsent}
                                    onChange={e => setFormData(prev => ({ ...prev, cameraConsent: e.target.checked }))}
                                    className="w-5 h-5 mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Camera size={18} className="text-teal-500" />
                                        <span className="font-medium text-zinc-900 dark:text-white">Camera Access</span>
                                        <span className="text-xs text-zinc-400">(optional)</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        Enable visual symptom assessment and medicine scanning.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Your Preferences</h2>
                            <p className="text-zinc-600 dark:text-zinc-400">Customize your VIRA experience</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Globe size={16} className="inline mr-2" />
                                    Preferred Language
                                </label>
                                <select
                                    value={formData.language}
                                    onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                    className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="english">English</option>
                                    <option value="hindi">Hindi</option>
                                    <option value="spanish">Spanish</option>
                                    <option value="french">French</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Health Profile</h2>
                            <p className="text-zinc-600 dark:text-zinc-400">Help VIRA understand your health better (optional)</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                    <Heart size={16} className="inline mr-2" />
                                    Existing Conditions
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {conditions.map(condition => (
                                        <button
                                            key={condition}
                                            onClick={() => handleConditionToggle(condition)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${formData.conditions.includes(condition)
                                                    ? 'bg-teal-500 text-white'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {formData.conditions.includes(condition) && <Check size={14} className="inline mr-1" />}
                                            {condition}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Pill size={16} className="inline mr-2" />
                                    Current Medications (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Metformin, Vitamin D"
                                    value={formData.medications.join(', ')}
                                    onChange={e => setFormData(prev => ({ ...prev, medications: e.target.value.split(',').map(m => m.trim()) }))}
                                    className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <AlertTriangle size={16} className="inline mr-2" />
                                    Known Allergies (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Penicillin, Peanuts"
                                    value={formData.allergies}
                                    onChange={e => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                                    className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Reminders</h2>
                            <p className="text-zinc-600 dark:text-zinc-400">Set up health check-in reminders</p>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center gap-3">
                                    <Bell size={20} className="text-teal-500" />
                                    <div>
                                        <span className="font-medium text-zinc-900 dark:text-white">Daily Health Check-in</span>
                                        <p className="text-sm text-zinc-500">Get a gentle reminder for wellness check</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.reminderEnabled}
                                    onChange={e => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                                    className="w-5 h-5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                                />
                            </label>

                            {formData.reminderEnabled && (
                                <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        <Clock size={16} className="inline mr-2" />
                                        Reminder Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.reminderTime}
                                        onChange={e => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="text-center pt-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h3 className="font-bold text-xl text-zinc-900 dark:text-white">You're All Set!</h3>
                            <p className="text-zinc-500 mt-2">Click complete to start your health journey with VIRA</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
            {/* Progress Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-4 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                                <HeartPulse size={16} className="text-white" />
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-white">VIRA</span>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm"
                        >
                            Skip for now
                        </button>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex-1 flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep > step.id
                                        ? 'bg-teal-500 text-white'
                                        : currentStep === step.id
                                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 ring-2 ring-teal-500'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                    }`}>
                                    {currentStep > step.id ? <Check size={16} /> : step.id}
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 rounded-full ${currentStep > step.id ? 'bg-teal-500' : 'bg-zinc-200 dark:bg-zinc-800'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    {renderStepContent()}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-4 px-6">
                <div className="max-w-3xl mx-auto flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${currentStep === 1
                                ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        <ChevronLeft size={20} />
                        Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${isStepValid()
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-500/20'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            }`}
                    >
                        {currentStep === 5 ? 'Complete Setup' : 'Continue'}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
