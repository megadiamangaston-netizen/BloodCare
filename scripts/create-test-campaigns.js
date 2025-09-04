// Script simple pour créer des campagnes de test via l'admin
const campaigns = [
  {
    title: "Campagne Université de Yaoundé I",
    description: "Grande collecte de sang organisée sur le campus principal pour les étudiants et le personnel.",
    location: {
      address: "Université de Yaoundé I, Campus principal, Yaoundé",
      latitude: 3.8667,
      longitude: 11.5167
    },
    startDate: "2024-12-15T09:00:00",
    endDate: "2024-12-15T17:00:00",
    status: "active",
    targetBloodTypes: ["O+", "O-", "A+", "B+"],
    maxDonors: 200,
    currentDonors: 45,
    hospitalId: "hospital_1",
    organizerId: "admin_1"
  },
  {
    title: "Don Solidaire de Noël",
    description: "Collecte spéciale de fin d'année pour reconstituer les stocks pendant les fêtes.",
    location: {
      address: "Centre Commercial Bastos, Yaoundé",
      latitude: 3.8848,
      longitude: 11.5021
    },
    startDate: "2024-12-20T10:00:00",
    endDate: "2024-12-22T18:00:00",
    status: "upcoming",
    targetBloodTypes: ["O-", "AB+", "A-", "B-"],
    maxDonors: 150,
    currentDonors: 12,
    hospitalId: "hospital_2",
    organizerId: "admin_2"
  },
  {
    title: "Collecte Entreprises Douala",
    description: "Journée dédiée aux entreprises de la zone industrielle de Douala.",
    location: {
      address: "Zone Industrielle de Douala, Bonabéri",
      latitude: 4.0511,
      longitude: 9.7679
    },
    startDate: "2025-01-02T10:00:00",
    endDate: "2025-01-02T16:00:00",
    status: "upcoming",
    targetBloodTypes: ["O+", "A+", "B+", "AB+"],
    maxDonors: 120,
    currentDonors: 8,
    hospitalId: "hospital_3",
    organizerId: "admin_3"
  },
  {
    title: "Campagne Hôpital Central",
    description: "Collecte urgente pour reconstituer les stocks de l'hôpital central.",
    location: {
      address: "Hôpital Central de Yaoundé, Quartier administratif",
      latitude: 3.8600,
      longitude: 11.5200
    },
    startDate: "2024-12-10T08:00:00",
    endDate: "2024-12-12T16:00:00",
    status: "active",
    targetBloodTypes: ["O-", "A-", "B-", "AB-"],
    maxDonors: 80,
    currentDonors: 65,
    hospitalId: "hospital_central",
    organizerId: "admin_central"
  }
];

console.log('Campagnes de test à créer:');
console.log(JSON.stringify(campaigns, null, 2));
console.log('\nPour ajouter ces campagnes:');
console.log('1. Connectez-vous en tant qu\'admin sur /admin');
console.log('2. Allez dans l\'onglet "Campagnes"');
console.log('3. Utilisez le bouton "Nouvelle Campagne" pour ajouter chaque campagne');
console.log('4. Copiez les informations depuis ce fichier');

module.exports = { campaigns };
