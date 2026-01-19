"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI } from "@google/genai";
import {
    ArrowLeft, Camera, Plus, X, Loader2, Clock, AlertTriangle,
    HeartPulse, Pill, Calendar, Bell, Trash2, CheckCircle, Edit2
} from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

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
        const loadMedications = async () => {
            setLoading(true);
            const data = await getMedications();
            if (data.success) {
                setMedications(data.data);
            }
            setLoading(false);
        };
        loadMedications();
    }, []);

    // Helper to refresh list
    const refreshMedications = async () => {
        const data = await getMedications();
        if (data.success) setMedications(data.data);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Could not access camera");
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

    const analyzeImage = async (imageData) => {
        if (!API_KEY) return;
        setIsAnalyzing(true);

        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const base64Data = imageData.split(',')[1];

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [{
                    parts: [
                        {
                            text: `Analyze this medicine strip/packaging image and extract:
1. Medicine name
2. Dosage (e.g., 500mg)
3. Expiry date (if visible)
4. Any usage instructions visible

Respond in JSON format ONLY:
{"name": "...", "dosage": "...", "expiry": "...", "instructions": "..."}

If you can't identify something, use "unknown" for that field.` },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                    ]
                }]
            });

            const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setNewMed(prev => ({
                    ...prev,
                    name: parsed.name !== 'unknown' ? parsed.name : '',
                    dosage: parsed.dosage !== 'unknown' ? parsed.dosage : '',
                    expiryDate: parsed.expiry !== 'unknown' ? parsed.expiry : '',
                    notes: parsed.instructions !== 'unknown' ? parsed.instructions : ''
                }));
            }
            setShowCameraModal(false);
            setShowAddModal(true);
        } catch (err) {
            console.error("Analysis error:", err);
            alert("Could not analyze the image. Please enter details manually.");
            setShowCameraModal(false);
            setShowAddModal(true);
        } finally {
            setIsAnalyzing(false);
            setCapturedImage(null);
        }
    };

    const handleAddMedication = async () => {
        if (!newMed.name) return;

        const result = await addMedication(newMed);

        if (result.success) {
            setNewMed({ name: '', dosage: '', frequency: 'daily', time: '09:00', expiryDate: '', notes: '' });
            setShowAddModal(false);
            refreshMedications();
        } else {
            alert(result.message);
        }
    };

    const handleDeleteMedication = async (id) => {
        if (confirm('Are you sure you want to delete this medication?')) {
            const result = await deleteMedication(id);
            if (result.success) {
                refreshMedications();
            }
        }
    };

    const markAsTaken = async (id, currentTaken) => {
        const today = new Date().toDateString();
        // Toggle logic
        let newTaken = [];
        if (currentTaken && currentTaken.includes(today)) {
            newTaken = currentTaken.filter(d => d !== today);
        } else {
            newTaken = [...(currentTaken || []), today];
        }

        // Optimistic update
        setMedications(prev => prev.map(m =>
            m.id === id ? { ...m, taken: newTaken } : m
        ));

        await updateMedicationDates(id, newTaken);
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
                <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
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
                {/* Add Buttons */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => { setShowCameraModal(true); startCamera(); }}
                        className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all"
                    >
                        <Camera size={22} /> Scan Medicine
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex-1 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                    >
                        <Plus size={22} /> Add Manually
                    </button>
                </div>

                {/* Medications List */}
                {medications.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                            <Pill size={40} className="text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No medications yet</h3>
                        <p className="text-zinc-500">Scan a medicine strip or add manually to start tracking.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {medications.map(med => {
                            const today = new Date().toDateString();
                            const takenToday = med.taken?.includes(today);
                            const expiring = isExpiringSoon(med.expiryDate);
                            const expired = isExpired(med.expiryDate);

                            return (
                                <div key={med.id} className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border p-6 ${expired ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
                                    expiring ? 'border-amber-300 dark:border-amber-800' : 'border-zinc-100 dark:border-zinc-800'
                                    }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => markAsTaken(med.id, med.taken)}
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
                                            <button onClick={() => handleDeleteMedication(med.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {med.expiryDate && (
                                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-sm text-zinc-500">
                                            <Calendar size={14} />
                                            <span>Expires: {new Date(med.expiryDate).toLocaleDateString()}</span>
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
                            <h3 className="font-bold text-lg">Scan Medicine</h3>
                            <button onClick={() => { stopCamera(); setShowCameraModal(false); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <X size={20} />
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
                                        <p>Analyzing medicine...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!capturedImage && !isAnalyzing && (
                            <div className="p-4">
                                <button onClick={captureImage} className="w-full py-4 bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    <Camera size={20} /> Capture
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg">Add Medication</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Medicine Name *</label>
                                <input
                                    type="text"
                                    value={newMed.name}
                                    onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                                        placeholder="e.g., 500mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newMed.time}
                                        onChange={e => setNewMed(prev => ({ ...prev, time: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Frequency</label>
                                <select
                                    value={newMed.frequency}
                                    onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                                />
                            </div>
                            <button
                                onClick={handleAddMedication}
                                disabled={!newMed.name}
                                className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                Add Medication
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
