import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface Clinica {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  foto_url?: string;
  aberto_24h: boolean;
  horarios: Record<string, string>;
  avaliacao_media: number;
  total_avaliacoes: number;
  latitude: number;
  longitude: number;
  distancia_km: number;
  tempo_espera_minutos: number;
}

const FALLBACK_LAT = -23.5015;
const FALLBACK_LNG = -47.4526;

async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const permission = await Geolocation.checkPermissions();
      if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
        await Geolocation.requestPermissions();
      }
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    }
  } catch {
    // Capacitor not available or permission denied — fall through to web API
  }

  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          resolve({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      resolve({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
    }
  });
}

export function useClinicas(raio_km: number = 10) {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const fetchClinicas = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/clinicas/proximas?lat=${lat}&lng=${lng}&raio=${raio_km}`);
      setClinicas(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentPosition().then(({ lat, lng }) => {
      setUserLocation([lat, lng]);
      fetchClinicas(lat, lng);
    });
  }, [raio_km]);

  return { clinicas, loading, error, userLocation, refetch: () => userLocation && fetchClinicas(userLocation[0], userLocation[1]) };
}
