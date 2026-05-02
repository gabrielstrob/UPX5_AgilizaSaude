import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useClinicas, type Clinica } from '../hooks/useClinicas';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function Mapa() {
  const { clinicas, loading, error, userLocation, refetch } = useClinicas(50000); // Busca global
  const [activeClinica, setActiveClinica] = useState<Clinica | null>(null);

  // Se a clínica ativa não estiver setada e temos resultados, seta a primeira (mais próxima)
  useEffect(() => {
    if (clinicas.length > 0 && !activeClinica) {
      setActiveClinica(clinicas[0]);
    }
  }, [clinicas, activeClinica]);

  if (loading || !userLocation) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface font-medium">Buscando sua localização e clínicas próximas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-container p-6 text-center">
        <div className="bg-error-container text-on-error-container p-4 rounded-xl">
          <p className="font-bold mb-2">Erro ao carregar mapa</p>
          <p>{error}</p>
          <button onClick={refetch} className="mt-4 bg-error text-on-error px-4 py-2 rounded-lg font-button">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bottom-[80px] md:bottom-0 md:left-64 z-0 bg-surface-container">
      <MapContainer center={userLocation} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }} className="leaflet-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={userLocation} />
        
        <Marker position={userLocation}>
          <Popup>Você está aqui</Popup>
        </Marker>

        {clinicas.map((clinica) => (
          <Marker 
            key={clinica.id} 
            position={[clinica.latitude, clinica.longitude]}
            eventHandlers={{
              click: () => setActiveClinica(clinica),
            }}
          >
            <Popup>{clinica.nome}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Controls (Top Right) */}
      <div className="absolute top-container-padding right-container-padding z-[400] flex flex-col gap-unit">
        <button 
          onClick={refetch}
          className="w-12 h-12 bg-surface text-on-surface rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-center hover:bg-surface-container-low transition-colors border border-outline-variant/30"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <button className="w-12 h-12 bg-surface text-on-surface rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-center hover:bg-surface-container-low transition-colors border border-outline-variant/30">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>

      {/* Closest Unit Card */}
      {activeClinica && (
        <div className="absolute bottom-container-padding left-0 w-full px-container-padding z-[400]">
          <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-outline-variant/20 overflow-hidden backdrop-blur-md bg-white/95">
            <div className="p-4">
              <div className="flex justify-between items-start mb-stack-sm">
                <div>
                  <h2 className="font-h2 text-h2 text-on-surface mb-1">{activeClinica.nome}</h2>
                  <p className="text-outline text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {activeClinica.distancia_km} km de distância
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${activeClinica.aberto_24h ? 'bg-surface-container-high text-primary' : 'bg-surface-container text-outline'}`}>
                  <span className={`w-2 h-2 rounded-full block ${activeClinica.aberto_24h ? 'bg-primary' : 'bg-outline'}`}></span>
                  {activeClinica.aberto_24h ? '24 Horas' : 'Aberto'}
                </div>
              </div>
              <div className="flex items-center gap-4 py-stack-sm border-t border-outline-variant/20 border-b mb-stack-md">
                <div className="flex-1">
                  <p className="font-label-caps text-label-caps text-outline mb-1">TEMPO ESTIMADO</p>
                  <p className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">schedule</span>
                    {activeClinica.tempo_espera_minutos} min de espera
                  </p>
                </div>
                <div className="h-10 w-px bg-outline-variant/30"></div>
                <div className="flex-1 text-right">
                  <p className="font-label-caps text-label-caps text-outline mb-1">AVALIAÇÃO</p>
                  <p className="font-bold text-primary flex items-center justify-end gap-1">
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    {activeClinica.avaliacao_media}
                  </p>
                </div>
              </div>
              <div className="flex gap-stack-sm">
                <Link to={`/clinicas/${activeClinica.id}`} className="flex-1 bg-primary text-on-primary font-button text-button py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-sm">
                  <span className="material-symbols-outlined">directions_car</span>
                  Ver Detalhes
                </Link>
                <button className="w-14 bg-surface-container text-on-surface border border-outline-variant/50 rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
