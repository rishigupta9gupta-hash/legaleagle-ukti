import { NextResponse } from 'next/server';

/* ============================================================
   Disease categories ported from MediVue ML Python backend
   ============================================================ */
const DISEASE_CATEGORIES = {
    oncology: {
        symptoms: ['lump', 'mass', 'growth', 'tumor', 'swelling', 'painless_lump', 'weight_loss', 'night_sweats'],
        keywords: ['lump', 'mass', 'growth', 'tumor', 'growing', 'painless', 'hard', 'slowly growing', 'lymph', 'node'],
        diseases: ['Lymphoma', 'Thyroid Cancer', 'Hodgkin Disease', 'Non-Hodgkin Lymphoma', 'Metastatic Cancer'],
        urgency: 'high',
        recommendation: 'Please consult an oncologist or ENT specialist for proper evaluation. A biopsy may be needed.',
        icon: '🔬'
    },
    thyroid: {
        symptoms: ['neck_lump', 'swelling', 'fatigue', 'weight_change', 'difficulty_swallowing'],
        keywords: ['neck', 'throat', 'thyroid', 'swallowing', 'goiter', 'lump in neck'],
        diseases: ['Thyroid Nodule', 'Goiter', 'Thyroiditis', 'Hyperthyroidism', 'Hypothyroidism', 'Thyroid Cancer'],
        urgency: 'moderate',
        recommendation: 'Thyroid function tests (TSH, T3, T4) and ultrasound recommended.',
        icon: '🦋'
    },
    lymphatic: {
        symptoms: ['swollen_lymph_nodes', 'night_sweats', 'fatigue', 'fever'],
        keywords: ['lymph', 'node', 'swollen', 'gland', 'armpit', 'groin', 'neck swelling'],
        diseases: ['Lymphadenopathy', 'Lymphoma', 'Mononucleosis', 'HIV/AIDS', 'Tuberculosis'],
        urgency: 'high',
        recommendation: 'Complete blood count and lymph node biopsy may be needed.',
        icon: '🩸'
    },
    infectious: {
        symptoms: ['fever', 'infection', 'swelling', 'pain'],
        keywords: ['infection', 'fever', 'pus', 'red', 'warm', 'tender'],
        diseases: ['Bacterial Infection', 'Viral Infection', 'Abscess', 'Cellulitis'],
        urgency: 'moderate',
        recommendation: 'May require antibiotics. Consult a doctor if symptoms persist.',
        icon: '🦠'
    },
    respiratory: {
        symptoms: ['cough', 'breathing_difficulty', 'sore_throat', 'shortness_of_breath'],
        keywords: ['cough', 'breath', 'wheeze', 'chest', 'lung', 'respiratory', 'cold', 'flu', 'sneez'],
        diseases: ['Common Cold', 'Flu', 'Asthma', 'Bronchitis', 'Pneumonia', 'COVID-19'],
        urgency: 'moderate',
        recommendation: 'Monitor oxygen levels. Seek care if breathing worsens.',
        icon: '🫁'
    },
    cardiac: {
        symptoms: ['chest_pain', 'palpitations', 'shortness_of_breath'],
        keywords: ['heart', 'chest pain', 'palpitation', 'irregular', 'racing', 'blood pressure'],
        diseases: ['Hypertension', 'Arrhythmia', 'Heart Disease', 'Angina'],
        urgency: 'high',
        recommendation: 'ECG and cardiac evaluation recommended.',
        icon: '❤️'
    },
    neurological: {
        symptoms: ['headache', 'dizziness', 'numbness', 'weakness'],
        keywords: ['headache', 'dizzy', 'numb', 'weak', 'tremor', 'seizure', 'vision', 'migraine'],
        diseases: ['Migraine', 'Tension Headache', 'Stroke Risk', 'Neuropathy'],
        urgency: 'moderate',
        recommendation: 'Neurological examination recommended if symptoms persist.',
        icon: '🧠'
    },
    gastrointestinal: {
        symptoms: ['nausea', 'vomiting', 'abdominal_pain', 'diarrhea'],
        keywords: ['stomach', 'nausea', 'vomit', 'diarrhea', 'constipation', 'abdomen', 'gastric', 'acidity'],
        diseases: ['Gastritis', 'GERD', 'IBS', 'Food Poisoning', 'Appendicitis'],
        urgency: 'moderate',
        recommendation: 'Stay hydrated. Seek care if severe pain or blood present.',
        icon: '🏥'
    },
    dermatological: {
        symptoms: ['rash', 'skin_discoloration', 'itching', 'lesion'],
        keywords: ['rash', 'skin', 'itch', 'spot', 'lesion', 'mole', 'allergy', 'hives'],
        diseases: ['Allergic Reaction', 'Eczema', 'Psoriasis', 'Skin Infection', 'Skin Cancer'],
        urgency: 'low',
        recommendation: 'Dermatologist consultation for persistent skin changes.',
        icon: '🩹'
    },
    mental_health: {
        symptoms: ['anxiety', 'depression', 'insomnia', 'stress'],
        keywords: ['anxiety', 'anxious', 'depress', 'sad', 'stress', 'sleep', 'insomnia', 'panic', 'worry', 'nervous', 'mood'],
        diseases: ['Anxiety Disorder', 'Depression', 'Insomnia', 'Panic Disorder', 'Stress-Related Disorder'],
        urgency: 'moderate',
        recommendation: 'Practice relaxation techniques. Consider speaking with a mental health professional.',
        icon: '🧘'
    },
    musculoskeletal: {
        symptoms: ['joint_pain', 'back_pain', 'muscle_pain', 'stiffness'],
        keywords: ['joint', 'back pain', 'muscle', 'stiff', 'arthritis', 'sprain', 'fracture', 'bone', 'knee', 'shoulder'],
        diseases: ['Arthritis', 'Muscle Strain', 'Disc Herniation', 'Fracture', 'Tendinitis'],
        urgency: 'low',
        recommendation: 'Rest the affected area. Consider physiotherapy if symptoms persist.',
        icon: '🦴'
    }
};

/**
 * Analyze raw conversation text for symptom keywords.
 * Mirrors Python backend's `analyze_symptoms()` with negation handling.
 */
function analyzeSymptoms(rawText) {
    const textLower = rawText.toLowerCase();
    const categoryScores = {};

    for (const [category, info] of Object.entries(DISEASE_CATEGORIES)) {
        let score = 0;
        const matchedKeywords = [];

        for (const keyword of info.keywords) {
            const keywordLower = keyword.toLowerCase();
            const idx = textLower.indexOf(keywordLower);
            if (idx === -1) continue;

            // Simple negation check — look 25 chars before keyword
            const contextBefore = textLower.substring(Math.max(0, idx - 25), idx);
            const negated = /\b(no|not|without|negative|denies|don't have|never)\b[\s:]*$/i.test(contextBefore);

            if (!negated) {
                score += 2;
                if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
            }
        }

        if (score > 0) {
            const numDiseases = Math.min(score + 1, info.diseases.length);
            categoryScores[category] = {
                score,
                matchedKeywords,
                possibleDiseases: info.diseases.slice(0, numDiseases),
                urgency: info.urgency,
                recommendation: info.recommendation,
                icon: info.icon
            };
        }
    }

    // Sort by score descending
    const sorted = Object.entries(categoryScores)
        .sort((a, b) => b[1].score - a[1].score);

    return Object.fromEntries(sorted);
}

/**
 * Determine overall risk level from category analysis
 */
function getRiskLevel(categories) {
    if (Object.keys(categories).length === 0) return { level: 'low', label: 'Low', description: 'No specific concerns detected' };

    const hasHigh = Object.values(categories).some(c => c.urgency === 'high');
    const highCount = Object.values(categories).filter(c => c.urgency === 'high').length;
    const totalScore = Object.values(categories).reduce((sum, c) => sum + c.score, 0);

    if (highCount >= 2 || totalScore > 12) return { level: 'emergency', label: 'Emergency', description: 'Seek immediate medical attention' };
    if (hasHigh) return { level: 'high', label: 'High', description: 'Consult a doctor soon' };
    if (totalScore > 6) return { level: 'moderate', label: 'Moderate', description: 'Monitor symptoms and consider a doctor visit' };
    return { level: 'low', label: 'Low', description: 'Monitor symptoms. Maintain healthy habits.' };
}

export async function POST(request) {
    try {
        const { transcript } = await request.json();

        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return NextResponse.json({
                success: true,
                risk: { level: 'low', label: 'Low', description: 'No conversation data to analyze' },
                categories: {},
                recommendations: [{ priority: 'low', text: 'No specific concerns detected. Maintain healthy habits.', icon: '✅' }]
            });
        }

        // Build raw text from user messages
        const rawText = transcript
            .filter(m => m.role === 'You')
            .map(m => m.text)
            .join(' ');

        // Run symptom analysis
        const categories = analyzeSymptoms(rawText);
        const risk = getRiskLevel(categories);

        // Build actionable recommendations
        const recommendations = [];

        if (risk.level === 'high' || risk.level === 'emergency') {
            recommendations.push({ priority: 'urgent', text: 'Please consult a healthcare professional soon.', icon: '🏥' });
        }

        for (const [, cat] of Object.entries(categories).slice(0, 3)) {
            recommendations.push({ priority: cat.urgency, text: cat.recommendation, icon: cat.icon });
        }

        if (recommendations.length === 0) {
            recommendations.push({ priority: 'low', text: 'No specific concerns detected. Maintain healthy habits.', icon: '✅' });
        }

        return NextResponse.json({
            success: true,
            risk,
            categories,
            recommendations,
            analyzedText: rawText.substring(0, 200)
        });
    } catch (error) {
        console.error('ML Predict Error:', error);
        return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
    }
}
