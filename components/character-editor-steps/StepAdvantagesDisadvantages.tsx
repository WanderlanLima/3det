import React, { useState, useMemo } from 'react';
import { useCharacterWizard } from '../../src/contexts/CharacterWizardContext'; // Import context hook
import StepTemplate from '../../src/components/StepTemplate'; // Import StepTemplate
import { SelectedCompendiumItem, CompendiumItem } from '../../types'; // Assuming types are defined here

// Removed Props interface as we use context now

const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-300 text-xs";
const inputClass = "w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 placeholder-slate-400";

// Added props for navigation functions from the parent wizard component
interface StepAdvantagesDisadvantagesProps {
    onNext?: () => void;
    onPrevious?: () => void;
    compendiumItems: CompendiumItem[]; // Pass compendium data as prop
}

const StepAdvantagesDisadvantages: React.FC<StepAdvantagesDisadvantagesProps> = ({ onNext, onPrevious, compendiumItems }) => {
  const { state, dispatch } = useCharacterWizard(); // Use context
  const formData = state; // Use state from context

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState<CompendiumItem | null>(null);
  const [modalLevel, setModalLevel] = useState(1);

  // TODO: Refine point calculation - needs a central function
  const calculateTotalPointsSpent = (): number => {
    const attributePoints = (formData.attributes.poder || 0) + (formData.attributes.habilidade || 0) + (formData.attributes.resistencia || 0);
    const skillPoints = formData.skills.reduce((acc, skill) => acc + (skill.cost || 0), 0);
    const advantagePoints = formData.advantages
        .filter(v => !v.isFromArchetype)
        .reduce((acc, adv) => acc + (adv.cost || 0), 0);
    const disadvantagePointsGained = Math.min(
        formData.disadvantages
            .filter(d => !d.isFromArchetype)
            .reduce((acc, dis) => acc + Math.abs(dis.cost || 0), 0),
        2 // Max 2 points from disadvantages
    );
    // Add costs from kits, etc. here later
    const kitPoints = 0; // Placeholder
    return attributePoints + skillPoints + advantagePoints - disadvantagePointsGained + kitPoints;
  };

  const totalPointsAvailable = formData.nivelDePoder || 10;
  const totalPointsSpent = calculateTotalPointsSpent();
  const pontosRestantes = totalPointsAvailable - totalPointsSpent;

  const allAdvantages = useMemo(() => compendiumItems.filter(item => item.type === 'Vantagem').sort((a, b) => a.name.localeCompare(b.name)), [compendiumItems]);
  const allDisadvantages = useMemo(() => compendiumItems.filter(item => item.type === 'Desvantagem').sort((a, b) => a.name.localeCompare(b.name)), [compendiumItems]);

  const filteredAdvantages = useMemo(() => allAdvantages.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allAdvantages, searchTerm]);

  const filteredDisadvantages = useMemo(() => allDisadvantages.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allDisadvantages, searchTerm]);

  const handleToggleItem = (itemToToggle: CompendiumItem | SelectedCompendiumItem, listType: 'advantages' | 'disadvantages', level?: number) => {
    const currentList = formData[listType];
    const isSelected = currentList.some(item => item.id === itemToToggle.id && !item.isFromArchetype);
    
    const compendiumItemForAdding = itemToToggle as CompendiumItem; 
    const baseItemCost = compendiumItemForAdding.cost || 0;
    const currentItemLevel = level || (compendiumItemForAdding.variableCost ? (compendiumItemForAdding.min || 1) : 1);
    const totalItemCost = compendiumItemForAdding.variableCost ? baseItemCost * currentItemLevel : baseItemCost;

    if (isSelected) {
      // Dispatch REMOVE_ITEM action using the ID from the SelectedCompendiumItem
      dispatch({ type: 'REMOVE_ITEM', field: listType, value: itemToToggle.id });
    } else {
      const isAdvantage = listType === 'advantages';
      const currentDisadvantagePointsGained = Math.min(
        formData.disadvantages.filter(d => !d.isFromArchetype).reduce((acc, dis) => acc + Math.abs(dis.cost || 0), 0),
        2
      );

      if (isAdvantage && (pontosRestantes < totalItemCost)) {
        alert("Pontos de personagem insuficientes para adicionar esta Vantagem.");
        return;
      }
      if (!isAdvantage && Math.abs(totalItemCost) > 0 && currentDisadvantagePointsGained >= 2) {
         alert("Limite de +2 pontos de Desvantagens já atingido. Você pode adicionar esta Desvantagem, mas não ganhará mais pontos por ela.");
         // Allow adding, but points won't increase beyond 2
      }
      
      // Check for incompatible items (Antipático/Carismático)
      if (compendiumItemForAdding.name === "Antipático" && formData.advantages.some(v => v.name === "Carismático" && !v.isFromArchetype)) {
        alert("Não pode ter Antipático e Carismático juntos."); return;
      }
      if (compendiumItemForAdding.name === "Carismático" && formData.disadvantages.some(d => d.name === "Antipático" && !d.isFromArchetype)) {
        alert("Não pode ter Carismático e Antipático juntos."); return;
      }

      const itemToAdd: SelectedCompendiumItem = { 
        ...compendiumItemForAdding, 
        cost: totalItemCost, 
        isFromArchetype: false,
        variableCost: compendiumItemForAdding.variableCost,
        costDetails: compendiumItemForAdding.costDetails,
        min: compendiumItemForAdding.min,
        max: compendiumItemForAdding.max,
        currentLevel: compendiumItemForAdding.variableCost ? currentItemLevel : undefined,
        originalCost: compendiumItemForAdding.variableCost ? baseItemCost : undefined,
        costType: 'PP'
      };
      // Dispatch ADD_ITEM action with the full object
      dispatch({ type: 'ADD_ITEM', field: listType, value: itemToAdd });
    }
    // TODO: Trigger recalculation of points if not handled automatically
  };
  
  const handleLevelChange = (itemId: string, listType: 'advantages' | 'disadvantages', newLevel: number) => {
    const currentList = formData[listType];
    const itemIndex = currentList.findIndex(item => item.id === itemId && !item.isFromArchetype);
    if (itemIndex === -1) return;

    const itemToUpdate = currentList[itemIndex];
    if (!itemToUpdate.variableCost || !itemToUpdate.originalCost) return;

    const minLevel = itemToUpdate.min || 1;
    const maxLevel = itemToUpdate.max || Infinity;
    const validatedLevel = Math.max(minLevel, Math.min(newLevel, maxLevel));
    
    const newTotalCost = itemToUpdate.originalCost * validatedLevel;
    const oldCost = itemToUpdate.cost || 0;
    const costDifference = newTotalCost - oldCost;

    // Check affordability before dispatching update
    if (listType === 'advantages') {
        if (pontosRestantes < costDifference) {
            alert("Pontos de personagem insuficientes para alterar o nível desta Vantagem.");
            // Visually revert or rely on validation
            return;
        }
    } else { // Disadvantage level change
        const currentDisadvantagePointsGained = Math.min(
            formData.disadvantages.filter(d => !d.isFromArchetype && d.id !== itemId).reduce((acc, dis) => acc + Math.abs(dis.cost || 0), 0) + Math.abs(newTotalCost),
            2
        );
        const previousDisadvantagePointsGained = Math.min(
            formData.disadvantages.filter(d => !d.isFromArchetype).reduce((acc, dis) => acc + Math.abs(dis.cost || 0), 0),
            2
        );
        const pointChangeFromDisadvantage = previousDisadvantagePointsGained - currentDisadvantagePointsGained;

        if (pontosRestantes + pointChangeFromDisadvantage < 0) {
             alert("A alteração de nível desta Desvantagem excede os pontos disponíveis.");
             return;
        }
    }

    // Create the updated item
    const updatedItem = { ...itemToUpdate, currentLevel: validatedLevel, cost: newTotalCost };

    // Dispatch an update action (needs a new action type or modify existing)
    // Option 1: Modify REMOVE_ITEM and ADD_ITEM (less ideal)
    // Option 2: Add UPDATE_ITEM action
    // Let's assume an UPDATE_ITEM action exists for now:
    // dispatch({ type: 'UPDATE_ITEM', field: listType, value: updatedItem });
    
    // Workaround using REMOVE + ADD if UPDATE_ITEM doesn't exist yet:
    dispatch({ type: 'REMOVE_ITEM', field: listType, value: itemId });
    // Need a slight delay or ensure reducer handles this sequence correctly
    // setTimeout(() => dispatch({ type: 'ADD_ITEM', field: listType, value: updatedItem }), 0);
    // Simpler: Assume reducer handles update logic within ADD_ITEM if item exists, or add UPDATE_ITEM later.
    // For now, just remove and add back. This might cause flicker.
    dispatch({ type: 'ADD_ITEM', field: listType, value: updatedItem });

  };

  const openModal = (item: CompendiumItem) => { 
    const listType = item.type === 'Vantagem' ? 'advantages' : 'disadvantages';
    const selectedItemInstance = formData[listType].find(i => i.id === item.id && !i.isFromArchetype);
    setModalLevel(selectedItemInstance?.currentLevel || item.min || 1);
    setModalItem(item); 
    setShowModal(true); 
  };
  const closeModal = () => { setShowModal(false); setModalItem(null); };

  const renderSection = (
    title: string, 
    itemsFromCompendium: CompendiumItem[],
    selectedItemsList: SelectedCompendiumItem[], 
    type: 'advantages' | 'disadvantages'
  ) => (
    <section className="bg-slate-700/30 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-sky-300 mb-3">{title}</h3>
      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 mb-4">
        {itemsFromCompendium.length === 0 && <p className="text-slate-400">Nenhum item encontrado.</p>}
        {itemsFromCompendium.map(compendiumItem => {
          const isSelectedManually = selectedItemsList.some(s => s.id === compendiumItem.id && !s.isFromArchetype);
          const isFromArchetype = selectedItemsList.some(s => s.id === compendiumItem.id && s.isFromArchetype);
          
          let effectiveItemCost = compendiumItem.cost || 0;
          if (compendiumItem.variableCost && compendiumItem.min) {
            effectiveItemCost = (compendiumItem.cost || 0) * (compendiumItem.min || 1);
          }

          let buttonDisabled = false;
          if (!isSelectedManually && !isFromArchetype) {
            if (type === 'advantages' && (pontosRestantes < effectiveItemCost) ) {
                 buttonDisabled = true;
            }
          }

          return (
            <div key={compendiumItem.id} className={`p-3 rounded-md flex justify-between items-center shadow transition-all duration-150 ${isSelectedManually ? 'bg-sky-600' : isFromArchetype ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
              <div className={`flex-grow mr-2 ${!isFromArchetype ? 'cursor-pointer' : ''}`} onClick={() => !isFromArchetype && openModal(compendiumItem)}>
                <h4 className={`font-medium ${isSelectedManually || isFromArchetype ? 'text-white' : 'text-slate-100'}`}>{compendiumItem.name} <span className="text-xs text-amber-300">({compendiumItem.cost || 0}pts{compendiumItem.variableCost ? '/nível' : ''})</span></h4>
                <p className={`text-xs ${isSelectedManually || isFromArchetype ? 'text-sky-100' : 'text-slate-400'} line-clamp-1`}>{compendiumItem.description.split('•')[0] || compendiumItem.description.split('\n')[0]}</p>
              </div>
              {!isFromArchetype && (
                <button onClick={() => handleToggleItem(compendiumItem, type)} className={`${buttonClass} ${isSelectedManually ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} flex-shrink-0`} disabled={buttonDisabled}>
                  {isSelectedManually ? 'Remover' : 'Adicionar'}
                </button>
              )}
              {isFromArchetype && <span className="text-xs text-slate-400 italic ml-2 flex-shrink-0">(do Arquétipo)</span>}
            </div>
          );
        })}
      </div>
      {selectedItemsList.filter(si => !si.isFromArchetype).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-slate-200 mb-1">{type === 'advantages' ? 'Vantagens' : 'Desvantagens'} Selecionadas (Manualmente):</h4>
          <div className="space-y-2">
            {selectedItemsList.filter(si => !si.isFromArchetype).map(selectedItemInstance => (
              <div key={selectedItemInstance.id} className="bg-sky-700 text-white p-2 rounded-md flex items-center justify-between flex-wrap">
                <div className="flex-grow mb-1 sm:mb-0">
                  <span className="cursor-pointer" onClick={() => openModal(compendiumItems.find(ci => ci.id === selectedItemInstance.id)!)}>{selectedItemInstance.name} ({selectedItemInstance.originalCost && selectedItemInstance.variableCost ? `${selectedItemInstance.originalCost} x ${selectedItemInstance.currentLevel} = ${selectedItemInstance.cost}` : selectedItemInstance.cost}pts)</span>
                  {selectedItemInstance.variableCost && selectedItemInstance.costDetails && <p className="text-xs text-sky-200 mt-1 w-full">{selectedItemInstance.costDetails}</p>}
                </div>
                <div className="flex items-center ml-2 flex-shrink-0">
                  {selectedItemInstance.variableCost && (
                    <input 
                      type="number"
                      aria-label={`Nível de ${selectedItemInstance.name}`}
                      value={selectedItemInstance.currentLevel || ''}
                      min={selectedItemInstance.min || 1}
                      max={selectedItemInstance.max || undefined}
                      onChange={(e) => handleLevelChange(selectedItemInstance.id, type, parseInt(e.target.value))}
                      className={`${inputClass} w-16 text-center text-sm p-1 mr-2`}
                    />
                  )}
                  <button onClick={() => handleToggleItem(selectedItemInstance, type)} className="text-red-300 hover:text-red-100 text-lg font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );

  // Basic validation: Check if points spent exceed total points
  const canProceed = pontosRestantes >= 0;

  return (
    <StepTemplate 
        title="Vantagens & Desvantagens"
        onNext={onNext}
        onPrevious={onPrevious}
        canProceed={canProceed}
        isFirstStep={false}
    >
      <div className="space-y-6">
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <p className="text-lg font-semibold text-sky-300">
            Pontos Restantes: <span className={`${pontosRestantes < 0 ? 'text-red-400' : 'text-green-400'}`}>{pontosRestantes}</span> / {totalPointsAvailable}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Vantagens custam pontos. Desvantagens concedem pontos (máx. +2 globalmente). Saldo considera Atributos, Perícias, Vantagens e Desvantagens manuais.
          </p>
          {pontosRestantes < 0 && <p className="text-xs text-red-400 mt-1">Você gastou mais pontos do que o disponível!</p>}
        </div>

        <div>
          <label htmlFor="searchAdvDis" className={labelClass}>Buscar Vantagem/Desvantagem:</label>
          <input
            type="text"
            id="searchAdvDis"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 placeholder-slate-400 mb-4"
            placeholder="Nome ou descrição..."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSection("Vantagens Disponíveis", filteredAdvantages, formData.advantages, 'advantages')}
          {renderSection("Desvantagens Disponíveis", filteredDisadvantages, formData.disadvantages, 'disadvantages')}
        </div>

        {/* Modal - Logic remains similar, uses handleToggleItem with context */}
        {showModal && modalItem && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={closeModal}>
            <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-slate-700" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-sky-400 text-2xl" aria-label="Fechar modal">&times;</button>
              <h3 className="text-2xl font-bold text-sky-400 mb-1">{modalItem.name}</h3>
              <p className="text-sm text-amber-400 mb-3">({modalItem.cost || 0}pts{modalItem.variableCost ? `/nível (Min: ${modalItem.min || 1}, Max: ${modalItem.max || 'N/A'})` : ''})</p>

              <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-4">{modalItem.description}</p>
              {modalItem.costDetails && <p className="text-sm text-sky-200 bg-slate-700 p-2 rounded mb-2">Detalhes do Custo: {modalItem.costDetails}</p>}
              {modalItem.rules && <p className="text-sm text-slate-400 italic whitespace-pre-line">Regras: {modalItem.rules}</p>}
              {modalItem.prerequisites && <p className="text-sm text-slate-300 italic">Pré-requisitos: {modalItem.prerequisites}</p>}
              {modalItem.source && <p className="text-xs text-slate-500">Fonte: {modalItem.source}</p>}

              {modalItem.variableCost && (
                <div className="mt-4">
                  <label htmlFor="modalLevelInput" className={labelClass}>Nível/Quantidade (Min: {modalItem.min || 1}, Max: {modalItem.max || 'N/A'}):</label>
                  <input
                    type="number"
                    id="modalLevelInput"
                    value={modalLevel}
                    min={modalItem.min || 1}
                    max={modalItem.max || undefined}
                    onChange={(e) => setModalLevel(Math.max(modalItem.min || 1, Math.min(parseInt(e.target.value) || (modalItem.min || 1) , modalItem.max || Infinity)))}
                    className={inputClass}
                  />
                </div>
              )}
              <button
                  onClick={() => {
                      const listType = modalItem.type === 'Vantagem' ? 'advantages' : 'disadvantages';
                      handleToggleItem(modalItem, listType, modalItem.variableCost ? modalLevel : undefined);
                      closeModal();
                  }}
                  className={`mt-6 w-full ${buttonClass} ${formData[modalItem.type === 'Vantagem' ? 'advantages' : 'disadvantages'].some(s => s.id === modalItem.id && !s.isFromArchetype) ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  disabled={
                    // Disable if adding and cannot afford
                    !formData[modalItem.type === 'Vantagem' ? 'advantages' : 'disadvantages'].some(s => s.id === modalItem.id && !s.isFromArchetype) &&
                    modalItem.type === 'Vantagem' &&
                    (pontosRestantes < ((modalItem.cost || 0) * (modalItem.variableCost ? modalLevel : 1)))
                  }
              >
                   {formData[modalItem.type === 'Vantagem' ? 'advantages' : 'disadvantages'].some(s => s.id === modalItem.id && !s.isFromArchetype) ? 'Remover' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StepTemplate>
  );
};

export default StepAdvantagesDisadvantages;

