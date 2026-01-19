"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleGenAI } from '@google/genai';
import { Upload, Wand2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function WhiteboardPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: prompt }
          ]
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imgUrl = `data:image/png;base64,${part.inlineData.data}`;
            setResultImage(imgUrl);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) alert("The model didn't return an image. Try a different prompt.");
    } catch (error) {
      console.error(error);
      alert("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col transition-colors duration-300">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors self-start"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Whiteboard AI Editor</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload technical diagrams or photos and ask Gemini to modify them.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* Input Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex-1 flex flex-col items-center justify-center relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            {selectedImage ? (
              <img src={selectedImage} alt="Original" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
                  <Upload size={32} />
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 font-medium">Click to upload an image</p>
                <p className="text-zinc-500 dark:text-zinc-600 text-sm mt-1">PNG, JPG supported</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Edit Instruction</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Add a Redis cache node between Service A and DB'"
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={handleGenerate}
                disabled={!selectedImage || !prompt || isGenerating}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
          {resultImage ? (
            <div className="w-full h-full p-4 flex flex-col">
              <div className="flex-1 relative">
                <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
              </div>
              <a
                href={resultImage}
                download="edited-whiteboard.png"
                className="mt-4 w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-center font-medium transition-colors"
              >
                Download Result
              </a>
            </div>
          ) : (
            <div className="text-center p-6 opacity-30">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
                <ImageIcon size={32} />
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">Generated result will appear here</p>
            </div>
          )}

          {/* Center Arrow for large screens */}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:block hidden z-10">
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-full shadow-lg">
              <ArrowRight className="text-zinc-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Image Icon without TS annotation
const ImageIcon = ({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);
