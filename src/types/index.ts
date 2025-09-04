export type UserRole = 'super_admin' | 'admin' | 'user';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type StockLevel = 'critical' | 'normal' | 'excellent';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  hospitalId?: string; // Pour les admins classiques
  createdAt: Date;
  updatedAt: Date;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  adminIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BloodBag {
  id: string;
  bloodType: BloodType;
  donorId?: string;
  hospitalId: string;
  collectionDate: Date;
  expiryDate: Date;
  volume: number; // en ml
  status: 'available' | 'reserved' | 'used' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  hospitalId: string;
  hospitalName: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  targetBloodTypes: BloodType[];
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  maxDonors: number;
  currentDonors: number;
  adminContact?: {
    name: string;
    phone?: string;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  hospitalId: string;
  hospitalName?: string;
  campaignId?: string;
  bloodType: BloodType;
  eligibilityTest?: EligibilityTest;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  scheduledDate?: Date;
  notes?: string;
  donationType?: 'campaign' | 'direct';
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  donationRequestId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  hospitalId: string;
  hospitalName?: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number; // en minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  reminderSent?: boolean;
  location?: {
    address: string;
    room?: string;
    floor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EligibilityTest {
  age: number;
  weight: number;
  lastDonation?: Date;
  hasIllness: boolean;
  takesMedication: boolean;
  hasTraveled: boolean;
  score: number;
  eligible: boolean;
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  rating: number;
  approved: boolean;
  createdAt: Date;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  imageUrl?: string;
  hospitalId: string;
  category: 'badge' | 'discount' | 'gift';
  createdAt: Date;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  earnedAt: Date;
  claimed: boolean;
}
