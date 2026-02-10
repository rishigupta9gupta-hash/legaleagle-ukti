"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft, Stethoscope, Clock, Star, MessageCircle,
    Phone, Mail, MapPin, Award, Calendar, Shield, FileText, Image as ImageIcon
} from "lucide-react";
import { getClientSession } from "@/app/utils/auth-api";

export default function DoctorProfilePage() {
    const router = useRouter();
    const params = useParams();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [certifications, setCertifications] = useState([]);

    useEffect(() => {
        const session = getClientSession();
        setUser(session);

        const fetchDoctor = async () => {
            try {
                const res = await fetch(`/api/doctors/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    setDoctor(data.doctor);
                }
            } catch (err) {
                console.error('Failed to fetch doctor:', err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchDoctor();
    }, [params.id]);

    // Fetch certifications when doctor loads
    useEffect(() => {
        if (!doctor?.email) return;
        const fetchCerts = async () => {
            try {
                const res = await fetch(`/api/profile/certifications?email=${encodeURIComponent(doctor.email)}`);
                const data = await res.json();
                if (data.success) setCertifications(data.certifications || []);
            } catch (err) { console.error('Failed to fetch certifications:', err); }
        };
        fetchCerts();
    }, [doctor?.email]);

    const handleStartChat = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: doctor.email,
                    content: 'Hello, I would like to consult with you.'
                })
            });
            router.push(`/chat?with=${encodeURIComponent(doctor.email)}`);
        } catch (err) {
            console.error('Failed to start chat:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Doctor not found</h2>
                <button
                    onClick={() => router.push('/doctors')}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium"
                >
                    Browse Doctors
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>

                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                            {doctor.avatar_url ? (
                                <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover object-top" />
                            ) : (
                                doctor.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-1">Dr. {doctor.name}</h1>
                            <div className="flex items-center gap-2 text-white/80 mb-4">
                                <Stethoscope size={18} />
                                <span className="text-lg">{doctor.specialization || 'General Medicine'}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-white/70">
                                {doctor.experience_years > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} /> {doctor.experience_years} years experience
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} /> Joined {new Date(doctor.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* About */}
                        {doctor.bio && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                                <h3 className="font-bold text-zinc-900 dark:text-white mb-3">About</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {doctor.bio}
                                </p>
                            </div>
                        )}

                        {/* Specialization Details */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Expertise</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                    <Stethoscope size={20} className="text-emerald-600" />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{doctor.specialization}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Shield size={20} className="text-blue-600" />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Verified Doctor</span>
                                </div>
                                {doctor.experience_years > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <Award size={20} className="text-purple-600" />
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{doctor.experience_years}+ years</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                    <Star size={20} className="text-orange-600" />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Top Rated</span>
                                </div>
                            </div>
                        </div>

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Award size={20} className="text-emerald-500" />
                                    Certifications & Documents
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {certifications.map(cert => (
                                        <div key={cert.id} className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden group">
                                            {cert.file_type === 'image' ? (
                                                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                    <img
                                                        src={cert.file_url}
                                                        alt={cert.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                            ) : (
                                                <a
                                                    href={cert.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="aspect-video bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                                >
                                                    <FileText size={32} className="text-red-500" />
                                                    <span className="text-xs text-zinc-500">View PDF</span>
                                                </a>
                                            )}
                                            <div className="p-3">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{cert.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Contact Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Contact</h3>
                            <div className="space-y-3">
                                {doctor.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone size={16} className="text-emerald-500" />
                                        <span className="text-zinc-600 dark:text-zinc-400">{doctor.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail size={16} className="text-emerald-500" />
                                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{doctor.email}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleStartChat}
                                className="w-full mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={20} />
                                Start Chat
                            </button>
                        </div>

                        {/* Quick Info */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800">
                            <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">💡 Chat for Free</h4>
                            <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                Send messages, share symptoms, and get initial guidance directly from the doctor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
