import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Video, Loader2, PlayCircle, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_KEY = process.env.API_KEY || '';

export const VideoStudio = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const handleGenerateVideo = async () => {
    if (!prompt) return;

    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }
    } catch (e) {
      console.warn("Key selection check failed, proceeding with env key", e);
    }

    setIsGenerating(true);
    setVideoUrl(null);
    setProgressMessage('Initializing Veo model...');

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      setProgressMessage('Sending generation request...');
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: aspectRatio
        }
      });

      setProgressMessage('Video rendering in progress. This may take a minute...');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setProgressMessage('Still rendering...');
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const videoRes = await fetch(`${downloadLink}&key=${API_KEY}`);
        const blob = await videoRes.blob();
        const localUrl = URL.createObjectURL(blob);
        setVideoUrl(localUrl);
      } else {
        throw new Error("No video URI returned");
      }

    } catch (error) {
      console.error(error);
      alert("Video generation failed. Ensure you have a paid billing project selected.");
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  };

  const openKeySelection = async () => {
    if(window.aistudio) {
      await window.aistudio.openSelectKey();
    } else {
      alert("Key selection tool not available in this environment.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col transition-colors duration-300">
       
       {/* Back Button */}
       <button 
            onClick={() => navigate('/')} 
            className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors self-start"
        >
            <ArrowLeft size={20} /> Back
        </button>

       <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Veo Scenario Studio</h1>
                <p className="text-zinc-600 dark:text-zinc-400">Generate realistic behavioral interview scenarios or office simulations.</p>
            </div>
            <button 
                onClick={openKeySelection}
                className="text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 flex items-center gap-2 text-zinc-900 dark:text-white transition-colors"
            >
                <KeyRound size={14} /> Change Billing Project
            </button>
       </div>

       <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-8 transition-colors">
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Scenario Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cinematic shot of a busy software engineering office with glass walls, purple neon lighting, highly detailed..."
                        className="w-full h-24 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-colors"
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Aspect Ratio:</span>
                        <div className="flex bg-zinc-50 dark:bg-zinc-950 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                            <button 
                                onClick={() => setAspectRatio('16:9')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${aspectRatio === '16:9' ? 'bg-purple-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                16:9
                            </button>
                            <button 
                                onClick={() => setAspectRatio('9:16')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${aspectRatio === '9:16' ? 'bg-purple-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                9:16
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerateVideo}
                        disabled={!prompt || isGenerating}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
                        Generate Scenario
                    </button>
                </div>
                
                {isGenerating && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm p-3 rounded-lg flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        {progressMessage}
                    </div>
                )}
            </div>
       </div>

       <div className="flex-1 bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden min-h-[400px]">
            {videoUrl ? (
                <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain"
                />
            ) : (
                <div className="text-center opacity-40">
                    <PlayCircle size={48} className="mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
                    <p className="text-zinc-400 dark:text-zinc-500">Video output area</p>
                </div>
            )}
       </div>
       
       <div className="mt-4 flex gap-2 items-start text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded transition-colors">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p>Veo video generation requires a paid Google Cloud Project. Please ensure you have selected a valid project using the key selector top right. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-purple-600 dark:hover:text-purple-400">View Billing Docs</a></p>
       </div>
    </div>
  );
};
