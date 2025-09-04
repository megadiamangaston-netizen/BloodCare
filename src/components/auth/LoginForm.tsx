'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormProps {
  userType: 'super_admin' | 'admin' | 'user';
}

export default function LoginForm({ userType }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
      }
      
      // Redirection selon le type d'utilisateur
      switch (userType) {
        case 'super_admin':
          router.push('/super-admin');
          break;
        case 'admin':
          router.push('/admin');
          break;
        case 'user':
          router.push('/dashboard');
          break;
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (userType !== 'user') return; // Google auth uniquement pour les utilisateurs basiques
    
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (userType) {
      case 'super_admin':
        return 'Connexion Super Administrateur';
      case 'admin':
        return 'Connexion Administrateur';
      case 'user':
        return isLogin ? 'Connexion Utilisateur' : 'Créer un compte';
    }
  };

  const getDescription = () => {
    switch (userType) {
      case 'super_admin':
        return 'Accès réservé aux super administrateurs avec identifiants spéciaux';
      case 'admin':
        return 'Connexion pour les hôpitaux et ONG partenaires';
      case 'user':
        return isLogin 
          ? 'Connectez-vous pour accéder à votre espace personnel'
          : 'Rejoignez notre communauté de donneurs';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-4"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-600 rounded-full blood-drop"></div>
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h2>
          <p className="text-gray-600 text-sm">
            {getDescription()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && userType === 'user' && (
            <Input
              type="text"
              label="Nom complet"
              placeholder="Votre nom complet"
              icon={<User size={20} />}
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          )}

          <Input
            type="email"
            label="Adresse email"
            placeholder="votre@email.com"
            icon={<Mail size={20} />}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Mot de passe"
              placeholder="••••••••"
              icon={<Lock size={20} />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </Button>
        </form>

        {userType === 'user' && (
          <>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full mt-6"
              onClick={handleGoogleAuth}
              loading={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </Button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isLogin 
                  ? "Pas encore de compte ? Créer un compte" 
                  : "Déjà un compte ? Se connecter"
                }
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
