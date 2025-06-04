import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CampaignFull, CampaignParticipant, CampaignSession, CharacterSummary, CampaignSummary, CAMPAIGN_SHEET_PREFIX_KEY, CAMPAIGN_LIST_KEY, CHARACTER_GALLERY_LIST_KEY } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Edit3, Trash2, PlusCircle, UserPlus, CalendarDays, StickyNote, Users, Shield, ImageIcon, AlertTriangle, Save, XSquare, ListChecks, Activity, CheckCircle, CircleSlash, Clock, BookOpen } from 'lucide-react';

// Componente para o modal de confirmação (reutilizado)
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  itemNameToDelete?: string;
  confirmText?: string;
  cancelText?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, itemNameToDelete, confirmText = "Confirmar Exclusão", cancelText = "Cancelar" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200] transition-opacity duration-300" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <AlertTriangle size={24} className="text-yellow-400 mr-3 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-sky-400">{title}</h3>
        </div>
        <p className="text-slate-300 mb-1 text-sm">{message}</p>
        {itemNameToDelete && <p className="text-slate-100 font-semibold text-center my-3 py-2 bg-slate-700/50 rounded-md">{itemNameToDelete}</p>}
        <p className="text-slate-300 mb-6 text-sm">Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-600 hover:bg-slate-500 text-slate-100 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// Modal para criar/editar sessão
const SessionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (session: CampaignSession) => void;
    sessionToEdit?: CampaignSession | null;
}> = ({ isOpen, onClose, onSave, sessionToEdit }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [status, setStatus] = useState<'planejada' | 'ativa' | 'concluída'>('planejada');
    const [summary, setSummary] = useState('');

    useEffect(() => {
        if (sessionToEdit) {
            setTitle(sessionToEdit.title);
            setDate(sessionToEdit.date ? new Date(sessionToEdit.date).toISOString().slice(0, 16) : '');
            setStatus(sessionToEdit.status);
            setSummary(sessionToEdit.summary);
        } else {
            setTitle('');
            setDate(new Date().toISOString().slice(0, 16));
            setStatus('planejada');
            setSummary('');
        }
    }, [sessionToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date) {
            alert("Título e Data da Sessão são obrigatórios.");
            return;
        }
        onSave({
            id: sessionToEdit?.id || `sess_${Date.now()}`,
            title,
            date,
            status,
            summary
        });
        onClose();
    };
    
    const inputClass = "w-full px-3 py-2 rounded-md bg-slate-700 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-400 text-sm";
    const labelClass = "block text-xs font-medium text-slate-300 mb-1";

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold text-sky-400 mb-4">{sessionToEdit ? 'Editar Sessão' : 'Nova Sessão'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label htmlFor="sessionTitle" className={labelClass}>Título <span className="text-red-400">*</span></label><input type="text" id="sessionTitle" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required /></div>
                    <div><label htmlFor="sessionDate" className={labelClass}>Data e Hora <span className="text-red-400">*</span></label><input type="datetime-local" id="sessionDate" value={date} onChange={e => setDate(e.target.value)} className={inputClass} required/></div>
                    <div><label htmlFor="sessionStatus" className={labelClass}>Status</label><select id="sessionStatus" value={status} onChange={e => setStatus(e.target.value as any)} className={inputClass}><option value="planejada">Planejada</option><option value="ativa">Ativa</option><option value="concluída">Concluída</option></select></div>
                    <div><label htmlFor="sessionSummary" className={labelClass}>Anotações/Resumo</label><textarea id="sessionSummary" rows={4} value={summary} onChange={e => setSummary(e.target.value)} className={inputClass}></textarea></div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-slate-600 hover:bg-slate-500 text-slate-100 transition-colors"><XSquare size={16} className="mr-1.5"/>Cancelar</button>
                        <button type="submit" className="flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"><Save size={16} className="mr-1.5"/>Salvar Sessão</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CampaignDetailPage: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<CampaignSession | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'campaign' | 'session' | 'participant', id: string, name: string } | null>(null);

  const [availableCharacters, setAvailableCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharacterToAdd, setSelectedCharacterToAdd] = useState('');

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification(message);
    setTimeout(() => setNotification(null), isError ? 4000 : 2500);
  };
  
  const loadCampaignData = useCallback(() => {
    if (!campaignId) {
      setError("ID da Campanha não fornecido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const campaignSheetString = localStorage.getItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${campaignId}`);
      if (campaignSheetString) {
        const loadedCampaign: CampaignFull = JSON.parse(campaignSheetString);
        loadedCampaign.sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCampaign(loadedCampaign);
      } else {
        setError("Campanha não encontrada.");
        setCampaign(null);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da campanha:", e);
      setError("Falha ao carregar dados da campanha.");
    }
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    loadCampaignData();
    const galleryListString = localStorage.getItem(CHARACTER_GALLERY_LIST_KEY);
    const summaries: CharacterSummary[] = galleryListString ? JSON.parse(galleryListString) : [];
    setAvailableCharacters(summaries);
  }, [campaignId, loadCampaignData]);

  const saveCampaign = useCallback((updatedCampaign: CampaignFull) => {
    if(!updatedCampaign) return;
    localStorage.setItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${updatedCampaign.id}`, JSON.stringify(updatedCampaign));
    
    const campaignListString = localStorage.getItem(CAMPAIGN_LIST_KEY);
    let campaignList: CampaignSummary[] = campaignListString ? JSON.parse(campaignListString) : [];
    const summaryIndex = campaignList.findIndex(c => c.id === updatedCampaign.id);
    
    const sortedSessions = [...updatedCampaign.sessions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (summaryIndex > -1) {
      campaignList[summaryIndex] = {
        ...campaignList[summaryIndex], // Preserve other summary fields if any
        id: updatedCampaign.id, // ensure id is correct
        name: updatedCampaign.name,
        description: updatedCampaign.description, // Short description
        status: updatedCampaign.status,
        gm: updatedCampaign.gm,
        imageUrl: updatedCampaign.imageUrl,
        setting: updatedCampaign.setting,
        playerCount: updatedCampaign.participants.length,
        sessionCount: updatedCampaign.sessions.length,
        npcCount: updatedCampaign.npcs?.length || 0,
        lastSessionDate: sortedSessions.length > 0 ? sortedSessions[0].date : undefined,
      };
      localStorage.setItem(CAMPAIGN_LIST_KEY, JSON.stringify(campaignList));
    }
    setCampaign(updatedCampaign);
  }, []);


  const handleSaveSession = (session: CampaignSession) => {
    if (!campaign) return;
    const existingSessionIndex = campaign.sessions.findIndex(s => s.id === session.id);
    let updatedSessions;
    if (existingSessionIndex > -1) {
      updatedSessions = campaign.sessions.map(s => s.id === session.id ? session : s);
    } else {
      updatedSessions = [...campaign.sessions, session];
    }
    updatedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveCampaign({ ...campaign, sessions: updatedSessions });
    showNotification(`Sessão "${session.title}" salva.`);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!campaign) return;
    const updatedSessions = campaign.sessions.filter(s => s.id !== sessionId);
    updatedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveCampaign({ ...campaign, sessions: updatedSessions });
    showNotification("Sessão excluída.");
  };

  const handleAddParticipant = () => {
    if (!campaign || !selectedCharacterToAdd) return;
    const charSummary = availableCharacters.find(c => c.id === selectedCharacterToAdd);
    if (!charSummary) { showNotification("Personagem não encontrado na galeria.", true); return; }
    if (campaign.participants.some(p => p.characterId === charSummary.id)) { showNotification("Este personagem já participa da campanha.", true); return; }

    const newParticipant: CampaignParticipant = {
      characterId: charSummary.id,
      characterName: charSummary.name,
      avatarUrl: charSummary.avatarUrl,
      status: 'ativo', // Default status
    };
    const updatedParticipants = [...campaign.participants, newParticipant];
    saveCampaign({ ...campaign, participants: updatedParticipants });
    setSelectedCharacterToAdd('');
    showNotification(`"${charSummary.name}" adicionado à campanha.`);
  };

  const handleRemoveParticipant = (characterId: string) => {
    if (!campaign) return;
    const updatedParticipants = campaign.participants.filter(p => p.characterId !== characterId);
    saveCampaign({ ...campaign, participants: updatedParticipants });
    showNotification("Participante removido.");
  };
  
  const handleDeleteCampaign = () => {
    if (!campaign) return;
    localStorage.removeItem(`${CAMPAIGN_SHEET_PREFIX_KEY}${campaign.id}`);
    const campaignListString = localStorage.getItem(CAMPAIGN_LIST_KEY);
    if (campaignListString) {
        let campaignList: CampaignSummary[] = JSON.parse(campaignListString);
        campaignList = campaignList.filter(c => c.id !== campaign.id);
        localStorage.setItem(CAMPAIGN_LIST_KEY, JSON.stringify(campaignList));
    }
    showNotification(`Campanha "${campaign.name}" excluída.`);
    navigate('/campaigns');
  };
  
  const requestDelete = (type: 'campaign' | 'session' | 'participant', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'campaign') handleDeleteCampaign();
    else if (itemToDelete.type === 'session') handleDeleteSession(itemToDelete.id);
    else if (itemToDelete.type === 'participant') handleRemoveParticipant(itemToDelete.id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const getStatusIconAndColor = (status: CampaignSession['status']) => {
    if (status === 'ativa') return { icon: <Activity size={14} className="mr-1 text-green-400"/>, color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500' };
    if (status === 'concluída') return { icon: <CheckCircle size={14} className="mr-1 text-slate-400"/>, color: 'text-slate-400', bgColor: 'bg-slate-600/30 border-slate-500' };
    return { icon: <Clock size={14} className="mr-1 text-yellow-400"/>, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500' };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-xl text-red-400 py-10">{error}</p>;
  if (!campaign) return <p className="text-center text-xl text-slate-400 py-10">Campanha não encontrada ou ID inválido.</p>;

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl">
      {notification && <div className={`fixed top-20 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 p-3 rounded-md shadow-lg text-sm z-[250] text-white ${notification.toLowerCase().includes('erro') || notification.toLowerCase().includes('falha') ? 'bg-red-500' : 'bg-green-500'}`}>{notification}</div>}
      
      <header className="mb-6 pb-4 border-b border-slate-700">
        {campaign.imageUrl ? (
          <img src={campaign.imageUrl} alt={`Capa de ${campaign.name}`} className="w-full h-56 sm:h-72 object-cover rounded-lg mb-4 shadow-lg" />
        ) : (
          <div className="w-full h-56 sm:h-72 bg-slate-700 flex items-center justify-center text-slate-500 rounded-lg mb-4 shadow-lg"><ImageIcon size={64} /></div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-sky-400 mb-1">{campaign.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-1 inline-block ${campaign.status === 'ativa' ? 'bg-green-500 text-green-100' : campaign.status === 'finalizada' ? 'bg-slate-600 text-slate-300' : 'bg-yellow-500 text-yellow-100'}`}>
              {campaign.status.toUpperCase()}
            </span>
            {campaign.gm && <p className="text-sm text-slate-400">Mestre: <span className="font-semibold text-slate-300">{campaign.gm}</span></p>}
            {campaign.setting && <p className="text-sm text-slate-400">Cenário: <span className="font-semibold text-slate-300">{campaign.setting}</span></p>}
             <p className="text-sm text-slate-400">Jogadores: {campaign.participants.length} | Sessões: {campaign.sessions.length} {campaign.npcs && campaign.npcs.length > 0 ? `| NPCs: ${campaign.npcs.length}` : ''}</p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0 flex-shrink-0">
            <Link to={`/campaign/edit/${campaign.id}`} className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-md transition-colors"><Edit3 size={14} className="mr-1"/> Editar</Link>
            <button onClick={() => requestDelete('campaign', campaign.id, campaign.name)} className="flex items-center text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md transition-colors"><Trash2 size={14} className="mr-1"/> Excluir</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2 space-y-6">
          {campaign.longDescription && (
            <div><h2 className="text-xl font-semibold text-sky-300 mb-2 flex items-center"><StickyNote size={18} className="mr-2"/>Descrição Detalhada</h2><p className="text-slate-300 leading-relaxed whitespace-pre-line bg-slate-700/40 p-3 rounded-md">{campaign.longDescription}</p></div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-sky-300 flex items-center"><CalendarDays size={18} className="mr-2"/>Sessões ({campaign.sessions.length})</h2>
              <button onClick={() => { setSessionToEdit(null); setIsSessionModalOpen(true); }} className="flex items-center text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2.5 rounded-md transition-colors"><PlusCircle size={14} className="mr-1"/> Nova Sessão</button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 bg-slate-800/30 p-3 rounded-md">
              {campaign.sessions.map(session => {
                 const statusInfo = getStatusIconAndColor(session.status);
                 return(
                    <div key={session.id} className={`p-3 rounded-lg shadow-sm border-l-4 ${statusInfo.bgColor}`}>
                        <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-sky-200">{session.title}</h4>
                            <p className="text-xs text-slate-400 mb-1">Data: {new Date(session.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            <p className={`text-xs font-medium flex items-center ${statusInfo.color}`}>{statusInfo.icon} {session.status.charAt(0).toUpperCase() + session.status.slice(1)}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => { setSessionToEdit(session); setIsSessionModalOpen(true);}} className="text-blue-400 hover:text-blue-300 p-1" aria-label={`Editar sessão ${session.title}`}><Edit3 size={14}/></button>
                            <button onClick={() => requestDelete('session', session.id, session.title)} className="text-red-400 hover:text-red-300 p-1" aria-label={`Excluir sessão ${session.title}`}><Trash2 size={14}/></button>
                        </div>
                        </div>
                        {session.summary && <p className="text-sm text-slate-300 mt-1.5 pt-1.5 border-t border-slate-700/50 line-clamp-3">{session.summary}</p>}
                    </div>
              )})}
              {campaign.sessions.length === 0 && <p className="text-slate-400 text-sm">Nenhuma sessão registrada.</p>}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-sky-300 mb-2 flex items-center"><Users size={18} className="mr-2"/>Participantes ({campaign.participants.length})</h2>
            <div className="mb-3 flex gap-2">
              <select value={selectedCharacterToAdd} onChange={e => setSelectedCharacterToAdd(e.target.value)} className="flex-grow px-3 py-1.5 rounded-md bg-slate-700 border border-slate-600 text-slate-100 text-xs focus:ring-sky-500 focus:border-sky-500">
                <option value="">Selecionar Personagem...</option>
                {availableCharacters.filter(ac => !campaign.participants.some(p => p.characterId === ac.id)).map(char => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
              <button onClick={handleAddParticipant} disabled={!selectedCharacterToAdd} className="flex items-center text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold py-1 px-2.5 rounded-md transition-colors disabled:opacity-50"><UserPlus size={14} className="mr-1"/> Adicionar</button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1 bg-slate-800/30 p-3 rounded-md">
              {campaign.participants.map(p => (
                <li key={p.characterId} className="flex items-center justify-between bg-slate-700/50 p-2.5 rounded-lg">
                  <div className="flex items-center">
                    <img src={p.avatarUrl || 'https://via.placeholder.com/32/64748b/FFFFFF?Text=P'} alt={p.characterName} className="w-8 h-8 rounded-full mr-2.5 object-cover"/>
                    <div>
                      <p className="font-medium text-sm text-slate-200">{p.characterName}</p>
                      {p.playerName && <p className="text-xs text-slate-400">{p.playerName}</p>}
                    </div>
                  </div>
                  <button onClick={() => requestDelete('participant', p.characterId, p.characterName)} className="text-red-400 hover:text-red-300 p-0.5" aria-label={`Remover ${p.characterName}`}><Trash2 size={14}/></button>
                </li>
              ))}
               {campaign.participants.length === 0 && <p className="text-slate-400 text-sm">Nenhum participante.</p>}
            </ul>
          </div>
          {campaign.npcs && campaign.npcs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-sky-300 mb-2 flex items-center"><BookOpen size={18} className="mr-2"/>NPCs da Campanha ({campaign.npcs.length})</h2>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-1 bg-slate-800/30 p-3 rounded-md">
                {campaign.npcs.map(npc => (
                  <li key={npc.id} className="flex items-center bg-slate-700/50 p-2.5 rounded-lg">
                    <img src={npc.avatarUrl || 'https://via.placeholder.com/32/475569/FFFFFF?Text=N'} alt={npc.name} className="w-8 h-8 rounded-full mr-2.5 object-cover"/>
                    <div>
                      <p className="font-medium text-sm text-slate-200">{npc.name}</p>
                      {npc.conceito && <p className="text-xs text-amber-400">{npc.conceito}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      <SessionModal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} onSave={handleSaveSession} sessionToEdit={sessionToEdit} />
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        title={`Confirmar Exclusão de ${itemToDelete?.type === 'campaign' ? 'Campanha' : itemToDelete?.type === 'session' ? 'Sessão' : 'Participante'}`}
        message={`Tem certeza que deseja excluir ${itemToDelete?.type === 'campaign' ? 'a campanha' : itemToDelete?.type === 'session' ? 'a sessão' : 'o participante'}:`}
        itemNameToDelete={itemToDelete?.name}
        onConfirm={confirmDelete}
        onCancel={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
      />
    </div>
  );
};

export default CampaignDetailPage;