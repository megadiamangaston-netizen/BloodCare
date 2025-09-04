'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Quote,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface Testimonial {
  id: string;
  userName: string;
  content: string;
  rating: number;
  createdAt: Date;
}

export default function Welcome() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const testimonialsCollection = collection(db, 'testimonials');
      const snapshot = await getDocs(testimonialsCollection);
      const testimonialsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || data.name || 'Anonyme',
          content: data.content || data.message || '',
          rating: data.rating || 5,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Testimonial[];
      
      setTestimonials(testimonialsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Erreur lors du chargement des témoignages:', error);
    }
  };

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.name.trim() || !newTestimonial.message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        userName: newTestimonial.name.trim(),
        content: newTestimonial.message.trim(),
        rating: 5,
        approved: true,
        createdAt: new Date(),
        userId: 'visitor',
        authProvider: 'visitor'
      });
      
      setNewTestimonial({ name: '', message: '' });
      toast.success('Témoignage ajouté avec succès!');
      loadTestimonials();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout du témoignage');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Bouton retour à la connexion */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
            <ArrowLeft size={20} className="mr-2" />
            Retour à la connexion
          </button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* En-tête de présentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="text-white" size={40} />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            HemmoConnect
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            La plateforme qui connecte les donneurs et sauve des vies au Cameroun
          </p>
          
          {/* Section mission */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Notre Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              HemmoConnect révolutionne le don de sang au Cameroun en créant un pont technologique 
              entre les donneurs volontaires et les établissements de santé. Notre plateforme facilite 
              la gestion des stocks sanguins, organise des campagnes de collecte efficaces, et permet 
              aux citoyens de contribuer facilement à sauver des vies.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="text-red-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Pour les Donneurs</h3>
                <p className="text-sm text-gray-600">Trouvez facilement où donner, suivez vos dons et obtenez des récompenses</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="text-blue-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Pour les Hôpitaux</h3>
                <p className="text-sm text-gray-600">Gérez vos stocks, organisez des campagnes et accédez aux statistiques</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="text-green-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Impact Social</h3>
                <p className="text-sm text-gray-600">Chaque don contribue à sauver des vies dans tout le Cameroun</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section statistiques */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center bg-white rounded-lg p-6 shadow-lg"
          >
            <div className="text-4xl font-bold text-red-500 mb-2">10,000+</div>
            <div className="text-gray-600 font-medium">Donneurs enregistrés</div>
            <div className="text-sm text-gray-500 mt-2">À travers tout le Cameroun</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center bg-white rounded-lg p-6 shadow-lg"
          >
            <div className="text-4xl font-bold text-blue-500 mb-2">500+</div>
            <div className="text-gray-600 font-medium">Vies sauvées</div>
            <div className="text-sm text-gray-500 mt-2">Grâce aux dons collectés</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center bg-white rounded-lg p-6 shadow-lg"
          >
            <div className="text-4xl font-bold text-green-500 mb-2">50+</div>
            <div className="text-gray-600 font-medium">Hôpitaux partenaires</div>
            <div className="text-sm text-gray-500 mt-2">Dans les 10 régions</div>
          </motion.div>
        </div>

        {/* Section témoignages interactifs */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center">
            <MessageCircle size={28} className="mr-3 text-red-500" />
            Témoignages de notre communauté
          </h2>
          
          {/* Témoignages par défaut */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 p-6 rounded-lg border-l-4 border-red-400"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Users className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold">Dr. Marie Ngono</h4>
                  <p className="text-sm text-gray-600">Hôpital Central de Yaoundé</p>
                </div>
              </div>
              <Quote size={16} className="text-gray-400 mb-2" />
              <p className="text-gray-700 italic">
                HemmoConnect nous a permis de mieux gérer nos stocks de sang et d'organiser des campagnes de collecte plus efficaces. Un véritable atout pour notre service de transfusion.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-400"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <Heart className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold">Jean-Paul Mbassi</h4>
                  <p className="text-sm text-gray-600">Donneur régulier depuis 2022</p>
                </div>
              </div>
              <Quote size={16} className="text-gray-400 mb-2" />
              <p className="text-gray-700 italic">
                Grâce à cette plateforme, je peux facilement trouver où donner mon sang et voir l'impact réel de mes dons. C'est motivant de savoir qu'on aide vraiment !
              </p>
            </motion.div>
          </div>

          {/* Liste des témoignages de la communauté */}
          {testimonials.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Témoignages récents de nos utilisateurs
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {testimonials.slice(0, 5).map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{testimonial.userName}</span>
                      <span className="text-sm text-gray-500">
                        {testimonial.createdAt.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <Quote size={14} className="text-gray-400 mb-1" />
                    <p className="text-gray-700 italic text-sm">{testimonial.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire d'ajout de témoignage */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
              <Quote size={20} className="mr-2 text-red-500" />
              Partagez votre expérience
            </h3>
            <form onSubmit={handleSubmitTestimonial} className="space-y-4">
              <Input
                type="text"
                placeholder="Votre nom"
                value={newTestimonial.name}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                required
                className="w-full"
              />
              <textarea
                placeholder="Votre témoignage sur HemmoConnect..."
                value={newTestimonial.message}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newTestimonial.name.trim() || !newTestimonial.message.trim()}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                {isSubmitting ? 'Envoi...' : 'Publier le témoignage'}
              </Button>
            </form>
          </div>
        </div>

        {/* Section informations pratiques */}
        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-lg p-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <MapPin size={24} className="mr-2 text-red-500" />
              Centres de collecte partenaires
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-800">Hôpital Central de Yaoundé</h4>
                  <p className="text-sm text-gray-600">Lundi - Vendredi, 8h - 16h</p>
                  <p className="text-xs text-gray-500">Quartier administratif, près du Hilton</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-800">Hôpital Général de Douala</h4>
                  <p className="text-sm text-gray-600">Tous les jours, 9h - 15h</p>
                  <p className="text-xs text-gray-500">Bonanjo, centre-ville de Douala</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-green-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-800">Centre National de Transfusion Sanguine</h4>
                  <p className="text-sm text-gray-600">Lundi - Samedi, 7h - 17h</p>
                  <p className="text-xs text-gray-500">Yaoundé, quartier Elig-Essono</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-lg p-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Calendar size={24} className="mr-2 text-blue-500" />
              Prochaines campagnes de collecte
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-semibold">Campagne Université de Yaoundé I</h4>
                <p className="text-sm text-gray-600">15 Décembre 2024, 9h - 17h</p>
                <p className="text-sm text-gray-500">Campus principal</p>
              </div>
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-semibold">Don solidaire de Noël</h4>
                <p className="text-sm text-gray-600">20-22 Décembre 2024</p>
                <p className="text-sm text-gray-500">Centre commercial Bastos</p>
              </div>
              <div className="border-l-4 border-purple-400 pl-4">
                <h4 className="font-semibold">Collecte entreprises</h4>
                <p className="text-sm text-gray-600">2 Janvier 2025, 10h - 16h</p>
                <p className="text-sm text-gray-500">Zone industrielle de Douala</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Call to action final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Rejoignez notre communauté
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Ensemble, nous pouvons sauver des vies. Chaque don compte et fait la différence.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white px-8 py-3 text-lg">
              Commencer maintenant
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
