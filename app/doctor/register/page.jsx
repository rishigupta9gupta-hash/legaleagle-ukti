"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle, ArrowLeft, Stethoscope, Phone, Briefcase, FileText } from "lucide-react";

export default function DoctorRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        specialization: "",
        experience_years: "",
        bio: "",
        certificationFile: null
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const specializations = [
        "General Medicine",
        "Cardiology",
        "Dermatology",
        "Orthopedics",
        "Pediatrics",
        "Gynecology",
        "Neurology",
        "Psychiatry",
        "ENT",
        "Ophthalmology",
        "Dentistry",
        "Ayurveda",
        "Homeopathy",
        "Physiotherapy",
        "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!formData.name || !formData.email || !formData.password || !formData.specialization || !formData.certificationFile) {
            setError("Please fill in all required fields, including certification.");
            setLoading(false);
            return;
        }

        try {
            // 1. Upload certification
            const uploadData = new FormData();
            uploadData.append('file', formData.certificationFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });

            const uploadResult = await uploadRes.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.message || 'File upload failed');
            }

            const certificationUrl = uploadResult.url;

            // 2. Register doctor
            const res = await fetch("/api/auth/doctor-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    experience_years: parseInt(formData.experience_years) || 0,
                    certificationUrl,
                    certificationFile: undefined // don't send file object
                }),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/login?success=1&role=doctor&message=Account created. Please wait for admin approval.");
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden md:flex flex-col bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-teal-900/50" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-20">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <Stethoscope size={18} className="text-white" />
                        </div>
                        VIRA for Doctors
                    </Link>

                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold mb-6">Join Vira as a Healthcare Provider</h1>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Connect with patients, provide consultations, and grow your practice with AI-powered health insights.
                        </p>

                        <div className="mt-12 space-y-4">
                            {[
                                { icon: "💬", title: "Direct Patient Chat", desc: "Communicate with patients securely" },
                                { icon: "📊", title: "Patient Insights", desc: "View AI-generated health reports" },
                                { icon: "🏥", title: "Grow Your Practice", desc: "Get discovered by patients nearby" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                                    <span className="text-2xl">{item.icon}</span>
                                    <div>
                                        <div className="font-semibold">{item.title}</div>
                                        <div className="text-sm text-zinc-400">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-auto text-sm text-zinc-500">
                    © 2024 Vira Health AI. All rights reserved.
                </div>
            </div>

            {/* Right: Registration Form */}
            <div className="flex flex-col justify-center p-6 md:p-12 lg:p-16 bg-white dark:bg-zinc-950 overflow-y-auto">
                <div className="max-w-md w-full mx-auto">
                    <Link href="/" className="md:hidden flex items-center gap-2 mb-8 text-zinc-500">
                        <ArrowLeft size={20} /> Back
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Stethoscope size={24} className="text-emerald-500" />
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Doctor Registration</h2>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Create your professional account on Vira
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-800">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Dr. Full Name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="doctor@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    <Phone size={14} className="inline mr-1" />Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="+91 98765..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    <Briefcase size={14} className="inline mr-1" />Experience (yrs)
                                </label>
                                <input
                                    type="number"
                                    value={formData.experience_years}
                                    onChange={(e) => updateField("experience_years", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="5"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Specialization *</label>
                            <select
                                value={formData.specialization}
                                onChange={(e) => updateField("specialization", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            >
                                <option value="">Select Specialization</option>
                                {specializations.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                <FileText size={14} className="inline mr-1" />Certification (Proof of License) *
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => updateField("certificationFile", e.target.files[0])}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                            <p className="text-xs text-zinc-500 mt-1">Upload your medical license or certification.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                <FileText size={14} className="inline mr-1" />Bio
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => updateField("bio", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Brief description of your practice and expertise..."
                                rows={3}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : <>Register as Doctor <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-zinc-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
                            Log in
                        </Link>
                    </p>

                    <p className="mt-2 text-center text-sm text-zinc-500">
                        Not a doctor?{" "}
                        <Link href="/signup" className="font-bold text-teal-600 hover:text-teal-700">
                            Sign up as Patient
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
