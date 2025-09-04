import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { BloodBag, Campaign, DonationRequest, BloodType } from '@/types';

export interface StatsData {
  totalBags: number;
  availableBags: number;
  expiredBags: number;
  stockByType: Record<BloodType, number>;
  criticalTypes: BloodType[];
  activeCampaigns: number;
  pendingDonations: number;
  completedDonations: number;
  monthlyDonations: { month: string; count: number }[];
}

export const calculateStats = (
  bloodBags: BloodBag[],
  campaigns: Campaign[],
  donations: DonationRequest[]
): StatsData => {
  const now = new Date();
  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  // Statistiques des poches de sang
  const availableBags = bloodBags.filter(bag => bag.status === 'available').length;
  const expiredBags = bloodBags.filter(bag => new Date(bag.expiryDate) < now).length;
  
  // Stock par type sanguin
  const stockByType: Record<BloodType, number> = {} as Record<BloodType, number>;
  bloodTypes.forEach(type => {
    stockByType[type] = bloodBags.filter(
      bag => bag.bloodType === type && bag.status === 'available'
    ).length;
  });
  
  // Types critiques (moins de 5 poches)
  const criticalTypes = bloodTypes.filter(type => stockByType[type] < 5);
  
  // Statistiques des campagnes
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  
  // Statistiques des dons
  const pendingDonations = donations.filter(d => d.status === 'pending').length;
  const completedDonations = donations.filter(d => d.status === 'completed').length;
  
  // Dons par mois (6 derniers mois)
  const monthlyDonations = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const count = donations.filter(d => 
      d.createdAt >= monthStart && 
      d.createdAt <= monthEnd &&
      d.status === 'completed'
    ).length;
    
    monthlyDonations.push({
      month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      count
    });
  }

  return {
    totalBags: bloodBags.length,
    availableBags,
    expiredBags,
    stockByType,
    criticalTypes,
    activeCampaigns,
    pendingDonations,
    completedDonations,
    monthlyDonations
  };
};

export const exportToPDF = (stats: StatsData, hospitalName: string) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(220, 38, 38); // Rouge
  pdf.text('BloodCare - Rapport Statistiques', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(hospitalName, pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });
  
  // Ligne de séparation
  pdf.setDrawColor(220, 38, 38);
  pdf.line(20, 45, pageWidth - 20, 45);
  
  let yPosition = 60;
  
  // Statistiques générales
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Statistiques Générales', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(12);
  const generalStats = [
    `Total des poches: ${stats.totalBags}`,
    `Poches disponibles: ${stats.availableBags}`,
    `Poches expirées: ${stats.expiredBags}`,
    `Campagnes actives: ${stats.activeCampaigns}`,
    `Dons en attente: ${stats.pendingDonations}`,
    `Dons terminés: ${stats.completedDonations}`
  ];
  
  generalStats.forEach(stat => {
    pdf.text(stat, 25, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Stock par type sanguin
  pdf.setFontSize(16);
  pdf.text('Stock par Type Sanguin', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(12);
  Object.entries(stats.stockByType).forEach(([type, count]) => {
    const isCritical = stats.criticalTypes.includes(type as BloodType);
    if (isCritical) {
      pdf.setTextColor(220, 38, 38); // Rouge pour critique
    } else {
      pdf.setTextColor(0, 0, 0);
    }
    pdf.text(`${type}: ${count} poches ${isCritical ? '(CRITIQUE)' : ''}`, 25, yPosition);
    yPosition += 8;
  });
  
  // Évolution mensuelle
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.text('Évolution des Dons (6 derniers mois)', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(12);
  stats.monthlyDonations.forEach(month => {
    pdf.text(`${month.month}: ${month.count} dons`, 25, yPosition);
    yPosition += 8;
  });
  
  // Sauvegarde
  pdf.save(`rapport-bloodcare-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (
  bloodBags: BloodBag[],
  campaigns: Campaign[],
  donations: DonationRequest[],
  hospitalName: string
) => {
  const workbook = XLSX.utils.book_new();
  
  // Feuille Stock de Sang
  const stockData = bloodBags.map(bag => ({
    'ID': bag.id,
    'Type Sanguin': bag.bloodType,
    'Volume (ml)': bag.volume,
    'Date Collecte': bag.collectionDate.toLocaleDateString('fr-FR'),
    'Date Expiration': bag.expiryDate.toLocaleDateString('fr-FR'),
    'Statut': bag.status,
    'Créé le': bag.createdAt.toLocaleDateString('fr-FR')
  }));
  
  const stockSheet = XLSX.utils.json_to_sheet(stockData);
  XLSX.utils.book_append_sheet(workbook, stockSheet, 'Stock de Sang');
  
  // Feuille Campagnes
  const campaignData = campaigns.map(campaign => ({
    'ID': campaign.id,
    'Titre': campaign.title,
    'Description': campaign.description,
    'Adresse': campaign.location.address,
    'Types Ciblés': campaign.targetBloodTypes.join(', '),
    'Date Début': campaign.startDate.toLocaleDateString('fr-FR'),
    'Date Fin': campaign.endDate.toLocaleDateString('fr-FR'),
    'Statut': campaign.status,
    'Donneurs': `${campaign.currentDonors}/${campaign.maxDonors}`,
    'Créé le': campaign.createdAt.toLocaleDateString('fr-FR')
  }));
  
  const campaignSheet = XLSX.utils.json_to_sheet(campaignData);
  XLSX.utils.book_append_sheet(workbook, campaignSheet, 'Campagnes');
  
  // Feuille Dons
  const donationData = donations.map(donation => ({
    'ID': donation.id,
    'Utilisateur': donation.userId,
    'Type Sanguin': donation.bloodType,
    'Statut': donation.status,
    'Date Demande': donation.createdAt.toLocaleDateString('fr-FR'),
    'Âge': donation.eligibilityTest?.age || '',
    'Poids': donation.eligibilityTest?.weight || '',
    'Score Éligibilité': donation.eligibilityTest?.score || '',
    'Éligible': donation.eligibilityTest?.eligible ? 'Oui' : 'Non'
  }));
  
  const donationSheet = XLSX.utils.json_to_sheet(donationData);
  XLSX.utils.book_append_sheet(workbook, donationSheet, 'Demandes de Don');
  
  // Sauvegarde
  XLSX.writeFile(workbook, `rapport-bloodcare-${hospitalName}-${new Date().toISOString().split('T')[0]}.xlsx`);
};
