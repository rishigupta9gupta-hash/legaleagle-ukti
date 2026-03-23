import { NextResponse } from "next/server";

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

// Helper for OpenAI-compatible APIs (xAI, Groq, OpenAI)
async function tryOpenAICompatible(apiKey, base64, mimeType, baseUrl, model, label) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: ANALYSIS_PROMPT },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
            }],
            max_tokens: 2048,
            temperature: 0.2
        }),
        signal: AbortSignal.timeout(60000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `${label} error ${res.status}`);
    return data?.choices?.[0]?.message?.content;
}

// 1. Try Gemini API
async function tryGemini(apiKey, base64, mimeType) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: ANALYSIS_PROMPT },
                    { inline_data: { mime_type: mimeType, data: base64 } }
                ]
            }]
        }),
        signal: AbortSignal.timeout(60000)
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data?.error?.message || `Gemini error ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function POST(req) {
    try {
        const { image } = await req.json();
        if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

        // Extract base64 and mime type from data URL
        const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const base64 = image.replace(/^data:image\/\w+;base64,/, "");

        let text = null;
        let provider = null;

        // Provider chain: Gemini → xAI/Grok → Groq → OpenAI
        const providers = [
            {
                name: 'gemini',
                fn: () => {
                    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
                    if (!key) return null;
                    return tryGemini(key, base64, mimeType);
                }
            },
            {
                name: 'xai',
                fn: () => {
                    const key = process.env.XAI_API_KEY;
                    if (!key) return null;
                    return tryOpenAICompatible(key, base64, mimeType, 'https://api.x.ai/v1', 'grok-2-vision-1212', 'xAI');
                }
            },
            {
                name: 'groq',
                fn: () => {
                    const key = process.env.GROQ_API_KEY;
                    if (!key) return null;
                    return tryOpenAICompatible(key, base64, mimeType, 'https://api.groq.com/openai/v1', 'meta-llama/llama-4-scout-17b-16e-instruct', 'Groq');
                }
            },
            {
                name: 'openai',
                fn: () => {
                    const key = process.env.OPENAI_API_KEY;
                    if (!key) return null;
                    return tryOpenAICompatible(key, base64, mimeType, 'https://api.openai.com/v1', 'gpt-4o-mini', 'OpenAI');
                }
            }
        ];

        for (const p of providers) {
            if (text) break;
            try {
                const result = await p.fn();
                if (result) {
                    text = result;
                    provider = p.name;
                }
            } catch (e) {
                console.warn(`${p.name} failed:`, e.message?.substring(0, 120));
            }
        }

        if (!text) {
            return NextResponse.json(
                { error: "All AI providers are currently unavailable. Please try again in a minute." },
                { status: 503 }
            );
        }

        console.log(`Skin check completed via: ${provider}`);

        // Clean up text to ensure it's valid JSON
        const json = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return NextResponse.json(JSON.parse(json));
    } catch (err) {
        console.error("Skin Check Server Error:", err);
        return NextResponse.json({ error: err.message || "Internal Analysis Error" }, { status: 500 });
    }
}
