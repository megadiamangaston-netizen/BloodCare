'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Droplets } from 'lucide-react';
import { Campaign } from '@/types';
import Button from '@/components/ui/Button';

interface MapProps {
  campaigns: Campaign[];
  onCampaignSelect?: (campaign: Campaign) => void;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectMode?: boolean;
}

export default function Map({ campaigns, onCampaignSelect, onLocationSelect, selectMode = false }: MapProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Simulation d'une carte interactive (remplacez par react-leaflet en production)
  const MapContainer = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl overflow-hidden">
      {/* Carte simulée */}
      <div className="absolute inset-0 bg-gray-200 opacity-50">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Lignes de grille pour simuler une carte */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Formes géographiques simulées */}
          <path d="M50,50 Q150,20 250,80 Q350,60 380,120 L380,250 Q300,280 200,260 Q100,270 20,240 Z" 
                fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
          <path d="M80,100 Q180,80 280,120 Q320,140 350,180 L330,220 Q250,240 150,220 Q80,210 60,170 Z" 
                fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1"/>
        </svg>
      </div>

      {/* Marqueurs des campagnes */}
      {campaigns.map((campaign, index) => (
        <motion.div
          key={campaign.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="absolute cursor-pointer"
          style={{
            left: `${20 + (index * 15) % 60}%`,
            top: `${30 + (index * 20) % 40}%`,
          }}
          onClick={() => {
            setSelectedCampaign(campaign);
            onCampaignSelect?.(campaign);
          }}
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
              campaign.status === 'active' 
                ? 'bg-red-600 ring-4 ring-red-200' 
                : 'bg-blue-600 ring-4 ring-blue-200'
            }`}
          >
            <MapPin className="text-white" size={16} />
          </motion.div>
          
          {/* Pulse animation pour les campagnes actives */}
          {campaign.status === 'active' && (
            <div className="absolute inset-0 w-8 h-8 bg-red-600 rounded-full animate-ping opacity-75" />
          )}
        </motion.div>
      ))}

      {/* Mode sélection de lieu */}
      {selectMode && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg p-4 shadow-lg border"
          >
            <p className="text-sm text-gray-600 mb-3">Cliquez sur la carte pour sélectionner l'emplacement</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLocationSelect?.(48.8566, 2.3522, 'Paris, France')}
            >
              Utiliser cette position
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <MapContainer />
      
      {/* Informations de la campagne sélectionnée */}
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedCampaign.title}
              </h3>
              <p className="text-gray-600 mb-4">{selectedCampaign.description}</p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2 text-red-500" />
                  {selectedCampaign.location.address}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2 text-blue-500" />
                  {selectedCampaign.startDate.toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2 text-green-500" />
                  {selectedCampaign.currentDonors}/{selectedCampaign.maxDonors} donneurs
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Droplets size={16} className="mr-2 text-purple-500" />
                  {selectedCampaign.targetBloodTypes.join(', ')}
                </div>
              </div>
            </div>
            
            <div className="ml-6">
              <Button variant="primary">
                Participer
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Légende de la carte */}
      <div className="bg-white rounded-xl p-4 border">
        <h4 className="font-medium text-gray-900 mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Campagne active</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Campagne à venir</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Campagne terminée</span>
          </div>
        </div>
      </div>
    </div>
  );
}
