'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Target, Loader } from 'lucide-react';
import Button from './Button';
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader';

interface Campaign {
  id: string;
  title: string;
  description: string;
  hospitalName: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: string;
  targetBloodTypes: string[];
}

interface MapSelectorProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  campaigns?: Campaign[];
  showCampaigns?: boolean;
  className?: string;
}

export default function MapSelector({ latitude, longitude, onLocationSelect, campaigns = [], showCampaigns = false, className = '' }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [campaignMarkers, setCampaignMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const initialPosition = latitude && longitude 
          ? { lat: latitude, lng: longitude }
          : { lat: 3.8667, lng: 11.5167 }; // Yaoundé par défaut

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: initialPosition,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          scaleControl: true,
        });

        // Créer le marqueur principal (seulement si pas en mode campagnes)
        let markerInstance = null;
        if (!showCampaigns) {
          markerInstance = new window.google.maps.Marker({
            position: initialPosition,
            map: mapInstance,
            draggable: true,
            title: 'Position de la campagne'
          });

          // Événement de glisser-déposer du marqueur
          markerInstance.addListener('dragend', () => {
            const position = markerInstance.getPosition();
            if (position) {
              onLocationSelect(position.lat(), position.lng());
            }
          });
        }

        // Événement de clic sur la carte (seulement si pas en mode campagnes)
        if (!showCampaigns) {
          mapInstance.addListener('click', (event: any) => {
            if (event.latLng) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              markerInstance.setPosition({ lat, lng });
              onLocationSelect(lat, lng);
            }
          });
        }

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsLoading(false);

        // Créer les marqueurs des campagnes si nécessaire
        if (showCampaigns && campaigns.length > 0) {
          createCampaignMarkers(mapInstance, campaigns);
        }
      } catch (error) {
        console.error('Erreur initialisation carte:', error);
        setError(`Erreur d'initialisation de la carte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        setIsLoading(false);
      }
    };

    // Utiliser le gestionnaire centralisé
    loadGoogleMapsAPI()
      .then(() => {
        initMap();
      })
      .catch((error) => {
        console.error('Erreur chargement Google Maps:', error);
        setError(error.message || 'Erreur lors du chargement de Google Maps');
        setIsLoading(false);
      });
  }, []);

  // Fonction pour créer les marqueurs des campagnes
  const createCampaignMarkers = (mapInstance: any, campaignsData: Campaign[]) => {
    // Nettoyer les anciens marqueurs
    campaignMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers: any[] = [];
    
    campaignsData.forEach((campaign, index) => {
      if (!campaign.location?.latitude || !campaign.location?.longitude) {
        console.warn(`Campagne ${campaign.id} sans coordonnées valides`);
        return;
      }

      const position = {
        lat: campaign.location.latitude,
        lng: campaign.location.longitude
      };

      // Couleur selon le statut
      let pinColor = '#FF6B6B'; // Rouge par défaut
      if (campaign.status === 'active') pinColor = '#4ECB71'; // Vert
      else if (campaign.status === 'upcoming') pinColor = '#45B7D1'; // Bleu
      else if (campaign.status === 'completed') pinColor = '#96A3B4'; // Gris

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstance,
        title: campaign.title,
        icon: {
          path: 'M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7Z',
          fillColor: pinColor,
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 2.2,
          anchor: { x: 12, y: 22 }
        }
      });

      // InfoWindow pour les détails de la campagne
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-sm">
            <h3 class="font-bold text-lg text-gray-800 mb-2">${campaign.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${campaign.description}</p>
            <div class="space-y-1 text-sm">
              <p><strong>🏥 Hôpital:</strong> ${campaign.hospitalName}</p>
              <p><strong>📍 Adresse:</strong> ${campaign.location.address}</p>
              <p><strong>🩸 Groupes recherchés:</strong> ${campaign.targetBloodTypes.join(', ')}</p>
              <p><strong>📊 Statut:</strong> <span class="px-2 py-1 rounded text-xs font-medium 
                ${campaign.status === 'active' ? 'bg-green-100 text-green-800' : 
                  campaign.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'}">
                ${campaign.status === 'active' ? '🟢 Active' : 
                  campaign.status === 'upcoming' ? '🔵 À venir' : 
                  '⚫ Terminée'}
              </span></p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Fermer toutes les autres InfoWindows
        newMarkers.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(mapInstance, marker);
      });

      marker.infoWindow = infoWindow;
      newMarkers.push(marker);
    });
    
    setCampaignMarkers(newMarkers);
    console.log(`✅ ${newMarkers.length} marqueurs de campagnes créés`);
    
    // Auto-ajuster la vue pour inclure tous les marqueurs
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Ajouter chaque position de marqueur aux bounds
      campaignsData.forEach(campaign => {
        if (campaign.location?.latitude && campaign.location?.longitude) {
          bounds.extend({
            lat: campaign.location.latitude,
            lng: campaign.location.longitude
          });
        }
      });
      
      // Ajuster la carte pour montrer tous les marqueurs
      mapInstance.fitBounds(bounds);
      
      // Éviter un zoom trop proche si une seule campagne
      if (newMarkers.length === 1) {
        mapInstance.setZoom(Math.min(mapInstance.getZoom(), 14));
      }
      
      console.log('📍 Vue ajustée pour inclure toutes les campagnes');
    }
  };

  // Effet pour mettre à jour les marqueurs des campagnes
  useEffect(() => {
    if (map && showCampaigns && campaigns.length > 0) {
      createCampaignMarkers(map, campaigns);
    }
  }, [campaigns, map, showCampaigns]);

  // Mettre à jour la position du marqueur quand les props changent
  useEffect(() => {
    if (map && marker && latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };
      marker.setPosition(newPosition);
      map.setCenter(newPosition);
    }
  }, [latitude, longitude, map, marker]);

  const getCurrentLocation = () => {
    setGeoLoading(true);
    
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (map && marker) {
          const newPosition = { lat, lng };
          marker.setPosition(newPosition);
          map.setCenter(newPosition);
          map.setZoom(15);
        }
        
        onLocationSelect(lat, lng);
        setGeoLoading(false);
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        setError('Impossible d\'obtenir votre position');
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <MapPin className="mr-2" size={20} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={geoLoading || isLoading}
            className="flex-1"
          >
            {geoLoading ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <Target className="mr-2" size={16} />
            )}
            Ma position actuelle
          </Button>
          
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => {
              if (map) {
                map.setCenter({ lat: 3.8667, lng: 11.5167 });
                map.setZoom(13);
              }
            }}
          >
            <MapPin className="mr-2" size={16} />
            Recentrer Yaoundé
          </Button>
        </div>

        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg border border-gray-300"
            style={{ minHeight: '384px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600">Chargement de la carte...</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Cliquez sur la carte pour placer le marqueur</p>
          <p>• Glissez le marqueur pour ajuster la position</p>
          {latitude !== 0 && longitude !== 0 && (
            <p className="text-green-600 font-medium">
              Position sélectionnée: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

