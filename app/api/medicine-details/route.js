import { NextResponse } from 'next/server';

const PROMPT_TEMPLATE = (name, dosage) => `You are VIRA, a health assistant. Provide detailed information about this medication:

Medicine: ${name}
${dosage ? `Dosage: ${dosage}` : ''}

Please provide the following in a clear, easy-to-understand format:

1. **What is ${name}?** — Brief description of the medicine and its category
2. **Uses** — What conditions/symptoms it treats
3. **How to Take** — Proper way to take/use this medicine
4. **Common Side Effects** — List common side effects (if any)
5. **Precautions** — Important warnings and things to avoid
6. **Storage** — How to store properly

IMPORTANT:
- Use simple language, avoid complex medical terms
- Be helpful but always recommend consulting a doctor
- Keep it concise but informative`;

// Try Gemini
async function tryGemini(apiKey, prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        }),
        signal: AbortSignal.timeout(30000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Gemini error ${res.status}`);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// Fallback to Groq
async function tryGroq(apiKey, prompt) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
            temperature: 0.3
        }),
        signal: AbortSignal.timeout(30000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Groq error ${res.status}`);
    return data?.choices?.[0]?.message?.content;
}

export async function POST(request) {
    try {
        const { name, dosage } = await request.json();
        if (!name) {
            return NextResponse.json({ success: false, message: 'Medicine name required' }, { status: 400 });
        }

        const prompt = PROMPT_TEMPLATE(name, dosage);
        let text = null;

        // Try Gemini
        const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (geminiKey) {
            try { text = await tryGemini(geminiKey, prompt); }
            catch (e) { console.warn('Gemini:', e.message?.substring(0, 80)); }
        }

        // Fallback to Groq
        if (!text) {
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
                try { text = await tryGroq(groqKey, prompt); }
                catch (e) { console.error('Groq:', e.message?.substring(0, 80)); }
            }
        }

        if (!text) {
            return NextResponse.json({ success: false, message: 'Could not fetch medicine details' }, { status: 503 });
        }

        return NextResponse.json({ success: true, details: text });
    } catch (error) {
        console.error('Medicine Details Error:', error);
        return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
    }
}
