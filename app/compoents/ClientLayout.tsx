"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Sun, Moon, LogOut, User, HeartPulse, Stethoscope, Pill, FileText, Heart, MessageCircle, Users, Menu, X } from 'lucide-react';
import { getSession, clearSession } from '../utils/auth';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isDark, setIsDark] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved) {
            setIsDark(saved === 'dark');
        } else {
            // Default to system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(prefersDark);
        }
    }, []);

    // Sync state with HTML class
    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDark]);

    // Check for logged in user on mount and route change
    useEffect(() => {
        const sessionUser = getSession();
        setUser(sessionUser);
        setIsMobileMenuOpen(false); // Close mobile menu on route change
    }, [pathname]);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const handleLogout = () => {
        clearSession();
        setUser(null);
        router.push('/login');
    };

    const navItems = [
        { name: 'Health Check', path: '/triage', hasDropdown: false },
        { name: 'Find Doctors', path: '/doctors', hasDropdown: false },
        { name: 'Features', path: '#', hasDropdown: true },
        ...(user ? [{ name: 'Chat', path: '/chat', hasDropdown: false }] : []),
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-200 transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 py-4 px-6 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50 transition-colors duration-300 print:hidden">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    {/* Left: Logo & Main Nav */}
                    <div className="flex items-center gap-4 lg:gap-10">
                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Logo */}
                        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                                <HeartPulse size={18} className="text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                VIRA
                            </span>
                        </Link>

                        {/* Nav Links (Desktop) */}
                        <nav className="hidden md:flex items-center gap-8 text-base font-medium text-zinc-600 dark:text-zinc-400">
                            {navItems.map((item) => (
                                <div key={item.name} className="relative group">
                                    <button
                                        onClick={() => item.path !== '#' && router.push(item.path)}
                                        className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors focus:outline-none py-2"
                                    >
                                        {item.name}
                                        {item.hasDropdown && (
                                            <ChevronDown
                                                size={14}
                                                className="mt-0.5 group-hover:rotate-180 transition-transform duration-200"
                                            />
                                        )}
                                    </button>

                                    {/* Features Dropdown */}
                                    {item.name === 'Features' && (
                                        <div className="absolute top-full left-0 pt-4 w-[320px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 relative overflow-hidden">
                                                <ul className="space-y-2">
                                                    <li>
                                                        <button
                                                            onClick={() => router.push('/triage')}
                                                            className="w-full text-left p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                                                <Stethoscope size={16} className="text-teal-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-zinc-900 dark:text-white text-sm">Symptom Check</div>
                                                                <div className="text-xs text-zinc-500">AI-powered health assessment</div>
                                                            </div>
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            onClick={() => router.push('/medication')}
                                                            className="w-full text-left p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                                <Pill size={16} className="text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-zinc-900 dark:text-white text-sm">Medications</div>
                                                                <div className="text-xs text-zinc-500">Track and manage medicines</div>
                                                            </div>
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            onClick={() => router.push('/reports')}
                                                            className="w-full text-left p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                                <FileText size={16} className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-zinc-900 dark:text-white text-sm">Report Analysis</div>
                                                                <div className="text-xs text-zinc-500">Understand lab results</div>
                                                            </div>
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            onClick={() => router.push('/care-programs')}
                                                            className="w-full text-left p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                                                <Heart size={16} className="text-pink-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-zinc-900 dark:text-white text-sm">Care Programs</div>
                                                                <div className="text-xs text-zinc-500">Condition-specific care</div>
                                                            </div>
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {user ? (
                            <div className="relative group">
                                <button className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700">
                                    <span className="hidden md:inline text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[100px] md:max-w-none">
                                        {user.name}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                </button>

                                {/* User Dropdown */}
                                <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden p-1">
                                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                                            <p className="text-xs text-zinc-500">Signed in as</p>
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                                        >
                                            <User size={16} /> Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Log out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.push('/contact')}
                                    className="hidden md:block text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                                >
                                    Contact Us
                                </button>

                                <Link
                                    href="/login"
                                    className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-black text-sm md:text-base font-semibold transition-colors"
                                >
                                    Log in
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Content */}
                {isMobileMenuOpen && (
                    <div className="md:hidden pt-4 pb-2 border-t border-zinc-200 dark:border-zinc-800 mt-4 animate-in slide-in-from-top-4 fade-in duration-200">
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <div key={item.name}>
                                    {item.name === 'Features' ? (
                                        <div className="py-2">
                                            <div className="px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-white">Features</div>
                                            <div className="pl-4 space-y-1 mt-1">
                                                <button onClick={() => router.push('/triage')} className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Symptom Check</button>
                                                <button onClick={() => router.push('/medication')} className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Medications</button>
                                                <button onClick={() => router.push('/reports')} className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Report Analysis</button>
                                                <button onClick={() => router.push('/care-programs')} className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Care Programs</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => router.push(item.path)}
                                            className="w-full text-left px-3 py-3 text-base font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                                        >
                                            {item.name}
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!user && (
                                <button
                                    onClick={() => router.push('/contact')}
                                    className="w-full text-left px-3 py-3 text-base font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                                >
                                    Contact Us
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full relative">{children}</main>
        </div>
    );
};
