import { Link } from 'react-router-dom';
import { useClinicas } from '../hooks/useClinicas';

export default function Unidades() {
  const { clinicas, loading, error, refetch } = useClinicas(50000);

  return (
    <div className="min-h-screen bg-surface-container pt-container-padding pb-[80px] px-container-padding">
      {/* Header */}
      <div className="mb-stack-md">
        <h1 className="font-h1 text-h1 text-on-surface mb-2">Unidades Próximas</h1>
        <p className="text-outline text-body-lg">Encontre atendimento odontológico na sua região.</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2 mb-stack-lg">
        <div className="flex-1 bg-surface rounded-full flex items-center px-4 h-14 shadow-sm border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <span className="material-symbols-outlined text-outline mr-2">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nome ou região..." 
            className="bg-transparent border-none outline-none w-full text-on-surface placeholder:text-outline"
          />
        </div>
        <button className="w-14 h-14 bg-surface text-on-surface rounded-full shadow-sm border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>

      {/* States (Loading/Error) */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-outline font-medium">Buscando clínicas na sua região...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold mb-2 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">error</span> Ops! Ocorreu um erro.
          </p>
          <p className="text-sm opacity-90">{error}</p>
          <button onClick={refetch} className="mt-4 bg-error text-on-error px-4 py-2 rounded-lg font-button shadow-sm active:scale-95 transition-transform">Tentar Novamente</button>
        </div>
      )}

      {/* Clinic List */}
      {!loading && !error && clinicas.length === 0 && (
        <div className="text-center py-10">
          <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 opacity-50">location_off</span>
          <p className="text-on-surface font-medium">Nenhuma clínica encontrada no momento.</p>
        </div>
      )}

      {!loading && !error && clinicas.length > 0 && (
        <div className="flex flex-col gap-stack-sm">
          {clinicas.map((clinica) => (
            <Link to={`/clinicas/${clinica.id}`} key={clinica.id} className="bg-surface rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20 hover:shadow-md transition-shadow active:scale-[0.98] flex flex-col md:flex-row gap-4">
              {clinica.foto_url ? (
                <img src={clinica.foto_url} alt="" className="w-full md:w-32 h-32 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-full md:w-32 h-32 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[40px] text-outline-variant opacity-50">local_hospital</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-h2 text-[18px] text-on-surface leading-tight pr-2">{clinica.nome}</h3>
                  <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shrink-0 ${clinica.aberto_24h ? 'bg-surface-container-high text-primary' : 'bg-surface-container text-outline'}`}>
                  <span className={`w-2 h-2 rounded-full block ${clinica.aberto_24h ? 'bg-primary' : 'bg-outline'}`}></span>
                  {clinica.aberto_24h ? '24 Horas' : 'Aberto'}
                </div>
              </div>
              
              <p className="text-outline text-sm flex items-center gap-1 mb-3">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {clinica.distancia_km} km • {clinica.endereco.split('-')[0].trim()}
              </p>
              
              <div className="flex items-center gap-4 py-2 border-t border-outline-variant/20">
                <div className="flex-1">
                  <p className="font-bold text-on-surface flex items-center gap-1 text-sm">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">schedule</span>
                    {clinica.tempo_espera_minutos} min
                  </p>
                </div>
                <div className="h-6 w-px bg-outline-variant/30"></div>
                <div className="flex-1 flex justify-end">
                  <p className="font-bold text-primary flex items-center gap-1 text-sm">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {clinica.avaliacao_media}
                  </p>
                </div>
              </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
