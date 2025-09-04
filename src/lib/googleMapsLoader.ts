// Gestionnaire centralisé pour l'API Google Maps
let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  // Si déjà chargé, résoudre immédiatement
  if (isGoogleMapsLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Si en cours de chargement, retourner la promesse existante
  if (isGoogleMapsLoading && loadPromise) {
    return loadPromise;
  }

  // Créer une nouvelle promesse de chargement
  loadPromise = new Promise<void>((resolve, reject) => {
    // Vérifier si l'API est déjà disponible
    if (window.google && window.google.maps && window.google.maps.places) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    isGoogleMapsLoading = true;

    // Vérifier la clé API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Clé API Google Maps manquante'));
      return;
    }

    // Supprimer les scripts existants pour éviter les conflits
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => script.remove());

    // Supprimer le callback global s'il existe
    if ((window as any).initGoogleMaps) {
      delete (window as any).initGoogleMaps;
    }

    // Créer le callback global unique
    const callbackName = 'initGoogleMapsAPI';
    (window as any)[callbackName] = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      delete (window as any)[callbackName];
      resolve();
    };

    // Créer et ajouter le script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&region=CM&language=fr&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      isGoogleMapsLoading = false;
      delete (window as any)[callbackName];
      reject(new Error('Erreur lors du chargement de l\'API Google Maps'));
    };

    document.head.appendChild(script);

    // Timeout de sécurité
    setTimeout(() => {
      if (isGoogleMapsLoading) {
        isGoogleMapsLoading = false;
        delete (window as any)[callbackName];
        reject(new Error('Timeout lors du chargement de l\'API Google Maps'));
      }
    }, 10000);
  });

  return loadPromise;
};

// Utilitaires pour vérifier l'état de l'API
export const isGoogleMapsReady = (): boolean => {
  return isGoogleMapsLoaded && 
         !!window.google && 
         !!window.google.maps && 
         !!window.google.maps.places;
};

export const waitForGoogleMaps = (): Promise<void> => {
  if (isGoogleMapsReady()) {
    return Promise.resolve();
  }
  
  return loadGoogleMapsAPI();
};
