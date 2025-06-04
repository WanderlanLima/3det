import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CampaignFormData, CampaignSummary, CampaignFull, CAMPAIGN_LIST_KEY, CAMPAIGN_SHEET_PREFIX_KEY } from '../types';
import { Save, XSquare, ImageIcon } from 'lucide-react'; // ImageIcon adicionado

const initialCampaignData: CampaignFormData = {
  name: '',
  description: '', // Descrição curta para galeria
  longDescription: '', // Descrição longa para detalhes
  status: 'planejada',
  gm: '',
  imageUrl: '',
  setting: '',
};

const CampaignEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState<CampaignFormData>(initialCampaignData);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      const campaignSheetString = localStorage.getItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${id}`);
      if (campaignSheetString) {
          const fullData: CampaignFull = JSON.parse(campaignSheetString);
          setCampaignData({ // Popula CampaignFormData a partir de CampaignFull
              id: fullData.id,
              name: fullData.name,
              description: fullData.description,
              longDescription: fullData.longDescription,
              status: fullData.status,
              gm: fullData.gm,
              imageUrl: fullData.imageUrl,
              setting: fullData.setting,
          });
      } else {
        showNotification("Campanha não encontrada para edição.", 3000);
        navigate('/campaigns');
      }
    } else {
      setIsEditing(false);
      setCampaignData(initialCampaignData);
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaignData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignData.name.trim() || !campaignData.description.trim()) {
      showNotification("Nome e Descrição Curta da Campanha são obrigatórios.", 3000);
      return;
    }

    const campaignIdToSave = id || `${Date.now()}`;
    
    let campaignToSave: CampaignFull;
    if(isEditing && id) {
        const existingSheet = localStorage.getItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${id}`);
        const existingFullData: Partial<CampaignFull> = existingSheet ? JSON.parse(existingSheet) : {};
        campaignToSave = {
            ...(existingFullData as CampaignFull), // Preserva sessões, participantes, npcs
            id: id, // Garante que o ID é o da edição
            name: campaignData.name,
            description: campaignData.description,
            longDescription: campaignData.longDescription,
            status: campaignData.status,
            gm: campaignData.gm,
            imageUrl: campaignData.imageUrl,
            setting: campaignData.setting,
            // playerCount, sessionCount, npcCount e lastSessionDate são atualizados no summary
        };
    } else {
         campaignToSave = {
            id: campaignIdToSave,
            name: campaignData.name,
            description: campaignData.description,
            longDescription: campaignData.longDescription,
            status: campaignData.status,
            gm: campaignData.gm,
            imageUrl: campaignData.imageUrl,
            setting: campaignData.setting,
            sessions: [], // Inicializa vazio para novas campanhas
            participants: [], // Inicializa vazio
            npcs: [], // Inicializa vazio
        };
    }

    localStorage.setItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${campaignIdToSave}`, JSON.stringify(campaignToSave));

    const campaignListString = localStorage.getItem(CAMPAIGN_LIST_KEY);
    let campaignList: CampaignSummary[] = campaignListString ? JSON.parse(campaignListString) : [];
    
    const summary: CampaignSummary = {
      id: campaignIdToSave,
      name: campaignToSave.name,
      description: campaignToSave.description,
      status: campaignToSave.status,
      gm: campaignToSave.gm,
      imageUrl: campaignToSave.imageUrl,
      playerCount: campaignToSave.participants.length,
      sessionCount: campaignToSave.sessions.length,
      npcCount: campaignToSave.npcs?.length || 0,
      lastSessionDate: campaignToSave.sessions.length > 0 
        ? campaignToSave.sessions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
        : undefined,
    };

    const existingIndex = campaignList.findIndex(c => c.id === campaignIdToSave);
    if (existingIndex > -1) {
      campaignList[existingIndex] = summary;
    } else {
      campaignList.push(summary);
    }
    localStorage.setItem(CAMPAIGN_LIST_KEY, JSON.stringify(campaignList));

    showNotification(`Campanha "${campaignToSave.name}" ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, 3000);
    navigate(`/campaign/${campaignIdToSave}`); // Navega para a página de detalhes após salvar
  };
  
  const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-100 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      {notification && (
        <div className={`fixed top-20 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 p-3 rounded-md shadow-lg text-sm z-[150] text-white ${notification.toLowerCase().includes('erro') || notification.toLowerCase().includes('obrigat') ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification}
        </div>
      )}
      <h1 className="text-3xl font-bold text-sky-400 mb-6">{isEditing ? 'Editar Campanha' : 'Criar Nova Campanha'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={labelClass}>Nome da Campanha <span className="text-red-400">*</span></label>
          <input type="text" name="name" id="name" value={campaignData.name} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>Descrição Curta (para galeria) <span className="text-red-400">*</span></label>
          <textarea name="description" id="description" rows={3} value={campaignData.description} onChange={handleChange} className={inputClass} required />
        </div>
         <div>
          <label htmlFor="longDescription" className={labelClass}>Descrição Longa/Detalhada</label>
          <textarea name="longDescription" id="longDescription" rows={5} value={campaignData.longDescription || ''} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="setting" className={labelClass}>Cenário/Sistema</label>
          <input type="text" name="setting" id="setting" value={campaignData.setting || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 3DeT Victory, Era das Arcas" />
        </div>
        <div>
          <label htmlFor="gm" className={labelClass}>Nome do Mestre</label>
          <input type="text" name="gm" id="gm" value={campaignData.gm || ''} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="imageUrl" className={labelClass}>URL da Imagem de Capa</label>
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-slate-400"/>
            <input type="url" name="imageUrl" id="imageUrl" value={campaignData.imageUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://exemplo.com/imagem.jpg"/>
          </div>
          {campaignData.imageUrl && <img src={campaignData.imageUrl} alt="Preview da capa" className="mt-2 rounded-md max-h-40 object-contain mx-auto" />}
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select name="status" id="status" value={campaignData.status} onChange={handleChange} className={inputClass}>
            <option value="planejada">Planejada</option>
            <option value="ativa">Ativa</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button type="submit" className="flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300">
            <Save size={18} className="mr-2" /> {isEditing ? 'Atualizar Campanha' : 'Salvar Campanha'}
          </button>
          <button type="button" onClick={() => navigate(id ? `/campaign/${id}` : '/campaigns')} className="flex-1 flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-3 px-4 rounded-lg transition duration-300">
            <XSquare size={18} className="mr-2" /> Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignEditorPage;