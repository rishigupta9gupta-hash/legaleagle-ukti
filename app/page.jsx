"use client"
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ChevronDown,
  Star,
  ArrowRight,
  Sparkles,
  X,
  Mic,
  Video,
  Info,
  Heart,
  Shield,
  Activity,
  Pill,
  FileText,
  Brain,
  Camera,
  MessageCircle,
  Clock,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  Salad,
  Bell,
  Upload
} from "lucide-react";
import { Footer } from "./compoents/Footer";

const StepCard = ({ number, title, desc, icon }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center hover:shadow-lg transition-all duration-300 group">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
      {icon || number}
    </div>
    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
  </div>
);

const TestimonialCard = ({ quote, author, role }) => (
  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
    <div className="flex text-teal-500 mb-4">
      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
    </div>
    <p className="text-zinc-700 dark:text-zinc-300 italic mb-6">"{quote}"</p>
    <div>
      <div className="font-bold text-zinc-900 dark:text-white">{author}</div>
      <div className="text-xs text-zinc-500">{role}</div>
    </div>
  </div>
);

const FaqItem = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className="font-medium text-zinc-900 dark:text-white pr-8 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{q}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180 text-teal-600" : "text-zinc-400"}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mb-4 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // Auto-rotate benefits
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const benefits = [
    {
      id: 1,
      title: "Voice-to-Voice Health Talks",
      desc: "Speak naturally with VIRA about your symptoms. Our AI listens, understands tone and hesitation, and asks smart follow-up questions just like a caring doctor.",
      icon: <Mic />,
      color: "from-teal-500 to-cyan-600",
      renderVisual: () => (
        <div className="w-full h-full flex flex-col relative rounded-xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800">
          <div className="h-10 bg-zinc-800 flex items-center px-4 gap-2 border-b border-zinc-700">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <div className="ml-auto text-xs text-zinc-400 font-mono flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Health Session
            </div>
          </div>
          <div className="flex-1 relative bg-gradient-to-br from-teal-900/20 to-zinc-950 p-4 flex items-center justify-center">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-teal-500/30 p-1 relative">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <HeartPulse size={60} className="text-white animate-pulse" />
              </div>
              <div className="absolute -bottom-2 right-4 bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-zinc-900">
                VIRA
              </div>
            </div>
          </div>
          <div className="h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-6">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white animate-pulse"><Mic size={18} /></div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/50"><Video size={20} /></div>
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><MessageCircle size={18} /></div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Smart Symptom Analysis",
      desc: "VIRA analyzes your symptoms using multimodal AI - voice, text, and optional camera - to provide severity assessment and personalized guidance.",
      icon: <Brain />,
      color: "from-purple-500 to-pink-600",
      renderVisual: () => (
        <div className="w-full h-full p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white dark:from-zinc-900 dark:to-zinc-950"></div>
          <div className="relative z-10 h-full flex flex-col justify-center">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-700 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <HeartPulse size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">Severity Assessment</div>
                  <div className="text-xs text-zinc-500">Based on your symptoms</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Risk Level</span>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full">MODERATE</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-green-500 via-yellow-500 to-yellow-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-teal-600 dark:text-teal-400 mt-0.5" />
                <p className="text-sm text-teal-700 dark:text-teal-300">Recommended: Schedule a doctor visit within 48 hours</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Medication Intelligence",
      desc: "Scan medicine strips, track dosages, get expiry alerts, and never miss a dose with smart reminders. Perfect for managing complex medication schedules.",
      icon: <Pill />,
      color: "from-orange-500 to-red-600",
      renderVisual: () => (
        <div className="w-full h-full flex items-center justify-center p-6 relative bg-zinc-50 dark:bg-zinc-900/50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-700 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-zinc-900 dark:text-white">Today's Medications</h4>
              <Bell size={18} className="text-teal-500" />
            </div>
            <div className="space-y-3">
              {[
                { name: "Vitamin D3", time: "8:00 AM", status: "taken", color: "bg-green-500" },
                { name: "Metformin", time: "2:00 PM", status: "upcoming", color: "bg-yellow-500" },
                { name: "Omega-3", time: "8:00 PM", status: "pending", color: "bg-zinc-300" }
              ].map((med, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${med.color}`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-zinc-900 dark:text-white">{med.name}</div>
                    <div className="text-xs text-zinc-500">{med.time}</div>
                  </div>
                  {med.status === "taken" && <CheckCircle size={18} className="text-green-500" />}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-medium">
                <AlertTriangle size={14} />
                Aspirin expires in 5 days
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Report Analysis",
      desc: "Upload lab reports and prescriptions. VIRA explains results in simple language and provides updated health guidance based on your reports.",
      icon: <FileText />,
      color: "from-blue-500 to-indigo-600",
      renderVisual: () => (
        <div className="w-full h-full p-8 flex flex-col justify-center relative bg-white dark:bg-zinc-950">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-zinc-900 dark:text-white">Blood Test Report</div>
                <div className="text-xs text-zinc-500">Uploaded today</div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Hemoglobin</span>
                <span className="font-bold text-green-600">14.2 g/dL ✓</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Vitamin D</span>
                <span className="font-bold text-yellow-600">18 ng/mL ⚠</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Blood Sugar</span>
                <span className="font-bold text-green-600">95 mg/dL ✓</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>VIRA says:</strong> Your Vitamin D is low. Consider supplements and 15 min daily sunlight.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleStartHealthCheck = () => {
    setShowConsentModal(true);
  };

  const handleConsentAndStart = () => {
    if (!consentGiven) return;
    setShowConsentModal(false);
    router.push('/triage');
  };

  return (
    <div className="flex flex-col min-h-screen relative">

      {/* --- HERO SECTION --- */}
      <div className="relative pt-20 pb-24 px-6 overflow-visible">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 blur-[120px] rounded-full -z-10" />

        <div className="max-w-[1600px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium mb-6 backdrop-blur-sm shadow-sm">
            <HeartPulse size={12} className="text-teal-500 dark:text-teal-400" />
            <span>AI-Powered Health Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight leading-tight">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 dark:from-teal-400 dark:via-cyan-500 dark:to-teal-400">VIRA</span> <br className="hidden md:block" />
            Your AI Health Companion
          </h1>

          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Talk naturally about your symptoms, get intelligent health guidance, track medications, and manage your wellness journey — all with voice-first AI.
          </p>

          {/* --- CTA BUTTONS --- */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleStartHealthCheck}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-lg"
            >
              <Stethoscope size={22} />
              Start Health Check
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-2 text-lg border border-zinc-200 dark:border-zinc-700"
            >
              Get Started Free
              <ArrowRight size={18} />
            </button>
          </div>

          <p className="text-sm text-zinc-500 flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1"><Shield size={14} className="text-teal-600" /> Privacy First</span>
            <span className="mx-2">•</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} className="text-teal-600" /> Not a replacement for doctors</span>
            <span className="mx-2">•</span>
            <span className="flex items-center gap-1"><Heart size={14} className="text-teal-600" /> Always free to start</span>
          </p>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
            {[
              { icon: <Stethoscope size={22} />, label: 'Symptom Check', href: '/triage', color: 'from-teal-500 to-cyan-500' },
              { icon: <Pill size={22} />, label: 'Medications', href: '/medication', color: 'from-orange-500 to-red-500' },
              { icon: <FileText size={22} />, label: 'Report Analysis', href: '/reports', color: 'from-blue-500 to-indigo-500' },
              { icon: <Heart size={22} />, label: 'Care Programs', href: '/programs', color: 'from-pink-500 to-rose-500' }
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => router.push(item.href)}
                className="group bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-lg hover:scale-105 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- DISCLAIMER BANNER --- */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-800 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3 text-amber-700 dark:text-amber-300">
          <Info size={20} className="shrink-0" />
          <p className="text-sm">
            <strong>Important:</strong> VIRA is an AI health assistant, not a doctor. It provides guidance and suggestions only. Always consult healthcare professionals for medical decisions.
          </p>
        </div>
      </div>

      {/* --- BENEFITS SECTION --- */}
      <div className="py-24 px-6 bg-white dark:bg-zinc-950/50 border-y border-zinc-100 dark:border-zinc-900 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">Why Choose VIRA?</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Multimodal AI that listens, understands, and guides your health journey with care and intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Navigation */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {benefits.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setActiveBenefit(index)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 relative ${activeBenefit === index
                    ? 'bg-zinc-50 dark:bg-zinc-900 shadow-lg scale-100'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 scale-95 opacity-70 hover:opacity-100'
                    }`}
                >
                  {activeBenefit === index && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-l-2xl"></div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${activeBenefit === index
                      ? `bg-gradient-to-br ${item.color} text-white`
                      : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}>
                      {React.cloneElement(item.icon, { size: 24 })}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 transition-colors ${activeBenefit === index ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
                        }`}>
                        {item.title}
                      </h3>
                      <p className={`text-base leading-relaxed transition-colors ${activeBenefit === index ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-500'
                        }`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Visual Display */}
            <div className="lg:col-span-7 h-[500px] relative">
              {benefits.map((item, index) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-all duration-700 ${activeBenefit === index
                    ? 'opacity-100 z-20'
                    : 'opacity-0 z-0'
                    }`}
                >
                  <div className="w-full h-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="w-full h-full relative z-10">
                      {item.renderVisual()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <div className="py-24 bg-zinc-50 dark:bg-zinc-900/30 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">How VIRA Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard number="1" icon={<MessageCircle size={20} />} title="Describe Symptoms" desc="Talk or type about how you're feeling. VIRA listens and asks follow-up questions." />
            <StepCard number="2" icon={<Brain size={20} />} title="AI Assessment" desc="Our multimodal AI analyzes your input to understand severity and patterns." />
            <StepCard number="3" icon={<Activity size={20} />} title="Get Guidance" desc="Receive personalized recommendations — rest, home care, or see a doctor." />
            <StepCard number="4" icon={<Heart size={20} />} title="Track & Improve" desc="Monitor medications, upload reports, and build lasting health habits." />
          </div>
        </div>
      </div>

      {/* --- FEATURES GRID --- */}
      <div className="py-24 px-6 bg-white dark:bg-black">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">Complete Health Companion</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              From symptom checks to medication tracking, VIRA covers your entire health journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Mic size={24} />, title: "Voice Conversations", desc: "Natural voice-to-voice health talks", href: "/triage" },
              { icon: <Camera size={24} />, title: "Visual Assessment", desc: "Optional camera for visual symptoms", href: "/triage" },
              { icon: <Pill size={24} />, title: "Medication Tracker", desc: "Never miss a dose with smart reminders", href: "/medication" },
              { icon: <FileText size={24} />, title: "Report Analysis", desc: "Upload and understand lab reports", href: "/reports" },
              { icon: <Salad size={24} />, title: "Care Programs", desc: "Condition-specific wellness plans", href: "/programs" },
              { icon: <Bell size={24} />, title: "Health Buddy", desc: "Daily check-ins and wellness nudges", href: "/triage" }
            ].map((feature, i) => (
              <div key={i} onClick={() => router.push(feature.href)} className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- TESTIMONIALS --- */}
      <div className="py-24 px-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">Loved by Users</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="VIRA helped me understand my symptoms and guided me to see a doctor early. The medication reminders are a lifesaver!"
              author="Priya S."
              role="Working Professional"
            />
            <TestimonialCard
              quote="Finally an app that explains my lab reports in simple language. I feel more informed about my health now."
              author="Rajesh K."
              role="Diabetic Patient"
            />
            <TestimonialCard
              quote="The voice conversations feel so natural. It's like having a caring friend who understands health."
              author="Anita M."
              role="Senior Citizen"
            />
          </div>
        </div>
      </div>

      {/* --- FAQ --- */}
      <div className="py-24 bg-white dark:bg-zinc-900/50 px-6 border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <FaqItem q="Is VIRA a replacement for doctors?" a="No. VIRA is an AI health assistant that provides guidance and suggestions. Always consult healthcare professionals for medical decisions and emergencies." />
            <FaqItem q="Is my health data secure?" a="Absolutely. We prioritize privacy. Your health conversations and data are encrypted and never shared with third parties. You control your data." />
            <FaqItem q="Can I use VIRA for emergencies?" a="For emergencies, always call emergency services immediately. VIRA can help with general health guidance but is not designed for emergency situations." />
            <FaqItem q="How does medication tracking work?" a="You can scan medicine strips or manually add medications. VIRA tracks dosages, sends reminders, and alerts you about expiring medicines." />
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <Footer />

      {/* --- CONSENT MODAL --- */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Before We Start</h3>
              </div>
              <button onClick={() => setShowConsentModal(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1">Important Disclaimer</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      VIRA is an AI health assistant, <strong>not a doctor</strong>. It provides guidance only and should never replace professional medical advice.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-zinc-900 dark:text-white">VIRA needs access to:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <Mic size={20} className="text-teal-500" />
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">Microphone</div>
                      <div className="text-xs text-zinc-500">For voice conversations</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <Camera size={20} className="text-teal-500" />
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">Camera (Optional)</div>
                      <div className="text-xs text-zinc-500">For visual symptom assessment</div>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer mt-0.5"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  I understand that VIRA is an AI assistant, not a medical professional. I agree to the <span className="text-teal-600 hover:underline">terms of use</span> and <span className="text-teal-600 hover:underline">privacy policy</span>.
                </span>
              </label>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConsentAndStart}
                disabled={!consentGiven}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20"
              >
                Continue to Health Check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
