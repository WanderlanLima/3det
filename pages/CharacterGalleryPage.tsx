import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CharacterSummary, CharacterFormData, CompendiumItem, EscalaPersonagem, CHARACTER_GALLERY_LIST_KEY, CHARACTER_SHEET_PREFIX_KEY, LAST_EDITED_CHAR_ID_KEY } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import GalleryFilters from '../components/GalleryFilters'; // Importado
import { Trash2, Edit3, Eye, UploadCloud, PlusCircle, AlertTriangle } from 'lucide-react';

const CharacterCard: React.FC<{ character: CharacterSummary, onDeleteRequest: (id: string, name: string) => void }> = React.memo(({ character, onDeleteRequest }) => (
  <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 hover:shadow-sky-500/20 hover:ring-1 hover:ring-sky-500">
    <div className="flex-grow">
      {character.avatarUrl ? (
        <img className="w-full h-60 object-cover" src={character.avatarUrl} alt={`Avatar de ${character.name}`} />
      ) : (
        <div className="w-full h-60 bg-slate-700 flex items-center justify-center text-slate-500">Sem Imagem</div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-sky-400 mb-1">{character.name}</h3>
        {character.conceito && <p className="text-sm text-amber-400 font-mono mb-2 line-clamp-2">{character.conceito}</p>}
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
          {character.description || "Um aventureiro pronto para o perigo."}
        </p>
      </div>
    </div>
    <div className="p-4 border-t border-slate-700 space-y-2">
       <Link 
        to={`/character/view/${character.id}`}
        className="flex items-center justify-center w-full text-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors"
      >
        <Eye size={16} className="mr-2"/> Visualizar
      </Link>
      <Link 
        to={`/character/edit/${character.id}`}
        className="flex items-center justify-center w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors"
      >
        <Edit3 size={16} className="mr-2"/> Editar
      </Link>
      <button
        onClick={() => onDeleteRequest(character.id, character.name)}
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
  characterNameToDelete?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, characterNameToDelete }) => {
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
        {characterNameToDelete && (
            <p className="text-slate-100 font-semibold text-center my-3 py-2 bg-slate-700/50 rounded-md">
                {characterNameToDelete}
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

const CharacterGalleryPage: React.FC = () => {
  const [allCharactersData, setAllCharactersData] = useState<CharacterFormData[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<CharacterSummary[]>([]);
  const [archetypeOptions, setArchetypeOptions] = useState<{id: string, name: string}[]>([]);
  const escalaOptions: EscalaPersonagem[] = ["Ningen", "Sugoi", "Kiodai", "Kami"];

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<{id: string, name: string} | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetypeId, setSelectedArchetypeId] = useState('');
  const [selectedEscala, setSelectedEscala] = useState('');

  const showNotification = (message: string, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  const loadCharactersAndData = useCallback(async () => {
    setLoading(true);
    try {
      const galleryListString = localStorage.getItem(CHARACTER_GALLERY_LIST_KEY);
      const loadedSummaries: CharacterSummary[] = galleryListString ? JSON.parse(galleryListString) : [];
      
      const charactersFullData: CharacterFormData[] = [];
      for (const summary of loadedSummaries) {
        const charSheetString = localStorage.getItem(`${CHARACTER_SHEET_PREFIX_KEY}${summary.id}`);
        if (charSheetString) {
          charactersFullData.push(JSON.parse(charSheetString));
        }
      }
      setAllCharactersData(charactersFullData);

      // Carregar arquétipos para o filtro
      const archetypesResponse = await fetch('/data/arquetipos.json');
      if (!archetypesResponse.ok) throw new Error('Falha ao carregar arquétipos');
      const archetypesData: CompendiumItem[] = await archetypesResponse.json();
      setArchetypeOptions(archetypesData.map(arch => ({ id: arch.id, name: arch.name })));

    } catch (e) {
      console.error("Erro ao carregar fichas e dados:", e);
      setAllCharactersData([]);
      setArchetypeOptions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCharactersAndData();
  }, [loadCharactersAndData]);

  // Lógica de Filtragem
  useEffect(() => {
    let tempFilteredData = [...allCharactersData];

    if (searchTerm) {
      tempFilteredData = tempFilteredData.filter(charData =>
        charData.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedArchetypeId) {
      tempFilteredData = tempFilteredData.filter(charData =>
        charData.archetype?.id === selectedArchetypeId
      );
    }

    if (selectedEscala) {
      tempFilteredData = tempFilteredData.filter(charData =>
        charData.escala === selectedEscala
      );
    }
    
    // Mapear para CharacterSummary para renderização
    const summaries = tempFilteredData.map(charData => ({
      id: charData.id || '',
      name: charData.name,
      conceito: charData.conceito,
      avatarUrl: charData.avatarUrl,
      nivelDePoder: charData.nivelDePoder,
      description: charData.description,
    }));
    setFilteredCharacters(summaries);

  }, [allCharactersData, searchTerm, selectedArchetypeId, selectedEscala]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedArchetypeId('');
    setSelectedEscala('');
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setCharacterToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCharacter = () => {
    if (!characterToDelete) return;
    try {
      localStorage.removeItem(`${CHARACTER_SHEET_PREFIX_KEY}${characterToDelete.id}`);
      
      const currentGalleryListString = localStorage.getItem(CHARACTER_GALLERY_LIST_KEY);
      if (currentGalleryListString) {
        let galleryList: CharacterSummary[] = JSON.parse(currentGalleryListString);
        galleryList = galleryList.filter(char => char.id !== characterToDelete.id);
        localStorage.setItem(CHARACTER_GALLERY_LIST_KEY, JSON.stringify(galleryList));
      }
      // Recarregar dados para refletir a exclusão e re-filtrar
      loadCharactersAndData();
      showNotification(`Ficha "${characterToDelete.name}" excluída com sucesso.`, 2000);
    } catch (e) {
      console.error("Erro ao excluir ficha:", e);
      showNotification("Erro ao excluir ficha.", 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setCharacterToDelete(null);
    }
  };

  const validateCharacterData = (data: any): data is CharacterFormData => {
    return data && typeof data.name === 'string' &&
           typeof data.nivelDePoder === 'number' &&
           typeof data.xp === 'number' &&
           typeof data.escala === 'string' &&
           data.attributes && typeof data.attributes.poder === 'number' &&
           typeof data.attributes.habilidade === 'number' &&
           typeof data.attributes.resistencia === 'number';
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          showNotification("Erro ao ler o arquivo.", 3000);
          return;
        }
        const importedData = JSON.parse(text);

        if (!validateCharacterData(importedData)) {
          showNotification("Arquivo JSON inválido ou não compatível com 3DeT Victory.", 4000);
          return;
        }
        
        const charId = importedData.id || `${Date.now()}`;
        const characterToImport: CharacterFormData = { ...importedData, id: charId };

        localStorage.setItem(`${CHARACTER_SHEET_PREFIX_KEY}${charId}`, JSON.stringify(characterToImport));
        
        const galleryListString = localStorage.getItem(CHARACTER_GALLERY_LIST_KEY);
        let galleryList: CharacterSummary[] = galleryListString ? JSON.parse(galleryListString) : [];
        
        const summary: CharacterSummary = {
          id: charId,
          name: characterToImport.name,
          conceito: characterToImport.conceito,
          avatarUrl: characterToImport.avatarUrl,
          nivelDePoder: characterToImport.nivelDePoder,
          description: characterToImport.description,
        };

        const existingIndex = galleryList.findIndex(c => c.id === charId);
        if (existingIndex > -1) {
          galleryList[existingIndex] = summary;
        } else {
          galleryList.push(summary);
        }
        localStorage.setItem(CHARACTER_GALLERY_LIST_KEY, JSON.stringify(galleryList));
        localStorage.setItem(LAST_EDITED_CHAR_ID_KEY, charId);
        
        loadCharactersAndData(); // Recarrega e aplica filtros
        showNotification(`Ficha "${characterToImport.name}" importada com sucesso!`, 3000);
        navigate(`/character/edit/${charId}`);

      } catch (error) {
        console.error("Erro ao importar ficha:", error);
        showNotification("Erro ao processar o arquivo JSON. Verifique o formato.", 4000);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
       {notification && (
        <div className={`fixed top-20 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 p-3 rounded-md shadow-lg text-sm z-[150] text-white ${notification.toLowerCase().includes('erro') || notification.toLowerCase().includes('inválido') ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification}
        </div>
      )}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold text-sky-400">Galeria de Fichas</h1>
        <div className="flex gap-2 flex-wrap">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelected} 
            style={{display: 'none'}} 
            accept=".json"
          />
          <button
            onClick={triggerFileUpload}
            className="flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            <UploadCloud size={18} className="mr-2" /> Importar Ficha
          </button>
          <Link 
            to="/character/new"
            className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            <PlusCircle size={18} className="mr-2"/> Criar Nova Ficha
          </Link>
        </div>
      </div>

      <GalleryFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedArchetypeId={selectedArchetypeId}
        onArchetypeChange={setSelectedArchetypeId}
        archetypeOptions={archetypeOptions}
        selectedEscala={selectedEscala}
        onEscalaChange={setSelectedEscala}
        escalaOptions={escalaOptions}
        onClearFilters={handleClearFilters}
        resultsCount={filteredCharacters.length}
        totalCount={allCharactersData.length}
      />

      {filteredCharacters.length === 0 && !loading ? (
        <p className="text-center text-lg text-slate-400 py-10">
          Nenhuma ficha encontrada para os filtros selecionados. Tente <button onClick={handleClearFilters} className="text-sky-400 hover:underline">limpar os filtros</button>.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCharacters.map(char => (
            <CharacterCard key={char.id} character={char} onDeleteRequest={handleDeleteRequest} />
          ))}
        </div>
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir permanentemente a ficha de:`}
        characterNameToDelete={characterToDelete?.name}
        onConfirm={confirmDeleteCharacter}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCharacterToDelete(null);
        }}
      />
    </div>
  );
};

export default CharacterGalleryPage;
