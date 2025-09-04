'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import Input from '@/components/ui/Input';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Qui peut donner son sang ?',
    answer: 'Toute personne âgée de 18 à 65 ans, en bonne santé, pesant au moins 50 kg peut donner son sang. Certaines conditions médicales ou traitements peuvent temporairement ou définitivement contre-indiquer le don.',
    category: 'Éligibilité'
  },
  {
    id: '2',
    question: 'Combien de temps faut-il attendre entre deux dons ?',
    answer: 'Il faut respecter un délai minimum de 8 semaines (56 jours) entre deux dons de sang total. Pour les dons de plaquettes, le délai est de 4 semaines minimum.',
    category: 'Fréquence'
  },
  {
    id: '3',
    question: 'Le don de sang est-il douloureux ?',
    answer: 'Le don de sang est généralement bien toléré. Vous ressentirez une légère piqûre lors de l\'insertion de l\'aiguille, similaire à une prise de sang classique. La douleur est minime et de courte durée.',
    category: 'Procédure'
  },
  {
    id: '4',
    question: 'Combien de temps dure un don de sang ?',
    answer: 'L\'ensemble de la procédure dure environ 45 minutes à 1 heure : accueil (10 min), entretien médical (15 min), prélèvement (8-10 min), repos et collation (15 min).',
    category: 'Procédure'
  },
  {
    id: '5',
    question: 'Que faire avant de donner son sang ?',
    answer: 'Mangez normalement, hydratez-vous bien, évitez l\'alcool 24h avant, dormez suffisamment, apportez une pièce d\'identité et évitez les efforts physiques intenses le jour du don.',
    category: 'Préparation'
  },
  {
    id: '6',
    question: 'Puis-je donner mon sang si je prends des médicaments ?',
    answer: 'Cela dépend du type de médicament. Certains traitements sont compatibles avec le don, d\'autres nécessitent un délai d\'attente. Mentionnez tous vos traitements lors de l\'entretien médical.',
    category: 'Médicaments'
  },
  {
    id: '7',
    question: 'Que se passe-t-il après le don ?',
    answer: 'Après le don, reposez-vous 15-20 minutes, prenez une collation, hydratez-vous bien, évitez les efforts physiques pendant 24h et retirez le pansement après 4-6 heures.',
    category: 'Après le don'
  },
  {
    id: '8',
    question: 'Mon sang est-il testé ?',
    answer: 'Oui, chaque don est systématiquement testé pour détecter les principales infections transmissibles (VIH, hépatites B et C, syphilis). Ces tests garantissent la sécurité des receveurs.',
    category: 'Sécurité'
  },
  {
    id: '9',
    question: 'Puis-je connaître mon groupe sanguin en donnant ?',
    answer: 'Oui, votre groupe sanguin ABO et Rhésus sera déterminé lors de votre premier don. Vous recevrez cette information par courrier ou SMS quelques jours après le don.',
    category: 'Informations'
  },
  {
    id: '10',
    question: 'Que deviennent les poches de sang collectées ?',
    answer: 'Le sang collecté est transformé en différents composants (globules rouges, plaquettes, plasma) selon les besoins. Chaque composant a une durée de conservation différente et des utilisations spécifiques.',
    category: 'Utilisation'
  }
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Questions Fréquentes
        </h1>
        <p className="text-gray-600">
          Trouvez rapidement les réponses à vos questions sur le don de sang
        </p>
      </motion.div>

      {/* Recherche et filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Rechercher une question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>
          
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="Tous">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Questions et réponses */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredFAQ.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune question trouvée pour votre recherche</p>
          </div>
        ) : (
          filteredFAQ.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {item.question}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openItems.includes(item.id) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="text-gray-400" size={20} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openItems.includes(item.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 pt-2 bg-gray-50 border-t">
                      <p className="text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Contact pour questions supplémentaires */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl p-6 text-center border"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Vous ne trouvez pas la réponse à votre question ?
        </h3>
        <p className="text-gray-600 mb-4">
          Notre équipe médicale est disponible pour répondre à toutes vos questions personnalisées
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Contacter un médecin
          </button>
          <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Utiliser le chatbot IA
          </button>
        </div>
      </motion.div>
    </div>
  );
}
