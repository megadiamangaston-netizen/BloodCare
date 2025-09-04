'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader';

interface AddressInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  required?: boolean;
  className?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AddressInput({ 
  label, 
  placeholder = "Tapez une adresse...", 
  value, 
  onChange, 
  required = false,
  className = '' 
}: AddressInputProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialiser les services Google Places via le gestionnaire centralisé
    const initializeServices = () => {
      try {
        console.log('Initialisation des services Google Places...');
        const autocomplete = new window.google.maps.places.AutocompleteService();
        const places = new window.google.maps.places.PlacesService(document.createElement('div'));
        setAutocompleteService(autocomplete);
        setPlacesService(places);
        console.log('Services Google Places initialisés avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des services Places:', error);
      }
    };

    // Utiliser le gestionnaire centralisé pour charger l'API
    loadGoogleMapsAPI()
      .then(() => {
        initializeServices();
      })
      .catch((error) => {
        console.error('Erreur chargement API Google Maps pour AddressInput:', error);
      });
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = (input: string) => {
    console.log('searchPlaces appelé avec:', input);
    
    if (!autocompleteService) {
      console.log('Service d\'autocomplétion non disponible');
      return;
    }
    
    if (input.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    
    const request = {
      input,
      componentRestrictions: { country: 'cm' }, // Restriction au Cameroun
      types: ['establishment', 'geocode'], // Types d'adresses
    };

    console.log('Requête de recherche:', request);

    autocompleteService.getPlacePredictions(request, (predictions: PlacePrediction[] | null, status: any) => {
      console.log('Réponse API Places:', { status, predictions });
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
        console.log('Prédictions reçues:', predictions.length);
        setPredictions(predictions.slice(0, 5)); // Limiter à 5 suggestions
        setShowDropdown(true);
      } else {
        console.log('Aucune prédiction ou erreur:', status);
        setPredictions([]);
        setShowDropdown(false);
        
        // Si pas de résultats au Cameroun, essayer sans restriction
        if (predictions?.length === 0) {
          console.log('Tentative sans restriction de pays...');
          const fallbackRequest = {
            input,
            types: ['establishment', 'geocode'],
          };
          
          autocompleteService.getPlacePredictions(fallbackRequest, (fallbackPredictions: PlacePrediction[] | null, fallbackStatus: any) => {
            console.log('Réponse fallback:', { fallbackStatus, fallbackPredictions });
            if (fallbackStatus === window.google.maps.places.PlacesServiceStatus.OK && fallbackPredictions) {
              setPredictions(fallbackPredictions.slice(0, 5));
              setShowDropdown(true);
            }
          });
        }
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchPlaces(newValue);
  };

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    if (!placesService) return;

    // Récupérer les détails de la place sélectionnée
    const request = {
      placeId: prediction.place_id,
      fields: ['geometry', 'formatted_address']
    };

    placesService.getDetails(request, (place: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        onChange(place.formatted_address, coordinates);
      } else {
        onChange(prediction.description);
      }
    });

    setShowDropdown(false);
    setPredictions([]);
  };

  const handleFocus = () => {
    if (predictions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            className="w-full px-3 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          />
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          {showDropdown && (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          )}
        </div>

        {/* Dropdown des suggestions */}
        {showDropdown && (predictions.length > 0 || isLoading) && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                Recherche d'adresses...
              </div>
            ) : (
              predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  onClick={() => handlePlaceSelect(prediction)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start">
                    <MapPin className="text-red-500 mr-3 mt-1 flex-shrink-0" size={16} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
      {!autocompleteService && (
        <div className="flex items-center mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600 mr-2"></div>
          Service d'autocomplétion en cours de chargement...
        </div>
      )}
      
      {autocompleteService && (
        <p className="text-xs text-green-600 mt-1">
          ✅ Autocomplétion activée - Tapez pour voir les suggestions
        </p>
      )}
    </div>
  );
}
