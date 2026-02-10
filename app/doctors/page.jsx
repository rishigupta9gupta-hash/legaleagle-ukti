"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Search, Stethoscope, Clock, Star,
    MessageCircle, Phone, Filter, ChevronRight
} from "lucide-react";
import { getClientSession } from "@/app/utils/auth-api";

export default function DoctorsPage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSpec, setSelectedSpec] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const specializations = [
        "All", "General Medicine", "Cardiology", "Dermatology", "Orthopedics",
        "Pediatrics", "Gynecology", "Neurology", "Psychiatry", "ENT",
        "Ophthalmology", "Dentistry", "Ayurveda", "Homeopathy", "Physiotherapy"
    ];

    useEffect(() => {
        const session = getClientSession();
        setUser(session);

        const fetchDoctors = async () => {
            try {
                const res = await fetch('/api/doctors');
                const data = await res.json();
                if (data.success) {
                    setDoctors(data.doctors);
                    setFilteredDoctors(data.doctors);
                }
            } catch (err) {
                console.error('Failed to fetch doctors:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    useEffect(() => {
        let filtered = doctors;

        if (searchQuery) {
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedSpec && selectedSpec !== "All") {
            filtered = filtered.filter(d => d.specialization === selectedSpec);
        }

        setFilteredDoctors(filtered);
    }, [searchQuery, selectedSpec, doctors]);

    const handleStartChat = async (doctorEmail) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            // Send initial message to auto-create conversation
            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: doctorEmail,
                    content: 'Hello, I would like to consult with you.'
                })
            });
            router.push(`/chat?with=${encodeURIComponent(doctorEmail)}`);
        } catch (err) {
            console.error('Failed to start chat:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>

                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Find a Doctor</h1>
                    <p className="text-white/80 text-lg">Browse healthcare providers and start a conversation</p>

                    {/* Search */}
                    <div className="mt-6 relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or specialization..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Specialization Filter */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {specializations.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSelectedSpec(spec === "All" ? "" : spec)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${(spec === "All" && !selectedSpec) || selectedSpec === spec
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                                }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>

                {/* Doctors Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden hover:shadow-xl transition-all group"
                            >
                                {/* Doctor Card Header */}
                                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
                                            {doctor.avatar_url ? (
                                                <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover object-top" />
                                            ) : (
                                                doctor.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">
                                                Dr. {doctor.name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                                <Stethoscope size={14} />
                                                {doctor.specialization || 'General'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Doctor Card Body */}
                                <div className="p-6 space-y-4">
                                    {doctor.bio && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                            {doctor.bio}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                        {doctor.experience_years > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {doctor.experience_years} yrs exp
                                            </div>
                                        )}
                                        {doctor.phone && (
                                            <div className="flex items-center gap-1">
                                                <Phone size={14} />
                                                Available
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => router.push(`/doctors/${doctor.id}`)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => handleStartChat(doctor.email)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1"
                                        >
                                            <MessageCircle size={16} />
                                            Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                            <Stethoscope size={40} className="text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No doctors found</h3>
                        <p className="text-zinc-500">
                            {searchQuery || selectedSpec ? "Try adjusting your search or filters" : "No doctors have registered yet"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
