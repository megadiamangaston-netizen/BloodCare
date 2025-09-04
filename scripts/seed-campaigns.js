// Script pour ajouter des campagnes de test dans Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Configuration Firebase (à adapter selon votre .env.local)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const campaigns = [
  {
    title: "Campagne Université de Yaoundé I",
    description: "Grande collecte de sang organisée sur le campus principal pour les étudiants et le personnel.",
    location: {
      address: "Université de Yaoundé I, Campus principal, Yaoundé",
      latitude: 3.8667,
      longitude: 11.5167,
      city: "Yaoundé"
    },
    startDate: new Date('2024-12-15T09:00:00'),
    endDate: new Date('2024-12-15T17:00:00'),
    status: "active",
    targetBloodTypes: ["O+", "O-", "A+", "B+"],
    maxDonors: 200,
    currentDonors: 45,
    hospitalId: "hospital_1",
    organizerId: "admin_1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Don Solidaire de Noël",
    description: "Collecte spéciale de fin d'année pour reconstituer les stocks pendant les fêtes.",
    location: {
      address: "Centre Commercial Bastos, Yaoundé",
      latitude: 3.8848,
      longitude: 11.5021,
      city: "Yaoundé"
    },
    startDate: new Date('2024-12-20T10:00:00'),
    endDate: new Date('2024-12-22T18:00:00'),
    status: "upcoming",
    targetBloodTypes: ["O-", "AB+", "A-", "B-"],
    maxDonors: 150,
    currentDonors: 12,
    hospitalId: "hospital_2",
    organizerId: "admin_2",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Collecte Entreprises Douala",
    description: "Journée dédiée aux entreprises de la zone industrielle de Douala.",
    location: {
      address: "Zone Industrielle de Douala, Bonabéri",
      latitude: 4.0511,
      longitude: 9.7679,
      city: "Douala"
    },
    startDate: new Date('2025-01-02T10:00:00'),
    endDate: new Date('2025-01-02T16:00:00'),
    status: "upcoming",
    targetBloodTypes: ["O+", "A+", "B+", "AB+"],
    maxDonors: 120,
    currentDonors: 8,
    hospitalId: "hospital_3",
    organizerId: "admin_3",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Campagne Hôpital Central",
    description: "Collecte urgente pour reconstituer les stocks de l'hôpital central.",
    location: {
      address: "Hôpital Central de Yaoundé, Quartier administratif",
      latitude: 3.8600,
      longitude: 11.5200,
      city: "Yaoundé"
    },
    startDate: new Date('2024-12-10T08:00:00'),
    endDate: new Date('2024-12-12T16:00:00'),
    status: "active",
    targetBloodTypes: ["O-", "A-", "B-", "AB-"],
    maxDonors: 80,
    currentDonors: 65,
    hospitalId: "hospital_central",
    organizerId: "admin_central",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Collecte Bafoussam Ouest",
    description: "Première campagne de l'année dans la région de l'Ouest.",
    location: {
      address: "Hôpital de District de Bafoussam, Centre-ville",
      latitude: 5.4781,
      longitude: 10.4174,
      city: "Bafoussam"
    },
    startDate: new Date('2025-01-15T09:00:00'),
    endDate: new Date('2025-01-15T15:00:00'),
    status: "upcoming",
    targetBloodTypes: ["O+", "O-", "A+", "A-"],
    maxDonors: 60,
    currentDonors: 3,
    hospitalId: "hospital_bafoussam",
    organizerId: "admin_ouest",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedCampaigns() {
  try {
    console.log('Ajout des campagnes de test...');
    
    for (const campaign of campaigns) {
      const docRef = await addDoc(collection(db, 'campaigns'), campaign);
      console.log(`Campagne ajoutée avec l'ID: ${docRef.id} - ${campaign.title}`);
    }
    
    console.log('✅ Toutes les campagnes ont été ajoutées avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des campagnes:', error);
  }
}

// Exécuter le script
seedCampaigns().then(() => {
  console.log('Script terminé');
  process.exit(0);
});
