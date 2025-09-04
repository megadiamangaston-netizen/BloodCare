'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Edit, Trash2, Eye, Building2, Shield } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Hospital } from '@/types';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    hospitalName: ''
  });

  useEffect(() => {
    fetchAdmins();
    fetchHospitals();
  }, []);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'adminCredentials'));
      const adminUsers = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as User));
      setAdmins(adminUsers);
    } catch (error) {
      toast.error('Erreur lors du chargement des administrateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'hospitals'));
      const hospitalData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hospital[];
      setHospitals(hospitalData);
    } catch (error) {
      toast.error('Erreur lors du chargement des hôpitaux');
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Créer l'admin dans la collection adminCredentials
      await addDoc(collection(db, 'adminCredentials'), {
        email: formData.email,
        displayName: formData.displayName,
        hospitalId: formData.hospitalName, // Utilise hospitalId pour stocker le nom
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.id
      });
      
      toast.success('Administrateur créé avec succès');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', displayName: '', hospitalName: '' });
      fetchAdmins();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'administrateur');
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
      try {
        await deleteDoc(doc(db, 'adminCredentials', adminId));
        toast.success('Administrateur supprimé');
        fetchAdmins();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border-b"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Super Admin</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Bienvenue, {user?.displayName}
                </span>
                <Button variant="ghost" onClick={logout}>
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Administrateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="text-green-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Hôpitaux</p>
                  <p className="text-2xl font-bold text-gray-900">{hospitals.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-purple-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Système</p>
                  <p className="text-2xl font-bold text-green-600">Actif</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Gestion des Administrateurs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestion des Administrateurs
                </h2>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center"
                >
                  <Plus size={20} className="mr-2" />
                  Nouvel Admin
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Administrateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hôpital
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de création
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.map((admin) => (
                        <motion.tr
                          key={admin.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {admin.displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {admin.displayName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {admin.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {admin.hospitalId || 'Non assigné'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 p-1">
                                <Eye size={16} />
                              </button>
                              <button className="text-yellow-600 hover:text-yellow-900 p-1">
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => deleteAdmin(admin.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {admins.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Aucun administrateur créé</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Modal de création d'administrateur */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Créer un nouvel administrateur
              </h3>
              
              <form onSubmit={createAdmin} className="space-y-4">
                <Input
                  type="text"
                  label="Nom complet"
                  placeholder="Nom de l'administrateur"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
                
                <Input
                  type="email"
                  label="Email"
                  placeholder="admin@hopital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                
                <Input
                  type="password"
                  label="Mot de passe temporaire"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                
                <Input
                  type="text"
                  label="Nom de l'hôpital"
                  placeholder="Centre Hospitalier Universitaire"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  required
                />
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Créer
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
