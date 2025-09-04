'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, 
  Plus, 
  Minus,
  Calendar, 
  MapPin, 
  TrendingUp, 
  FileText,
  Download,
  Users,
  Building2,
  Trash2,
  AlertTriangle,
  X,
  Share2,
  Facebook,
  MessageCircle
} from 'lucide-react';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BloodLiquidIndicator from '@/components/ui/BloodLiquidIndicator';
import BloodTypeChart from '@/components/ui/BloodTypeChart';
import { DonationRequest, EligibilityTest, BloodType, Campaign, Hospital, Appointment } from '@/types';
import MapSelector from '@/components/ui/MapSelector';
import AddressInput from '@/components/ui/AddressInput';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Additional local types for admin-specific data
interface BloodBag {
  id: string;
  bloodType: BloodType;
  volume: number;
  collectionDate: Date;
  expiryDate: Date;
  hospitalId: string;
  hospitalName: string;
  status: 'available' | 'used' | 'expired';
  serialNumber: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stock');
  const [bloodStock, setBloodStock] = useState<BloodBag[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showShareButtons, setShowShareButtons] = useState(false);
  const [showBulkRemove, setShowBulkRemove] = useState(false);
  const [showScheduleAppointment, setShowScheduleAppointment] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRequest | null>(null);
  const [createdCampaignData, setCreatedCampaignData] = useState<any>(null);
  const [bulkRemoveForm, setBulkRemoveForm] = useState<{[key: string]: number}>({});
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: user?.displayName || '',
    phone: '',
    address: ''
  });

  const [stockForm, setStockForm] = useState({
    bloodType: 'O+' as BloodType,
    volume: 450,
    collectionDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    address: '',
    latitude: 0,
    longitude: 0,
    targetBloodTypes: [] as BloodType[],
    startDate: '',
    endDate: '',
    maxDonors: 50
  });

  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    duration: 30,
    notes: '',
    location: {
      address: '',
      room: '',
      floor: ''
    }
  });

  useEffect(() => {
    if (user?.id) {
      fetchBloodStock();
      fetchCampaigns();
      fetchDonations();
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const q = query(
        collection(db, 'appointments'), 
        where('hospitalId', '==', user?.id),
        orderBy('appointmentDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const appointmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appointmentDate: doc.data().appointmentDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Appointment[];
      
      setAppointments(appointmentsList);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast.error('Impossible de charger les rendez-vous');
    }
  };

  const scheduleAppointment = async (appointmentData: {
    donationRequestId: string;
    appointmentDate: Date;
    appointmentTime: string;
    duration: number;
    location?: {
      address: string;
      room?: string;
      floor?: string;
    };
    notes?: string;
  }) => {
    if (!user?.id || !selectedDonation) {
      console.error('❌ Données manquantes:', { userId: user?.id, selectedDonation });
      toast.error('Erreur: utilisateur ou donation non sélectionnée');
      return;
    }

    console.log('📅 Programmation du rendez-vous...', {
      appointmentData,
      selectedDonation: {
        id: selectedDonation.id,
        userId: selectedDonation.userId,
        userName: selectedDonation.userName,
        userEmail: selectedDonation.userEmail
      },
      hospitalInfo: {
        id: user.id,
        name: adminProfile.name || user?.displayName || 'Hôpital'
      }
    });

    try {
      // Créer le rendez-vous
      const appointmentDoc = {
        donationRequestId: appointmentData.donationRequestId,
        userId: selectedDonation.userId,
        userName: selectedDonation.userName,
        userEmail: selectedDonation.userEmail,
        hospitalId: user.id,
        hospitalName: adminProfile.name || user?.displayName || 'Hôpital',
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        duration: appointmentData.duration,
        location: appointmentData.location,
        notes: appointmentData.notes,
        status: 'scheduled' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('💾 Sauvegarde dans Firestore:', appointmentDoc);
      
      const appointmentRef = await addDoc(collection(db, 'appointments'), appointmentDoc);
      
      console.log('✅ Rendez-vous créé avec ID:', appointmentRef.id);

      // Mettre à jour la demande de don
      const donationRef = doc(db, 'donationRequests', appointmentData.donationRequestId);
      await updateDoc(donationRef, {
        status: 'approved',
        appointmentId: appointmentRef.id,
        updatedAt: new Date(),
      });

      console.log('✅ Demande de don mise à jour');

      toast.success('🎉 Rendez-vous programmé avec succès!');
      
      // Actualiser les données
      console.log('🔄 Actualisation des données...');
      await fetchDonations();
      await fetchAppointments();
      
      // Fermer la modal
      setShowScheduleAppointment(false);
      setSelectedDonation(null);
      
      console.log('🏁 Processus terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur détaillée lors de la programmation:', error);
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
      }
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Impossible de programmer le rendez-vous'}`);
    }
  };

  const fetchBloodStock = async () => {
    try {
      const q = query(collection(db, 'poche'), where('hospitalId', '==', user?.id));
      const querySnapshot = await getDocs(q);
      const stock = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collectionDate: doc.data().collectionDate?.toDate() || new Date(),
        expiryDate: doc.data().expiryDate?.toDate() || new Date(),
      })) as BloodBag[];
      setBloodStock(stock);
      console.log('Stock chargé:', stock.length, 'poches pour utilisateur:', user?.id);
    } catch (error) {
      console.error('Erreur chargement stock:', error);
      toast.error('Erreur lors du chargement du stock');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const q = query(collection(db, 'campaigns'), where('hospitalId', '==', user?.id));
      const querySnapshot = await getDocs(q);
      const campaignData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const startDate = data.startDate?.toDate() || new Date();
        const endDate = data.endDate?.toDate() || new Date();
        const now = new Date();
        
        // Déterminer le statut automatiquement selon les dates
        let status = data.status;
        if (now >= startDate && now <= endDate) {
          status = 'active';
        } else if (now > endDate) {
          status = 'completed';
        } else {
          status = 'upcoming';
        }

        return {
          id: doc.id,
          ...data,
          startDate,
          endDate,
          status
        };
      }) as Campaign[];
      
      setCampaigns(campaignData);
      console.log('Campagnes chargées:', campaignData.length, 'dont', campaignData.filter(c => c.status === 'active').length, 'actives');
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      toast.error('Erreur lors du chargement des campagnes');
    }
  };

  const fetchDonations = async () => {
    try {
      // Maintenant on filtre par adminId au lieu de hospitalId
      const q = query(collection(db, 'donationRequests'), where('adminId', '==', user?.id));
      const querySnapshot = await getDocs(q);
      const donationData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as DonationRequest[];
      setDonations(donationData);
      console.log('Demandes de don chargées:', donationData.length, 'pour admin:', user?.id);
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };


  const addBloodBag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const newBloodBag = {
        bloodType: stockForm.bloodType,
        volume: stockForm.volume,
        collectionDate: new Date(stockForm.collectionDate),
        expiryDate: new Date(stockForm.expiryDate),
        hospitalId: user?.id,
        hospitalName: adminProfile.name || user?.displayName || 'Hôpital',
        status: 'available',
        donorId: null,
        serialNumber: `${stockForm.bloodType}-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.id
      };

      const docRef = await addDoc(collection(db, 'poche'), newBloodBag);
      console.log('Poche ajoutée avec ID:', docRef.id);
      
      toast.success('Poche de sang ajoutée avec succès');
      setStockForm({
        bloodType: 'O+' as BloodType,
        volume: 450,
        collectionDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      });
      setShowAddStock(false);
      fetchBloodStock();
    } catch (error) {
      console.error('Erreur ajout poche:', error);
      toast.error('Erreur lors de l\'ajout de la poche');
    }
  };

  const removeBloodBag = async (bagId: string, bloodType: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer cette poche ${bloodType} ?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'poche', bagId));
      toast.success('Poche retirée avec succès');
      fetchBloodStock();
    } catch (error) {
      console.error('Erreur suppression poche:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const bulkRemoveBloodBags = async () => {
    const totalToRemove = Object.values(bulkRemoveForm).reduce((sum: number, count) => sum + (count as number), 0);
    
    if (totalToRemove === 0) {
      toast.error('Veuillez sélectionner au moins une poche à retirer');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir retirer ${totalToRemove} poche(s) de sang ?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      let removedCount = 0;
      
      for (const [bloodType, countToRemove] of Object.entries(bulkRemoveForm)) {
        if ((countToRemove as number) > 0) {
          const availableBags = bloodStock
            .filter(bag => bag.bloodType === bloodType && bag.status === 'available')
            .slice(0, countToRemove as number);

          for (const bag of availableBags) {
            await deleteDoc(doc(db, 'poche', bag.id));
            removedCount++;
          }
        }
      }

      toast.success(`${removedCount} poche(s) retirée(s) avec succès`);
      setBulkRemoveForm({});
      setShowBulkRemove(false);
      fetchBloodStock();
    } catch (error) {
      console.error('Erreur suppression en lot:', error);
      toast.error('Erreur lors de la suppression en lot');
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!campaignForm.title || !campaignForm.description || !campaignForm.address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (campaignForm.latitude === 0 || campaignForm.longitude === 0) {
      toast.error('Veuillez sélectionner une position sur la carte');
      return;
    }
    
    if (campaignForm.targetBloodTypes.length === 0) {
      toast.error('Veuillez sélectionner au moins un type de sang');
      return;
    }

    try {
      console.log('Création campagne avec données:', campaignForm);
      
      const newCampaign = {
        title: campaignForm.title,
        description: campaignForm.description,
        hospitalId: user?.id || user?.hospitalId,
        hospitalName: adminProfile.name || user?.displayName || 'Hôpital',
        adminContact: {
          name: adminProfile.name || user?.displayName || 'Hôpital',
          phone: adminProfile.phone || 'Non renseigné',
          address: adminProfile.address || 'Non renseignée'
        },
        location: {
          address: campaignForm.address,
          latitude: campaignForm.latitude,
          longitude: campaignForm.longitude
        },
        targetBloodTypes: campaignForm.targetBloodTypes,
        startDate: new Date(campaignForm.startDate),
        endDate: new Date(campaignForm.endDate),
        status: 'upcoming',
        maxDonors: campaignForm.maxDonors,
        currentDonors: 0,
        registeredDonors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.id
      };

      const docRef = await addDoc(collection(db, 'campaigns'), newCampaign);
      console.log('Campagne créée avec ID:', docRef.id);
      
      toast.success('Campagne créée avec succès');
      setShowCreateCampaign(false);
      
      // Préparer les données pour le partage
      setCreatedCampaignData({
        ...newCampaign,
        id: docRef.id
      });
      setShowShareButtons(true);
      
      // Réinitialiser le formulaire
      setCampaignForm({
        title: '',
        description: '',
        address: '',
        latitude: 0,
        longitude: 0,
        targetBloodTypes: [],
        startDate: '',
        endDate: '',
        maxDonors: 50
      });
      
      fetchCampaigns();
    } catch (error) {
      console.error('Erreur création campagne:', error);
      toast.error(`Erreur lors de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const getBloodTypeChartData = () => {
    const bloodTypeColors = {
      'A+': '#DC2626', 'A-': '#EF4444',
      'B+': '#7C3AED', 'B-': '#8B5CF6',
      'AB+': '#059669', 'AB-': '#10B981',
      'O+': '#EA580C', 'O-': '#F97316'
    };

    const availableStock = bloodStock.filter(bag => bag.status === 'available');
    const total = availableStock.length;
    
    return bloodTypes.map(bloodType => {
      const count = availableStock.filter(bag => bag.bloodType === bloodType).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      
      return {
        bloodType,
        count,
        percentage,
        color: bloodTypeColors[bloodType]
      };
    });
  };

  const shareOnFacebook = (campaign?: Campaign) => {
    const campaignData = campaign || createdCampaignData;
    if (!campaignData) return;
    
    const shareText = `🩸 Campagne de don de sang : ${campaignData.title}\n\n${campaignData.description}\n\n📍 Lieu: ${campaignData.location.address}\n📅 Du ${campaignData.startDate.toLocaleDateString()} au ${campaignData.endDate.toLocaleDateString()}\n\nVenez donner votre sang et sauver des vies ! 💪❤️`;
    
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = (campaign?: Campaign) => {
    const campaignData = campaign || createdCampaignData;
    if (!campaignData) return;
    
    const shareText = `🩸 *Campagne de don de sang*\n\n*${campaignData.title}*\n\n${campaignData.description}\n\n📍 *Lieu:* ${campaignData.location.address}\n📅 *Période:* Du ${campaignData.startDate.toLocaleDateString()} au ${campaignData.endDate.toLocaleDateString()}\n\nVenez donner votre sang et sauver des vies ! 💪❤️\n\nPlus d'infos: ${window.location.origin}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };


  const getStockLevel = (bloodType: BloodType) => {
    const bags = bloodStock.filter(bag => bag.bloodType === bloodType && bag.status === 'available');
    const count = bags.length;
    
    if (count === 0) return { level: 'critical', color: 'red' };
    if (count <= 2) return { level: 'low', color: 'yellow' };
    if (count <= 5) return { level: 'medium', color: 'blue' };
    return { level: 'high', color: 'green' };
  };

  const exportToPDF = () => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Rapport de Stock de Sang', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 20, 40);
      doc.text(`Hôpital: ${user?.displayName || 'Non spécifié'}`, 20, 50);
      
      // En-têtes
      let yPos = 80;
      doc.setFontSize(14);
      doc.text('Type de Sang', 20, yPos);
      doc.text('Quantité', 80, yPos);
      doc.text('Volume (ml)', 130, yPos);
      doc.text('Statut', 170, yPos);
      
      yPos += 10;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      // Données
      const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      
      bloodTypes.forEach(type => {
        const bags = bloodStock.filter(bag => bag.bloodType === type && bag.status === 'available');
        const totalVolume = bags.reduce((sum, bag) => sum + bag.volume, 0);
        const { level } = getStockLevel(type);
        
        doc.setFontSize(12);
        doc.text(type, 20, yPos);
        doc.text(bags.length.toString(), 80, yPos);
        doc.text(totalVolume.toString(), 130, yPos);
        doc.text(level, 170, yPos);
        
        yPos += 15;
      });
      
      doc.save('rapport-stock-sang.pdf');
      toast.success('Rapport PDF exporté avec succès!');
    });
  };

  const exportToExcel = () => {
    // Import XLSX dynamically to avoid SSR issues
    import('xlsx').then((XLSX) => {
      const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      
      const ws_data = [
        ['Type de Sang', 'Quantité', 'Volume (ml)', 'Statut'],
        ...bloodTypes.map(type => {
          const bags = bloodStock.filter(bag => bag.bloodType === type && bag.status === 'available');
          const totalVolume = bags.reduce((sum, bag) => sum + bag.volume, 0);
          const { level } = getStockLevel(type);
          
          return [type, bags.length, totalVolume, level];
        })
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock de Sang');
      
      // Sauvegarder le fichier
      XLSX.writeFile(wb, 'rapport-stock-sang.xlsx');
      toast.success('Rapport Excel exporté avec succès!');
    });
  };

  const tabs = [
    { id: 'stock', label: 'Stock de Sang', icon: Droplets },
    { id: 'campaigns', label: 'Campagnes', icon: Calendar },
    { id: 'donations', label: 'Demandes de Don', icon: Users },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
    { id: 'stats', label: 'Statistiques', icon: TrendingUp },
    { id: 'profile', label: 'Profil', icon: Building2 },
  ];

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Building2 className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Administrateur</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowProfileForm(true)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {adminProfile.name || user?.displayName}
                </Button>
                <Button variant="ghost" onClick={logout}>
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
          </motion.div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation par onglets */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border mb-8"
          >
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={20} className="mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {activeTab === 'stock' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Gestion du Stock de Sang</h3>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => setShowBulkRemove(true)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Minus size={20} className="mr-2" />
                        Retirer en lot
                      </Button>
                      <Button onClick={() => setShowAddStock(true)}>
                        <Plus size={20} className="mr-2" />
                        Ajouter une poche
                      </Button>
                    </div>
                  </div>

                  {/* Grille des groupes sanguins avec animation liquide */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {bloodTypes.map((bloodType) => {
                      const stock = getStockLevel(bloodType);
                      const count = bloodStock.filter(bag => bag.bloodType === bloodType && bag.status === 'available').length;
                      
                      return (
                        <motion.div
                          key={bloodType}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <BloodLiquidIndicator
                            bloodType={bloodType}
                            count={count}
                            maxCount={20}
                            level={stock.level as 'critical' | 'low' | 'normal' | 'high'}
                          />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Liste détaillée des poches avec bouton suppression */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Stock Détaillé</h4>
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {bloodStock.filter(bag => bag.status === 'available').map((bag) => (
                        <motion.div
                          key={bag.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                                 style={{ backgroundColor: getStockLevel(bag.bloodType).color.replace('text-', '#') }}>
                              {bag.bloodType}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {bag.serialNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {bag.volume}ml • Expire le {bag.expiryDate.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeBloodBag(bag.id, bag.bloodType)}
                            className="flex items-center space-x-1"
                          >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Retirer</span>
                          </Button>
                        </motion.div>
                      ))}
                      {bloodStock.filter(bag => bag.status === 'available').length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Droplets size={48} className="mx-auto mb-4 text-gray-300" />
                          <p>Aucune poche disponible</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'campaigns' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Campagnes de Collecte</h3>
                    <Button onClick={() => setShowCreateCampaign(true)}>
                      <Plus size={20} className="mr-2" />
                      Nouvelle campagne
                    </Button>
                  </div>

                  {/* Debug info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p><strong>Debug:</strong> {campaigns.length} campagnes trouvées</p>
                    <p><strong>Actives:</strong> {campaigns.filter(c => c.status === 'active').length}</p>
                    <p><strong>À venir:</strong> {campaigns.filter(c => c.status === 'upcoming').length}</p>
                    <p><strong>Terminées:</strong> {campaigns.filter(c => c.status === 'completed').length}</p>
                  </div>

                  <div className="grid gap-6">
                    {campaigns.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>Aucune campagne créée</p>
                      </div>
                    ) : (
                      campaigns.map((campaign) => (
                        <motion.div
                          key={campaign.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-xl p-6 border"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {campaign.title}
                              </h4>
                              <p className="text-gray-600 mb-4">{campaign.description}</p>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <MapPin size={16} className="mr-1" />
                                {campaign.location.address}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar size={16} className="mr-1" />
                                {campaign.startDate.toLocaleDateString()} - {campaign.endDate.toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                campaign.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {campaign.status}
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                {campaign.currentDonors}/{campaign.maxDonors} donneurs
                              </div>
                            </div>
                          </div>
                          
                          {/* Boutons de partage */}
                          {campaign.status === 'active' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 font-medium">Partager cette campagne:</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => shareOnFacebook(campaign)}
                                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    <Facebook size={16} className="mr-1" />
                                    Facebook
                                  </button>
                                  <button
                                    onClick={() => shareOnWhatsApp(campaign)}
                                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    <MessageCircle size={16} className="mr-1" />
                                    WhatsApp
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'donations' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold">Demandes de Don Reçues</h3>
                  
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <motion.div
                        key={donation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-50 rounded-xl p-6 border"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {donation.bloodType}
                              </div>
                              <div>
                                <span className="font-medium">{donation.userName || 'Donneur anonyme'}</span>
                                <p className="text-xs text-gray-500">{donation.userEmail}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Candidature reçue le {donation.createdAt.toLocaleDateString()}
                            </p>
                            
                            {/* Informations d'éligibilité */}
                            {donation.eligibilityTest && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Test d'éligibilité</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                  <p><strong>Âge:</strong> {donation.eligibilityTest.age} ans</p>
                                  <p><strong>Poids:</strong> {donation.eligibilityTest.weight} kg</p>
                                  <p><strong>Score:</strong> {donation.eligibilityTest.score}/100</p>
                                  <p><strong>Éligible:</strong> {donation.eligibilityTest.eligible ? '✅ Oui' : '❌ Non'}</p>
                                  {donation.eligibilityTest.lastDonation && (
                                    <p className="col-span-2"><strong>Dernier don:</strong> {new Date(donation.eligibilityTest.lastDonation).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Type de don */}
                            <div className="mt-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                donation.donationType === 'campaign' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {donation.donationType === 'campaign' ? '🗓️ Campagne' : '🩸 Don direct'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Voir détails
                            </Button>
                            {donation.status === 'pending' && (
                              <>
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDonation(donation);
                                    setShowScheduleAppointment(true);
                                  }}
                                >
                                  📅 Programmer RDV
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Rejeter
                                </Button>
                              </>
                            )}
                            {donation.status === 'approved' && donation.appointmentId && (
                              <span className="text-green-600 text-sm font-medium">✅ RDV programmé</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'appointments' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Gestion des Rendez-vous</h3>
                    <Button onClick={() => fetchAppointments()}>
                      🔄 Actualiser
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">📅 Programmés</h4>
                      <p className="text-2xl font-bold text-blue-700">
                        {appointments.filter(a => a.status === 'scheduled').length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">✅ Confirmés</h4>
                      <p className="text-2xl font-bold text-green-700">
                        {appointments.filter(a => a.status === 'confirmed').length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-900 mb-2">⏳ Aujourd'hui</h4>
                      <p className="text-2xl font-bold text-yellow-700">
                        {appointments.filter(a => 
                          new Date(a.appointmentDate).toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {appointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">Aucun rendez-vous programmé</p>
                        <p className="text-sm">Les rendez-vous programmés apparaîtront ici</p>
                      </div>
                    ) : (
                      appointments.map((appointment) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white rounded-xl p-6 border shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-3">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                  👤
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{appointment.userName}</h4>
                                  <p className="text-sm text-gray-600">{appointment.userEmail}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">📅 Date et heure</p>
                                  <p className="text-sm text-gray-600">
                                    {appointment.appointmentDate.toLocaleDateString()} à {appointment.appointmentTime}
                                  </p>
                                  <p className="text-xs text-gray-500">Durée: {appointment.duration} minutes</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">📍 Lieu</p>
                                  <p className="text-sm text-gray-600">
                                    {appointment.location?.address || 'Adresse principale'}
                                  </p>
                                  {appointment.location?.room && (
                                    <p className="text-xs text-gray-500">
                                      Salle: {appointment.location.room}
                                      {appointment.location.floor && ` - Étage: ${appointment.location.floor}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {appointment.notes && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3">
                                  <p className="text-sm text-yellow-800">
                                    <strong>📝 Notes:</strong> {appointment.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appointment.status === 'scheduled' ? '📅 Programmé' :
                                 appointment.status === 'confirmed' ? '✅ Confirmé' :
                                 appointment.status === 'completed' ? '✓ Terminé' :
                                 appointment.status === 'cancelled' ? '❌ Annulé' :
                                 '⚠️ Absent'}
                              </span>
                              
                              <div className="flex space-x-2">
                                {appointment.status === 'scheduled' && (
                                  <Button variant="outline" size="sm">
                                    ✅ Confirmer
                                  </Button>
                                )}
                                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                  <Button variant="ghost" size="sm">
                                    ❌ Annuler
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Statistiques et Rapports</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={exportToPDF}>
                        <Download size={20} className="mr-2" />
                        Export PDF
                      </Button>
                      <Button variant="outline" onClick={exportToExcel}>
                        <FileText size={20} className="mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>

                  {/* Cartes de statistiques avec effet liquide */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Carte Total Poches */}
                    <motion.div 
                      className="relative rounded-xl overflow-hidden h-32 bg-red-600"
                      animate={{ 
                        boxShadow: [
                          "0 4px 15px rgba(239, 68, 68, 0.3)",
                          "0 8px 25px rgba(239, 68, 68, 0.4)",
                          "0 4px 15px rgba(239, 68, 68, 0.3)"
                        ]
                      }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-700"
                        animate={{
                          y: [0, -2, 2, 0],
                          scale: [1, 1.02, 0.98, 1],
                          rotate: [0, 0.5, -0.5, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
                        <p className="text-red-100 text-sm mb-1">Total Poches</p>
                        <p className="text-4xl font-bold">{bloodStock.length}</p>
                        <Droplets size={20} className="text-red-200 mt-1" />
                      </div>
                    </motion.div>
                    
                    {/* Carte Disponibles */}
                    <motion.div 
                      className="relative rounded-xl overflow-hidden h-32 bg-green-600"
                      animate={{ 
                        boxShadow: [
                          "0 4px 15px rgba(34, 197, 94, 0.3)",
                          "0 8px 25px rgba(34, 197, 94, 0.4)",
                          "0 4px 15px rgba(34, 197, 94, 0.3)"
                        ]
                      }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.25 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-700"
                        animate={{
                          y: [0, 2, -2, 0],
                          scale: [1, 0.98, 1.02, 1],
                          rotate: [0, -0.5, 0.5, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}
                      />
                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
                        <p className="text-green-100 text-sm mb-1">Disponibles</p>
                        <p className="text-4xl font-bold">
                          {bloodStock.filter(bag => bag.status === 'available').length}
                        </p>
                        <TrendingUp size={20} className="text-green-200 mt-1" />
                      </div>
                    </motion.div>
                    
                    {/* Carte Campagnes actives */}
                    <motion.div 
                      className="relative rounded-xl overflow-hidden h-32 bg-blue-600"
                      animate={{ 
                        boxShadow: [
                          "0 4px 15px rgba(59, 130, 246, 0.3)",
                          "0 8px 25px rgba(59, 130, 246, 0.4)",
                          "0 4px 15px rgba(59, 130, 246, 0.3)"
                        ]
                      }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700"
                        animate={{
                          y: [0, -1, 1, 0],
                          scale: [1, 1.01, 0.99, 1],
                          rotate: [0, 0.3, -0.3, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                      />
                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
                        <p className="text-blue-100 text-sm mb-1">Campagnes actives</p>
                        <p className="text-4xl font-bold">
                          {campaigns.filter(c => c.status === 'active').length}
                        </p>
                        <Calendar size={20} className="text-blue-200 mt-1" />
                      </div>
                    </motion.div>
                    
                    {/* Carte En attente */}
                    <motion.div 
                      className="relative rounded-xl overflow-hidden h-32 bg-purple-600"
                      animate={{ 
                        boxShadow: [
                          "0 4px 15px rgba(147, 51, 234, 0.3)",
                          "0 8px 25px rgba(147, 51, 234, 0.4)",
                          "0 4px 15px rgba(147, 51, 234, 0.3)"
                        ]
                      }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.75 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700"
                        animate={{
                          y: [0, 1, -1, 0],
                          scale: [1, 0.99, 1.01, 1],
                          rotate: [0, -0.3, 0.3, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.75 }}
                      />
                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
                        <p className="text-purple-100 text-sm mb-1">En attente</p>
                        <p className="text-4xl font-bold">
                          {donations.filter(d => d.status === 'pending').length}
                        </p>
                        <Users size={20} className="text-purple-200 mt-1" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Diagramme circulaire des groupes sanguins */}
                  <BloodTypeChart data={getBloodTypeChartData()} />

                  {/* Alertes niveau critique */}
                  <div className="bg-white rounded-xl p-6 border">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="text-red-600 mr-2" size={20} />
                      Niveaux de Stock Critiques
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {bloodTypes.map((bloodType) => {
                        const stock = getStockLevel(bloodType);
                        if (stock.level === 'critical') {
                          return (
                            <div key={bloodType} className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                              <div className="text-red-600 font-bold text-lg">{bloodType}</div>
                              <div className="text-red-800 text-sm">Stock critique</div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Profil Administrateur</h3>
                    <Button onClick={() => setShowProfileForm(true)}>
                      Modifier le profil
                    </Button>
                  </div>

                  <div className="bg-white rounded-xl p-6 border">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom de l'établissement
                        </label>
                        <p className="text-lg text-gray-900">{adminProfile.name || user?.displayName || 'Non défini'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de téléphone
                        </label>
                        <p className="text-lg text-gray-900">{adminProfile.phone || 'Non défini'}</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse
                        </label>
                        <p className="text-lg text-gray-900">{adminProfile.address || 'Non définie'}</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <p className="text-lg text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Information importante :</h4>
                    <p className="text-sm text-blue-800">
                      Ces informations seront affichées sur toutes vos campagnes pour permettre aux donneurs de vous contacter directement.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Modals */}
        {showCreateCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Créer une nouvelle campagne
              </h3>
              
              <form onSubmit={createCampaign} className="space-y-4">
                <Input
                  type="text"
                  label="Titre de la campagne"
                  placeholder="Collecte de sang urgente"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Description de la campagne..."
                    required
                  />
                </div>
                
                {/* Champ adresse avec autocomplétion */}
                <AddressInput
                  label="Adresse de la campagne"
                  placeholder="Tapez une adresse au Cameroun..."
                  value={campaignForm.address}
                  onChange={(address, coordinates) => {
                    setCampaignForm({ 
                      ...campaignForm, 
                      address,
                      latitude: coordinates?.lat || campaignForm.latitude,
                      longitude: coordinates?.lng || campaignForm.longitude
                    });
                  }}
                  required
                />
                
                {/* Sélection interactive de localisation avec autocomplétion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position sur la carte
                  </label>
                  <MapSelector
                    latitude={campaignForm.latitude}
                    longitude={campaignForm.longitude}
                    onLocationSelect={(lat, lng) => {
                      setCampaignForm({ 
                        ...campaignForm, 
                        latitude: lat, 
                        longitude: lng
                      });
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Types de sang recherchés
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {bloodTypes.map((type) => (
                      <label key={type} className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={campaignForm.targetBloodTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCampaignForm({
                                ...campaignForm,
                                targetBloodTypes: [...campaignForm.targetBloodTypes, type]
                              });
                            } else {
                              setCampaignForm({
                                ...campaignForm,
                                targetBloodTypes: campaignForm.targetBloodTypes.filter(t => t !== type)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Date de début"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    required
                  />
                  
                  <Input
                    type="date"
                    label="Date de fin"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    required
                  />
                </div>
                
                <Input
                  type="number"
                  label="Nombre maximum de donneurs"
                  value={campaignForm.maxDonors}
                  onChange={(e) => setCampaignForm({ ...campaignForm, maxDonors: parseInt(e.target.value) })}
                  min="10"
                  max="200"
                  required
                />
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateCampaign(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={campaignForm.targetBloodTypes.length === 0 || campaignForm.latitude === 0}
                  >
                    Créer la campagne
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAddStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ajouter une poche de sang
              </h3>
              
              <form onSubmit={addBloodBag} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Groupe sanguin
                  </label>
                  <select
                    value={stockForm.bloodType}
                    onChange={(e) => setStockForm({ ...stockForm, bloodType: e.target.value as BloodType })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg"
                  >
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <Input
                  type="number"
                  label="Volume (ml)"
                  value={stockForm.volume}
                  onChange={(e) => setStockForm({ ...stockForm, volume: parseInt(e.target.value) })}
                  min="350"
                  max="500"
                  required
                />
                
                <Input
                  type="date"
                  label="Date de collecte"
                  value={stockForm.collectionDate}
                  onChange={(e) => setStockForm({ ...stockForm, collectionDate: e.target.value })}
                  required
                />
                
                <Input
                  type="date"
                  label="Date d'expiration"
                  value={stockForm.expiryDate}
                  onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
                  required
                />
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddStock(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Ajouter
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Profil Administrateur */}
        {showProfileForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Modifier le profil
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // Sauvegarder le profil dans Firestore
                  await addDoc(collection(db, 'adminProfiles'), {
                    userId: user?.id,
                    name: adminProfile.name,
                    phone: adminProfile.phone,
                    address: adminProfile.address,
                    email: user?.email,
                    updatedAt: new Date()
                  });
                  
                  toast.success('Profil mis à jour avec succès');
                  setShowProfileForm(false);
                } catch (error) {
                  console.error('Erreur mise à jour profil:', error);
                  toast.error('Erreur lors de la mise à jour');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'établissement *
                  </label>
                  <input
                    type="text"
                    value={adminProfile.name}
                    onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Hôpital Central de Yaoundé"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    value={adminProfile.phone}
                    onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="+237 6XX XX XX XX"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète
                  </label>
                  <textarea
                    value={adminProfile.address}
                    onChange={(e) => setAdminProfile({...adminProfile, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Rue, quartier, ville..."
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ℹ️ Ces informations seront visibles par les donneurs sur vos campagnes pour vous contacter.
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowProfileForm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Sauvegarder
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Partage campagne */}
        {showShareButtons && createdCampaignData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Share2 size={24} className="mr-2 text-primary-600" />
                  Partager la campagne
                </h3>
                <button
                  onClick={() => setShowShareButtons(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{createdCampaignData.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{createdCampaignData.description}</p>
                <div className="text-sm text-gray-500">
                  📍 {createdCampaignData.location.address}
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => shareOnFacebook()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                >
                  <Facebook size={20} className="mr-2" />
                  Partager sur Facebook
                </Button>
                
                <Button
                  onClick={() => shareOnWhatsApp()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                >
                  <MessageCircle size={20} className="mr-2" />
                  Partager sur WhatsApp
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowShareButtons(false)}
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modale de retrait en lot */}
        {showBulkRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Minus size={20} className="mr-2 text-red-500" />
                Retirer des poches par groupe sanguin
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {bloodTypes.map((bloodType) => {
                  const availableCount = bloodStock.filter(bag => 
                    bag.bloodType === bloodType && bag.status === 'available'
                  ).length;
                  
                  return (
                    <div key={bloodType} className="border rounded-lg p-4">
                      <div className="text-center mb-3">
                        <h4 className="font-semibold text-lg">{bloodType}</h4>
                        <p className="text-sm text-gray-600">
                          {availableCount} disponible(s)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Nombre à retirer
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={availableCount}
                          value={bulkRemoveForm[bloodType] || 0}
                          onChange={(e) => setBulkRemoveForm(prev => ({
                            ...prev,
                            [bloodType]: Math.min(parseInt(e.target.value) || 0, availableCount)
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={availableCount === 0}
                        />
                        
                        {availableCount > 0 && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setBulkRemoveForm(prev => ({
                                ...prev,
                                [bloodType]: Math.min((prev[bloodType] || 0) + 1, availableCount)
                              }))}
                              className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => setBulkRemoveForm(prev => ({
                                ...prev,
                                [bloodType]: availableCount
                              }))}
                              className="flex-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                            >
                              Tout
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Résumé */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">Résumé du retrait</h4>
                <div className="text-sm text-gray-600">
                  Total à retirer: <span className="font-semibold text-red-600">
                    {Object.values(bulkRemoveForm).reduce((sum, count) => sum + count, 0)} poche(s)
                  </span>
                </div>
                {Object.entries(bulkRemoveForm).map(([bloodType, count]) => 
                  count > 0 && (
                    <div key={bloodType} className="text-sm">
                      {bloodType}: {count} poche(s)
                    </div>
                  )
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={bulkRemoveBloodBags}
                  disabled={Object.values(bulkRemoveForm).reduce((sum, count) => sum + count, 0) === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer le retrait
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkRemove(false);
                    setBulkRemoveForm({});
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de programmation de rendez-vous */}
        {showScheduleAppointment && selectedDonation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    📅 Programmer un Rendez-vous
                  </h2>
                  <button
                    onClick={() => {
                      setShowScheduleAppointment(false);
                      setSelectedDonation(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Infos du donneur */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">👤 Informations du donneur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Nom:</strong> {selectedDonation.userName}</p>
                      <p><strong>Email:</strong> {selectedDonation.userEmail}</p>
                    </div>
                    <div>
                      <p><strong>Groupe sanguin:</strong> {selectedDonation.bloodType}</p>
                      <p><strong>Hôpital choisi:</strong> {selectedDonation.hospitalName}</p>
                    </div>
                  </div>
                </div>

                {/* Formulaire de rendez-vous */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    const appointmentDate = new Date(formData.get('appointmentDate') as string);
                    const appointmentTime = formData.get('appointmentTime') as string;
                    const duration = parseInt(formData.get('duration') as string) || 60;
                    const address = formData.get('address') as string;
                    const room = formData.get('room') as string;
                    const floor = formData.get('floor') as string;
                    const notes = formData.get('notes') as string;

                    scheduleAppointment({
                      donationRequestId: selectedDonation.id,
                      appointmentDate,
                      appointmentTime,
                      duration,
                      location: {
                        address,
                        room: room || undefined,
                        floor: floor || undefined,
                      },
                      notes: notes || undefined,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📅 Date du rendez-vous
                      </label>
                      <input
                        type="date"
                        name="appointmentDate"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🕐 Heure du rendez-vous
                      </label>
                      <input
                        type="time"
                        name="appointmentTime"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⏱️ Durée (minutes)
                    </label>
                    <select
                      name="duration"
                      defaultValue="60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="90">1h 30min</option>
                      <option value="120">2 heures</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📍 Adresse du lieu
                    </label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Adresse complète de l'hôpital"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🏠 Salle (optionnel)
                      </label>
                      <input
                        type="text"
                        name="room"
                        placeholder="Numéro de salle"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🏢 Étage (optionnel)
                      </label>
                      <input
                        type="text"
                        name="floor"
                        placeholder="Numéro d'étage"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📝 Notes (optionnel)
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder="Instructions spéciales, préparations nécessaires..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowScheduleAppointment(false);
                        setSelectedDonation(null);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" variant="primary">
                      📅 Programmer le rendez-vous
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
