const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLpLQIqKcWgUVYDttXit1x5nRrcFB1RmM",
  authDomain: "hemoconnect-ec751.firebaseapp.com",
  projectId: "hemoconnect-ec751",
  storageBucket: "hemoconnect-ec751.firebasestorage.app",
  messagingSenderId: "324649213432",
  appId: "1:324649213432:web:77683bec35f3fe9b4a8a0d"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hôpitaux du Cameroun
const hospitals = [
  {
    name: "Hôpital Central de Yaoundé",
    address: "Avenue Henri Dunant, Yaoundé, Cameroun",
    phone: "+237 222 23 40 20",
    email: "contact@hcy.cm",
    latitude: 3.8667,
    longitude: 11.5167,
    adminIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Hôpital Général de Douala",
    address: "Boulevard de la Liberté, Douala, Cameroun", 
    phone: "+237 233 42 25 01",
    email: "info@hgd.cm",
    latitude: 4.0511,
    longitude: 9.7679,
    adminIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Centre Hospitalier d'Essos",
    address: "Quartier Essos, Yaoundé, Cameroun",
    phone: "+237 222 20 15 30", 
    email: "essos@hospital.cm",
    latitude: 3.8580,
    longitude: 11.5021,
    adminIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Hôpital de District de Biyem-Assi",
    address: "Biyem-Assi, Yaoundé, Cameroun",
    phone: "+237 222 31 45 67",
    email: "biyemassi@health.gov.cm",
    latitude: 3.8419,
    longitude: 11.4731,
    adminIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Centre Médical de la Cité Verte",
    address: "Cité Verte, Yaoundé, Cameroun",
    phone: "+237 222 20 89 45",
    email: "citeverte@medical.cm",
    latitude: 3.8789,
    longitude: 11.5189,
    adminIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Hôpital de Référence de Garoua", 
    address: "Avenue Ahmadou Ahidjo, Garoua, Cameroun",
    phone: "+237 222 27 10 33",
    email: "garoua@hospital.cm",
    latitude: 9.3265,
    longitude: 13.3911,
    adminIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedHospitals() {
  console.log('🏥 Ajout des hôpitaux camerounais...');
  
  try {
    for (const hospital of hospitals) {
      const docRef = await addDoc(collection(db, 'hospitals'), hospital);
      console.log(`✅ ${hospital.name} ajouté avec ID: ${docRef.id}`);
    }
    
    console.log(`🎉 ${hospitals.length} hôpitaux ajoutés avec succès !`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des hôpitaux:', error);
    process.exit(1);
  }
}

seedHospitals();
