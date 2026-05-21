import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

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
  const { userLocation, locationReady } = useLocation();
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinicas = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    setClinicas([]);
    try {
      const data = await api.get(`/clinicas/proximas?lat=${lat}&lng=${lng}&raio=${raio_km}`);
      setClinicas(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [raio_km]);

  useEffect(() => {
    if (locationReady && userLocation) {
      fetchClinicas(userLocation[0], userLocation[1]);
    }
  }, [locationReady, userLocation, fetchClinicas]);

  return {
    clinicas,
    loading: loading || !locationReady,
    error,
    userLocation,
    refetch: () => userLocation && fetchClinicas(userLocation[0], userLocation[1])
  };
}
