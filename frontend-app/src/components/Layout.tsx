import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none border-b border-slate-100 dark:border-slate-900">
        <div className="text-cyan-700 dark:text-cyan-400 font-extrabold flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
          <span className="font-manrope font-bold text-lg tracking-tight">Conecta Odonto</span>
        </div>
        <div>
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
            <span className="material-symbols-outlined text-outline">person</span>
          </div>
        </div>
      </header>

      <main className="flex-grow relative mt-16 mb-[80px] md:mb-0 md:ml-64">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden rounded-t-2xl">
        <Link to="/" className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-150 ${currentPath === '/' ? 'text-cyan-700 bg-cyan-50 rounded-xl scale-95' : 'text-slate-400 hover:text-cyan-600'}`}>
          <span className="material-symbols-outlined" style={currentPath === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>map</span>
          <span className="font-manrope text-[11px] font-semibold uppercase tracking-wider mt-1">Mapa</span>
        </Link>
        <Link to="/clinicas" className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-150 ${currentPath.includes('/clinicas') ? 'text-cyan-700 bg-cyan-50 rounded-xl scale-95' : 'text-slate-400 hover:text-cyan-600'}`}>
          <span className="material-symbols-outlined" style={currentPath.includes('/clinicas') ? { fontVariationSettings: "'FILL' 1" } : {}}>medical_services</span>
          <span className="font-manrope text-[11px] font-semibold uppercase tracking-wider mt-1">Clínicas</span>
        </Link>
        <Link to="/triagem" className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-150 ${currentPath === '/triagem' ? 'text-cyan-700 bg-cyan-50 rounded-xl scale-95' : 'text-slate-400 hover:text-cyan-600'}`}>
          <span className="material-symbols-outlined" style={currentPath === '/triagem' ? { fontVariationSettings: "'FILL' 1" } : {}}>search</span>
          <span className="font-manrope text-[11px] font-semibold uppercase tracking-wider mt-1">Triagem</span>
        </Link>
      </nav>
      
      <aside className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface border-r border-outline-variant/20 p-4">
        <nav className="flex flex-col gap-2">
            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-button text-button text-left transition-colors ${currentPath === '/' ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined" style={currentPath === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>map</span>
                Mapa
            </Link>
            <Link to="/clinicas" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-button text-button text-left transition-colors ${currentPath.includes('/clinicas') ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined" style={currentPath.includes('/clinicas') ? { fontVariationSettings: "'FILL' 1" } : {}}>medical_services</span>
                Clínicas
            </Link>
            <Link to="/triagem" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-button text-button text-left transition-colors ${currentPath === '/triagem' ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined" style={currentPath === '/triagem' ? { fontVariationSettings: "'FILL' 1" } : {}}>search</span>
                Triagem
            </Link>
        </nav>
      </aside>
    </>
  );
}
