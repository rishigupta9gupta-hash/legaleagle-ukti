import { NextResponse } from 'next/server';

const PROMPT = `You are VIRA, a helpful health assistant. Analyze this medical report/test result and explain it in simple, easy-to-understand language.

Please provide:
1. **What This Report Shows**: A brief summary of what kind of test/report this is
2. **Key Findings**: List the important values/findings (use bullet points)
3. **What It Means**: Explain in simple terms what these results indicate
4. **Normal vs Abnormal**: Highlight anything that's outside normal range (if applicable)
5. **Suggested Actions**: What the person should do next (if anything needs attention)

IMPORTANT:
- Use simple, everyday language (avoid medical jargon)
- Be reassuring but honest
- Always recommend consulting a doctor for proper interpretation
- If you can't read the report clearly, say so

Format your response with clear sections using markdown headers.`;

// Try Gemini API first
async function tryGemini(apiKey, base64Data, mimeType) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: PROMPT },
                    { inline_data: { mime_type: mimeType, data: base64Data } }
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

// Fallback to Groq API (free tier, Llama Vision)
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
                role: "user",
                content: [
                    { type: "text", text: PROMPT },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Data}`
                        }
                    }
                ]
            }],
            max_tokens: 4096,
            temperature: 0.3
        }),
        signal: AbortSignal.timeout(60000)
    });

    const data = await res.json();

    if (!res.ok) {
        const err = new Error(data?.error?.message || `Groq error ${res.status}`);
        err.status = res.status;
        throw err;
    }

    return data?.choices?.[0]?.message?.content;
}

// Fallback to OpenAI API
async function tryOpenAI(apiKey, base64Data, mimeType) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: PROMPT },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Data}`
                        }
                    }
                ]
            }],
            max_tokens: 4096,
            temperature: 0.3
        }),
        signal: AbortSignal.timeout(60000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `OpenAI error ${res.status}`);
    return data?.choices?.[0]?.message?.content;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { base64Data, mimeType } = body;

        if (!base64Data || !mimeType) {
            return NextResponse.json(
                { success: false, message: 'Missing file data or mime type' },
                { status: 400 }
            );
        }

        let text = null;
        let provider = null;

        // 1. Try Gemini first
        const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (geminiKey) {
            try {
                text = await tryGemini(geminiKey, base64Data, mimeType);
                provider = 'gemini';
            } catch (e) {
                console.warn('Gemini failed:', e.message?.substring(0, 100));
            }
        }

        // 2. Fallback to xAI/Grok
        if (!text) {
            const xaiKey = process.env.XAI_API_KEY;
            if (xaiKey) {
                try {
                    text = await tryOpenAI(xaiKey, base64Data, mimeType, 'https://api.x.ai/v1', 'grok-2-vision-1212');
                    provider = 'xai';
                } catch (e) {
                    console.warn('xAI failed:', e.message?.substring(0, 100));
                }
            }
        }

        // 3. Fallback to Groq (free tier)
        if (!text) {
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
                try {
                    text = await tryGroq(groqKey, base64Data, mimeType);
                    provider = 'groq';
                } catch (e) {
                    console.warn('Groq failed:', e.message?.substring(0, 100));
                }
            }
        }

        // 4. Fallback to OpenAI
        if (!text) {
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
                try {
                    text = await tryOpenAI(openaiKey, base64Data, mimeType, 'https://api.openai.com/v1', 'gpt-4o-mini');
                    provider = 'openai';
                } catch (e) {
                    console.warn('OpenAI failed:', e.message?.substring(0, 100));
                }
            }
        }

        if (!text) {
            return NextResponse.json(
                { success: false, message: 'All AI providers failed. Please check your API keys or try again later.' },
                { status: 503 }
            );
        }

        return NextResponse.json({
            success: true,
            analysis: text,
            summary: text.substring(0, 200) + '...',
            provider
        });

    } catch (error) {
        console.error('Analysis Error:', error);
        return NextResponse.json(
            { success: false, message: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
