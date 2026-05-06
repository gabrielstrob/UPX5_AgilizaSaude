import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { type Clinica } from '../hooks/useClinicas';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
}

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'import' | 'manage'>('manage');
  
  // Import State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  
  // Manage State
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loadingClinicas, setLoadingClinicas] = useState(false);
  const [editingClinica, setEditingClinica] = useState<Clinica | null>(null);
  const [editFormData, setEditFormData] = useState({ foto_url: '', horariosText: '' });
  
  // General State
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchClinicas();
    }
  }, [activeTab]);

  const fetchClinicas = async () => {
    setLoadingClinicas(true);
    try {
      const data = await api.get('/clinicas/admin/list');
      setClinicas(data);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoadingClinicas(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoadingSearch(true);
    setMessage(null);
    try {
      const data = await api.get(`/clinicas/admin/places/search?query=${encodeURIComponent(query)}`);
      setResults(data.resultados || []);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleImport = async (placeId: string, name: string) => {
    setImportingId(placeId);
    setMessage(null);
    try {
      await api.post(`/clinicas/admin/places/${placeId}/import`);
      setMessage({ text: `Clínica "${name}" importada com sucesso!`, type: 'success' });
      setResults(prev => prev.filter(r => r.place_id !== placeId));
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setImportingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta clínica permanentemente?')) return;
    
    try {
      await api.delete(`/clinicas/admin/${id}`);
      setMessage({ text: 'Clínica excluída com sucesso.', type: 'success' });
      setClinicas(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const openEdit = (clinica: Clinica) => {
    setEditingClinica(clinica);
    setEditFormData({
      foto_url: clinica.foto_url || '',
      horariosText: JSON.stringify(clinica.horarios || {}, null, 2)
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClinica) return;
    try {
      let parsedHorarios = {};
      try {
        parsedHorarios = JSON.parse(editFormData.horariosText);
      } catch (e) {
        throw new Error("Formato JSON de horários inválido. Use chaves e aspas corretas.");
      }

      await api.patch(`/clinicas/admin/${editingClinica.id}`, {
        foto_url: editFormData.foto_url,
        horarios: parsedHorarios
      });
      
      setMessage({ text: 'Clínica atualizada com sucesso!', type: 'success' });
      setEditingClinica(null);
      fetchClinicas(); // recarregar lista
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-container-padding py-stack-lg">
      <div className="mb-stack-lg border-b border-outline-variant/30 pb-stack-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-[32px]">admin_panel_settings</span>
          <h1 className="font-h1 text-h1 text-on-surface">Portal Admin</h1>
          <button
            onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
            className="ml-auto flex items-center gap-1 px-4 py-2 rounded-lg text-outline hover:bg-surface-container transition-colors font-button text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sair
          </button>
        </div>
        <p className="text-outline text-body-lg">Gerencie o banco de dados de clínicas ativas no PWA.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-stack-lg flex items-start gap-2 ${message.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
          <span className="material-symbols-outlined mt-0.5">
            {message.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 border-b border-outline-variant/30 mb-stack-lg">
        <button 
          onClick={() => setActiveTab('manage')}
          className={`pb-3 font-button px-2 transition-colors ${activeTab === 'manage' ? 'border-b-2 border-primary text-primary' : 'text-outline hover:text-on-surface'}`}
        >
          Gerenciar Clínicas
        </button>
        <button 
          onClick={() => setActiveTab('import')}
          className={`pb-3 font-button px-2 transition-colors ${activeTab === 'import' ? 'border-b-2 border-primary text-primary' : 'text-outline hover:text-on-surface'}`}
        >
          Importar do Google
        </button>
      </div>

      {/* ABA: GERENCIAR */}
      {activeTab === 'manage' && (
        <div>
          {loadingClinicas ? (
            <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid gap-stack-sm">
              {clinicas.map(clinica => (
                <div key={clinica.id} className="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {clinica.foto_url ? (
                      <img src={clinica.foto_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-surface-container" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-outline"><span className="material-symbols-outlined">image</span></div>
                    )}
                    <div>
                      <h3 className="font-h2 text-[16px] text-on-surface mb-1">{clinica.nome}</h3>
                      <p className="text-outline text-sm line-clamp-1">{clinica.endereco}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEdit(clinica)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                    <button onClick={() => handleDelete(clinica.id)} className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container hover:opacity-80 transition-opacity"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: IMPORTAR */}
      {activeTab === 'import' && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-stack-lg">
            <div className="flex-1 bg-surface rounded-lg flex items-center px-4 h-14 shadow-sm border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-outline mr-2">search</span>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar clínica por nome..." 
                className="bg-transparent border-none outline-none w-full text-on-surface placeholder:text-outline"
              />
            </div>
            <button type="submit" disabled={loadingSearch} className="h-14 px-6 bg-primary text-on-primary rounded-lg font-button shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">Buscar</button>
          </form>

          {results.length > 0 && (
            <div className="flex flex-col gap-stack-sm">
              {results.map((place) => (
                <div key={place.place_id} className="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-h2 text-[18px] text-on-surface leading-tight mb-1">{place.name}</h3>
                    <p className="text-outline text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> {place.formatted_address}</p>
                  </div>
                  <button
                    onClick={() => handleImport(place.place_id, place.name)}
                    disabled={importingId === place.place_id}
                    className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-button text-sm shadow-sm hover:bg-secondary/90 transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                  >
                    {importingId === place.place_id ? 'Importando...' : 'Importar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL EDIÇÃO */}
      {editingClinica && (
        <div className="fixed inset-0 z-[1000] bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-2xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-h1 text-[24px] mb-4">Editar Clínica</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">URL da Foto (Banner)</label>
                <input 
                  type="text" 
                  value={editFormData.foto_url} 
                  onChange={e => setEditFormData({...editFormData, foto_url: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-surface-container rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Horários de Funcionamento (Formato JSON)</label>
                <textarea 
                  value={editFormData.horariosText} 
                  onChange={e => setEditFormData({...editFormData, horariosText: e.target.value})}
                  rows={8}
                  className="w-full bg-surface-container rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => setEditingClinica(null)} className="px-6 py-3 rounded-lg font-button hover:bg-surface-container-high transition-colors">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-6 py-3 bg-primary text-on-primary rounded-lg font-button shadow-sm hover:bg-primary/90 transition-colors">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
