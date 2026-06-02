import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';

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

const isNative = Capacitor.isNativePlatform();

async function requestNativePermissions(): Promise<boolean> {
  try {
    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted' || status.coarseLocation === 'granted') return true;
    const req = await Geolocation.requestPermissions({ permissions: ['coarseLocation', 'location'] });
    return req.location === 'granted' || req.coarseLocation === 'granted';
  } catch {
    return false;
  }
}

function positionToCoords(position: Position | GeolocationPosition): [number, number] {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = position.coords.accuracy;
  if (!isCoordInBrasil(lat, lng) || accuracy > 50000) {
    return [FALLBACK_LAT, FALLBACK_LNG];
  }
  return [lat, lng];
}

async function getNativeLocation(): Promise<[number, number]> {
  const granted = await requestNativePermissions();
  if (!granted) return [FALLBACK_LAT, FALLBACK_LNG];
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
  return positionToCoords(pos);
}

function getWebLocation(): Promise<[number, number]> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve([FALLBACK_LAT, FALLBACK_LNG]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(positionToCoords(pos)),
      () => resolve([FALLBACK_LAT, FALLBACK_LNG]),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function getCurrentLocation(): Promise<[number, number]> {
  return isNative ? getNativeLocation() : getWebLocation();
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [cepApplied, setCepApplied] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>('gps');
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    getCurrentLocation().then((coords) => {
      setUserLocation(coords);
      setLocationReady(true);
    });
  }, []);

  const setManualLocation = useCallback((lat: number, lng: number, cep: string) => {
    setUserLocation([lat, lng]);
    setCepApplied(cep);
    setLocationSource('cep');
  }, []);

  const resetToGps = useCallback(() => {
    setCepApplied(null);
    setLocationSource('gps');
    getCurrentLocation().then((coords) => {
      setUserLocation(coords);
    });
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
