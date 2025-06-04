import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CampaignSummary, CAMPAIGN_LIST_KEY, CAMPAIGN_SHEET_PREFIX_KEY } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusCircle, Trash2, AlertTriangle, Eye, Edit3, Users, CalendarDays, BookOpen, ImageIcon } from 'lucide-react';

const CampaignCard: React.FC<{ campaign: CampaignSummary, onDeleteRequest: (id: string, name: string) => void }> = React.memo(({ campaign, onDeleteRequest }) => (
  <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 hover:shadow-sky-500/20 hover:ring-1 hover:ring-sky-500">
    <Link to={`/campaign/${campaign.id}`} className="block flex-grow">
      {campaign.imageUrl ? (
        <img className="w-full h-48 object-cover" src={campaign.imageUrl} alt={`Imagem da campanha ${campaign.name}`} />
      ) : (
        <div className="w-full h-48 bg-slate-700 flex items-center justify-center text-slate-500">
            <ImageIcon size={48} className="text-slate-600"/>
        </div>
      )}
      <div className="p-5">
        <h3 className="text-xl font-semibold text-sky-400 mb-1 truncate" title={campaign.name}>{campaign.name}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${campaign.status === 'ativa' ? 'bg-green-500 text-green-100' : campaign.status === 'finalizada' ? 'bg-slate-600 text-slate-100' : 'bg-yellow-500 text-yellow-100'}`}>
          {campaign.status.toUpperCase()}
        </span>
        <p className="text-slate-400 text-sm mb-2 leading-relaxed line-clamp-3">
          {campaign.description}
        </p>
        <div className="mt-2 space-y-1 text-xs text-slate-500">
            {campaign.gm && <p>Mestre: {campaign.gm}</p>}
            <div className="flex items-center gap-2 flex-wrap">
                {campaign.playerCount !== undefined && <span className="flex items-center"><Users size={12} className="mr-1"/> {campaign.playerCount} Jog.</span>}
                {campaign.sessionCount !== undefined && <span className="flex items-center"><CalendarDays size={12} className="mr-1"/> {campaign.sessionCount} Sess.</span>}
                {campaign.npcCount !== undefined && campaign.npcCount > 0 && <span className="flex items-center"><BookOpen size={12} className="mr-1"/> {campaign.npcCount} NPCs</span>}
            </div>
            {campaign.lastSessionDate && <p className="text-xs text-slate-500 mt-1">Última Sessão: {new Date(campaign.lastSessionDate).toLocaleDateString('pt-BR')}</p>}
        </div>

      </div>
    </Link>
    <div className="p-3 border-t border-slate-700 space-y-2">
        <Link 
            to={`/campaign/${campaign.id}`}
            className="flex items-center justify-center w-full text-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors"
        >
            <Eye size={16} className="mr-2"/> Ver Detalhes
        </Link>
        <Link 
            to={`/campaign/edit/${campaign.id}`}
            className="flex items-center justify-center w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors"
        >
            <Edit3 size={16} className="mr-2"/> Editar
        </Link>
        <button
            onClick={() => onDeleteRequest(campaign.id, campaign.name)}
            className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors"
        >
            <Trash2 size={16} className="mr-2"/> Excluir
        </button>
    </div>
  </div>
));

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  itemNameToDelete?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, itemNameToDelete }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200] transition-opacity duration-300"
        onClick={onCancel} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
    >
      <div 
        className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-center mb-4">
          <AlertTriangle size={24} className="text-yellow-400 mr-3 flex-shrink-0" />
          <h3 id="confirmation-modal-title" className="text-xl font-semibold text-sky-400">{title}</h3>
        </div>
        <p className="text-slate-300 mb-1 text-sm">
          {message}
        </p>
        {itemNameToDelete && (
            <p className="text-slate-100 font-semibold text-center my-3 py-2 bg-slate-700/50 rounded-md">
                {itemNameToDelete}
            </p>
        )}
        <p className="text-slate-300 mb-6 text-sm">
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-600 hover:bg-slate-500 text-slate-100 transition-colors"
            aria-label="Cancelar exclusão"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
            aria-label="Confirmar exclusão"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};


const CampaignGalleryPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{id: string, name: string} | null>(null);

  const showNotification = (message: string, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  const loadCampaigns = useCallback(() => {
    setLoading(true);
    try {
      const campaignListString = localStorage.getItem(CAMPAIGN_LIST_KEY);
      let loadedCampaigns: CampaignSummary[] = campaignListString ? JSON.parse(campaignListString) : [];
      
      // Ordenar: campanhas com lastSessionDate mais recente primeiro, depois por nome
      loadedCampaigns.sort((a, b) => {
        if (a.lastSessionDate && b.lastSessionDate) {
          return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime();
        }
        if (a.lastSessionDate) return -1; // Campanhas com data vêm antes das sem data
        if (b.lastSessionDate) return 1;  // Campanhas com data vêm antes das sem data
        return a.name.localeCompare(b.name); // Se ambas não têm data, ordena por nome
      });
      setCampaigns(loadedCampaigns);
    } catch (e) {
      console.error("Erro ao carregar campanhas:", e);
      showNotification("Erro ao carregar campanhas.", 3000);
      setCampaigns([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCampaigns();
    
    // Adiciona um listener para o evento 'storage' para recarregar se outra aba modificar o localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CAMPAIGN_LIST_KEY || (event.key && event.key.startsWith(CAMPAIGN_SHEET_PREFIX_KEY))) {
        loadCampaigns();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [loadCampaigns]);

  const handleDeleteRequest = (id: string, name: string) => {
    setCampaignToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCampaign = () => {
    if (!campaignToDelete) return;
    try {
      localStorage.removeItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${campaignToDelete.id}`);
      const currentCampaignListString = localStorage.getItem(CAMPAIGN_LIST_KEY);
      if (currentCampaignListString) {
        let campaignList: CampaignSummary[] = JSON.parse(currentCampaignListString);
        campaignList = campaignList.filter(camp => camp.id !== campaignToDelete.id);
        localStorage.setItem(CAMPAIGN_LIST_KEY, JSON.stringify(campaignList));
      }
      setCampaigns(prev => prev.filter(camp => camp.id !== campaignToDelete!.id));
      showNotification(`Campanha "${campaignToDelete.name}" excluída com sucesso.`, 2000);
    } catch (e) {
      console.error("Erro ao excluir campanha:", e);
      showNotification("Erro ao excluir campanha.", 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setCampaignToDelete(null);
    }
  };


  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {notification && (
        <div className={`fixed top-20 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 p-3 rounded-md shadow-lg text-sm z-[150] text-white ${notification.toLowerCase().includes('erro') ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification}
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-sky-400">Galeria de Campanhas</h1>
        <Link 
          to="/campaign/new"
          className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          aria-label="Criar Nova Campanha"
        >
          <PlusCircle size={18} className="mr-2"/> Criar Nova Campanha
        </Link>
      </div>
      {campaigns.length === 0 && !loading ? (
         <p className="text-center text-lg text-slate-400 py-10">Nenhuma campanha encontrada. Que tal <Link to="/campaign/new" className="text-sky-400 hover:underline">criar uma nova</Link>?</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <CampaignCard key={camp.id} campaign={camp} onDeleteRequest={handleDeleteRequest} />
          ))}
        </div>
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirmar Exclusão de Campanha"
        message="Tem certeza que deseja excluir permanentemente a campanha:"
        itemNameToDelete={campaignToDelete?.name}
        onConfirm={confirmDeleteCampaign}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCampaignToDelete(null);
        }}
      />
    </div>
  );
};

export default CampaignGalleryPage;