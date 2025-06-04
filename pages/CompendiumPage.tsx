
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Importado
import { CompendiumItem } from '../types';
import CompendiumFilters from '../components/compendium/CompendiumFilters';
import CompendiumItemCard from '../components/compendium/CompendiumItemCard';
import CompendiumItemModal from '../components/compendium/CompendiumItemModal';
import LoadingSpinner from '../components/LoadingSpinner'; // Importado

const ITEMS_PER_PAGE = 12;
const ADD_ITEM_QUEUE_KEY = 'rpgCompanion.addItemToSheetQueue';
const CHARACTER_SHEET_ITEMS_KEY = 'rpgCompanion.characterSheetItemIds';
const LAST_EDITED_CHAR_ID_KEY = 'rpgCompanion.lastEditedCharacterId'; // Importado de types.ts (implicitamente)

const CompendiumPage: React.FC = () => {
  const navigate = useNavigate(); // Hook para navegação
  const [allItems, setAllItems] = useState<CompendiumItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CompendiumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<CompendiumItem['type']>>(new Set());
  
  const [selectedItem, setSelectedItem] = useState<CompendiumItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [characterSheetItemIds, setCharacterSheetItemIds] = useState<Set<string>>(new Set());

  // Load filter preferences from localStorage
  useEffect(() => {
    try {
      const savedSearchTerm = localStorage.getItem('compendiumSearchTerm');
      const savedSelectedTypes = localStorage.getItem('compendiumSelectedTypes');
      if (savedSearchTerm) setSearchTerm(savedSearchTerm);
      if (savedSelectedTypes) setSelectedTypes(new Set(JSON.parse(savedSelectedTypes)));
    } catch (e) {
      console.error("Error loading filter preferences:", e);
    }
  }, []);

  // Save filter preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('compendiumSearchTerm', searchTerm);
      localStorage.setItem('compendiumSelectedTypes', JSON.stringify(Array.from(selectedTypes)));
    } catch (e) {
      console.error("Error saving filter preferences:", e);
    }
  }, [searchTerm, selectedTypes]);

  useEffect(() => {
    fetch('/data/compendium.json')
      .then(response => {
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
         return response.json();
      })
      .then((data: CompendiumItem[]) => {
        setAllItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load compendium data:", err);
        setError("Não foi possível carregar os itens do compêndio.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const updateSheetItems = () => {
      try {
        const storedItemIds = localStorage.getItem(CHARACTER_SHEET_ITEMS_KEY);
        if (storedItemIds) {
          setCharacterSheetItemIds(new Set(JSON.parse(storedItemIds)));
        } else {
          setCharacterSheetItemIds(new Set());
        }
      } catch (e) {
        console.error("Error reading character sheet items from localStorage:", e);
        setCharacterSheetItemIds(new Set());
      }
    };

    updateSheetItems();
    window.addEventListener('storage', updateSheetItems);
    const intervalId = setInterval(updateSheetItems, 2000);

    return () => {
      window.removeEventListener('storage', updateSheetItems);
      clearInterval(intervalId);
    };
  }, []);

  const itemTypes = useMemo(() => {
    const types = new Set(allItems.map(item => item.type));
    return Array.from(types).sort();
  }, [allItems]);

  useEffect(() => {
    setCurrentPage(1);
    let items = allItems;
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    if (selectedTypes.size > 0) {
      items = items.filter(item => selectedTypes.has(item.type));
    }
    setFilteredItems(items);
  }, [searchTerm, selectedTypes, allItems]);

  const handleSearchChange = (term: string) => setSearchTerm(term);
  
  const handleTypeToggle = (type: CompendiumItem['type']) => {
    setSelectedTypes(prevTypes => {
      const newTypes = new Set(prevTypes);
      if (newTypes.has(type)) newTypes.delete(type);
      else newTypes.add(type);
      return newTypes;
    });
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTypes(new Set());
  };

  const handleViewDetails = (item: CompendiumItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddItemToSheet = useCallback((item: CompendiumItem) => {
    try {
      localStorage.setItem(ADD_ITEM_QUEUE_KEY, JSON.stringify({ id: item.id, type: item.type, name: item.name }));
      alert(`"${item.name}" foi marcado para adição à sua ficha. Volte ao Editor de Ficha para vê-lo adicionado.`);
    } catch (e) {
      console.error("Error adding item to sheet queue:", e);
      alert("Ocorreu um erro ao tentar adicionar o item à ficha.");
    }
  }, []);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const navigateToEditor = () => {
    const lastCharId = localStorage.getItem(LAST_EDITED_CHAR_ID_KEY);
    if (lastCharId) {
      navigate(`/character/edit/${lastCharId}`);
    } else {
      navigate('/character/new');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-xl text-red-400 py-10">{error}</p>;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-sky-400 mb-1">Compêndio de Regras</h1>
          <p className="text-slate-400">Explore vantagens, desvantagens, perícias, técnicas, truques e equipamentos.</p>
        </div>
        <button
            onClick={navigateToEditor}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            Ir para Editor de Ficha
        </button>
      </header>

      <CompendiumFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        availableTypes={itemTypes}
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        onClearFilters={handleClearFilters}
        resultsCount={filteredItems.length}
      />

      {filteredItems.length === 0 && !loading ? (
        <p className="text-center text-lg text-slate-400 py-10">Nenhum item encontrado para os filtros selecionados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedItems.map(item => (
            <CompendiumItemCard 
              key={item.id} 
              item={item} 
              onViewDetails={handleViewDetails}
              onAddToSheet={handleAddItemToSheet}
              isAdded={characterSheetItemIds.has(item.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-700 hover:bg-sky-600 rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-slate-300">Página {currentPage} de {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-700 hover:bg-sky-600 rounded-md disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {isModalOpen && selectedItem && (
        <CompendiumItemModal 
          item={selectedItem} 
          onClose={() => setIsModalOpen(false)}
          onAddToSheet={handleAddItemToSheet}
          isAdded={characterSheetItemIds.has(selectedItem.id)}
        />
      )}
    </div>
  );
};

export default CompendiumPage;
