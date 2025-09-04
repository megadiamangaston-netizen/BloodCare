import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not configured');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" });

const bloodDonationContext = `Tu es un assistant IA spécialisé dans le don de sang pour la plateforme BloodCare. 
Ton rôle est d'aider les utilisateurs avec des informations précises sur le don de sang, les critères d'éligibilité, 
les procédures médicales et de les guider dans leurs démarches.

Informations importantes à retenir :
- Âge requis : 18-65 ans
- Poids minimum : 50 kg
- Délai entre dons : 8 semaines minimum
- Groupes sanguins : A+, A-, B+, B-, AB+, AB-, O+, O-
- O- est donneur universel, AB+ est receveur universel
- Certains médicaments peuvent contre-indiquer le don
- Les voyages récents en zone à risque peuvent nécessiter un délai d'attente

Réponds de manière bienveillante, précise et professionnelle. Si une question dépasse tes compétences ou nécessite un avis médical personnalisé, oriente vers un professionnel de santé.`;

export async function POST(request: NextRequest) {
  let message = '';
  
  try {
    const body = await request.json();
    message = body.message;
    const history = body.history || [];

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message invalide' },
        { status: 400 }
      );
    }

    // Si Gemini n'est pas configuré, utiliser les réponses de secours
    if (!model) {
      const fallbackResponse = getFallbackResponse(message);
      return NextResponse.json({ response: fallbackResponse });
    }

    // Utiliser Gemini Flash 1.5
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: bloodDonationContext }]
        },
        {
          role: "model",
          parts: [{ text: "Bonjour ! Je suis votre assistant BloodCare, spécialisé dans le don de sang. Je suis là pour répondre à toutes vos questions sur l'éligibilité, les procédures et tout ce qui concerne le don de sang. Comment puis-je vous aider aujourd'hui ?" }]
        },
        ...history.map((msg: any) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const responseText = response.text();

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('Erreur API Chat:', error);
    
    // Fallback en cas d'erreur
    const fallbackResponse = getFallbackResponse(message || 'erreur');
    return NextResponse.json({ response: fallbackResponse });
  }
}

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  const responses: Record<string, string> = {
    'âge': 'Pour donner votre sang, vous devez avoir entre 18 et 65 ans.',
    'poids': 'Le poids minimum requis pour donner son sang est de 50 kg.',
    'délai': 'Il faut attendre au minimum 8 semaines entre deux dons de sang complet.',
    'médicaments': 'Certains médicaments sont compatibles avec le don, d\'autres non. Mentionnez tous vos traitements lors de l\'entretien médical.',
    'groupes sanguins': 'Il existe 8 groupes sanguins principaux : A+, A-, B+, B-, AB+, AB-, O+, O-. O- est donneur universel, AB+ est receveur universel.',
    'procédure': 'Le don dure environ 45 minutes : accueil, questionnaire médical, examen médical, prélèvement (8-10 min), repos et collation.',
    'éligibilité': 'Les critères principaux sont : 18-65 ans, minimum 50 kg, bonne santé, pas de voyage récent en zone à risque, pas de traitement incompatible.',
    'voyage': 'Les voyages récents dans certaines zones peuvent nécessiter une période d\'attente. Mentionnez vos déplacements lors de l\'entretien.',
    'fréquence': 'Vous pouvez donner votre sang jusqu\'à 4 fois par an pour les hommes et 3 fois pour les femmes, avec un délai minimum de 8 semaines.',
    'après don': 'Après le don : reposez-vous, hydratez-vous bien, évitez les efforts physiques pendant 24h, gardez le pansement 4-6h.'
  };

  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  return 'Je ne suis pas sûr de comprendre votre question. Pouvez-vous la reformuler ? Pour des conseils personnalisés, n\'hésitez pas à contacter notre équipe médicale ou à consulter la section FAQ de notre plateforme.';
}
