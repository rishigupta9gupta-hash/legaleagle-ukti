"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { registerUser } from '@/app/utils/auth-api';
import { parseJwt, googleAuthenticate } from '@/app/utils/auth';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    const initializeGoogleAuth = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
            use_fedcm_for_prompt: true,
          });

          window.google.accounts.id.renderButton(
            document.getElementById('googleSignUpDiv'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signup_with',
            }
          );
        } catch (err) {
          console.error('Google Auth Init Failed', err);
        }
      }
    };

    initializeGoogleAuth();
  }, []);

  const handleGoogleCallback = (response) => {
    try {
      const userObj = parseJwt(response.credential);
      if (userObj.email) {
        const result = googleAuthenticate(userObj);
        if (result.success) {
          router.push('/');
        } else {
          setError('Authentication failed.');
        }
      }
    } catch {
      setError('Google authentication failed. Please try again.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    const newUser = {
      name: formData.name,
      email: formData.email,
      password: formData.password
    };

    const result = await registerUser(newUser);

    if (result.success) {
      // Redirect to login page or auto-login
      router.push('/login?success=1');
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      {/* Google Identity Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline font-medium">Back to Home</span>
        </button>

        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-zinc-900 dark:text-white">Create an account</h1>
            <p className="text-sm text-zinc-500">
              Join VIRA Health to start your journey
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-lg bg-zinc-50 dark:bg-zinc-950"
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-lg bg-zinc-50 dark:bg-zinc-950"
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-lg bg-zinc-50 dark:bg-zinc-950"
            />

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all">
              Create Account <ArrowRight size={18} />
            </button>
          </form>

          <div className="my-6 text-center text-xs text-zinc-500">
            Or sign up with
          </div>

          <div id="googleSignUpDiv" />

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-zinc-900 dark:text-white hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
