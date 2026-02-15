"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HeartPulse } from "lucide-react";

export const Footer = () => {
  const router = useRouter();

  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 pt-20 pb-10 px-6 border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          {/* Brand Column - spans 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <HeartPulse size={18} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">VIRA</h3>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
              VIRA is an AI-powered health assistant that helps you understand symptoms, track medications, and manage your wellness journey. Always consult healthcare professionals for medical decisions.
            </p>
          </div>

          {/* Health Features */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-6">Features</h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><button onClick={() => router.push("/triage")} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left">Symptom Check</button></li>
              <li><button onClick={() => router.push("/medications")} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left">Medication Tracker</button></li>
              <li><button onClick={() => router.push("/reports")} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left">Report Analysis</button></li>
              <li><button onClick={() => router.push("/programs")} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left">Care Programs</button></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-6">About</h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">About VIRA</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Safety & AI</a></li>
              <li><button onClick={() => router.push("/contact")} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left">Contact Us</button></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Health Disclaimer</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Data Security</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-6">Resources</h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Health Blog</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© 2024 VIRA Health AI. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <span className="text-amber-600 dark:text-amber-400">Not a replacement for professional medical advice</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
