import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Utilisation de Gemini Flash 1.5 pour de meilleures performances
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export class GeminiChatService {
  private context: string;

  constructor() {
    this.context = `Tu es un assistant IA spécialisé dans le don de sang pour la plateforme BloodCare. 
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
  }

  async sendMessage(message: string, history: ChatMessage[] = []): Promise<string> {
    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: this.context }]
          },
          {
            role: "model",
            parts: [{ text: "Bonjour ! Je suis votre assistant BloodCare, spécialisé dans le don de sang. Je suis là pour répondre à toutes vos questions sur l'éligibilité, les procédures et tout ce qui concerne le don de sang. Comment puis-je vous aider aujourd'hui ?" }]
          },
          ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          }))
        ]
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erreur Gemini:', error);
      
      // Fallback avec réponses prédéfinies
      return this.getFallbackResponse(message);
    }
  }

  private getFallbackResponse(message: string): string {
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
}

export const geminiChatService = new GeminiChatService();
