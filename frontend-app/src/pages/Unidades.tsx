import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClinicas } from '../hooks/useClinicas';
import { getLotacaoStyle } from '../utils/lotacao';

type SortMode = 'distance' | 'occupancy' | 'rating';

export default function Unidades() {
  const { clinicas, loading, error, refetch } = useClinicas(50000);
  const [search, setSearch] = useState('');
  const [filter24h, setFilter24h] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>('distance');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    if (filtersOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filtersOpen]);

  const filtered = useMemo(() => {
    let list = [...clinicas];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.nome.toLowerCase().includes(q) || c.endereco.toLowerCase().includes(q));
    }
    if (filter24h) list = list.filter(c => c.aberto_24h);
    if (sortBy === 'distance') list.sort((a, b) => a.distancia_km - b.distancia_km);
    else if (sortBy === 'occupancy') list.sort((a, b) => a.lotacao_nivel - b.lotacao_nivel);
    else if (sortBy === 'rating') list.sort((a, b) => b.avaliacao_media - a.avaliacao_media);
    return list;
  }, [clinicas, search, filter24h, sortBy]);

  const hasActiveFilters = filter24h || sortBy !== 'distance';

  return (
    <div className="min-h-screen bg-surface-container pt-container-padding pb-[80px] px-container-padding">
      <div className="mb-stack-md">
        <h1 className="font-h1 text-h1 text-on-surface mb-2">Unidades Próximas</h1>
        <p className="text-outline text-body-lg">Encontre atendimento odontológico na sua região.</p>
      </div>

      <div className="flex gap-2 mb-stack-lg relative">
        <div className="flex-1 bg-surface rounded-full flex items-center px-4 h-14 shadow-sm border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <span className="material-symbols-outlined text-outline mr-2">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nome ou região..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-on-surface placeholder:text-outline"
          />
          {search && (
            <button onClick={() => setSearch('')} className="ml-1">
              <span className="material-symbols-outlined text-outline text-[20px]">close</span>
            </button>
          )}
        </div>
        <button 
          onClick={() => setFiltersOpen(v => !v)}
          className={`w-14 h-14 rounded-full shadow-sm border flex items-center justify-center transition-colors ${hasActiveFilters ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-on-surface border-outline-variant/30 hover:bg-surface-container-low'}`}
        >
          <span className="material-symbols-outlined">tune</span>
        </button>

        {filtersOpen && (
          <div ref={filterRef} className="absolute top-16 right-0 z-50 bg-surface rounded-xl shadow-lg border border-outline-variant/30 p-4 w-64 animate-in">
            <p className="font-semibold text-on-surface mb-3 text-sm">Ordenar por</p>
            <div className="flex flex-col gap-2 mb-4">
              {([
                ['distance', 'Mais próximas', 'location_on'],
                ['occupancy', 'Menos movimentada', 'bar_chart'],
                ['rating', 'Melhor avaliação', 'star'],
              ] as const).map(([key, label, icon]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === key ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface hover:bg-surface-container'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="border-t border-outline-variant/30 pt-3">
              <button
                onClick={() => setFilter24h(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors ${filter24h ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-[18px]">nightlight</span>
                24 Horas
              </button>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilter24h(false); setSortBy('distance'); }}
                className="mt-3 w-full text-center text-sm text-primary font-semibold py-1 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
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
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-10">
          <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 opacity-50">location_off</span>
          <p className="text-on-surface font-medium">{search || hasActiveFilters ? 'Nenhuma clínica corresponde aos filtros.' : 'Nenhuma clínica encontrada no momento.'}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-stack-sm">
          {filtered.map((clinica) => (
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
                  <div className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 ${clinica.aberto_24h || clinica.status_funcionamento === 'Aberta' ? 'bg-surface-container-high text-primary' : 'bg-error-container text-on-error-container'}`}>
                  <span className={`w-2 h-2 rounded-full block ${clinica.aberto_24h || clinica.status_funcionamento === 'Aberta' ? 'bg-primary' : 'bg-error'}`}></span>
                  {clinica.aberto_24h ? '24 Horas' : clinica.status_funcionamento}
                </div>
              </div>
              
              <p className="text-outline text-sm flex items-center gap-1 mb-3">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {clinica.distancia_km} km • {clinica.endereco.split('-')[0].trim()}
              </p>
              
              <div className="flex items-center gap-4 py-2 border-t border-outline-variant/20">
                <div className="flex-1 flex items-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getLotacaoStyle(clinica.lotacao_nivel).bg} ${getLotacaoStyle(clinica.lotacao_nivel).text}`}>
                    <span className="material-symbols-outlined text-[15px]">{getLotacaoStyle(clinica.lotacao_nivel).icon}</span>
                    {clinica.lotacao_status}
                  </span>
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
