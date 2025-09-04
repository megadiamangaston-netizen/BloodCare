'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Shield, User } from 'lucide-react';

export default function SetupAdminPage() {
  const { createFirstSuperAdmin, user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createFirstSuperAdmin(email);
    } catch (error) {
      console.error('Error promoting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-purple-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configuration Super Admin
          </h1>
          <p className="text-gray-600">
            Promouvoir un utilisateur existant en super administrateur
          </p>
        </div>

        {user?.role === 'super_admin' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vous êtes déjà Super Admin !
            </h2>
            <p className="text-gray-600 mb-6">
              Vous pouvez accéder au dashboard super admin.
            </p>
            <Button 
              onClick={() => window.location.href = '/super-admin'}
              className="w-full"
            >
              Accéder au Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePromoteUser} className="space-y-6">
            <Input
              type="email"
              label="Email de l'utilisateur à promouvoir"
              placeholder="admin@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important :</strong> Cette page est temporaire. 
                L'utilisateur doit déjà avoir un compte dans l'application. 
                Supprimez cette page après avoir configuré votre premier super admin.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? 'Promotion en cours...' : 'Promouvoir en Super Admin'}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            BloodCare - Configuration initiale
          </p>
        </div>
      </div>
    </div>
  );
}
