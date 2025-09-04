'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Target, Loader, Search } from 'lucide-react';
import Button from './Button';

interface LocationSelectorProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  className?: string;
  showAddressInput?: boolean;
}

export default function LocationSelector({ 
  latitude, 
  longitude, 
  onLocationSelect, 
  className = '',
  showAddressInput = true 
}: LocationSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const initGoogleMaps = () => {
      if (!mapRef.current) return;
      
      // Vérifier que Google Maps est complètement chargé
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.log('Google Maps pas encore disponible');
        return;
      }

      try {
        const initialPosition = latitude && longitude 
          ? { lat: latitude, lng: longitude }
          : { lat: 3.8667, lng: 11.5167 }; // Yaoundé, Cameroun par défaut

        // Initialiser la carte
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: initialPosition,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Créer le marqueur
        const markerInstance = new window.google.maps.Marker({
          position: initialPosition,
          map: mapInstance,
          draggable: true,
          title: 'Position de la campagne'
        });

        // Événement de clic sur la carte
        mapInstance.addListener('click', (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            markerInstance.setPosition({ lat, lng });
            
            // Géocodage inverse pour obtenir l'adresse
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                setAddress(results[0].formatted_address);
                onLocationSelect(lat, lng, results[0].formatted_address);
              } else {
                onLocationSelect(lat, lng);
              }
            });
          }
        });

        // Événement de glisser-déposer du marqueur
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            
            // Géocodage inverse
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                setAddress(results[0].formatted_address);
                onLocationSelect(lat, lng, results[0].formatted_address);
              } else {
                onLocationSelect(lat, lng);
              }
            });
          }
        });

        // Initialiser l'autocomplétion si le champ d'adresse est présent
        if (autocompleteRef.current && showAddressInput) {
          const autocompleteInstance = new window.google.maps.places.Autocomplete(
            autocompleteRef.current,
            {
              types: ['establishment', 'geocode'],
              componentRestrictions: { country: 'cm' } // Restriction au Cameroun
            }
          );

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              // Mettre à jour la carte et le marqueur
              mapInstance.setCenter({ lat, lng });
              mapInstance.setZoom(15);
              markerInstance.setPosition({ lat, lng });
              
              setAddress(place.formatted_address || place.name || '');
              onLocationSelect(lat, lng, place.formatted_address || place.name);
            }
          });

          setAutocomplete(autocompleteInstance);
        }

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsLoading(false);

        // Géolocalisation automatique au chargement si aucune position n'est définie
        if (!latitude && !longitude) {
          setTimeout(() => {
            getCurrentLocationInternal(mapInstance, markerInstance);
          }, 1000);
        }
      } catch (error) {
        console.error('Erreur initialisation carte:', error);
        setError('Erreur de chargement de la carte');
        setIsLoading(false);
      }
    };

    // Fonction pour vérifier et attendre Google Maps
    const waitForGoogleMaps = (callback: () => void, maxAttempts = 50) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          callback();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setError('Google Maps API non disponible après 5 secondes');
          setIsLoading(false);
        }
      }, 100);
    };

    // Charger Google Maps API avec Places
    if (typeof window !== 'undefined') {
      // Vérifier si Google Maps est déjà chargé
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps déjà disponible');
        initGoogleMaps();
        return;
      }

      // Éviter les scripts en double
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Script Google Maps déjà présent, attente...');
        waitForGoogleMaps(initGoogleMaps);
        return;
      }

      // Créer et charger le script avec callback unique
      const callbackName = `initGoogleMaps_${Date.now()}`;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=${callbackName}`;
      script.async = true;
      
      // Fonction callback globale unique
      (window as any)[callbackName] = () => {
        console.log('Google Maps callback appelé');
        delete (window as any)[callbackName];
        initGoogleMaps();
      };
      
      script.onerror = (e) => {
        console.error('Erreur chargement script Google Maps:', e);
        setError('Erreur de chargement Google Maps. Vérifiez votre clé API.');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    }
  }, []);

  // Cleanup function pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if ((window as any).initGoogleMapsCallback) {
        delete (window as any).initGoogleMapsCallback;
      }
    };
  }, []);

  // Mettre à jour la position du marqueur quand les props changent
  useEffect(() => {
    if (map && marker && latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };
      marker.setPosition(newPosition);
      map.setCenter(newPosition);
    }
  }, [latitude, longitude, map, marker]);

  const getCurrentLocationInternal = (mapInstance?: any, markerInstance?: any) => {
    const currentMap = mapInstance || map;
    const currentMarker = markerInstance || marker;
    
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (currentMap && currentMarker) {
          const newPosition = { lat, lng };
          currentMarker.setPosition(newPosition);
          currentMap.setCenter(newPosition);
          currentMap.setZoom(15);
        }
        
        // Géocodage inverse pour obtenir l'adresse
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
            onLocationSelect(lat, lng, results[0].formatted_address);
          } else {
            onLocationSelect(lat, lng);
          }
        });
      },
      (error) => {
        console.log('Géolocalisation non disponible, utilisation de Yaoundé par défaut');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000
      }
    );
  };

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
        
        // Géocodage inverse pour obtenir l'adresse
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
            onLocationSelect(lat, lng, results[0].formatted_address);
          } else {
            onLocationSelect(lat, lng);
          }
        });
        
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
        {/* Champ de recherche avec autocomplétion */}
        {showAddressInput && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={autocompleteRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rechercher une adresse ou un lieu..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        )}

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
                if (marker) {
                  marker.setPosition({ lat: 3.8667, lng: 11.5167 });
                }
                setAddress('Yaoundé, Cameroun');
                onLocationSelect(3.8667, 11.5167, 'Yaoundé, Cameroun');
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
            className="w-full h-64 rounded-lg border border-gray-300"
            style={{ minHeight: '256px' }}
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
          <p>• Tapez une adresse dans le champ de recherche</p>
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
