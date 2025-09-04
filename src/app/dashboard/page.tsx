'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  Search, 
  MessageSquare, 
  Gift, 
  HelpCircle,
  Calendar,
  Droplets,
  Star,
  Bot,
  Users,
  Bell,
  X
} from 'lucide-react';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Chatbot from '@/components/Chatbot';
import MapSelector from '@/components/ui/MapSelector';
import HospitalSelector from '@/components/ui/HospitalSelector';
import { Campaign, BloodType, Testimonial, DonationRequest, Hospital, Appointment } from '@/types';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [myDonations, setMyDonations] = useState<DonationRequest[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchBloodType, setSearchBloodType] = useState<BloodType>('O+');
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [showChatbot, setShowChatbot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEligibilityTest, setShowEligibilityTest] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [eligibilityStep, setEligibilityStep] = useState(0);
  const [eligibilityData, setEligibilityData] = useState({
    age: 18,
    weight: 50,
    lastDonation: '',
    hasIllness: false,
    takesMedication: false,
    hasTraveled: false
  });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [showHospitalSelection, setShowHospitalSelection] = useState(false);
  const [hospitalSearchType, setHospitalSearchType] = useState<BloodType>('O+');
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 3.8667, lng: 11.5167 });

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    console.log('🔐 Vérification authentification utilisateur:', user);
    if (user && user.id) {
      console.log('✅ Utilisateur authentifié, chargement des données...');
      fetchCampaigns();
      fetchTestimonials();
      fetchMyDonations();
      fetchMyAppointments();
      fetchHospitals();
    } else {
      console.log('⏳ En attente de l\'authentification...');
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      console.log('🔄 Début du chargement des campagnes...');
      console.log('🔍 Utilisateur actuel:', user?.email, user?.id);
      console.log('🔍 Configuration DB:', db);
      
      const campaignsRef = collection(db, 'campaigns');
      console.log('📂 Référence collection:', campaignsRef);
      
      console.log('🚀 Exécution de la requête Firestore...');
      const querySnapshot = await getDocs(campaignsRef);
      console.log('📊 Requête exécutée. Documents trouvés:', querySnapshot.docs.length);
      
      if (querySnapshot.empty) {
        console.warn('⚠️ Collection vide ou permissions insuffisantes');
        toast.error('Aucune campagne trouvée. Vérifiez les permissions Firestore.');
        return;
      }
      
      const campaignData = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log(`📄 Document ${index + 1}/${querySnapshot.docs.length}:`, {
          id: doc.id,
          rawData: data,
          keys: Object.keys(data),
          hasTitle: !!data.title,
          hasStartDate: !!data.startDate,
          hasEndDate: !!data.endDate,
          hasLocation: !!data.location
        });
        
        try {
          const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate || Date.now());
          const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate || Date.now());
          const now = new Date();
          
          console.log(`📅 Dates pour ${doc.id}:`, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            now: now.toISOString()
          });
          
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
            title: data.title || `Campagne ${doc.id}`,
            description: data.description || 'Aucune description',
            hospitalName: data.hospitalName || 'Hôpital non spécifié',
            location: data.location || { address: 'Lieu non spécifié', latitude: 3.8667, longitude: 11.5167 },
            targetBloodTypes: data.targetBloodTypes || ['O+'],
            maxDonors: data.maxDonors || 50,
            currentDonors: data.currentDonors || 0,
            ...data,
            startDate,
            endDate,
            status
          };
        } catch (dateError) {
          console.error(`❌ Erreur traitement dates pour ${doc.id}:`, dateError);
          return {
            id: doc.id,
            title: data.title || `Campagne ${doc.id}`,
            description: 'Erreur de format de dates',
            ...data,
            startDate: new Date(),
            endDate: new Date(),
            status: 'upcoming'
          };
        }
      }) as Campaign[];
      
      setCampaigns(campaignData);
      console.log('✅ Campagnes traitées et stockées:', campaignData.length);
      console.log('📋 Résumé final:', campaignData.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        dateRange: `${c.startDate?.toLocaleDateString()} - ${c.endDate?.toLocaleDateString()}`,
        location: c.location?.address
      })));
      
      if (campaignData.length > 0) {
        toast.success(`${campaignData.length} campagnes chargées avec succès`);
      }
      
    } catch (error) {
      console.error('❌ Erreur complète chargement campagnes:', {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast.error(`Erreur chargement: ${error.message}`);
    }
  };

  const fetchTestimonials = async () => {
    try {
      console.log('📝 Chargement des témoignages...');
      const querySnapshot = await getDocs(
        query(collection(db, 'testimonials'), where('approved', '==', true), orderBy('createdAt', 'desc'))
      );
      
      console.log(`📄 ${querySnapshot.docs.length} témoignages trouvés dans Firestore`);
      
      const testimonialData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📝 Témoignage:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Testimonial[];
      
      setTestimonials(testimonialData);
      console.log(`✅ ${testimonialData.length} témoignages chargés et affichés`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des témoignages:', error);
      toast.error('Erreur lors du chargement des témoignages');
    }
  };

  const fetchMyAppointments = async () => {
    try {
      if (!user?.id) {
        console.log('⏳ fetchMyAppointments: Pas d\'utilisateur connecté');
        return;
      }
      
      console.log('📅 Chargement des rendez-vous pour l\'utilisateur:', user.id);
      console.log('🔍 Tentative de récupération depuis la collection "appointments"');
      
      // Essayer sans orderBy d'abord pour éviter les erreurs d'index
      const qSimple = query(
        collection(db, 'appointments'),
        where('userId', '==', user.id)
      );
      
      console.log('🚀 Exécution de la requête Firestore...');
      const querySnapshot = await getDocs(qSimple);
      console.log(`📊 ${querySnapshot.docs.length} documents trouvés dans la collection appointments`);
      
      if (querySnapshot.empty) {
        console.warn('⚠️ Collection vide ou aucun rendez-vous pour cet utilisateur');
        setMyAppointments([]);
        return;
      }
      
      const appointmentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Document rendez-vous trouvé:', { 
          id: doc.id, 
          userId: data.userId,
          hospitalName: data.hospitalName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          status: data.status,
          allFields: Object.keys(data)
        });
        
        try {
          return {
            id: doc.id,
            ...data,
            appointmentDate: data.appointmentDate?.toDate ? data.appointmentDate.toDate() : new Date(data.appointmentDate),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          };
        } catch (dateError) {
          console.error('❌ Erreur conversion date pour le document:', doc.id, dateError);
          return {
            id: doc.id,
            ...data,
            appointmentDate: new Date(),
            createdAt: new Date(),
          };
        }
      }) as Appointment[];
      
      // Trier manuellement par date
      appointmentsList.sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime());
      
      setMyAppointments(appointmentsList);
      console.log(`✅ ${appointmentsList.length} rendez-vous chargés et affectés au state`);
      console.log('📋 Résumé des rendez-vous:', appointmentsList.map(app => ({
        id: app.id,
        date: app.appointmentDate.toLocaleDateString(),
        time: app.appointmentTime,
        hospital: app.hospitalName,
        status: app.status
      })));
      
      // Créer les notifications pour les nouveaux rendez-vous
      generateNotifications(appointmentsList);
    } catch (error) {
      console.error('❌ Erreur complète lors du chargement des rendez-vous:', error);
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message);
        // Check if it's a Firebase error with a code property
        if ('code' in error) {
          console.error('Code d\'erreur:', (error as any).code);
        }
        console.error('Stack trace:', error.stack);
      }
    }
  };

  const generateNotifications = (appointments: Appointment[]) => {
    const newNotifications: any[] = [];
    
    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const now = new Date();
      const timeDiff = appointmentDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Notification pour rendez-vous programmé
      if (appointment.status === 'scheduled') {
        newNotifications.push({
          id: `appointment-scheduled-${appointment.id}`,
          type: 'appointment_scheduled',
          title: '📅 Nouveau rendez-vous programmé',
          message: `Votre rendez-vous de don a été programmé pour le ${appointmentDate.toLocaleDateString('fr-FR')} à ${appointment.appointmentTime}`,
          appointmentId: appointment.id,
          createdAt: appointment.createdAt,
          read: false
        });
      }
      
      // Notification pour rendez-vous confirmé
      if (appointment.status === 'confirmed') {
        newNotifications.push({
          id: `appointment-confirmed-${appointment.id}`,
          type: 'appointment_confirmed',
          title: '✅ Rendez-vous confirmé',
          message: `Votre rendez-vous de don du ${appointmentDate.toLocaleDateString('fr-FR')} a été confirmé`,
          appointmentId: appointment.id,
          createdAt: appointment.createdAt,
          read: false
        });
      }
      
      // Rappel 1 jour avant
      if (daysDiff === 1 && (appointment.status === 'scheduled' || appointment.status === 'confirmed')) {
        newNotifications.push({
          id: `appointment-reminder-${appointment.id}`,
          type: 'appointment_reminder',
          title: '⏰ Rappel - Rendez-vous demain',
          message: `N'oubliez pas votre rendez-vous de don demain à ${appointment.appointmentTime} à ${appointment.hospitalName}`,
          appointmentId: appointment.id,
          createdAt: new Date(),
          read: false
        });
      }
      
      // Rappel jour même
      if (daysDiff === 0 && (appointment.status === 'scheduled' || appointment.status === 'confirmed')) {
        newNotifications.push({
          id: `appointment-today-${appointment.id}`,
          type: 'appointment_today',
          title: '🚨 Rendez-vous aujourd\'hui',
          message: `Votre rendez-vous de don est aujourd'hui à ${appointment.appointmentTime}. Préparez votre pièce d'identité !`,
          appointmentId: appointment.id,
          createdAt: new Date(),
          read: false
        });
      }
    });
    
    setNotifications(newNotifications);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const fetchMyDonations = async () => {
    try {
      const q = query(collection(db, 'donationRequests'), where('userId', '==', user?.id));
      const querySnapshot = await getDocs(q);
      const donationData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        scheduledDate: doc.data().scheduledDate?.toDate() || null,
      })) as DonationRequest[];
      setMyDonations(donationData);
    } catch (error) {
      toast.error('Erreur lors du chargement de vos dons');
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      // Charger la liste des administrateurs avec leurs stocks de sang
      const adminProfilesSnapshot = await getDocs(collection(db, 'adminProfiles'));
      const bloodStockSnapshot = await getDocs(collection(db, 'poche'));
      
      // Créer un mapping des stocks par hospitalId/adminId
      const stocksByAdmin: Record<string, Record<string, number>> = {};
      bloodStockSnapshot.docs.forEach(doc => {
        const stockData = doc.data();
        const adminId = stockData.hospitalId || stockData.createdBy;
        if (!stocksByAdmin[adminId]) {
          stocksByAdmin[adminId] = {};
        }
        const bloodType = stockData.bloodType;
        if (!stocksByAdmin[adminId][bloodType]) {
          stocksByAdmin[adminId][bloodType] = 0;
        }
        // Compter seulement les poches disponibles
        if (stockData.status === 'available') {
          stocksByAdmin[adminId][bloodType] += 1;
        }
      });
      
      const adminData = adminProfilesSnapshot.docs.map(doc => ({
        id: doc.data().userId,
        name: doc.data().name,
        phone: doc.data().phone,
        address: doc.data().address,
        email: doc.data().email,
        bloodStock: stocksByAdmin[doc.data().userId] || {},
        totalStock: Object.values(stocksByAdmin[doc.data().userId] || {}).reduce((a, b) => a + b, 0)
      }));
      
      setHospitals(adminData);
      console.log('Admins avec stocks chargés:', adminData.length);
    } catch (error) {
      console.error('Erreur chargement admins:', error);
      toast.error('Erreur lors du chargement des établissements');
    }
  };

  const calculateEligibilityScore = () => {
    let score = 100;
    
    // Vérifications d'âge (18-65 ans)
    if (eligibilityData.age < 18 || eligibilityData.age > 65) score -= 50;
    
    // Vérifications de poids (minimum 50kg)
    if (eligibilityData.weight < 50) score -= 30;
    
    // Dernier don (minimum 8 semaines pour hommes, 12 pour femmes)
    if (eligibilityData.lastDonation) {
      const lastDonationDate = new Date(eligibilityData.lastDonation);
      const daysDiff = (new Date().getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 56) score -= 40; // 8 semaines
    }
    
    // Maladie actuelle
    if (eligibilityData.hasIllness) score -= 30;
    
    // Médicaments
    if (eligibilityData.takesMedication) score -= 20;
    
    // Voyage récent (zones à risque)
    if (eligibilityData.hasTraveled) score -= 15;
    
    return { score, eligible: score >= 70 };
  };

  const submitEligibilityTest = async () => {
    const result = calculateEligibilityScore();
    
    if (result.eligible) {
      toast.success('Félicitations ! Vous êtes éligible pour faire un don.');
      setShowEligibilityTest(false);
      
      // Si c'est un don via campagne, envoyer directement la candidature
      if (currentCampaignId) {
        submitCampaignDonationRequest();
      } else {
        // Pour les dons directs, afficher la sélection d'hôpital
        setShowHospitalSelection(true);
      }
    } else {
      toast.error('Désolé, vous n\'êtes pas éligible pour faire un don actuellement.');
      setShowEligibilityTest(false);
    }
  };

  const submitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'testimonials'), {
        userId: user?.id,
        userName: user?.displayName,
        userPhoto: user?.photoURL,
        content: testimonialText,
        rating: testimonialRating,
        approved: false,
        createdAt: new Date(),
      });
      
      toast.success('Témoignage soumis pour modération');
      setShowTestimonialForm(false);
      setTestimonialText('');
      setTestimonialRating(5);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du témoignage');
    }
  };

  const startDonationProcess = (campaignId?: string) => {
    setCurrentCampaignId(campaignId || null);
    setShowEligibilityTest(true);
    // Reset form
    setEligibilityData({
      age: 18,
      weight: 50,
      lastDonation: '',
      hasIllness: false,
      takesMedication: false,
      hasTraveled: false
    });
  };

  const submitCampaignDonationRequest = async () => {
    if (!currentCampaignId) return;
    
    try {
      const eligibilityResult = calculateEligibilityScore();
      
      // Trouver la campagne sélectionnée
      const selectedCampaign = campaigns.find(campaign => campaign.id === currentCampaignId);
      if (!selectedCampaign) {
        toast.error('Campagne introuvable');
        return;
      }
      
      const donationData: any = {
        userId: user?.id,
        userName: user?.displayName,
        userEmail: user?.email,
        hospitalId: selectedCampaign.hospitalId,
        hospitalName: selectedCampaign.hospitalName,
        campaignId: currentCampaignId,
        bloodType: 'O+', // À récupérer du profil utilisateur
        eligibilityTest: {
          ...eligibilityData,
          lastDonation: eligibilityData.lastDonation ? new Date(eligibilityData.lastDonation) : null,
          score: eligibilityResult.score,
          eligible: eligibilityResult.eligible
        },
        status: 'pending',
        donationType: 'campaign',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await addDoc(collection(db, 'donationRequests'), donationData);
      
      toast.success(`🎉 Candidature envoyée pour la campagne "${selectedCampaign.title}" ! ${selectedCampaign.hospitalName} vous contactera bientôt.`);
      setCurrentCampaignId(null);
      fetchMyDonations(); // Refresh la liste
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la candidature:', error);
      toast.error('Erreur lors de l\'envoi de la candidature');
    }
  };

  const submitDonationRequest = async () => {
    if (!selectedHospital) return;
    
    try {
      const eligibilityResult = calculateEligibilityScore();
      
      const selectedAdmin = hospitals.find(admin => admin.id === selectedHospital);
      
      const donationData: any = {
        userId: user?.id,
        userName: user?.displayName,
        userEmail: user?.email,
        hospitalId: selectedHospital,
        hospitalName: selectedAdmin?.name || 'Hôpital',
        bloodType: 'O+', // À récupérer du profil utilisateur
        eligibilityTest: {
          ...eligibilityData,
          lastDonation: eligibilityData.lastDonation ? new Date(eligibilityData.lastDonation) : null,
          score: eligibilityResult.score,
          eligible: eligibilityResult.eligible
        },
        status: 'pending',
        donationType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await addDoc(collection(db, 'donationRequests'), donationData);
      
      toast.success(`Candidature de don direct envoyée ! ${selectedAdmin?.name || 'L\'établissement'} vous contactera bientôt.`);
      setShowHospitalSelection(false);
      setSelectedHospital(null);
      fetchMyDonations(); // Refresh la liste
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la candidature:', error);
      toast.error('Erreur lors de l\'envoi de la candidature');
    }
  };

  const applyForDonation = (campaignId: string) => {
    startDonationProcess(campaignId);
  };

  const tabs = [
    { id: 'campaigns', label: 'Campagnes', icon: MapPin },
    { id: 'appointments', label: 'Mes Rendez-vous', icon: Calendar },
    { id: 'search', label: 'Rechercher', icon: Search },
    { id: 'testimonials', label: 'Témoignages', icon: MessageSquare },
    { id: 'donations', label: 'Mes Dons', icon: Heart },
    { id: 'rewards', label: 'Récompenses', icon: Gift },
  ];

  return (
    <ProtectedRoute requiredRole="user">
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
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                  <Heart className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Mon Espace Donneur</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full"
                  >
                    <Bell size={20} />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown des notifications */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm">Aucune notification</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {notifications
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                  }`}
                                  onClick={() => {
                                    markNotificationAsRead(notification.id);
                                    if (notification.appointmentId) {
                                      setActiveTab('appointments');
                                      setShowNotifications(false);
                                    }
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className={`text-sm font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {notification.title}
                                      </h4>
                                      <p className={`text-sm mt-1 ${!notification.read ? 'text-blue-700' : 'text-gray-600'}`}>
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-2">
                                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      
                      {notifications.filter(n => !n.read).length > 0 && (
                        <div className="p-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }}
                            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Marquer tout comme lu
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600">
                    {user?.displayName}
                  </span>
                </div>
                <Button variant="ghost" onClick={logout}>
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation par onglets */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border mb-8"
          >
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
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

            <div className="p-6">
              {/* Onglet Campagnes */}
              {activeTab === 'campaigns' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Campagnes de Collecte Actives</h3>
                    <div className="text-sm text-gray-600">
                      {campaigns.length} campagnes disponibles
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Heart className="mr-2" size={20} />
                      Comment faire un don ?
                    </h4>
                    <p className="text-sm text-blue-800">
                      1. Cliquez sur <strong>"Test d'éligibilité"</strong> sur une campagne qui vous intéresse<br/>
                      2. Remplissez le questionnaire de santé<br/>
                      3. Si vous êtes éligible, choisissez un hôpital<br/>
                      4. Envoyez votre candidature et attendez la confirmation
                    </p>
                  </div>

                  {/* Carte interactive des campagnes */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-blue-500 text-white p-4">
                      <h4 className="font-semibold flex items-center">
                        <MapPin size={20} className="mr-2" />
                        Carte des Campagnes au Cameroun
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="h-[600px] mb-6">
                        <MapSelector
                          latitude={mapCenter.lat}
                          longitude={mapCenter.lng}
                          onLocationSelect={(lat, lng) => setMapCenter({ lat, lng })}
                          campaigns={campaigns}
                          showCampaigns={true}
                          className="h-full"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <MapPin className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                          <p className="text-sm font-medium text-blue-900">
                            {campaigns.length} campagnes sur la carte
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Cliquez pour voir les détails
                          </p>
                        </div>
                        
                        {campaigns.slice(0, 5).map((campaign, index) => (
                          <div key={campaign.id} className="text-center p-3 bg-gray-50 rounded-lg border hover:border-red-300 cursor-pointer transition-colors">
                            <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold ${
                              campaign.status === 'active' ? 'bg-red-500' :
                              campaign.status === 'upcoming' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {index + 1}
                            </div>
                            <p className="text-xs text-gray-700 font-medium mb-1">
                              {campaign.title || 'Campagne sans titre'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {campaign.location?.address?.split(',')[0] || 'Lieu non défini'}
                            </p>
                            <p className="text-xs text-gray-500">{campaign.currentDonors || 0}/{campaign.maxDonors || 50}</p>
                            <p className="text-xs text-gray-400">{campaign.hospitalName || 'Hôpital'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Liste des campagnes */}
                  <div className="grid gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-sm">
                      <strong>Debug:</strong> {campaigns.length} campagnes chargées
                      {campaigns.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {campaigns.map(c => (
                            <div key={c.id} className="text-xs">
                              • {c.title} - Statut: {c.status} - Lieu: {c.location?.address || 'Non défini'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {campaigns.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl border">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">Aucune campagne trouvée</p>
                        <p className="text-sm text-gray-400">Vérifiez la console pour les détails de debug</p>
                      </div>
                    ) : (
                      campaigns.map((campaign) => (
                        <motion.div
                          key={campaign.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-white to-red-50 rounded-xl p-6 border border-red-100 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {campaign.title}
                              </h4>
                              <p className="text-gray-600 mb-4">{campaign.description}</p>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin size={16} className="mr-2 text-red-500" />
                                  {campaign.location?.address || 'Lieu à préciser'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar size={16} className="mr-2 text-blue-500" />
                                  {campaign.startDate.toLocaleDateString('fr-FR')} - {campaign.endDate.toLocaleDateString('fr-FR')}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Droplets size={16} className="mr-2 text-purple-500" />
                                  Groupes recherchés: {campaign.targetBloodTypes?.join(', ') || 'Tous groupes'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Users size={16} className="mr-2 text-green-500" />
                                  Organisé par: {campaign.hospitalName || 'Hôpital partenaire'}
                                </div>
                                
                                {/* Informations de contact de l'admin */}
                                {campaign.adminContact && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">📞 Contact</h4>
                                    <div className="space-y-1 text-xs text-blue-800">
                                      <p><strong>Établissement:</strong> {campaign.adminContact.name}</p>
                                      {campaign.adminContact.phone && campaign.adminContact.phone !== 'Non renseigné' && (
                                        <p><strong>Téléphone:</strong> {campaign.adminContact.phone}</p>
                                      )}
                                      {campaign.adminContact.address && campaign.adminContact.address !== 'Non renseignée' && (
                                        <p><strong>Adresse:</strong> {campaign.adminContact.address}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">{campaign.currentDonors || 0}</span> / {campaign.maxDonors || 100} donneurs
                                </div>
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((campaign.currentDonors || 0) / (campaign.maxDonors || 100)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-6">
                              <Button
                                onClick={() => applyForDonation(campaign.id)}
                                variant="primary"
                                size="lg"
                                className="mb-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3"
                              >
                                🩸 Faire un Don
                              </Button>
                              <p className="text-xs text-gray-500 text-center">Test d'éligibilité inclus</p>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {campaign.status === 'active' ? 'En cours' : 'À venir'}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Onglet Rendez-vous */}
              {activeTab === 'appointments' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Mes Rendez-vous de Don</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        {myAppointments.length} rendez-vous
                      </div>
                      <Button
                        onClick={() => {
                          console.log('🔄 Test manuel de chargement des rendez-vous...');
                          fetchMyAppointments();
                        }}
                        variant="outline"
                        size="sm"
                      >
                        🔄 Recharger
                      </Button>
                    </div>
                  </div>

                  {/* Statistiques des rendez-vous */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">📅 Programmés</h4>
                      <p className="text-2xl font-bold text-blue-700">
                        {myAppointments.filter(a => a.status === 'scheduled').length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">✅ Confirmés</h4>
                      <p className="text-2xl font-bold text-green-700">
                        {myAppointments.filter(a => a.status === 'confirmed').length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-2">✓ Terminés</h4>
                      <p className="text-2xl font-bold text-purple-700">
                        {myAppointments.filter(a => a.status === 'completed').length}
                      </p>
                    </div>
                  </div>

                  {/* Liste des rendez-vous */}
                  <div className="space-y-4">
                    {myAppointments.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous programmé</h4>
                        <p className="text-gray-600 mb-4">
                          Vos rendez-vous de don apparaîtront ici une fois qu'ils seront programmés par l'hôpital.
                        </p>
                        <Button 
                          onClick={() => setActiveTab('campaigns')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          🩸 Voir les campagnes disponibles
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Prochains rendez-vous */}
                        {myAppointments.filter(a => 
                          new Date(a.appointmentDate) >= new Date() && 
                          (a.status === 'scheduled' || a.status === 'confirmed')
                        ).length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                              <Calendar className="mr-2" size={20} />
                              Prochains rendez-vous
                            </h4>
                            <div className="space-y-3">
                              {myAppointments
                                .filter(a => 
                                  new Date(a.appointmentDate) >= new Date() && 
                                  (a.status === 'scheduled' || a.status === 'confirmed')
                                )
                                .slice(0, 2)
                                .map((appointment) => (
                                  <div key={appointment.id} className="bg-white p-3 rounded-lg border border-blue-300">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-blue-900">
                                          {appointment.appointmentDate.toLocaleDateString('fr-FR', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          })}
                                        </p>
                                        <p className="text-sm text-blue-700">
                                          🕐 {appointment.appointmentTime} • 📍 {appointment.hospitalName}
                                        </p>
                                      </div>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        appointment.status === 'confirmed' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {appointment.status === 'confirmed' ? '✅ Confirmé' : '📅 Programmé'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Tous les rendez-vous */}
                        {myAppointments.map((appointment) => (
                          <motion.div
                            key={appointment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                                  🩸
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Rendez-vous de don - {appointment.hospitalName}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Programmé le {appointment.createdAt.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appointment.status === 'scheduled' ? '📅 Programmé' :
                                 appointment.status === 'confirmed' ? '✅ Confirmé' :
                                 appointment.status === 'completed' ? '✓ Terminé' :
                                 appointment.status === 'cancelled' ? '❌ Annulé' :
                                 '⚠️ Absent'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">📅 Date et heure</p>
                                  <p className="text-gray-900">
                                    {appointment.appointmentDate.toLocaleDateString('fr-FR', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })} à {appointment.appointmentTime}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Durée estimée: {appointment.duration} minutes
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">🏥 Lieu</p>
                                  <p className="text-gray-900">{appointment.hospitalName}</p>
                                  <p className="text-sm text-gray-600">
                                    {appointment.location?.address || 'Adresse à confirmer'}
                                  </p>
                                  {appointment.location?.room && (
                                    <p className="text-sm text-gray-600">
                                      Salle: {appointment.location.room}
                                      {appointment.location.floor && ` - Étage: ${appointment.location.floor}`}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {appointment.notes && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">📝 Instructions</p>
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                      <p className="text-sm text-yellow-800">{appointment.notes}</p>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">📋 Préparation recommandée</p>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Bien dormir la nuit précédente</li>
                                    <li>• Prendre un repas équilibré</li>
                                    <li>• Boire beaucoup d'eau</li>
                                    <li>• Apporter une pièce d'identité</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                  {new Date(appointment.appointmentDate) > new Date() 
                                    ? `Dans ${Math.ceil((new Date(appointment.appointmentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jour(s)`
                                    : new Date(appointment.appointmentDate).toDateString() === new Date().toDateString()
                                    ? "Aujourd'hui"
                                    : "Passé"
                                  }
                                </div>
                                
                                <div className="flex space-x-2">
                                  {appointment.status === 'scheduled' && new Date(appointment.appointmentDate) > new Date() && (
                                    <Button variant="outline" size="sm">
                                      📞 Contacter l'hôpital
                                    </Button>
                                  )}
                                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && 
                                   new Date(appointment.appointmentDate) > new Date() && (
                                    <Button variant="ghost" size="sm" className="text-red-600">
                                      ❌ Annuler
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Onglet Recherche */}
              {activeTab === 'search' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold">🩸 Rechercher des Poches de Sang</h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Groupe sanguin recherché
                        </label>
                        <select
                          value={searchBloodType}
                          onChange={(e) => setSearchBloodType(e.target.value as BloodType)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {bloodTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recherche par établissement
                        </label>
                        <Input
                          placeholder="Nom de l'établissement..."
                          value={hospitalSearchTerm}
                          onChange={(e) => setHospitalSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Astuce :</strong> Recherchez par groupe sanguin pour voir tous les établissements qui ont ce type en stock,
                        ou utilisez le nom pour trouver un établissement spécifique.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Droplets size={20} className="mr-2 text-red-600" />
                      Établissements avec du sang {searchBloodType} disponible
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {hospitals.filter(admin => 
                          (!hospitalSearchTerm || admin.name.toLowerCase().includes(hospitalSearchTerm.toLowerCase())) &&
                          admin.bloodStock[searchBloodType] > 0
                        ).length} trouvé(s)
                      </span>
                    </h4>
                    
                    <div className="space-y-4">
                      {hospitals
                        .filter(admin => {
                          const matchesName = !hospitalSearchTerm || 
                            admin.name.toLowerCase().includes(hospitalSearchTerm.toLowerCase());
                          const hasBloodType = admin.bloodStock[searchBloodType] > 0;
                          return matchesName && hasBloodType;
                        })
                        .sort((a, b) => {
                          // Trier par stock du groupe sanguin recherché (décroissant)
                          const stockA = a.bloodStock[searchBloodType] || 0;
                          const stockB = b.bloodStock[searchBloodType] || 0;
                          return stockB - stockA;
                        })
                        .map((admin) => (
                          <motion.div 
                            key={admin.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-gradient-to-r from-white to-red-50 rounded-lg border border-red-100 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <h5 className="font-medium text-gray-900 mr-3">{admin.name}</h5>
                                  <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {admin.bloodStock[searchBloodType]} poches {searchBloodType}
                                  </div>
                                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                                    {admin.totalStock} total
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      📍 {admin.address || 'Adresse non renseignée'}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">
                                      📞 {admin.phone || 'Téléphone non renseigné'}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      ✉️ {admin.email}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-800 mb-2">Autres stocks disponibles :</h6>
                                    <div className="grid grid-cols-4 gap-1 text-xs">
                                      {bloodTypes.filter(type => type !== searchBloodType).map(type => {
                                        const count = admin.bloodStock[type] || 0;
                                        return (
                                          <div key={type} className={`text-center px-1 py-1 rounded ${
                                            count > 0
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            <div className="font-medium">{type}</div>
                                            <div>{count}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedHospital(admin.id);
                                  startDonationProcess();
                                }}
                                className="ml-4 bg-red-600 text-white hover:bg-red-700 border-red-600"
                              >
                                🩸 Faire un Don
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      
                      {hospitals.filter(admin => {
                        const matchesName = !hospitalSearchTerm || 
                          admin.name.toLowerCase().includes(hospitalSearchTerm.toLowerCase());
                        const hasBloodType = admin.bloodStock[searchBloodType] > 0;
                        return matchesName && hasBloodType;
                      }).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Droplets className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-lg font-medium mb-2">Aucun établissement trouvé</p>
                          <p className="text-sm mb-4">
                            {hospitalSearchTerm 
                              ? `Aucun établissement ne correspond à "${hospitalSearchTerm}" avec du sang ${searchBloodType}`
                              : `Aucun établissement n'a de stock ${searchBloodType} disponible actuellement`
                            }
                          </p>
                          <div className="space-y-2 text-xs text-gray-400">
                            <p>💡 Suggestions :</p>
                            <p>• Essayez un autre groupe sanguin</p>
                            <p>• Vérifiez l'orthographe du nom</p>
                            <p>• Effacez les filtres pour voir tous les établissements</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {hospitals.some(admin => admin.totalStock > 0) && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center">
                          📊 Résumé des stocks disponibles
                        </h5>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
                          {bloodTypes.map(type => {
                            const totalStock = hospitals.reduce((total, admin) => 
                              total + (admin.bloodStock[type] || 0), 0
                            );
                            return (
                              <div key={type} className={`text-center p-2 rounded ${
                                type === searchBloodType
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : totalStock > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                <div className="font-bold">{type}</div>
                                <div>{totalStock} poches</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Onglet Témoignages */}
              {activeTab === 'testimonials' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Témoignages de la Communauté</h3>
                    <Button onClick={() => setShowTestimonialForm(true)}>
                      <MessageSquare size={20} className="mr-2" />
                      Écrire un témoignage
                    </Button>
                  </div>

                  <div className="grid gap-6">
                    {testimonials.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Pas de témoignages pour le moment</h4>
                        <p className="text-gray-600 mb-4">
                          Soyez le premier à partager votre expérience de don de sang.
                        </p>
                        <Button 
                          onClick={() => setShowTestimonialForm(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          💬 Écrire le premier témoignage
                        </Button>
                      </div>
                    ) : (
                      testimonials.map((testimonial) => (
                      <motion.div
                        key={testimonial.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-6 border shadow-sm"
                      >
                        <div className="flex items-start space-x-4">
                          {testimonial.userPhoto ? (
                            <img 
                              src={testimonial.userPhoto} 
                              alt={testimonial.userName}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {testimonial.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">
                                {testimonial.userName}
                              </h4>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={`${
                                      i < testimonial.rating 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">{testimonial.content}</p>
                            <p className="text-xs text-gray-500">
                              {testimonial.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )))}
                  </div>
                </motion.div>
              )}

              {/* Onglet Mes Dons */}
              {activeTab === 'donations' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Mes Dons de Sang</h3>
                    <Button
                      onClick={() => startDonationProcess()}
                      variant="primary"
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      🩸 Proposer un Don
                    </Button>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-red-900 mb-2">
                          Faire un Don Spontané
                        </h4>
                        <p className="text-red-800 mb-4">
                          Vous pouvez proposer votre don même sans campagne active ! Votre geste peut sauver des vies.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <h5 className="font-medium text-red-900">Processus :</h5>
                            <ul className="text-red-700 space-y-1">
                              <li>• Test d'éligibilité médical</li>
                              <li>• Sélection d'un hôpital</li>
                              <li>• Candidature envoyée</li>
                              <li>• Confirmation par l'hôpital</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-medium text-red-900">Avantages :</h5>
                            <ul className="text-red-700 space-y-1">
                              <li>• Don quand vous êtes disponible</li>
                              <li>• Contribution directe aux stocks</li>
                              <li>• Suivi personnalisé</li>
                              <li>• Impact immédiat</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    Historique de mes Dons
                  </h4>
                  
                  <div className="grid gap-4">
                    {myDonations.map((donation) => (
                      <motion.div
                        key={donation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-xl p-6 border"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {donation.bloodType}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">Don de sang {donation.bloodType}</span>
                                <p className="text-sm text-gray-500">
                                  Score d'éligibilité: {donation.eligibilityTest?.score || 'N/A'}/100
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Type:</span> {donation.donationType === 'direct' ? 'Don spontané' : 'Don de campagne'}
                              </p>
                              <p>
                                <span className="font-medium">Demande envoyée:</span> {donation.createdAt.toLocaleDateString()}
                              </p>
                              {donation.scheduledDate && (
                                <p>
                                  <span className="font-medium">Don programmé:</span> {donation.scheduledDate.toLocaleDateString()}
                                </p>
                              )}
                              {donation.notes && (
                                <p>
                                  <span className="font-medium">Notes:</span> {donation.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                              donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              donation.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {donation.status === 'completed' ? 'Don effectué' :
                               donation.status === 'approved' ? 'Programmé' :
                               donation.status === 'pending' ? 'En attente' : 'Rejeté'}
                            </div>
                            
                            {donation.status === 'approved' && donation.scheduledDate && (
                              <div className="text-xs text-blue-600 font-medium">
                                <Calendar size={12} className="inline mr-1" />
                                {donation.scheduledDate.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Détails du test d'éligibilité */}
                        {donation.eligibilityTest && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500">Âge:</span>
                                <span className="ml-1 font-medium">{donation.eligibilityTest.age} ans</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Poids:</span>
                                <span className="ml-1 font-medium">{donation.eligibilityTest.weight} kg</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Éligible:</span>
                                <span className={`ml-1 font-medium ${donation.eligibilityTest.eligible ? 'text-green-600' : 'text-red-600'}`}>
                                  {donation.eligibilityTest.eligible ? 'Oui' : 'Non'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Score:</span>
                                <span className="ml-1 font-medium">{donation.eligibilityTest.score}/100</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  
                  {myDonations.length === 0 && (
                    <div className="text-center py-12">
                      <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">Vous n'avez pas encore fait de don</p>
                      <Button 
                        onClick={() => setActiveTab('campaigns')}
                        variant="primary"
                      >
                        Voir les campagnes
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Onglet Récompenses */}
              {activeTab === 'rewards' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold">Mes Récompenses</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                        <div className="text-center">
                          <Gift className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                          <h4 className="font-semibold text-gray-900 mb-2">Badge Donneur #{i}</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Récompense pour {i * 3} dons de sang
                          </p>
                          <Button variant="outline" size="sm">
                            Récupérer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Modal témoignage */}
        {showTestimonialForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Partager votre expérience
              </h3>
              
              <form onSubmit={submitTestimonial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTestimonialRating(star)}
                        className="p-1"
                      >
                        <Star
                          size={24}
                          className={`${
                            star <= testimonialRating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre témoignage
                  </label>
                  <textarea
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg h-32 resize-none"
                    placeholder="Partagez votre expérience du don de sang..."
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowTestimonialForm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Publier
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Test d'Éligibilité Progressif */}
        {showEligibilityTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Test d'Éligibilité
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((eligibilityStep + 1) / 6) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Question {eligibilityStep + 1} sur 6
                </p>
              </div>

              <motion.div
                key={eligibilityStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                {eligibilityStep === 0 && (
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Quel est votre âge ?
                    </h4>
                    <div className="flex justify-center mb-4">
                      <input
                        type="number"
                        min="16"
                        max="70"
                        value={eligibilityData.age}
                        onChange={(e) => setEligibilityData({...eligibilityData, age: parseInt(e.target.value) || 18})}
                        className="w-32 px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-medium"
                        placeholder="18"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      L'âge requis est entre 18 et 65 ans
                    </p>
                  </div>
                )}

                {eligibilityStep === 1 && (
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Quel est votre poids ?
                    </h4>
                    <div className="flex justify-center items-center mb-4">
                      <input
                        type="number"
                        min="40"
                        max="150"
                        value={eligibilityData.weight}
                        onChange={(e) => setEligibilityData({...eligibilityData, weight: parseInt(e.target.value) || 50})}
                        className="w-32 px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-medium"
                        placeholder="50"
                      />
                      <span className="ml-2 text-gray-600 font-medium">kg</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Le poids minimum requis est de 50 kg
                    </p>
                  </div>
                )}

                {eligibilityStep === 2 && (
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Quand avez-vous fait votre dernier don ?
                    </h4>
                    <div className="mb-4">
                      <input
                        type="date"
                        value={eligibilityData.lastDonation}
                        onChange={(e) => setEligibilityData({...eligibilityData, lastDonation: e.target.value})}
                        className="px-4 py-3 border border-gray-300 rounded-lg text-center"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Laissez vide si c'est votre premier don
                    </p>
                  </div>
                )}

                {eligibilityStep === 3 && (
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-6">
                      Souffrez-vous actuellement d'une maladie ou infection ?
                    </h4>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setEligibilityData({...eligibilityData, hasIllness: false})}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          !eligibilityData.hasIllness
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Non
                      </button>
                      <button
                        onClick={() => setEligibilityData({...eligibilityData, hasIllness: true})}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          eligibilityData.hasIllness
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Oui
                      </button>
                    </div>
                  </div>
                )}

                {eligibilityStep === 4 && (
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-6">
                      Prenez-vous actuellement des médicaments ?
                    </h4>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setEligibilityData({...eligibilityData, takesMedication: false})}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          !eligibilityData.takesMedication
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Non
                      </button>
                      <button
                        onClick={() => setEligibilityData({...eligibilityData, takesMedication: true})}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          eligibilityData.takesMedication
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Oui
                      </button>
                    </div>
                  </div>
                )}

                {eligibilityStep === 5 && (
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-6">
                      Avez-vous voyagé dans une zone à risque ces 6 derniers mois ?
                    </h4>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setEligibilityData({...eligibilityData, hasTraveled: false})}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          !eligibilityData.hasTraveled
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Non
                      </button>
                      <button
                        onClick={() => setEligibilityData({...eligibilityData, hasTraveled: true})}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          eligibilityData.hasTraveled
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Oui
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
              
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (eligibilityStep > 0) {
                      setEligibilityStep(eligibilityStep - 1);
                    } else {
                      setShowEligibilityTest(false);
                      setEligibilityStep(0);
                    }
                  }}
                  className="flex-1"
                >
                  {eligibilityStep > 0 ? 'Précédent' : 'Annuler'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (eligibilityStep < 5) {
                      setEligibilityStep(eligibilityStep + 1);
                    } else {
                      submitEligibilityTest();
                    }
                  }}
                  className="flex-1"
                >
                  {eligibilityStep < 5 ? 'Suivant' : 'Vérifier l\'éligibilité'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Sélection Hôpital */}
        {showHospitalSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Sélectionner un établissement de santé
              </h3>
              
              <HospitalSelector
                onHospitalSelect={(hospital) => setSelectedHospital(hospital)}
                selectedHospital={selectedHospital}
                bloodType={hospitalSearchType}
                className="mb-6"
              />
              
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowHospitalSelection(false);
                    setSelectedHospital(null);
                  }}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  variant="primary"
                  onClick={submitDonationRequest}
                  disabled={!selectedHospital}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  📨 Envoyer la candidature
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bouton flottant Assistant IA */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <Bot size={24} className="group-hover:animate-pulse" />
          <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Assistant IA
          </div>
        </motion.button>

        {/* Chatbot */}
        {showChatbot && (
          <Chatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
