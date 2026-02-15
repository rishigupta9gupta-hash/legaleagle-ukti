import { NextResponse } from 'next/server';

const PROMPT = `Analyze this medicine strip/packaging/tube image and extract:
1. Medicine name
2. Dosage (e.g., 500mg, 10gm)
3. Expiry date (if visible, in YYYY-MM-DD format)
4. Any usage instructions visible

Respond in JSON format ONLY, nothing else:
{"name": "...", "dosage": "...", "expiry": "...", "instructions": "..."}

If you can't identify something, use "unknown" for that field.`;

// Try Gemini API
async function tryGemini(apiKey, base64Data, mimeType) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: "user", parts: [
                    { text: PROMPT },
                    { inline_data: { mime_type: mimeType, data: base64Data } }
                ]
            }]
        }),
        signal: AbortSignal.timeout(30000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Gemini error ${res.status}`);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// Fallback to Groq API
async function tryGroq(apiKey, base64Data, mimeType) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [{
                role: "user", content: [
                    { type: "text", text: PROMPT },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
            }],
            max_tokens: 1024,
            temperature: 0.1
        }),
        signal: AbortSignal.timeout(30000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Groq error ${res.status}`);
    return data?.choices?.[0]?.message?.content;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { base64Data, mimeType } = body;

        if (!base64Data || !mimeType) {
            return NextResponse.json({ success: false, message: 'Missing image data' }, { status: 400 });
        }

        let text = null;

        // Try Gemini
        const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (geminiKey) {
            try { text = await tryGemini(geminiKey, base64Data, mimeType); }
            catch (e) { console.warn('Gemini failed:', e.message?.substring(0, 80)); }
        }

        // Fallback to Groq
        if (!text) {
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
                try { text = await tryGroq(groqKey, base64Data, mimeType); }
                catch (e) { console.error('Groq failed:', e.message?.substring(0, 80)); }
            }
        }

        if (!text) {
            return NextResponse.json({ success: false, message: 'AI analysis failed. Please enter details manually.' }, { status: 503 });
        }

        // Parse JSON from text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ success: true, data: parsed });
        }

        return NextResponse.json({ success: false, message: 'Could not parse medicine details' }, { status: 500 });

    } catch (error) {
        console.error('Medicine Analysis Error:', error);
        return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
    }
}
