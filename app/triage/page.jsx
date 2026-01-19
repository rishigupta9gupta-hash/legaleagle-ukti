"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI, Modality } from "@google/genai";
import {
    Mic, MicOff, PhoneOff, Clock, CheckCircle,
    Loader2, RefreshCw, ArrowLeft,
    HeartPulse, Activity, Shield,
    Stethoscope, FileText, ChevronDown, Globe
} from "lucide-react";
import {
    arrayBufferToBase64,
    base64ToUint8Array,
    decodeAudioData,
    float32ToPCM16
} from "../utils/audio";
import AudioVisualizer from "../components/AudioVisualizer";
import { saveSession } from "@/app/utils/session-api";

/* ================= CONFIG ================= */
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

/* ================= LANGUAGES ================= */
const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

/* ================= SEVERITY LEVELS ================= */
const SEVERITY_LEVELS = {
    low: { label: "Low", color: "bg-green-500", textColor: "text-green-600" },
    moderate: { label: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-600" },
    high: { label: "High", color: "bg-orange-500", textColor: "text-orange-600" },
    emergency: { label: "Emergency", color: "bg-red-500", textColor: "text-red-600" }
};

/* ================= COMPONENT ================= */
export default function HealthTriage() {
    const router = useRouter();

    const [sessionStatus, setSessionStatus] = useState("idle");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [speakingCount, setSpeakingCount] = useState(0);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [assessmentData, setAssessmentData] = useState(null);
    const [fullTranscript, setFullTranscript] = useState([]);
    const [currentSeverity, setCurrentSeverity] = useState("low");

    // Language selector
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    // Mode toggles
    const [isBuddyMode, setIsBuddyMode] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const chatInputRef = useRef(null);

    const inputAudioContextRef = useRef(null);
    const outputAudioContextRef = useRef(null);
    const audioStreamRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const inputAnalyserRef = useRef(null);
    const outputAnalyserRef = useRef(null);
    const sessionRef = useRef(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set());

    useEffect(() => {
        if (sessionStatus !== "active") return;
        const interval = setInterval(() => setSessionDuration(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, [sessionStatus]);

    useEffect(() => {
        return () => stopSession();
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const connectToLive = async () => {
        if (!API_KEY) {
            alert("API Key missing!");
            return;
        }
        if (isConnecting || sessionStatus === 'active') return;
        setIsConnecting(true);

        try {
            const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;

            inputAnalyserRef.current = inputCtx.createAnalyser();
            outputAnalyserRef.current = outputCtx.createAnalyser();

            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);
            outputNode.connect(outputAnalyserRef.current);

            const ai = new GoogleGenAI({ apiKey: API_KEY });

            const languageInstruction = selectedLanguage.code !== 'en'
                ? `Respond in ${selectedLanguage.name} (${selectedLanguage.native}) language. `
                : '';

            const buddyModeInstruction = isBuddyMode
                ? `You are VIRA, a friendly wellness buddy. ${languageInstruction}You're here to chat, provide emotional support, and help with daily wellness.

BUDDY MODE - Be casual and friendly:
1. Talk like a caring friend, not a medical assistant
2. Help with mood, anxiety, reminders, and daily wellness
3. Remember context from the conversation
4. Suggest healthy habits, hydration, breaks, etc.
5. Be encouraging and positive

Start by saying: "Hey! I'm here whenever you want to chat. How's your day going?"`
                : `You are VIRA, a compassionate AI health assistant. ${languageInstruction}Help users understand their symptoms and provide guidance.

MEDICAL MODE - Be professional but warm:
1. You are NOT a doctor - always remind users to consult professionals
2. NEVER diagnose diseases or prescribe medications
3. Be empathetic and ask follow-up questions about symptoms
4. Assess severity (low, moderate, high, emergency)
5. Suggest next steps (rest, doctor visit, emergency)

Start by saying: "Hi, I'm VIRA. How are you feeling today?"`;

            const systemInstruction = isBuddyMode ? buddyModeInstruction : buddyModeInstruction;

            const sessionPromise = ai.live.connect({
                model: LIVE_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onopen: async () => {
                        setSessionStatus("active");
                        setFullTranscript([]);
                        await startMicrophoneStream(inputCtx, sessionPromise);
                    },
                    onmessage: async (msg) => await handleServerMessage(msg, outputCtx, outputNode),
                    onclose: () => { },
                    onerror: (err) => { setIsConnecting(false); }
                }
            });

            sessionRef.current = sessionPromise;
            setIsConnecting(false);
        } catch (e) {
            setIsConnecting(false);
            setSessionStatus("idle");
            alert("Connection failed: " + e.message);
        }
    };

    const startMicrophoneStream = async (ctx, sessionPromise) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            if (inputAnalyserRef.current) source.connect(inputAnalyserRef.current);

            const processor = ctx.createScriptProcessor(2048, 1, 1);
            processor.onaudioprocess = (e) => {
                if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed' || !isMicOn) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = float32ToPCM16(inputData);
                const base64Data = arrayBufferToBase64(pcm16.buffer);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } });
                }).catch(() => { });
            };
            source.connect(processor);
            processor.connect(ctx.destination);
        } catch (err) {
            alert("Microphone access denied.");
        }
    };

    const handleServerMessage = async (msg, ctx, outputNode) => {
        const inputTx = msg.serverContent?.inputTranscription?.text;
        const outputTx = msg.serverContent?.outputTranscription?.text;

        if (inputTx || outputTx) {
            setFullTranscript(prev => {
                const newLogs = [...prev];
                if (inputTx) newLogs.push({ role: 'You', text: inputTx });
                if (outputTx) newLogs.push({ role: 'VIRA', text: outputTx });
                return newLogs;
            });
        }

        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData && ctx.state !== 'closed') {
            try {
                const uint8Array = base64ToUint8Array(audioData);
                const audioBuffer = await decodeAudioData(uint8Array, ctx, 24000, 1);
                const currentTime = ctx.currentTime;
                let startTime = nextStartTimeRef.current < currentTime ? currentTime : nextStartTimeRef.current;

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.start(startTime);

                nextStartTimeRef.current = startTime + audioBuffer.duration;
                sourcesRef.current.add(source);

                setTimeout(() => setSpeakingCount(prev => prev + 1), Math.max(0, (startTime - currentTime) * 1000));
                source.onended = () => {
                    setSpeakingCount(prev => Math.max(0, prev - 1));
                    sourcesRef.current.delete(source);
                };
            } catch (e) { }
        }

        if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setSpeakingCount(0);
        }
    };

    const stopSession = (endedByUser = true) => {
        if (sessionStatus === 'active' && endedByUser) {
            setSessionStatus("finished");
            generateAssessment();
        } else if (sessionStatus !== 'finished') {
            setSessionStatus("idle");
        }
        setIsConnecting(false);

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(t => t.stop());
            audioStreamRef.current = null;
        }
        try { inputAudioContextRef.current?.close(); } catch (e) { }
        try { outputAudioContextRef.current?.close(); } catch (e) { }
        sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
        sourcesRef.current.clear();
        setSpeakingCount(0);
        try { sessionRef.current?.close(); } catch (e) { }
        sessionRef.current = null;
    };

    const generateAssessment = () => {
        setIsAnalyzing(true);
        setTimeout(async () => {
            const severityLevel = currentSeverity || 'low';
            const assessment = {
                severity: severityLevel,
                summary: "Based on our conversation, your symptoms appear to be " + SEVERITY_LEVELS[severityLevel].label.toLowerCase() + " severity.",
                recommendations: ["Monitor symptoms", "Stay hydrated", "Rest well", "Consult a doctor if symptoms worsen"]
            };

            setAssessmentData(assessment);
            setIsAnalyzing(false);

            // Save to Database
            if (fullTranscript.length > 0) {
                await saveSession({
                    duration: sessionDuration,
                    transcript: fullTranscript,
                    summary: assessment.summary,
                    severity: assessment.severity,
                    recommendations: assessment.recommendations,
                    mode: isBuddyMode ? 'buddy' : 'medical',
                    language: selectedLanguage.code
                });
            }
        }, 2000);
    };

    const resetSession = () => {
        setSessionStatus('idle');
        setSessionDuration(0);
        setAssessmentData(null);
        setFullTranscript([]);
        setCurrentSeverity("low");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col">
            {/* Header - Matching Reference Exactly */}
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
                        <div className="font-bold text-zinc-900 dark:text-white">VIRA</div>
                        <div className="text-xs text-zinc-500">AI Health Companion</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Buddy Mode Toggle */}
                    <button
                        onClick={() => setIsBuddyMode(!isBuddyMode)}
                        disabled={sessionStatus === 'active'}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${isBuddyMode
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            } ${sessionStatus === 'active' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                    >
                        <span>{isBuddyMode ? '💬 Buddy' : '🩺 Medical'}</span>
                    </button>

                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors text-sm font-medium"
                        >
                            <Globe size={16} />
                            <span>{selectedLanguage.name}</span>
                            <ChevronDown size={14} className={`transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showLanguageDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setSelectedLanguage(lang);
                                            setShowLanguageDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between ${selectedLanguage.code === lang.code ? 'text-teal-600 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        <span>{lang.native}</span>
                                        <span className="text-xs text-zinc-400">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Clock size={18} />
                        <span className="font-mono font-medium">{formatTime(sessionDuration)}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Panel - Avatar Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=450&fit=crop&crop=faces"
                                alt="VIRA"
                                className="w-full aspect-[4/3] object-cover"
                            />

                            {/* READY Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide ${sessionStatus === 'active'
                                    ? 'bg-green-500 text-white'
                                    : sessionStatus === 'finished'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-teal-500 text-white'
                                    }`}>
                                    {sessionStatus === 'active' ? 'Listening' : sessionStatus === 'finished' ? 'Complete' : 'Ready'}
                                </span>
                            </div>

                            {/* Audio Visualizer */}
                            {sessionStatus === 'active' && speakingCount > 0 && outputAnalyserRef.current && (
                                <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                                    <AudioVisualizer
                                        analyser={outputAnalyserRef.current}
                                        isActive={speakingCount > 0}
                                        color="#ffffff"
                                        width={180}
                                        height={40}
                                    />
                                </div>
                            )}

                            {/* Name Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-16">
                                <h3 className="text-white font-bold text-2xl">VIRA</h3>
                                <p className="text-white/70 text-sm">Your AI Health Companion</p>
                            </div>
                        </div>

                        {/* Button */}
                        <div className="p-5">
                            {sessionStatus === 'idle' ? (
                                <button
                                    onClick={connectToLive}
                                    disabled={isConnecting}
                                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg text-lg"
                                >
                                    {isConnecting ? (
                                        <><Loader2 size={22} className="animate-spin" /> Connecting...</>
                                    ) : (
                                        <><Stethoscope size={22} /> Start Health Check</>
                                    )}
                                </button>
                            ) : sessionStatus === 'active' ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsMicOn(!isMicOn)}
                                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isMicOn
                                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700'
                                            : 'bg-red-100 text-red-600'
                                            }`}
                                    >
                                        {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
                                    </button>
                                    <button
                                        onClick={stopSession}
                                        className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        <PhoneOff size={22} /> End
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={resetSession}
                                    className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={20} /> New Session
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Conversation */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-zinc-100 dark:border-zinc-800">
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                            <FileText size={20} className="text-teal-500" />
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Conversation</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
                            {sessionStatus === 'finished' && assessmentData ? (
                                <div className="space-y-4">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader2 size={40} className="text-teal-500 animate-spin mb-4" />
                                            <p className="text-zinc-500">Analyzing...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${SEVERITY_LEVELS[assessmentData.severity].color}`}>
                                                    <Activity size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-sm ${SEVERITY_LEVELS[assessmentData.severity].textColor}`}>
                                                        {SEVERITY_LEVELS[assessmentData.severity].label}
                                                    </div>
                                                    <p className="text-xs text-zinc-500">{assessmentData.summary}</p>
                                                </div>
                                            </div>
                                            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl">
                                                <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-2 text-sm flex items-center gap-2">
                                                    <CheckCircle size={14} /> Recommendations
                                                </h4>
                                                <ul className="space-y-1">
                                                    {assessmentData.recommendations.map((rec, i) => (
                                                        <li key={i} className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-2">
                                                            <span className="w-1 h-1 bg-teal-500 rounded-full" />{rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <button onClick={resetSession} className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold text-sm">
                                                Start New Check
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : fullTranscript.length > 0 ? (
                                <div className="space-y-4">
                                    {fullTranscript.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'You' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'You'
                                                ? 'bg-teal-500 text-white rounded-br-sm'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-sm'
                                                }`}>
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                        <Stethoscope size={28} className="text-zinc-400" />
                                    </div>
                                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Start a health check to begin</h4>
                                    <p className="text-sm text-zinc-500">
                                        VIRA will listen and help assess your concerns
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Shield size={12} />
                <span>VIRA is an AI assistant, not a doctor. Always consult healthcare professionals for medical decisions.</span>
            </footer>
        </div>
    );
}
