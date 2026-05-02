import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface Clinica {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  aberto_24h: boolean;
  horarios: Record<string, string>;
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

  useEffect(() => {
    // 1. Tentar pegar a localização do usuário
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("Geolocalização:", lat, lng, "Accuracy:", position.coords.accuracy);
          setUserLocation([lat, lng]);
          fetchClinicas(lat, lng);
        },
        (err) => {
          console.warn("Erro de localização:", err.message, "Usando fallback.");
          // Fallback para Av. Paulista se negar/falhar
          const fallbackLat = -23.5015;
          const fallbackLng = -47.4526;
          setUserLocation([fallbackLat, fallbackLng]);
          fetchClinicas(fallbackLat, fallbackLng);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Adicionando timeout de 5 segundos para não ficar preso
      );
    } else {
       // Sem suporte
       const fallbackLat = -23.5015;
       const fallbackLng = -47.4526;
       setUserLocation([fallbackLat, fallbackLng]);
       fetchClinicas(fallbackLat, fallbackLng);
    }
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

  return { clinicas, loading, error, userLocation, refetch: () => userLocation && fetchClinicas(userLocation[0], userLocation[1]) };
}
