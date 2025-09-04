'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, HelpCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant BloodCare alimenté par Gemini Flash 1.5. Je peux répondre à vos questions sur le don de sang, les critères d\'éligibilité, et vous guider dans vos démarches. Comment puis-je vous aider ?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const predefinedQuestions = [
    'Qui peut donner son sang ?',
    'Combien de temps entre deux dons ?',
    'Quels sont les critères d\'éligibilité ?',
    'Comment se déroule un don de sang ?',
    'Puis-je donner si je prends des médicaments ?',
    'Quels sont les groupes sanguins compatibles ?'
  ];

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Utiliser l'API route pour éviter les problèmes côté client
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          history: chatHistory
        }),
      });

      const data = await response.json();
      const geminiResponse = data.response;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: geminiResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Mettre à jour l'historique pour Gemini
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: currentMessage },
        { role: 'model', content: geminiResponse }
      ]);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Message d'erreur en cas de problème avec l'API
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler votre question ou contacter notre équipe médicale pour une assistance immédiate ?',
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePredefinedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Chatbot Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Assistant BloodCare</h3>
                    <p className="text-xs opacity-90">Alimenté par Gemini Flash 1.5</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Questions prédéfinies */}
            {messages.length === 1 && (
              <div className="p-4 border-b bg-gray-50">
                <p className="text-xs text-gray-600 mb-3">Questions fréquentes :</p>
                <div className="space-y-2">
                  {predefinedQuestions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handlePredefinedQuestion(question)}
                      className="block w-full text-left text-xs bg-white border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.isBot 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.isBot ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Posez votre question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={sendMessage}
                  variant="primary"
                  size="sm"
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-3"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
