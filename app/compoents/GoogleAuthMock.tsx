import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface GoogleAuthMockProps {
  onClose: () => void;
  onLogin: (user: { name: string; email: string; picture?: string }) => void;
}

export const GoogleAuthMock: React.FC<GoogleAuthMockProps> = ({ onClose, onLogin }) => {
  // Simulating accounts that might be found in a browser session
  const accounts = [
    { name: "Demo User", email: "demo.user@gmail.com", letter: "D", color: "bg-purple-600" },
    { name: "Developer Account", email: "dev@intervue.x", letter: "A", color: "bg-emerald-600" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transform scale-100 animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Warning Banner explaining why this mock exists */}
        <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-[10px] text-amber-800 dark:text-amber-200 flex items-center gap-2 border-b border-amber-100 dark:border-amber-900/30">
             <AlertTriangle size={12} />
             <span>Demo Mode: Real Google Sign-In blocked by domain origin.</span>
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="font-medium text-lg text-zinc-700 dark:text-zinc-200">Sign in with Google</span>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2">
            <div className="text-center mb-6">
                <h3 className="text-base font-normal text-zinc-900 dark:text-white">Choose an account</h3>
                <p className="text-sm text-zinc-500">to continue to InterVue X</p>
            </div>

            <div className="space-y-2">
                {accounts.map(acc => (
                    <button 
                        key={acc.email}
                        onClick={() => onLogin(acc)}
                        className="w-full flex items-center gap-4 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors border border-transparent border-b-zinc-100 dark:border-b-zinc-800 last:border-0 text-left group"
                    >
                        <div className={`w-10 h-10 rounded-full ${acc.color} flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
                            {acc.letter}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">{acc.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{acc.email}</div>
                        </div>
                    </button>
                ))}
                
                <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                     <button className="w-full flex items-center gap-4 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-left text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                        <div className="w-10 h-10 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center shrink-0">
                             <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        Use another account
                     </button>
                </div>
            </div>

            <div className="mt-8 text-[11px] text-zinc-500 text-center leading-relaxed">
                To continue, Google will share your name, email address, and language preference with InterVue X.
            </div>
        </div>
      </div>
    </div>
  );
};