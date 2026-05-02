
export default function Triagem() {
  return (
    <div className="max-w-4xl mx-auto px-container-padding space-y-stack-lg pb-stack-lg">
      <section className="space-y-stack-sm pt-stack-md">
        <h1 className="font-h1 text-h1 text-primary">Triagem de Urgência</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Encontre a unidade de saúde pública mais próxima para o seu caso.</p>
      </section>

      <section className="relative">
        <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-2 border-surface-container-highest focus-within:border-primary transition-colors duration-200">
          <span className="material-symbols-outlined absolute left-4 text-outline">search</span>
          <input className="w-full bg-transparent border-none py-4 pl-12 pr-4 font-body-lg text-body-lg text-on-surface focus:ring-0 placeholder-outline-variant outline-none" placeholder="Descreva seu sintoma ou unidade..." type="text"/>
        </div>
      </section>

      <section className="space-y-stack-md">
        <h2 className="font-h2 text-h2 text-on-surface">Sintomas Comuns</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <button className="bg-secondary text-on-secondary rounded-xl p-stack-md flex flex-col items-start gap-stack-sm shadow-[0_8px_24px_rgba(186,26,26,0.12)] hover:opacity-90 transition-opacity text-left">
            <div className="bg-white/20 p-2 rounded-full">
              <span className="material-symbols-outlined text-white">personal_injury</span>
            </div>
            <div>
              <span className="font-button text-button block mb-1">Dor Intensa</span>
              <span className="font-label-caps text-label-caps opacity-90">Atendimento Imediato</span>
            </div>
          </button>
          
          <button className="bg-secondary text-on-secondary rounded-xl p-stack-md flex flex-col items-start gap-stack-sm shadow-[0_8px_24px_rgba(186,26,26,0.12)] hover:opacity-90 transition-opacity text-left">
            <div className="bg-white/20 p-2 rounded-full">
              <span className="material-symbols-outlined text-white">bloodtype</span>
            </div>
            <div>
              <span className="font-button text-button block mb-1">Sangramento</span>
              <span className="font-label-caps text-label-caps opacity-90">Hemorragia Oral</span>
            </div>
          </button>
          
          <button className="bg-secondary text-on-secondary rounded-xl p-stack-md flex flex-col items-start gap-stack-sm shadow-[0_8px_24px_rgba(186,26,26,0.12)] hover:opacity-90 transition-opacity text-left">
            <div className="bg-white/20 p-2 rounded-full">
              <span className="material-symbols-outlined text-white">healing</span>
            </div>
            <div>
              <span className="font-button text-button block mb-1">Trauma</span>
              <span className="font-label-caps text-label-caps opacity-90">Quedas ou Pancadas</span>
            </div>
          </button>
        </div>
        
        <div className="bg-surface-container-low p-stack-md rounded-lg flex items-start gap-stack-sm">
          <span className="material-symbols-outlined text-primary-container">info</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Todas as opções acima direcionam para unidades de pronto atendimento da rede pública (SUS).</p>
        </div>
      </section>

      <section>
        <div className="bg-tertiary-container text-on-tertiary-container p-stack-md rounded-xl flex items-start gap-stack-md shadow-[0_8px_24px_rgba(150,95,0,0.12)]">
          <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div>
            <h3 className="font-h2 text-h2 mb-2">Emergência Grave?</h3>
            <p className="font-body-md text-body-md mb-4">Se você estiver com dificuldade para respirar, inchaço no rosto ou febre alta, procure o hospital imediatamente ou ligue para o SAMU.</p>
            <button className="bg-white text-tertiary-container font-button text-button py-2 px-6 rounded-full shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              Ligar 192
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
