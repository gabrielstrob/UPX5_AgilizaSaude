import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { type Clinica } from '../hooks/useClinicas';
import { getLotacaoStyle } from '../utils/lotacao';

const formatarUltimaAtualizacao = (dataStr: string | null | undefined) => {
  if (!dataStr) return null;
  try {
    const data = new Date(dataStr);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Atualizado agora";
    if (diffMins < 60) return `Atualizado há ${diffMins} min`;
    
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `Atualizado há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    
    return `Atualizado em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return null;
  }
};

export default function Detalhes() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewExpanded, setReviewExpanded] = useState(false);

  useEffect(() => {
    const fetchClinica = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/clinicas/${id}`);
        setClinica(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClinica();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface font-medium">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error || !clinica) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container p-6">
        <div className="bg-error-container text-on-error-container p-6 rounded-xl text-center shadow-sm max-w-md w-full">
          <span className="material-symbols-outlined text-[48px] mb-4">error</span>
          <p className="font-bold mb-2 text-lg">Erro ao carregar clínica</p>
          <p className="opacity-90">{error || "Clínica não encontrada."}</p>
          <button onClick={() => navigate(-1)} className="mt-6 bg-error text-on-error px-6 py-3 rounded-lg font-button shadow-sm active:scale-95 transition-transform w-full">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-md px-container-padding h-16 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="ml-2 font-h2 text-h2 text-primary truncate flex-1">Detalhes da Clínica</span>
      </header>

      <div className="max-w-4xl mx-auto md:px-container-padding px-0 pb-stack-lg">
        <section className="relative w-full h-[300px] md:h-[400px] md:mt-stack-md md:rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          {clinica.foto_url ? (
            <img alt="Clinic exterior" className="w-full h-full object-cover" src={clinica.foto_url} />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-[80px] text-outline-variant opacity-50">local_hospital</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-container-padding">
            {(() => {
              const isOpen = clinica.aberto_24h || clinica.status_funcionamento === 'Aberta';
              const bg = clinica.aberto_24h ? 'bg-primary' : isOpen ? 'bg-primary' : 'bg-error-container';
              const textColor = clinica.aberto_24h ? 'text-on-primary' : isOpen ? 'text-on-primary' : 'text-on-error-container';
              const icon = clinica.aberto_24h ? 'verified' : isOpen ? 'check_circle' : 'cancel';
              const label = clinica.aberto_24h ? '24 Horas' : isOpen ? 'Aberta agora' : 'Fechada';
              return (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-stack-sm ${bg}`}>
                  <span className={`material-symbols-outlined text-sm ${textColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                  <span className={`font-label-caps text-label-caps ${textColor}`}>
                    {label}
                  </span>
                </div>
              );
            })()}
            <h1 className="font-h1 text-h1 text-white mb-unit drop-shadow-md">{clinica.nome}</h1>
            <p className="font-body-md text-body-md text-white/90 flex items-center gap-2 drop-shadow-sm">
              <span className="material-symbols-outlined text-lg">location_on</span>
              {clinica.endereco}
            </p>
          </div>
        </section>

        <section className="px-container-padding md:px-0 mt-stack-md grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <a href={`tel:${clinica.telefone}`} className="bg-error hover:bg-error/90 text-on-error font-button text-button py-4 rounded-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(186,26,26,0.12)] transition-colors w-full active:scale-[0.98]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            Ligar ({clinica.telefone})
          </a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${clinica.latitude},${clinica.longitude}`} target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary/90 text-on-primary font-button text-button py-4 rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-colors w-full active:scale-[0.98]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions</span>
            Iniciar Rota
          </a>
        </section>

        <div className="px-container-padding md:px-0 mt-stack-lg grid grid-cols-1 lg:grid-cols-3 gap-stack-md">
          <div className="lg:col-span-2 space-y-stack-md">
            <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container/50">
              <h2 className="font-h2 text-h2 text-on-surface mb-stack-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                Movimentação (Google)
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">Fluxo de visitantes estimado em tempo real.</p>
              <div className={`bg-surface-container-low rounded-lg p-stack-md flex items-center gap-4 border-l-4 ${getLotacaoStyle(clinica.lotacao_nivel).border}`}>
                <div className={`w-12 h-12 rounded-full ${getLotacaoStyle(clinica.lotacao_nivel).bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-2xl ${getLotacaoStyle(clinica.lotacao_nivel).text}`}>
                    {getLotacaoStyle(clinica.lotacao_nivel).icon}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body-lg text-body-lg text-on-surface font-semibold">
                      {clinica.lotacao_status}
                    </span>
                    {clinica.google_place_id ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                        Tempo Real
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-container-high text-outline text-[10px] font-bold uppercase tracking-wider border border-outline-variant/30">
                        Simulado
                      </span>
                    )}
                  </div>
                  <span className="block font-body-sm text-[13px] text-on-surface-variant leading-tight mt-1">
                    Frequência de clientes atual em comparação com a média normal para este horário.
                  </span>
                  {clinica.google_place_id && clinica.lotacao_atualizada_em && (
                    <span className="block text-[11px] text-primary font-medium mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] animate-pulse">sync</span>
                      {formatarUltimaAtualizacao(clinica.lotacao_atualizada_em)}
                    </span>
                  )}
                  {!clinica.google_place_id && (
                    <span className="block text-[11px] text-outline font-medium mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Simulação baseada no horário comercial normal
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container/50">
              <h2 className="font-h2 text-h2 text-on-surface mb-stack-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                Horário de Funcionamento
              </h2>
              <div className="divide-y divide-surface-container/50">
                {Object.entries(clinica.horarios || {}).map(([dia, horario]) => (
                  <div key={dia} className="py-3 flex justify-between items-center">
                    <span className="font-body-md text-body-md text-on-surface font-semibold capitalize">
                      {dia.replace(/_/g, ' ')}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">{horario}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-stack-md">
            <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container/50">
              <div className="flex items-center justify-between mb-stack-md">
                <h3 className="font-h2 text-h2 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {clinica.avaliacao_media}
                </h3>
                <span className="font-label-caps text-label-caps text-on-surface-variant">{clinica.total_avaliacoes} AVALIAÇÕES</span>
              </div>
              <div className="space-y-stack-sm">
                {clinica.review_texto && (
                <div className="bg-surface rounded-lg p-3 border border-surface-container-low">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                      {clinica.review_autor?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-body-md text-on-surface text-sm font-semibold truncate">{clinica.review_autor}</p>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-body-md text-body-md text-on-surface-variant text-xs">{clinica.review_nota} · {clinica.review_data}</span>
                      </div>
                    </div>
                  </div>
                  <p className={`font-body-md text-body-md text-on-surface-variant text-sm ${reviewExpanded ? '' : 'line-clamp-3'}`}>"{clinica.review_texto}"</p>
                  {clinica.review_texto && clinica.review_texto.length > 120 && (
                    <button
                      onClick={() => setReviewExpanded(v => !v)}
                      className="mt-1 text-primary text-xs font-semibold flex items-center gap-0.5 hover:underline"
                    >
                      {reviewExpanded ? 'Ver menos' : 'Ver mais'}
                      <span className="material-symbols-outlined text-[16px]">{reviewExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
