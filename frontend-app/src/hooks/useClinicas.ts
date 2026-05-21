import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface Clinica {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  aberto_24h: boolean;
  horarios: Record<string, string>;
  foto_url: string | null;
  avaliacao_media: number;
  total_avaliacoes: number;
  latitude: number;
  longitude: number;
  distancia_km: number;
  tempo_espera_minutos: number;
}

export function useClinicas(raio_km: number = 10) {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const BRASIL_BOUNDS = { latMin: -33.75, latMax: 5.27, lngMin: -73.99, lngMax: -34.79 };

  const isCoordInBrasil = (lat: number, lng: number) => {
    return (
      lat >= BRASIL_BOUNDS.latMin && lat <= BRASIL_BOUNDS.latMax &&
      lng >= BRASIL_BOUNDS.lngMin && lng <= BRASIL_BOUNDS.lngMax
    );
  };

  const FALLBACK_LAT = -23.5015;
  const FALLBACK_LNG = -47.4526;

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
      fetchClinicas(FALLBACK_LAT, FALLBACK_LNG);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log("Geolocalização:", lat, lng, "Accuracy:", accuracy);

        if (!isCoordInBrasil(lat, lng) || accuracy > 50000) {
          console.warn("Localização imprecisa ou fora do Brasil. Usando fallback.");
          lat = FALLBACK_LAT;
          lng = FALLBACK_LNG;
        }

        setUserLocation([lat, lng]);
        fetchClinicas(lat, lng);
      },
      (err) => {
        console.warn("Erro de localização:", err.message, "Usando fallback.");
        setUserLocation([FALLBACK_LAT, FALLBACK_LNG]);
        fetchClinicas(FALLBACK_LAT, FALLBACK_LNG);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [raio_km]);

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

  const setManualLocation = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    fetchClinicas(lat, lng);
  };

  return {
    clinicas,
    loading,
    error,
    userLocation,
    setManualLocation,
    refetch: () => userLocation && fetchClinicas(userLocation[0], userLocation[1])
  };
}
