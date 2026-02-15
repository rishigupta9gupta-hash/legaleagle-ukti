"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMedications, addMedication, deleteMedication, updateMedicationDates } from "@/app/utils/medication-api";
import {
    ArrowLeft, Camera, Plus, X, Loader2, Clock, AlertTriangle,
    HeartPulse, Pill, Calendar, Bell, Trash2, CheckCircle, Edit2,
    Upload, ImageIcon, Info
} from "lucide-react";

export default function MedicationPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const [medications, setMedications] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsMed, setDetailsMed] = useState(null);
    const [detailsText, setDetailsText] = useState('');
    const [loadingDetails, setLoadingDetails] = useState(false);
    const toastTimer = useRef(null);

    // Toast notification helper
    const showToast = useCallback((message, type = 'success') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ message, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    // Fetch AI-powered medicine details
    const fetchMedicineDetails = async (med) => {
        setDetailsMed(med);
        setShowDetailsModal(true);
        setDetailsText('');
        setLoadingDetails(true);
        try {
            const res = await fetch('/api/medicine-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: med.name, dosage: med.dosage })
            });
            const result = await res.json();
            if (result.success) {
                setDetailsText(result.details);
            } else {
                setDetailsText('Could not fetch details. Please try again.');
            }
        } catch {
            setDetailsText('Failed to load medicine details.');
        } finally {
            setLoadingDetails(false);
        }
    };

    // Simple markdown renderer
    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-4 mb-1">{line.slice(4)}</h4>;
            if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-base text-zinc-900 dark:text-white mt-4 mb-1">{line.slice(3)}</h3>;
            if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg text-zinc-900 dark:text-white mt-4 mb-2">{line.slice(2)}</h2>;
            if (line.startsWith('- ') || line.startsWith('* ')) {
                const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return <li key={i} className="ml-4 text-sm text-zinc-600 dark:text-zinc-400 list-disc" dangerouslySetInnerHTML={{ __html: content }} />;
            }
            if (line.trim() === '') return <div key={i} className="h-2" />;
            const content = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-800 dark:text-zinc-200">$1</strong>');
            return <p key={i} className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />;
        });
    };

    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: 'daily',
        time: '09:00',
        expiryDate: '',
        notes: ''
    });

    const [loading, setLoading] = useState(true);

    // Load medications from API
    useEffect(() => {
        loadMedications();
    }, []);

    const loadMedications = async () => {
        setLoading(true);
        try {
            const data = await getMedications();
            if (data?.success) {
                setMedications(data.data || []);
            } else {
                // If not logged in, use localStorage fallback
                const local = localStorage.getItem('vira_medications');
                if (local) setMedications(JSON.parse(local));
            }
        } catch {
            const local = localStorage.getItem('vira_medications');
            if (local) setMedications(JSON.parse(local));
        }
        setLoading(false);
    };

    const refreshMedications = async () => {
        try {
            const data = await getMedications();
            if (data?.success) setMedications(data.data || []);
        } catch { }
    };

    // --- Camera functions ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            setError("Could not access camera. Try uploading a photo instead.");
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const captureImage = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
    };

    // --- File upload handler ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError("Please upload a JPG, PNG, or WebP image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const imageData = reader.result;
            setCapturedImage(imageData);
            analyzeImage(imageData);
        };
        reader.readAsDataURL(file);
    };

    // --- Server-side AI analysis ---
    const analyzeImage = async (imageData) => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.match(/data:(.*?);/)?.[1] || 'image/jpeg';

            const res = await fetch('/api/analyze-medicine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Data, mimeType })
            });

            const result = await res.json();

            if (result.success && result.data) {
                const parsed = result.data;
                setNewMed(prev => ({
                    ...prev,
                    name: parsed.name !== 'unknown' ? parsed.name : '',
                    dosage: parsed.dosage !== 'unknown' ? parsed.dosage : '',
                    expiryDate: parsed.expiry !== 'unknown' ? parsed.expiry : '',
                    notes: parsed.instructions !== 'unknown' ? parsed.instructions : ''
                }));
            } else {
                setError(result.message || "Could not analyze. Enter details manually.");
            }

            setShowCameraModal(false);
            setShowAddModal(true);
        } catch (err) {
            console.error("Analysis error:", err);
            setError("Could not analyze the image. Please enter details manually.");
            setShowCameraModal(false);
            setShowAddModal(true);
        } finally {
            setIsAnalyzing(false);
            setCapturedImage(null);
        }
    };

    const handleAddMedication = async () => {
        if (!newMed.name) return;

        try {
            const result = await addMedication(newMed);

            if (result?.success) {
                showToast(`✅ ${newMed.name} added successfully!`);
                setNewMed({ name: '', dosage: '', frequency: 'daily', time: '09:00', expiryDate: '', notes: '' });
                setShowAddModal(false);
                setError(null);
                refreshMedications();
            } else {
                // Fallback to localStorage if not logged in
                const newEntry = {
                    id: Date.now().toString(),
                    ...newMed,
                    taken: [],
                    created_at: new Date().toISOString()
                };
                const updated = [...medications, newEntry];
                setMedications(updated);
                localStorage.setItem('vira_medications', JSON.stringify(updated));
                showToast(`✅ ${newMed.name} added successfully!`);
                setNewMed({ name: '', dosage: '', frequency: 'daily', time: '09:00', expiryDate: '', notes: '' });
                setShowAddModal(false);
                setError(null);
            }
        } catch {
            // localStorage fallback
            const newEntry = {
                id: Date.now().toString(),
                ...newMed,
                taken: [],
                created_at: new Date().toISOString()
            };
            const updated = [...medications, newEntry];
            setMedications(updated);
            localStorage.setItem('vira_medications', JSON.stringify(updated));
            showToast(`✅ ${newMed.name} added successfully!`);
            setNewMed({ name: '', dosage: '', frequency: 'daily', time: '09:00', expiryDate: '', notes: '' });
            setShowAddModal(false);
        }
    };

    const handleDeleteMedication = async (id) => {
        const med = medications.find(m => m.id === id);
        if (confirm('Are you sure you want to delete this medication?')) {
            try {
                const result = await deleteMedication(id);
                if (result?.success) {
                    refreshMedications();
                } else {
                    const updated = medications.filter(m => m.id !== id);
                    setMedications(updated);
                    localStorage.setItem('vira_medications', JSON.stringify(updated));
                }
            } catch {
                const updated = medications.filter(m => m.id !== id);
                setMedications(updated);
                localStorage.setItem('vira_medications', JSON.stringify(updated));
            }
            showToast(`🗑️ ${med?.name || 'Medication'} removed`, 'info');
        }
    };

    const markAsTaken = async (id, currentTaken) => {
        const today = new Date().toDateString();
        const med = medications.find(m => m.id === id);
        let newTaken = [];
        if (currentTaken && currentTaken.includes(today)) {
            newTaken = currentTaken.filter(d => d !== today);
            showToast(`↩️ ${med?.name} unmarked for today`, 'info');
        } else {
            newTaken = [...(currentTaken || []), today];
            showToast(`💊 ${med?.name} marked as taken!`, 'success');
        }

        // Optimistic update
        setMedications(prev => prev.map(m =>
            m.id === id ? { ...m, taken: newTaken } : m
        ));

        try {
            await updateMedicationDates(id, newTaken);
        } catch { }
    };

    const isExpiringSoon = (expiryDate) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
    };

    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                        <Pill size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-white">Medications</div>
                        <div className="text-xs text-zinc-500">Track & Manage</div>
                    </div>
                </div>

                <div className="w-20" />
            </header>

            <div className="max-w-4xl mx-auto p-6 md:p-8">
                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto"><X size={16} className="text-amber-400" /></button>
                    </div>
                )}

                {/* Add Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={() => { setShowCameraModal(true); startCamera(); }}
                        className="py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all"
                    >
                        <Camera size={22} /> Scan Medicine
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all"
                    >
                        <Upload size={22} /> Upload Photo
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                    >
                        <Plus size={22} /> Add Manually
                    </button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-teal-500" />
                    </div>
                )}

                {/* Medications List */}
                {!loading && medications.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                            <Pill size={40} className="text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No medications yet</h3>
                        <p className="text-zinc-500">Scan a medicine strip, upload a photo, or add manually to start tracking.</p>
                    </div>
                ) : !loading && (
                    <div className="space-y-4">
                        {medications.map(med => {
                            const today = new Date().toDateString();
                            const takenDates = med.taken || med.taken_dates || [];
                            const takenToday = takenDates.includes?.(today);
                            const expiryDate = med.expiryDate || med.expiry_date;
                            const expiring = isExpiringSoon(expiryDate);
                            const expired = isExpired(expiryDate);

                            return (
                                <div key={med.id} className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border p-6 ${expired ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
                                    expiring ? 'border-amber-300 dark:border-amber-800' : 'border-zinc-100 dark:border-zinc-800'
                                    }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => markAsTaken(med.id, takenDates)}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${takenToday
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-teal-100 hover:text-teal-600'
                                                    }`}
                                            >
                                                <CheckCircle size={24} />
                                            </button>
                                            <div>
                                                <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{med.name}</h4>
                                                <p className="text-zinc-500 text-sm">{med.dosage} • {med.frequency} at {med.time}</p>
                                                {med.notes && <p className="text-xs text-zinc-400 mt-1">{med.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {expired && (
                                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <AlertTriangle size={12} /> Expired
                                                </span>
                                            )}
                                            {expiring && !expired && (
                                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <Clock size={12} /> Expiring Soon
                                                </span>
                                            )}
                                            <button onClick={() => fetchMedicineDetails(med)} className="p-2 text-zinc-400 hover:text-teal-500 transition-colors" title="View Details">
                                                <Info size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteMedication(med.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {expiryDate && (
                                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-sm text-zinc-500">
                                            <Calendar size={14} />
                                            <span>Expires: {new Date(expiryDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Scan Medicine</h3>
                            <button onClick={() => { stopCamera(); setCapturedImage(null); setShowCameraModal(false); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </div>
                        <div className="relative aspect-[4/3] bg-black">
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            )}
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <Loader2 size={40} className="animate-spin mx-auto mb-2" />
                                        <p className="font-medium">Analyzing medicine...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!capturedImage && !isAnalyzing && (
                            <div className="p-4 space-y-3">
                                <button onClick={captureImage} className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                    <Camera size={20} /> Capture Photo
                                </button>
                                <button
                                    onClick={() => { stopCamera(); setShowCameraModal(false); fileInputRef.current?.click(); }}
                                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Upload size={18} /> Upload Photo Instead
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Analyzing Overlay (for file upload) */}
            {isAnalyzing && !showCameraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center shadow-2xl">
                        <Loader2 size={48} className="animate-spin text-teal-500 mx-auto mb-4" />
                        <p className="font-bold text-zinc-900 dark:text-white text-lg">Analyzing Medicine...</p>
                        <p className="text-zinc-500 text-sm mt-1">AI is reading the packaging</p>
                    </div>
                </div>
            )}

            {/* Add Medication Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Add Medication</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Medicine Name *</label>
                                <input
                                    type="text"
                                    value={newMed.name}
                                    onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                                    placeholder="e.g., Paracetamol"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dosage</label>
                                    <input
                                        type="text"
                                        value={newMed.dosage}
                                        onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                                        placeholder="e.g., 500mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newMed.time}
                                        onChange={e => setNewMed(prev => ({ ...prev, time: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Frequency</label>
                                <select
                                    value={newMed.frequency}
                                    onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="twice">Twice a day</option>
                                    <option value="thrice">Three times a day</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="asneeded">As needed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    value={newMed.expiryDate}
                                    onChange={e => setNewMed(prev => ({ ...prev, expiryDate: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Notes / Instructions</label>
                                <textarea
                                    value={newMed.notes}
                                    onChange={e => setNewMed(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white resize-none"
                                    rows={2}
                                    placeholder="e.g., Take after meals"
                                />
                            </div>
                            <button
                                onClick={handleAddMedication}
                                disabled={!newMed.name}
                                className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50 hover:from-teal-400 hover:to-cyan-400 transition-all"
                            >
                                Add Medication
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-[slideDown_0.3s_ease-out]">
                    <div className={`px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500 text-white' :
                            toast.type === 'info' ? 'bg-blue-500 text-white' :
                                'bg-red-500 text-white'
                        }`}>
                        <span>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Medicine Details Modal */}
            {showDetailsModal && detailsMed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                                    <Pill size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{detailsMed.name}</h3>
                                    {detailsMed.dosage && <p className="text-xs text-zinc-500">{detailsMed.dosage}</p>}
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 size={36} className="animate-spin text-teal-500 mb-3" />
                                    <p className="text-zinc-500 text-sm">Fetching medicine details...</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {renderMarkdown(detailsText)}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                            <p className="text-xs text-zinc-400 text-center">⚠️ This is AI-generated info. Always consult your doctor.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-down animation */}
            <style jsx>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
}
