"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI } from "@google/genai";
import { getReports, saveReport, deleteReport } from "@/app/utils/report-api";
import {
    ArrowLeft, Upload, FileText, Image, X, Loader2,
    HeartPulse, CheckCircle, AlertTriangle, Info, Download
} from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export default function ReportsPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [uploadedFile, setUploadedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);

    // Load past reports
    const loadReports = async () => {
        const data = await getReports();
        if (data.success) {
            setReports(data.data);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError("Please upload a PDF or image file (JPG, PNG, WebP)");
            return;
        }

        setUploadedFile(file);
        setError(null);
        setAnalysis(null);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const input = fileInputRef.current;
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            handleFileSelect({ target: { files: [file] } });
        }
    };

    const analyzeReport = async () => {
        if (!uploadedFile || !API_KEY) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            // Read file as base64
            const reader = new FileReader();
            const fileData = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });

            // Extract base64 data
            const base64Data = fileData.split(',')[1];
            const mimeType = uploadedFile.type;

            const prompt = `You are VIRA, a helpful health assistant. Analyze this medical report/test result and explain it in simple, easy-to-understand language.

Please provide:
1. **What This Report Shows**: A brief summary of what kind of test/report this is
2. **Key Findings**: List the important values/findings (use bullet points)
3. **What It Means**: Explain in simple terms what these results indicate
4. **Normal vs Abnormal**: Highlight anything that's outside normal range (if applicable)
5. **Suggested Actions**: What the person should do next (if anything needs attention)

IMPORTANT:
- Use simple, everyday language (avoid medical jargon)
- Be reassuring but honest
- Always recommend consulting a doctor for proper interpretation
- If you can't read the report clearly, say so

Format your response with clear sections using markdown headers.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Data } }
                    ]
                }]
            });

            const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
            setAnalysis(text);

            // Save to Database
            if (text) {
                const summary = text.substring(0, 200) + '...';
                await saveReport({
                    fileName: uploadedFile.name,
                    fileType: uploadedFile.type,
                    fileUrl: base64Data,
                    analysis: text,
                    summary: summary
                });
                loadReports();
            }
        } catch (err) {
            console.error("Analysis error:", err);
            setError("Failed to analyze the report. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearFile = () => {
        setUploadedFile(null);
        setFilePreview(null);
        setAnalysis(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <HeartPulse size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-white">Report Analysis</div>
                        <div className="text-xs text-zinc-500">Powered by VIRA</div>
                    </div>
                </div>

                <div className="w-20" />
            </header>

            <div className="max-w-4xl mx-auto p-6 md:p-8">
                {/* Upload Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Upload Your Report</h2>
                    <p className="text-zinc-500 mb-6">Upload a medical report or test result and VIRA will explain it in simple language.</p>

                    {!uploadedFile ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-all"
                        >
                            <Upload size={48} className="mx-auto text-zinc-400 mb-4" />
                            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Drag & drop your report here
                            </p>
                            <p className="text-sm text-zinc-500 mb-4">or click to browse</p>
                            <p className="text-xs text-zinc-400">Supports: PDF, JPG, PNG, WebP</p>
                        </div>
                    ) : (
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                {filePreview ? (
                                    <img src={filePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl" />
                                ) : (
                                    <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                                        <FileText size={32} className="text-teal-600" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1">{uploadedFile.name}</h4>
                                    <p className="text-sm text-zinc-500 mb-4">
                                        {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type.split('/')[1].toUpperCase()}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={analyzeReport}
                                            disabled={isAnalyzing}
                                            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 hover:from-teal-400 hover:to-cyan-400 transition-all disabled:opacity-50"
                                        >
                                            {isAnalyzing ? (
                                                <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
                                            ) : (
                                                <><FileText size={18} /> Analyze Report</>
                                            )}
                                        </button>
                                        <button
                                            onClick={clearFile}
                                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                        >
                                            <X size={18} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Analysis Results */}
                {analysis && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-teal-50 dark:bg-teal-900/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={22} className="text-teal-600" />
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Analysis Complete</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:text-teal-700 dark:prose-headings:text-teal-400 prose-strong:text-teal-600">
                                {analysis.split('\n').map((line, i) => {
                                    if (line.startsWith('## ')) {
                                        return <h2 key={i} className="text-lg font-bold mt-6 mb-3 text-teal-700 dark:text-teal-400">{line.replace('## ', '')}</h2>;
                                    } else if (line.startsWith('**') && line.endsWith('**')) {
                                        return <h3 key={i} className="font-bold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                                    } else if (line.startsWith('- ') || line.startsWith('* ')) {
                                        return <li key={i} className="ml-4">{line.replace(/^[-*] /, '')}</li>;
                                    } else if (line.trim()) {
                                        return <p key={i} className="mb-2">{line}</p>;
                                    }
                                    return null;
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                                <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    <strong>Disclaimer:</strong> This analysis is for informational purposes only. Please consult your doctor for proper interpretation and medical advice.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Past Reports List */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Past Reports</h3>
                    {!reports || reports.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-zinc-500">No reports saved yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {reports.map((report) => (
                                <div key={report.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                                                <FileText size={20} className="text-teal-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{report.file_name}</h4>
                                                <p className="text-xs text-zinc-500">{new Date(report.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Delete this report?')) {
                                                    await deleteReport(report.id);
                                                    loadReports();
                                                }
                                            }}
                                            className="text-zinc-400 hover:text-red-500 p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3">
                                        {report.summary || "No summary available."}
                                    </div>
                                    <button
                                        onClick={() => setAnalysis(report.analysis)}
                                        className="w-full py-2 bg-zinc-50 dark:bg-zinc-800 text-teal-600 text-sm font-medium rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                                    >
                                        View Analysis
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                {!analysis && reports.length === 0 && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-6 mt-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center shrink-0">
                                <Image size={24} className="text-teal-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-teal-800 dark:text-teal-300 mb-1">What can you upload?</h4>
                                <ul className="text-sm text-teal-700 dark:text-teal-400 space-y-1">
                                    <li>• Blood test reports (CBC, lipid panel, etc.)</li>
                                    <li>• Diagnostic imaging reports</li>
                                    <li>• Prescription notes</li>
                                    <li>• Lab results (thyroid, diabetes, etc.)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
