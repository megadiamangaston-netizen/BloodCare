'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, Users, UserPlus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function Home() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Création de compte utilisateur
        if (formData.password !== formData.confirmPassword) {
          toast.error('Les mots de passe ne correspondent pas');
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Créer le profil utilisateur dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: formData.email,
          displayName: formData.fullName,
          role: 'user',
          createdAt: new Date()
        });
        
        toast.success('Compte créé avec succès!');
        router.push('/dashboard');
      } else {
        // Connexion
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Vérifier le rôle de l'utilisateur
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.role === 'super_admin') {
          router.push('/super-admin');
        } else if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        
        toast.success('Connexion réussie!');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Email ou mot de passe incorrect');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Cette adresse email est déjà utilisée');
      } else {
        toast.error('Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Vérifier si l'utilisateur existe déjà
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Créer le profil utilisateur pour Google Auth
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          role: 'user',
          createdAt: new Date(),
          authProvider: 'google'
        });
      }
      
      const userData = userDoc.data();
      
      // Redirection selon le rôle
      if (userData?.role === 'super_admin') {
        router.push('/super-admin');
      } else if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      
      toast.success('Connexion Google réussie!');
    } catch (error: any) {
      console.error('Erreur Google:', error);
      toast.error('Erreur lors de la connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex flex-col items-center justify-center mb-6">
            {/* Espace logo - dimensions optimisées pour un vrai logo */}
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="mb-4"
            >
              {/* Logo placeholder - remplacer par <img src="/logo.png" alt="HemmoConnect" className="w-20 h-20 object-contain" /> */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                <Heart className="text-white" size={36} />
              </div>
            </motion.div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mb-2">
              HemmoConnect
            </h1>
            <p className="text-gray-600 text-lg">
              Ensemble, sauvons des vies par le don de sang
            </p>
          </div>
        </motion.div>

        {/* Formulaire de connexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connexion
            </h2>
            <p className="text-gray-600">
              Connectez-vous à votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <Input
                type="text"
                name="fullName"
                placeholder="Votre nom complet"
                value={formData.fullName}
                onChange={handleChange}
                icon={<Users size={20} />}
                required
              />
            )}
            
            <Input
              type="email"
              name="email"
              placeholder="Votre adresse email"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={20} />}
              required
            />

            <Input
              type="password"
              name="password"
              placeholder="Votre mot de passe"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock size={20} />}
              required
            />
            
            {isSignUp && (
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={<Lock size={20} />}
                required
              />
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
              <ArrowRight className="ml-2" size={20} />
            </Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>
            
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignUp ? 'S\'inscrire avec Google' : 'Se connecter avec Google'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center mx-auto"
            >
              <UserPlus size={16} className="mr-1" />
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Créer un compte utilisateur'}
            </button>
          </div>
        </motion.div>

        {/* Option visiteur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6"
        >
          <Link href="/welcome">
            <motion.div
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)"
              }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 cursor-pointer group hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                  <Eye className="text-white" size={20} />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Entrer en tant que visiteur
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Découvrir témoignages et fonctionnalités publiques
                  </p>
                </div>
                
                <ArrowRight className="text-green-600 group-hover:translate-x-1 transition-transform duration-200" size={20} />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Liens utiles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p className="mb-2">
            <strong>Administrateurs:</strong> Utilisez vos identifiants existants
          </p>
          <p>
            <Link href="/welcome" className="text-blue-600 hover:text-blue-700 font-medium">
              Découvrir HemmoConnect
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
