'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, Mail, Users, Droplets } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Hospital, BloodType } from '@/types';
import Button from './Button';
import Input from './Input';

interface HospitalSelectorProps {
  onHospitalSelect: (hospital: Hospital) => void;
  selectedHospital?: Hospital | null;
  bloodType?: BloodType;
  className?: string;
}

interface HospitalWithStock extends Hospital {
  bloodStock: Record<BloodType, number>;
  totalStock: number;
}

export default function HospitalSelector({ 
  onHospitalSelect, 
  selectedHospital, 
  bloodType,
  className = '' 
}: HospitalSelectorProps) {
  const [hospitals, setHospitals] = useState<HospitalWithStock[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<HospitalWithStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterByBloodType, setFilterByBloodType] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [hospitals, searchTerm, filterByBloodType, bloodType]);

  const fetchHospitals = async () => {
    try {
      // Récupérer les hôpitaux
      const hospitalsSnapshot = await getDocs(collection(db, 'hospitals'));
      const hospitalsData = hospitalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hospital[];

      // Récupérer les admins pour obtenir les stocks
      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      const adminsData = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Associer les stocks aux hôpitaux
      const hospitalsWithStock: HospitalWithStock[] = hospitalsData.map(hospital => {
        const admin: any = adminsData.find((admin: any) => admin.hospitalId === hospital.id);
        const bloodStock: Record<BloodType, number> = (admin && admin.bloodStock) ? admin.bloodStock : {
          'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 
          'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
        };
        const totalStock: number = Object.values(bloodStock).reduce((sum: number, count: number) => sum + (count || 0), 0);

        return {
          ...hospital,
          bloodStock,
          totalStock
        };
      });

      setHospitals(hospitalsWithStock);
    } catch (error) {
      console.error('Erreur lors de la récupération des hôpitaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    let filtered = hospitals;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par groupe sanguin si activé
    if (filterByBloodType && bloodType) {
      filtered = filtered.filter(hospital => 
        hospital.bloodStock[bloodType] && hospital.bloodStock[bloodType] > 0
      );
    }

    // Trier par stock total décroissant
    filtered.sort((a, b) => b.totalStock - a.totalStock);

    setFilteredHospitals(filtered);
  };

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-600">Chargement des établissements...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Rechercher un établissement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          {bloodType && (
            <Button
              variant={filterByBloodType ? "primary" : "outline"}
              onClick={() => setFilterByBloodType(!filterByBloodType)}
              className="whitespace-nowrap"
            >
              <Droplets size={16} className="mr-2" />
              Stock {bloodType} disponible
            </Button>
          )}
        </div>

        {/* Liste des hôpitaux */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Aucun établissement trouvé</p>
              <p className="text-sm">
                {searchTerm 
                  ? `Aucun établissement ne correspond à "${searchTerm}"`
                  : filterByBloodType 
                  ? `Aucun établissement n'a de stock ${bloodType} disponible`
                  : 'Aucun établissement disponible'
                }
              </p>
            </div>
          ) : (
            filteredHospitals.map((hospital) => (
              <motion.div
                key={hospital.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedHospital?.id === hospital.id
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 hover:border-red-300 hover:shadow-sm'
                }`}
                onClick={() => onHospitalSelect(hospital)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-semibold text-gray-900 mr-3">{hospital.name}</h4>
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {hospital.totalStock} poches total
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPin size={14} className="mr-1" />
                          {hospital.address}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Phone size={14} className="mr-1" />
                          {hospital.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-1" />
                          {hospital.email}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-800 mb-2">🩸 Stocks disponibles :</h5>
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {bloodTypes.map(type => {
                            const count = hospital.bloodStock[type] || 0;
                            return (
                              <div key={type} className={`text-center px-1 py-1 rounded ${
                                type === bloodType && count > 0
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : count > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                <div className="font-medium">{type}</div>
                                <div>{count}</div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {bloodType && hospital.bloodStock[bloodType] > 0 && (
                          <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                            ✅ {hospital.bloodStock[bloodType]} poches {bloodType} disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border-2 ml-4 mt-1 ${
                    selectedHospital?.id === hospital.id
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'
                  }`} />
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Information */}
        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p>💡 <strong>Conseil :</strong> Sélectionnez l'établissement le plus proche de chez vous ou celui ayant le plus de stock de votre groupe sanguin.</p>
        </div>
      </div>
    </div>
  );
}
