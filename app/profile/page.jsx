"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    User, Save, Calendar, Activity, FileText,
    ArrowLeft, Shield, Edit2, Phone, Camera,
    Stethoscope, Award, Upload, Trash2, X,
    CheckCircle, Clock, Plus, Eye, Briefcase, Mail
} from "lucide-react";
import { getClientSession, createClientSession } from "@/app/utils/auth-api";

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const certFileRef = useRef(null);

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [certifications, setCertifications] = useState([]);
    const [showCertModal, setShowCertModal] = useState(false);
    const [certTitle, setCertTitle] = useState('');
    const [uploadingCert, setUploadingCert] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [preferences, setPreferences] = useState({
        conditions: [],
        allergies: [],
    });
    const [sessions, setSessions] = useState([]);
    const [medications, setMedications] = useState([]);

    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        bio: '',
        specialization: '',
        experience_years: 0,
    });

    // Load user data
    useEffect(() => {
        const loadData = async () => {
            const session = getClientSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setUser(session);

            try {
                // Fetch full profile from DB
                const profileRes = await fetch(`/api/profile/update?email=${encodeURIComponent(session.email)}`);
                const profileData = await profileRes.json();
                if (profileData.success) {
                    setProfile(profileData.user);
                    setEditForm({
                        name: profileData.user.name || '',
                        phone: profileData.user.phone || '',
                        bio: profileData.user.bio || '',
                        specialization: profileData.user.specialization || '',
                        experience_years: profileData.user.experience_years || 0,
                    });
                }

                // Fetch certifications if doctor
                if (session.role === 'doctor') {
                    const certRes = await fetch(`/api/profile/certifications?email=${encodeURIComponent(session.email)}`);
                    const certData = await certRes.json();
                    if (certData.success) {
                        setCertifications(certData.certifications);
                    }
                }

                // Fetch health data for regular users
                if (session.id) {
                    try {
                        const prefRes = await fetch(`/api/user/preferences?userId=${session.id}`);
                        const prefData = await prefRes.json();
                        if (prefData.success && prefData.data) {
                            setPreferences(prefData.data);
                        }
                    } catch (e) { /* preferences endpoint may not exist */ }

                    try {
                        const sessRes = await fetch(`/api/sessions?userId=${session.id}`);
                        const sessData = await sessRes.json();
                        if (sessData.success) setSessions(sessData.data || []);
                    } catch (e) { /* sessions endpoint may not exist */ }

                    try {
                        const medRes = await fetch(`/api/medications?userId=${session.id}`);
                        const medData = await medRes.json();
                        if (medData.success) setMedications(medData.data || []);
                    } catch (e) { /* medications endpoint may not exist */ }
                }
            } catch (err) {
                console.error("Error loading profile data", err);
            }

            setIsLoading(false);
        };

        loadData();
    }, [router]);

    // Avatar upload
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'avatar');

            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();

            if (uploadData.success) {
                // Save avatar URL to DB
                const updateRes = await fetch('/api/profile/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, avatar_url: uploadData.url }),
                });
                const updateData = await updateRes.json();
                if (updateData.success) {
                    setProfile(prev => ({ ...prev, avatar_url: uploadData.url }));
                    // Update localStorage session too
                    createClientSession({ ...user, picture: uploadData.url });
                }
            }
        } catch (err) {
            console.error('Avatar upload failed:', err);
        }
        setUploadingAvatar(false);
    };

    // Save profile edits
    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const updateData = { email: user.email, ...editForm };
            if (user.role !== 'doctor') {
                delete updateData.specialization;
                delete updateData.experience_years;
            }

            const res = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.user);
                setIsEditing(false);
                setSaveMessage('Profile updated!');
                // Update session name
                createClientSession({ ...user, name: editForm.name });
                setUser(prev => ({ ...prev, name: editForm.name }));
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                setSaveMessage('Failed: ' + data.error);
            }
        } catch (err) {
            setSaveMessage('Error saving profile');
        }
        setIsSaving(false);
    };

    // Certification upload
    const handleCertUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !certTitle.trim()) return;

        setUploadingCert(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'certification');

            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();

            if (uploadData.success) {
                const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
                const certRes = await fetch('/api/profile/certifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        title: certTitle.trim(),
                        file_url: uploadData.url,
                        file_type: fileType,
                    }),
                });
                const certData = await certRes.json();
                if (certData.success) {
                    setCertifications(prev => [certData.certification, ...prev]);
                    setCertTitle('');
                    setShowCertModal(false);
                }
            }
        } catch (err) {
            console.error('Certification upload failed:', err);
        }
        setUploadingCert(false);
    };

    // Delete certification
    const handleDeleteCert = async (certId) => {
        try {
            const res = await fetch('/api/profile/certifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: certId, email: user.email }),
            });
            const data = await res.json();
            if (data.success) {
                setCertifications(prev => prev.filter(c => c.id !== certId));
            }
        } catch (err) {
            console.error('Error deleting certification:', err);
        }
    };

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
        });

    const isDoctor = user?.role === 'doctor';

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
            {/* Hero Header */}
            <div className={`relative overflow-hidden ${isDoctor ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-teal-500 to-cyan-500'}`}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                </div>
                <div className="max-w-5xl mx-auto px-6 pt-6 pb-20 relative">
                    <button
                        onClick={() => router.push(isDoctor ? '/doctor/dashboard' : '/dashboard')}
                        className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar with upload */}
                        <div className="relative group">
                            <div className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl overflow-hidden bg-white/20 flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover object-top" />
                                ) : (
                                    <span className="text-4xl font-bold text-white">
                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                disabled={uploadingAvatar}
                            >
                                {uploadingAvatar ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                ) : (
                                    <Camera size={24} className="text-white" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left text-white">
                            <h1 className="text-2xl md:text-3xl font-bold">
                                {isDoctor ? 'Dr. ' : ''}{profile?.name || user.name}
                            </h1>
                            <p className="text-white/70 flex items-center gap-2 justify-center md:justify-start mt-1">
                                <Mail size={14} /> {user.email}
                            </p>
                            {isDoctor && profile?.specialization && (
                                <p className="text-white/80 flex items-center gap-2 justify-center md:justify-start mt-1">
                                    <Stethoscope size={14} /> {profile.specialization}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-medium rounded-full">
                                    {isDoctor ? '🩺 Doctor' : '👤 Patient'}
                                </span>
                                <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-medium rounded-full">
                                    Member since {formatDate(profile?.created_at || new Date())}
                                </span>
                            </div>
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            <Edit2 size={16} /> {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success toast */}
            {saveMessage && (
                <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium shadow-lg flex items-center gap-2 animate-slide-in">
                    <CheckCircle size={18} /> {saveMessage}
                </div>
            )}

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
                {/* Edit Form Card */}
                {isEditing && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Edit2 size={18} className="text-teal-500" /> Edit Profile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Full Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Phone</label>
                                <input
                                    value={editForm.phone}
                                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="+91 9999999999"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                                    rows={3}
                                    placeholder="Tell us about yourself..."
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                />
                            </div>
                            {isDoctor && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Specialization</label>
                                        <select
                                            value={editForm.specialization}
                                            onChange={e => setEditForm(p => ({ ...p, specialization: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select Specialization</option>
                                            {["General Medicine", "Cardiology", "Dermatology", "Orthopedics", "Pediatrics", "Gynecology", "Neurology", "Psychiatry", "ENT", "Ophthalmology", "Dentistry", "Ayurveda", "Homeopathy", "Physiotherapy"].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Years of Experience</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.experience_years}
                                            onChange={e => setEditForm(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-zinc-600 dark:text-zinc-400 font-medium rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={16} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Profile Info Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                <User size={18} className="text-teal-500" /> About
                            </h3>
                            <div className="space-y-3">
                                {profile?.bio && (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{profile.bio}</p>
                                )}
                                {profile?.phone && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Phone size={14} className="text-zinc-400" /> {profile.phone}
                                    </div>
                                )}
                                {isDoctor && profile?.experience_years > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Briefcase size={14} className="text-zinc-400" /> {profile.experience_years} years experience
                                    </div>
                                )}
                                {!profile?.bio && !profile?.phone && (
                                    <p className="text-sm text-zinc-400 italic">No details added yet. Click Edit Profile to add your info.</p>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            {isDoctor ? (
                                <>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{certifications.length}</div>
                                        <div className="text-xs text-zinc-500">Certifications</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{profile?.experience_years || 0}</div>
                                        <div className="text-xs text-zinc-500">Years Exp</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{sessions.length}</div>
                                        <div className="text-xs text-zinc-500">Check-ups</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{medications.length}</div>
                                        <div className="text-xs text-zinc-500">Medications</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Health Passport (user only) */}
                        {!isDoctor && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Shield size={18} className="text-teal-500" /> Health Passport
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-zinc-400 uppercase">Conditions</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {preferences.conditions?.length > 0 ? preferences.conditions.map((c, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-100 dark:border-red-800">{c}</span>
                                            )) : <span className="text-xs text-zinc-500 italic">None listed</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-zinc-400 uppercase">Allergies</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {preferences.allergies?.length > 0 ? preferences.allergies.map((c, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded-lg border border-orange-100 dark:border-orange-800">{c}</span>
                                            )) : <span className="text-xs text-zinc-500 italic">None listed</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Doctor: Certifications */}
                        {isDoctor && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Award size={18} className="text-amber-500" /> Certifications & Documents
                                    </h3>
                                    <button
                                        onClick={() => setShowCertModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all flex items-center gap-1"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                                <div className="p-6">
                                    {certifications.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {certifications.map(cert => (
                                                <div key={cert.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
                                                    {/* Preview */}
                                                    <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center">
                                                        {cert.file_type === 'pdf' ? (
                                                            <div className="text-center">
                                                                <FileText size={40} className="mx-auto text-red-500 mb-2" />
                                                                <span className="text-xs text-zinc-500">PDF Document</span>
                                                            </div>
                                                        ) : (
                                                            <img src={cert.file_url} alt={cert.title} className="w-full h-full object-cover" />
                                                        )}
                                                        {/* Actions overlay */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <a
                                                                href={cert.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 bg-white rounded-full hover:bg-zinc-100 transition-colors"
                                                            >
                                                                <Eye size={16} className="text-zinc-900" />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteCert(cert.id)}
                                                                className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                                            >
                                                                <Trash2 size={16} className="text-white" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="font-medium text-zinc-900 dark:text-white text-sm truncate">{cert.title}</h4>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{formatDate(cert.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <Award size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                                            <p className="text-zinc-500 font-medium">No certifications uploaded</p>
                                            <p className="text-sm text-zinc-400 mt-1">Upload your medical degrees and certifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* User: Recent Activity */}
                        {!isDoctor && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Activity size={18} className="text-teal-500" /> Recent Activity
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {sessions.length > 0 ? (
                                        <div className="space-y-3">
                                            {sessions.slice(0, 5).map(session => (
                                                <div key={session.id} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.severity === 'high' ? 'bg-red-100 text-red-600' :
                                                        session.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-green-100 text-green-600'
                                                        }`}>
                                                        <Activity size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-zinc-900 dark:text-white text-sm">{session.summary || 'Health Check'}</div>
                                                        <div className="text-xs text-zinc-500">{new Date(session.created_at).toLocaleString()}</div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${session.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                        session.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {session.severity || 'Low'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <Activity size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                                            <p className="text-zinc-500">No recent activity</p>
                                            <button onClick={() => router.push('/triage')} className="mt-2 text-teal-600 font-medium text-sm hover:underline">Start a Health Check</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Vitals Card (user only) */}
                        {!isDoctor && (
                            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={20} /> Latest Vitals</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                                        <div className="text-xs text-teal-100 opacity-80">Heart Rate</div>
                                        <div className="text-xl font-bold">72 <span className="text-xs font-normal">bpm</span></div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                                        <div className="text-xs text-teal-100 opacity-80">Blood Pressure</div>
                                        <div className="text-xl font-bold">120/80</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                                        <div className="text-xs text-teal-100 opacity-80">Oxygen</div>
                                        <div className="text-xl font-bold">98%</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-teal-100 opacity-70 flex items-center gap-1">
                                    <CheckCircle size={12} /> Last updated from recent session
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Certification Upload Modal */}
            {showCertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                                <Upload size={18} className="text-teal-500" /> Upload Certification
                            </h3>
                            <button onClick={() => setShowCertModal(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Certificate Title</label>
                                <input
                                    value={certTitle}
                                    onChange={e => setCertTitle(e.target.value)}
                                    placeholder="e.g. MBBS Degree, Medical License"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Upload File (PDF or Image)</label>
                                <div
                                    onClick={() => certTitle.trim() && certFileRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${certTitle.trim()
                                        ? 'border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/10 cursor-pointer'
                                        : 'border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    {uploadingCert ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
                                    ) : (
                                        <>
                                            <Upload size={32} className="mx-auto text-zinc-400 mb-2" />
                                            <p className="text-sm text-zinc-500">{certTitle.trim() ? 'Click to select file' : 'Enter title first'}</p>
                                            <p className="text-xs text-zinc-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={certFileRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleCertUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
