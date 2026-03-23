"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/app/utils/compress-image";
import {
    Camera, Video, Loader2, ArrowLeft, CheckCircle,
    AlertTriangle, RefreshCw, Sparkles, Shield, Heart,
    Pill, SwitchCamera, X, ZoomIn, Activity, Eye,
    Brain, Thermometer, Wind, SmilePlus, Scan
} from "lucide-react";

// API is now handled server-side at /api/skin-check;const API_KEY = "";

/* ================================================================
   ANALYSIS PROMPT — sent to Gemini Vision with the captured image
   ================================================================ */
const ANALYSIS_PROMPT = `You are an expert dermatological AI assistant. Analyze this image of a skin condition carefully.

IMPORTANT RULES:
- You are NOT a doctor. Always remind the user to consult a dermatologist.
- Be empathetic and clear in your response.
- Base your analysis ONLY on what you can see in the image.

Provide your analysis in the following JSON format ONLY (no markdown, no extra text):
{
  "condition": "Name of the most likely skin condition",
  "confidence": "low | moderate | high",
  "severity": "mild | moderate | severe",
  "description": "Brief 1-2 sentence description of what you observe",
  "possibleConditions": [
    { "name": "Condition 1", "likelihood": "high" },
    { "name": "Condition 2", "likelihood": "moderate" },
    { "name": "Condition 3", "likelihood": "low" }
  ],
  "immediateSteps": [
    "Step 1: What to do right now",
    "Step 2: Next action",
    "Step 3: Another action"
  ],
  "medications": [
    {
      "name": "Medication name",
      "type": "OTC / Prescription",
      "usage": "How to apply/use it",
      "frequency": "How often",
      "duration": "For how long",
      "note": "Important notes"
    }
  ],
  "homeRemedies": ["Remedy 1", "Remedy 2"],
  "whenToSeeDoctor": "Describe when the user should see a doctor",
  "doNot": ["Thing to avoid 1", "Thing to avoid 2"]
}`;

/* ================================================================
   COMPONENT
   ================================================================ */
export default function SkinCheckPage() {
    const router = useRouter();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const hiddenCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const faceIntervalRef = useRef(null);
    const faceApiRef = useRef(null);

    /* Camera state */
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraRequestId, setCameraRequestId] = useState(0);

    /* Analysis state */
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState("");
    const [showZoom, setShowZoom] = useState(false);

    /* Face health metrics (from face-api.js) */
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
    const [healthMetrics, setHealthMetrics] = useState({
        heartRate: null,
        spo2: null,
        breathing: null,
        emotion: null,
        skinColor: null,
        lipColor: null,
        facialSymmetry: null,
        fatigue: null,
        distress: null,
        headTremor: null,
    });

    /* Buffers for rPPG & metrics */
    const rgbBuffer = useRef([]);
    const hrHistory = useRef([]);
    const breathBuffer = useRef([]);
    const symmetryBuffer = useRef([]);
    const headPosBuffer = useRef([]);
    const blinkCount = useRef(0);
    const eyeClosedFrames = useRef(0);
    const totalFrames = useRef(0);
    const startTime = useRef(Date.now());

    /* ============ Load face-api.js models ============ */
    useEffect(() => {
        const loadModels = async () => {
            try {
                const faceapi = await import("face-api.js");
                faceApiRef.current = faceapi;
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
                    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
                ]);
                setFaceModelsLoaded(true);
            } catch (err) {
                console.warn("face-api.js models not loaded:", err);
            }
        };
        loadModels();
        return () => { if (faceIntervalRef.current) clearInterval(faceIntervalRef.current); };
    }, []);

    /* ============ Camera controls ============ */
    const startCamera = useCallback(async () => {
        // Stop any existing stream first
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            setIsCameraOn(true);
        } catch {
            setError("Camera access denied. Please allow camera permissions.");
        }
    }, [facingMode]);

    /* Attach the stream to the video element once both exist */
    useEffect(() => {
        if (isCameraOn && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
            if (facingMode === "user") startFaceDetection();
        }
    }, [isCameraOn, facingMode]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (faceIntervalRef.current) {
            clearInterval(faceIntervalRef.current);
            faceIntervalRef.current = null;
        }
        setIsCameraOn(false);
        setFaceDetected(false);
    }, []);

    const switchCamera = useCallback(() => {
        stopCamera();
        setFacingMode((p) => (p === "environment" ? "user" : "environment"));
    }, [stopCamera]);

    /* This effect handles ALL camera starts/restarts.
       It triggers when facingMode or cameraRequestId changes. */
    useEffect(() => {
        if (!capturedImage) {
            startCamera();
        }
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode, cameraRequestId]);

    /* ============ Face detection loop (adapted from MediVue) ============ */
    const startFaceDetection = useCallback(() => {
        if (!faceModelsLoaded || !faceApiRef.current) return;
        const faceapi = faceApiRef.current;

        if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);

        faceIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;

            try {
                const detection = await faceapi
                    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
                    .withFaceLandmarks(true)
                    .withFaceExpressions();

                if (detection) {
                    setFaceDetected(true);
                    const lm = detection.landmarks;

                    /* rPPG Heart Rate */
                    estimateHeartRate(lm, faceapi);
                    /* SpO2 */
                    estimateSpO2(lm);
                    /* Breathing */
                    estimateBreathing(lm);
                    /* Emotion */
                    analyzeEmotion(detection.expressions);
                    /* Skin color */
                    analyzeSkinColor(lm);
                    /* Lip color */
                    analyzeLipColor(lm);
                    /* Facial symmetry */
                    analyzeFacialSymmetry(lm);
                    /* Fatigue */
                    detectFatigue(lm);
                    /* Distress */
                    estimateDistress(lm);
                    /* Head tremor */
                    detectHeadTremor(lm);
                } else {
                    setFaceDetected(false);
                }
            } catch { }
        }, 300);
    }, [faceModelsLoaded]);

    /* ---- Heart Rate (rPPG) ---- */
    const estimateHeartRate = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current || !videoRef.current) return;
        const canvas = hiddenCanvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const lb = landmarks.getLeftEyeBrow();
        const rb = landmarks.getRightEyeBrow();
        const fx = (lb[0].x + rb[4].x) / 2 - 30;
        const fy = Math.min(lb[0].y, rb[4].y) - 40;
        try {
            const imgData = ctx.getImageData(Math.max(0, fx), Math.max(0, fy), 60, 30);
            let g = 0, count = imgData.data.length / 4;
            for (let i = 0; i < imgData.data.length; i += 4) g += imgData.data[i + 1];
            g /= count;
            rgbBuffer.current.push({ g, ts: Date.now() });
            if (rgbBuffer.current.length > 150) rgbBuffer.current.shift();
            if (rgbBuffer.current.length >= 90) {
                const vals = rgbBuffer.current.map((d) => d.g);
                const mean = vals.reduce((a, b) => a + b) / vals.length;
                const norm = vals.map((v) => v - mean);
                let peaks = 0;
                for (let i = 1; i < norm.length; i++) if (norm[i - 1] < 0 && norm[i] >= 0) peaks++;
                const durSec = (rgbBuffer.current[rgbBuffer.current.length - 1].ts - rgbBuffer.current[0].ts) / 1000;
                const bpm = Math.round((peaks / durSec) * 60);
                if (bpm >= 50 && bpm <= 150) {
                    hrHistory.current.push(bpm);
                    if (hrHistory.current.length > 10) hrHistory.current.shift();
                    const avg = Math.round(hrHistory.current.reduce((a, b) => a + b) / hrHistory.current.length);
                    setHealthMetrics((p) => ({ ...p, heartRate: { bpm: avg, confidence: 0.7 } }));
                }
            }
        } catch { }
    }, []);

    /* ---- SpO2 ---- */
    const estimateSpO2 = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current) return;
        const ctx = hiddenCanvasRef.current.getContext("2d");
        const lips = landmarks.getMouth();
        try {
            const imgData = ctx.getImageData(Math.max(0, lips[0].x), Math.max(0, lips[2].y), Math.max(1, lips[6].x - lips[0].x), Math.max(1, lips[9].y - lips[2].y));
            let r = 0, b = 0, count = imgData.data.length / 4;
            for (let i = 0; i < imgData.data.length; i += 4) { r += imgData.data[i]; b += imgData.data[i + 2]; }
            r /= count; b /= count;
            const ratio = r / (b + 1);
            const val = Math.min(100, Math.max(85, 85 + (ratio - 1) * 10));
            setHealthMetrics((p) => ({ ...p, spo2: { value: Math.round(val), confidence: 0.5 } }));
        } catch { }
    }, []);

    /* ---- Breathing ---- */
    const estimateBreathing = useCallback((landmarks) => {
        const nose = landmarks.getNose()[0];
        breathBuffer.current.push({ y: nose.y, ts: Date.now() });
        if (breathBuffer.current.length > 150) breathBuffer.current.shift();
        if (breathBuffer.current.length < 60) return;
        const vals = breathBuffer.current.map((d) => d.y);
        const mean = vals.reduce((a, b) => a + b) / vals.length;
        const norm = vals.map((v) => v - mean);
        let cycles = 0;
        for (let i = 1; i < norm.length - 1; i++) if (norm[i] > norm[i - 1] && norm[i] > norm[i + 1] && norm[i] > 0.5) cycles++;
        const durMin = (breathBuffer.current[breathBuffer.current.length - 1].ts - breathBuffer.current[0].ts) / 60000;
        const bpm = Math.round(cycles / durMin);
        const rate = bpm < 12 ? "Slow" : bpm > 20 ? "Fast" : "Normal";
        setHealthMetrics((p) => ({ ...p, breathing: { rate, bpm } }));
    }, []);

    /* ---- Emotion ---- */
    const analyzeEmotion = useCallback((expressions) => {
        if (!expressions) return;
        const map = { neutral: "Neutral", happy: "Happy", sad: "Sad", angry: "Angry", fearful: "Fearful", disgusted: "Disgusted", surprised: "Surprised" };
        let maxE = "neutral", maxS = 0;
        Object.entries(expressions).forEach(([e, s]) => { if (s > maxS) { maxS = s; maxE = e; } });
        setHealthMetrics((p) => ({ ...p, emotion: { primary: map[maxE] || "Unknown", confidence: (maxS * 100).toFixed(0) } }));
    }, []);

    /* ---- Skin Color ---- */
    const analyzeSkinColor = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current) return;
        const ctx = hiddenCanvasRef.current.getContext("2d");
        const cheek = landmarks.getJawOutline()[4];
        try {
            const imgData = ctx.getImageData(Math.max(0, cheek.x - 15), Math.max(0, cheek.y - 15), 30, 30);
            let r = 0, g = 0, b = 0, count = imgData.data.length / 4;
            for (let i = 0; i < imgData.data.length; i += 4) { r += imgData.data[i]; g += imgData.data[i + 1]; b += imgData.data[i + 2]; }
            r /= count; g /= count; b /= count;
            let status = "Normal", alerts = [];
            if (g > 150 && b < 100 && r > 150) { status = "Yellowish"; alerts.push("Possible Jaundice"); }
            else if (r > 200 && g > 200 && b > 200) { status = "Pale"; alerts.push("Possible Anemia"); }
            else if (b > r && b > g) { status = "Bluish"; alerts.push("Check Oxygen"); }
            else if (r > 180 && g < 130 && b < 130) { status = "Flushed"; alerts.push("Possible Fever"); }
            setHealthMetrics((p) => ({ ...p, skinColor: { status, alerts } }));
        } catch { }
    }, []);

    /* ---- Lip Color ---- */
    const analyzeLipColor = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current) return;
        const ctx = hiddenCanvasRef.current.getContext("2d");
        const lips = landmarks.getMouth();
        const cx = (lips[0].x + lips[6].x) / 2, cy = (lips[2].y + lips[9].y) / 2;
        try {
            const imgData = ctx.getImageData(Math.max(0, cx - 10), Math.max(0, cy - 5), 20, 10);
            let r = 0, b = 0, count = imgData.data.length / 4;
            for (let i = 0; i < imgData.data.length; i += 4) { r += imgData.data[i]; b += imgData.data[i + 2]; }
            r /= count; b /= count;
            const status = b > r * 0.8 ? "Bluish (Low O2)" : r > 180 ? "Healthy Pink" : "Normal";
            setHealthMetrics((p) => ({ ...p, lipColor: { status } }));
        } catch { }
    }, []);

    /* ---- Facial Symmetry ---- */
    const analyzeFacialSymmetry = useCallback((landmarks) => {
        const jaw = landmarks.getJawOutline(), nose = landmarks.getNose(), le = landmarks.getLeftEye(), re = landmarks.getRightEye(), mouth = landmarks.getMouth();
        const noseTip = nose[3];
        const lJaw = Math.hypot(jaw[0].x - noseTip.x, jaw[0].y - noseTip.y);
        const rJaw = Math.hypot(jaw[16].x - noseTip.x, jaw[16].y - noseTip.y);
        const lEye = Math.hypot((le[0].x + le[3].x) / 2 - noseTip.x, (le[1].y + le[5].y) / 2 - noseTip.y);
        const rEye = Math.hypot((re[0].x + re[3].x) / 2 - noseTip.x, (re[1].y + re[5].y) / 2 - noseTip.y);
        const lMouth = Math.hypot(mouth[0].x - noseTip.x, mouth[0].y - noseTip.y);
        const rMouth = Math.hypot(mouth[6].x - noseTip.x, mouth[6].y - noseTip.y);
        const symm = ((Math.min(lJaw, rJaw) / Math.max(lJaw, rJaw) + Math.min(lEye, rEye) / Math.max(lEye, rEye) + Math.min(lMouth, rMouth) / Math.max(lMouth, rMouth)) / 3) * 100;
        symmetryBuffer.current.push(symm);
        if (symmetryBuffer.current.length > 30) symmetryBuffer.current.shift();
        const avg = Math.round(symmetryBuffer.current.reduce((a, b) => a + b) / symmetryBuffer.current.length);
        const status = avg < 85 ? "Asymmetric" : avg < 92 ? "Mild Asymmetry" : "Normal";
        setHealthMetrics((p) => ({ ...p, facialSymmetry: { score: avg, status } }));
    }, []);

    /* ---- Fatigue ---- */
    const detectFatigue = useCallback((landmarks) => {
        const le = landmarks.getLeftEye(), re = landmarks.getRightEye();
        const ear = (eye) => { const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); return (d(eye[1], eye[5]) + d(eye[2], eye[4])) / (2 * d(eye[0], eye[3])); };
        const e = (ear(le) + ear(re)) / 2;
        totalFrames.current++;
        if (e < 0.2) eyeClosedFrames.current++;
        const perclos = (eyeClosedFrames.current / totalFrames.current) * 100;
        const level = perclos > 50 ? "Severe" : perclos > 30 ? "Drowsy" : perclos > 15 ? "Mild" : "Alert";
        setHealthMetrics((p) => ({ ...p, fatigue: { perclos: perclos.toFixed(1), level } }));
    }, []);

    /* ---- Distress ---- */
    const estimateDistress = useCallback((landmarks) => {
        const le = landmarks.getLeftEye(), re = landmarks.getRightEye();
        const ear = (eye) => { const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); return (d(eye[1], eye[5]) + d(eye[2], eye[4])) / (2 * d(eye[0], eye[3])); };
        const e = (ear(le) + ear(re)) / 2;
        if (e < 0.2) blinkCount.current++;
        const elapsed = (Date.now() - startTime.current) / 60000;
        const blinkRate = blinkCount.current / Math.max(0.1, elapsed);
        let score = 0;
        if (blinkRate > 25) score += 0.3;
        if (blinkRate > 35) score += 0.2;
        if (e < 0.18) score += 0.3;
        setHealthMetrics((p) => ({ ...p, distress: { score: Math.min(score, 1).toFixed(2), blinkRate: Math.round(blinkRate) } }));
    }, []);

    /* ---- Head Tremor ---- */
    const detectHeadTremor = useCallback((landmarks) => {
        const nose = landmarks.getNose()[3];
        headPosBuffer.current.push({ x: nose.x, y: nose.y });
        if (headPosBuffer.current.length > 60) headPosBuffer.current.shift();
        if (headPosBuffer.current.length < 30) return;
        const xs = headPosBuffer.current.map((p) => p.x), ys = headPosBuffer.current.map((p) => p.y);
        const xm = xs.reduce((a, b) => a + b) / xs.length, ym = ys.reduce((a, b) => a + b) / ys.length;
        const xv = xs.reduce((s, x) => s + (x - xm) ** 2, 0) / xs.length;
        const yv = ys.reduce((s, y) => s + (y - ym) ** 2, 0) / ys.length;
        const variance = Math.sqrt(xv + yv);
        const status = variance > 10 ? "Significant" : variance > 5 ? "Mild" : "Stable";
        setHealthMetrics((p) => ({ ...p, headTremor: { variance: variance.toFixed(1), status } }));
    }, []);

    /* ============ Capture & Analyze ============ */
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current, canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
        stopCamera();
    }, [stopCamera]);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setError("");
        // Bump cameraRequestId to trigger the useEffect to restart camera
        setCameraRequestId((prev) => prev + 1);
    }, []);

    const analyzeImage = useCallback(async () => {
        if (!capturedImage) { setError("Please capture an image first."); return; }
        setIsAnalyzing(true);
        setError("");
        setAnalysisResult(null);
        try {
            // Compress image before sending to reduce API token usage
            const compressed = await compressImage(capturedImage, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.6
            });

            const response = await fetch("/api/skin-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: compressed }),
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Analysis failed");
            
            setAnalysisResult(data);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(`Analysis failed: ${err.message || 'Server error'}.`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [capturedImage]);

    /* ============ Helpers ============ */
    const sev = (s) => {
        switch (s) {
            case "mild": return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" };
            case "moderate": return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" };
            case "severe": return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" };
            default: return { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600", dot: "bg-zinc-500" };
        }
    };

    const m = healthMetrics;

    /* ============ RENDER ============ */
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col">
            {/* Header */}
            <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={20} /><span className="font-medium hidden sm:inline">Back</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                        <Scan size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">VIRA Vision</div>
                        <div className="text-xs text-zinc-500 hidden sm:block">AI Health Scanner</div>
                    </div>
                </div>
                <div className="w-20" />
            </header>

            {/* Main */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="w-full max-w-6xl mx-auto space-y-6">

                    {/* ========== REAL-TIME VITALS BAR (front camera only) ========== */}
                    {isCameraOn && faceModelsLoaded && facingMode === "user" && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2 h-2 rounded-full ${faceDetected ? "bg-green-500 animate-pulse" : "bg-zinc-400"}`} />
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    {faceDetected ? "Face Detected — Live Vitals" : "Looking for face..."}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {/* Heart Rate */}
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1"><Heart size={14} className="text-red-500" /><span className="text-[10px] font-bold text-red-500 uppercase">Heart Rate</span></div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white">{m.heartRate ? `${m.heartRate.bpm} bpm` : "—"}</div>
                                </div>
                                {/* SpO2 */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1"><Activity size={14} className="text-blue-500" /><span className="text-[10px] font-bold text-blue-500 uppercase">SpO2</span></div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white">{m.spo2 ? `${m.spo2.value}%` : "—"}</div>
                                </div>
                                {/* Breathing */}
                                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1"><Wind size={14} className="text-teal-500" /><span className="text-[10px] font-bold text-teal-500 uppercase">Breathing</span></div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white">{m.breathing ? m.breathing.rate : "—"}</div>
                                </div>
                                {/* Emotion */}
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1"><SmilePlus size={14} className="text-purple-500" /><span className="text-[10px] font-bold text-purple-500 uppercase">Mood</span></div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white">{m.emotion?.primary || "—"}</div>
                                </div>
                                {/* Skin */}
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1"><Thermometer size={14} className="text-amber-500" /><span className="text-[10px] font-bold text-amber-500 uppercase">Skin</span></div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white">{m.skinColor?.status || "—"}</div>
                                </div>
                            </div>

                            {/* Secondary metrics row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                    <Brain size={12} className="text-zinc-400" />
                                    <span className="text-xs text-zinc-500">Symmetry:</span>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{m.facialSymmetry ? `${m.facialSymmetry.score}%` : "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                    <Eye size={12} className="text-zinc-400" />
                                    <span className="text-xs text-zinc-500">Fatigue:</span>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{m.fatigue?.level || "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                    <Activity size={12} className="text-zinc-400" />
                                    <span className="text-xs text-zinc-500">Lip:</span>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{m.lipColor?.status || "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                    <AlertTriangle size={12} className="text-zinc-400" />
                                    <span className="text-xs text-zinc-500">Tremor:</span>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{m.headTremor?.status || "—"}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========== MAIN GRID ========== */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        {/* Left — Camera / Image */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                            <div className="relative">
                                <div className="w-full aspect-[4/3] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                                    {/* Video element is always rendered for ref stability */}
                                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${capturedImage || !isCameraOn ? 'hidden' : ''}`} />
                                    {capturedImage ? (
                                        <>
                                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                                            <button onClick={() => setShowZoom(!showZoom)} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"><ZoomIn size={18} /></button>
                                        </>
                                    ) : isCameraOn ? (
                                        <>
                                            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-white/40 rounded-3xl" />
                                            </div>
                                            <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                                                <p className="text-white/80 text-sm font-medium bg-black/40 inline-block px-4 py-1.5 rounded-full">
                                                    {facingMode === "user" ? "Face the camera for vitals" : "Position the affected area inside the frame"}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center"><Camera size={48} className="mx-auto text-zinc-600 mb-4" /><p className="text-zinc-500 text-sm">Camera is off</p></div>
                                    )}
                                </div>
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <canvas ref={hiddenCanvasRef} className="hidden" />

                            {/* Controls */}
                            <div className="p-5 space-y-3">
                                {error && (<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm"><AlertTriangle size={16} />{error}</div>)}
                                {!capturedImage ? (
                                    <div className="flex gap-3">
                                        {isCameraOn ? (
                                            <>
                                                <button onClick={capturePhoto} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg text-lg"><Camera size={22} /> Capture</button>
                                                <button onClick={switchCamera} className="w-14 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><SwitchCamera size={22} /></button>
                                            </>
                                        ) : (
                                            <button onClick={startCamera} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg text-lg"><Video size={22} /> Turn On Camera</button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button onClick={retakePhoto} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2"><RefreshCw size={20} /> Retake</button>
                                        <button onClick={analyzeImage} disabled={isAnalyzing} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                                            {isAnalyzing ? (<><Loader2 size={20} className="animate-spin" /> Analyzing...</>) : (<><Sparkles size={20} /> Analyze</>)}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right — Results */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-zinc-100 dark:border-zinc-800">
                            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                                <Heart size={20} className="text-rose-500" />
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Analysis Results</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 min-h-[350px] max-h-[600px]">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="relative"><div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 animate-pulse flex items-center justify-center"><Sparkles size={32} className="text-white" /></div><div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-rose-300 animate-ping" /></div>
                                        <p className="text-zinc-500 mt-6 font-medium">Analyzing skin condition...</p>
                                        <p className="text-zinc-400 text-sm mt-1">This may take a few seconds</p>
                                    </div>
                                ) : analysisResult ? (
                                    <div className="space-y-5">
                                        {/* Condition Header */}
                                        <div className={`p-4 rounded-2xl ${sev(analysisResult.severity).bg}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-3 h-3 rounded-full ${sev(analysisResult.severity).dot}`} />
                                                <span className={`font-bold text-lg ${sev(analysisResult.severity).text}`}>{analysisResult.condition}</span>
                                            </div>
                                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">{analysisResult.description}</p>
                                            <div className="flex gap-2 mt-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sev(analysisResult.severity).bg} ${sev(analysisResult.severity).text}`}>Severity: {analysisResult.severity}</span>
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Confidence: {analysisResult.confidence}</span>
                                            </div>
                                        </div>

                                        {/* Possible Conditions */}
                                        {analysisResult.possibleConditions?.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-zinc-900 dark:text-white mb-2 text-sm flex items-center gap-2"><AlertTriangle size={14} /> Possible Conditions</h4>
                                                <div className="space-y-2">
                                                    {analysisResult.possibleConditions.map((c, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
                                                            <span className="text-sm text-zinc-900 dark:text-white font-medium">{c.name}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.likelihood === "high" ? "bg-red-100 text-red-600" : c.likelihood === "moderate" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>{c.likelihood}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Immediate Steps */}
                                        {analysisResult.immediateSteps?.length > 0 && (
                                            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-200 dark:border-teal-800/40">
                                                <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-3 text-sm flex items-center gap-2"><CheckCircle size={14} /> Step-by-Step Guide</h4>
                                                <ol className="space-y-2">
                                                    {analysisResult.immediateSteps.map((step, i) => (
                                                        <li key={i} className="flex items-start gap-3">
                                                            <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                                            <span className="text-sm text-teal-700 dark:text-teal-300">{step}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}

                                        {/* Medications */}
                                        {analysisResult.medications?.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-zinc-900 dark:text-white mb-3 text-sm flex items-center gap-2"><Pill size={14} /> Recommended Medications</h4>
                                                <div className="space-y-3">
                                                    {analysisResult.medications.map((med, i) => (
                                                        <div key={i} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-bold text-zinc-900 dark:text-white">{med.name}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${med.type === "OTC" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>{med.type}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg"><span className="text-zinc-400 block">Usage</span><span className="text-zinc-700 dark:text-zinc-300 font-medium">{med.usage}</span></div>
                                                                <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg"><span className="text-zinc-400 block">Frequency</span><span className="text-zinc-700 dark:text-zinc-300 font-medium">{med.frequency}</span></div>
                                                                <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg"><span className="text-zinc-400 block">Duration</span><span className="text-zinc-700 dark:text-zinc-300 font-medium">{med.duration}</span></div>
                                                                {med.note && (<div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg"><span className="text-amber-500 block">⚠️ Note</span><span className="text-amber-700 dark:text-amber-300 font-medium">{med.note}</span></div>)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Home Remedies */}
                                        {analysisResult.homeRemedies?.length > 0 && (
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl">
                                                <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2 text-sm">🌿 Home Remedies</h4>
                                                <ul className="space-y-1">{analysisResult.homeRemedies.map((r, i) => (<li key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />{r}</li>))}</ul>
                                            </div>
                                        )}

                                        {/* Things to Avoid */}
                                        {analysisResult.doNot?.length > 0 && (
                                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                                                <h4 className="font-bold text-red-700 dark:text-red-300 mb-2 text-sm">🚫 Things to Avoid</h4>
                                                <ul className="space-y-1">{analysisResult.doNot.map((item, i) => (<li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"><X size={14} className="mt-0.5 shrink-0" />{item}</li>))}</ul>
                                            </div>
                                        )}

                                        {/* When to See Doctor */}
                                        {analysisResult.whenToSeeDoctor && (
                                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                                                <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-1 text-sm flex items-center gap-2"><AlertTriangle size={14} /> When to See a Doctor</h4>
                                                <p className="text-sm text-amber-600 dark:text-amber-400">{analysisResult.whenToSeeDoctor}</p>
                                            </div>
                                        )}

                                        <button onClick={retakePhoto} className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"><RefreshCw size={16} /> New Scan</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center mb-6"><Camera size={36} className="text-rose-400" /></div>
                                        <h4 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">Scan a Skin Condition</h4>
                                        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">Point your camera at any rash, bump, or skin issue. VIRA will analyze it and provide step-by-step medication guidance.</p>
                                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                            {["Rashes", "Burns", "Bites", "Acne", "Eczema", "Wounds"].map((tag) => (<span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-xs font-medium">{tag}</span>))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zoom Modal */}
            {showZoom && capturedImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"><X size={20} /></button>
                    <img src={capturedImage} alt="Zoomed" className="max-w-full max-h-full rounded-2xl" />
                </div>
            )}

            {/* Footer */}
            <footer className="py-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Shield size={12} /><span>VIRA is an AI assistant, not a doctor. Always consult healthcare professionals for medical decisions.</span>
            </footer>
        </div>
    );
}
