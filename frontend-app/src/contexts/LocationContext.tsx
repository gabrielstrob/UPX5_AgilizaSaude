import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type LocationSource = 'gps' | 'cep';

interface LocationContextType {
  userLocation: [number, number] | null;
  cepApplied: string | null;
  locationSource: LocationSource;
  locationReady: boolean;
  setManualLocation: (lat: number, lng: number, cep: string) => void;
  resetToGps: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const BRASIL_BOUNDS = { latMin: -33.75, latMax: 5.27, lngMin: -73.99, lngMax: -34.79 };
const isCoordInBrasil = (lat: number, lng: number) =>
  lat >= BRASIL_BOUNDS.latMin && lat <= BRASIL_BOUNDS.latMax &&
  lng >= BRASIL_BOUNDS.lngMin && lng <= BRASIL_BOUNDS.lngMax;

const FALLBACK_LAT = -23.5015;
const FALLBACK_LNG = -47.4526;

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [cepApplied, setCepApplied] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>('gps');
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
      setLocationReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;

        if (!isCoordInBrasil(lat, lng) || position.coords.accuracy > 50000) {
          lat = FALLBACK_LAT;
          lng = FALLBACK_LNG;
        }

        setUserLocation([lat, lng]);
        setLocationReady(true);
      },
      () => {
        setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
        setLocationReady(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const setManualLocation = useCallback((lat: number, lng: number, cep: string) => {
    setUserLocation([lat, lng]);
    setCepApplied(cep);
    setLocationSource('cep');
  }, []);

  const resetToGps = useCallback(() => {
    setCepApplied(null);
    setLocationSource('gps');

    if (!('geolocation' in navigator)) {
      setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;

        if (!isCoordInBrasil(lat, lng) || position.coords.accuracy > 50000) {
          lat = FALLBACK_LAT;
          lng = FALLBACK_LNG;
        }

        setUserLocation([lat, lng]);
      },
      () => {
        setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  return (
    <LocationContext.Provider value={{ userLocation, cepApplied, locationSource, locationReady, setManualLocation, resetToGps }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
}
