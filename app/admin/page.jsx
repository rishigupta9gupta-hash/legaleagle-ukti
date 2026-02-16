"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientSession } from '../utils/auth-api';
import { ShieldCheck, UserCheck, AlertCircle, FileText, CheckCircle, Clock, Ban, Trash2, XCircle, ChevronDown, Eye } from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, SUSPENDED, ALL
    const [selectedDoctor, setSelectedDoctor] = useState(null); // For detail modal

    useEffect(() => {
        const sessionUser = getClientSession();
        if (!sessionUser || !sessionUser.isAdmin) {
            router.push('/');
            return;
        }
        setUser(sessionUser);
        fetchDoctors();
    }, [activeTab]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            // If ALL, don't send status param
            const url = activeTab === 'ALL'
                ? '/api/admin/doctors'
                : `/api/admin/doctors?status=${activeTab}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setDoctors(data.doctors);
            } else {
                setError('Failed to fetch doctors');
            }
        } catch (err) {
            setError('Error fetching doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (doctorId, newStatus) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            const res = await fetch('/api/admin/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                // Refresh list or remove from current list if filtering
                fetchDoctors();
                alert(`Doctor status updated to ${newStatus}`);
                setSelectedDoctor(null); // Close modal if open
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            alert('Error updating status');
        }
    };

    const handleDelete = async (doctorId) => {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this doctor? This action cannot be undone.')) return;

        try {
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId })
            });
            const data = await res.json();
            if (data.success) {
                setDoctors(doctors.filter(d => d.id !== doctorId));
                alert('Doctor deleted successfully');
                setSelectedDoctor(null);
            } else {
                alert(data.message || 'Failed to delete doctor');
            }
        } catch (err) {
            alert('Error deleting doctor');
        }
    };

    const DetailModal = ({ doctor, onClose }) => {
        if (!doctor) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                        <h2 className="text-xl font-bold">Doctor Details</h2>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</label>
                                    <p className="text-lg font-medium">{doctor.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</label>
                                    <p className="text-base">{doctor.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phone</label>
                                    <p className="text-base">{doctor.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Joined</label>
                                    <p className="text-base">{new Date(doctor.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Specialization</label>
                                    <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {doctor.specialization}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Experience</label>
                                    <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        {doctor.experience_years} Years
                                    </span>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Current Status</label>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${doctor.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                            doctor.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                doctor.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                        }`}>
                                        {doctor.status || 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bio</label>
                            <div className="mt-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-sm leading-relaxed border border-zinc-100 dark:border-zinc-800">
                                {doctor.bio || 'No bio provided.'}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Certification</label>
                            {doctor.certificationUrl ? (
                                <a
                                    href={doctor.certificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition-colors group"
                                >
                                    <FileText className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <span className="font-medium text-zinc-700 dark:text-zinc-200">View Certification Document</span>
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                                    <AlertCircle /> No certification uploaded
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {doctor.status !== 'APPROVED' && (
                                <button
                                    onClick={() => handleStatusUpdate(doctor.id, 'APPROVED')}
                                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} /> Approve
                                </button>
                            )}

                            {doctor.status === 'APPROVED' && (
                                <button
                                    onClick={() => handleStatusUpdate(doctor.id, 'SUSPENDED')}
                                    className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-500/20 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                                >
                                    <Ban size={18} /> Suspend
                                </button>
                            )}

                            {doctor.status !== 'BANNED' && (
                                <button
                                    onClick={() => handleStatusUpdate(doctor.id, 'BANNED')}
                                    className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-500/20 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                                >
                                    <Ban size={18} /> Ban
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(doctor.id)}
                                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl font-medium shadow-lg shadow-zinc-500/20 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} /> Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
                    {['PENDING', 'APPROVED', 'SUSPENDED', 'BANNED', 'ALL'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab
                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-500/20'
                                    : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
                                }`}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[400px]">
                    <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                            <UserCheck size={20} />
                            <span className="hidden sm:inline">{activeTab === 'ALL' ? 'All Doctors' : `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Doctors`}</span>
                            <span className="sm:hidden">{activeTab}</span>
                        </h2>
                        <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1">
                            <Clock size={14} /> {doctors.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : doctors.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                            <p>No doctors found in this category.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {doctors.map(doctor => (
                                <div key={doctor.id} className="p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-start group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg md:text-xl font-bold truncate">{doctor.name}</h3>
                                                {/* Mini Status Badge for ALL view */}
                                                {activeTab === 'ALL' && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${doctor.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                                            doctor.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {doctor.status}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-zinc-500 shrink-0">{new Date(doctor.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 break-words">{doctor.email} • {doctor.phone}</p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                                                {doctor.specialization}
                                            </span>
                                            <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold">
                                                {doctor.experience_years} years exp
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-48 shrink-0">
                                        <button
                                            onClick={() => setSelectedDoctor(doctor)}
                                            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <Eye size={16} /> View Details
                                        </button>

                                        {doctor.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleStatusUpdate(doctor.id, 'APPROVED')}
                                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedDoctor && <DetailModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />}
        </div>
    );
}
