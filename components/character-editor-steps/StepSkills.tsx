import React, { useState, useMemo } from 'react';
import { useCharacterWizard } from '../../src/contexts/CharacterWizardContext'; // Import context hook
import StepTemplate from '../../src/components/StepTemplate'; // Import StepTemplate
import { SelectedCompendiumItem, CompendiumItem } from '../../types'; // Assuming types are defined here

// Removed Props interface as we use context now

const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-300 text-xs";
const removeButtonClass = "bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md text-xs transition duration-300";
const itemPillClass = "px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors";
const selectedItemPillClass = "bg-sky-500 text-white";
const unselectedItemPillClass = "bg-slate-700 hover:bg-slate-600 text-slate-200";

// Added props for navigation functions from the parent wizard component
interface StepSkillsProps {
    onNext?: () => void;
    onPrevious?: () => void;
    compendiumItems: CompendiumItem[]; // Pass compendium data as prop for now
    // availablePoints: number; // This should be calculated internally or passed differently
}

const StepSkills: React.FC<StepSkillsProps> = ({ onNext, onPrevious, compendiumItems }) => {
  const { state, dispatch } = useCharacterWizard(); // Use context
  const formData = state; // Use state from context

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState<CompendiumItem | null>(null);

  // TODO: Refine point calculation - needs a central function
  const calculateTotalPointsSpent = (): number => {
    const attributePoints = (formData.attributes.poder || 0) + (formData.attributes.habilidade || 0) + (formData.attributes.resistencia || 0);
    const skillPoints = formData.skills.reduce((acc, skill) => acc + (skill.cost || 0), 0);
    // Add costs from advantages, disadvantages (negative), kits, etc. here later
    const advantagePoints = 0; // Placeholder
    const disadvantagePoints = 0; // Placeholder
    const kitPoints = 0; // Placeholder
    return attributePoints + skillPoints + advantagePoints - disadvantagePoints + kitPoints;
  };

  const totalPointsAvailable = formData.nivelDePoder || 10;
  const totalPointsSpent = calculateTotalPointsSpent();
  const pontosRestantes = totalPointsAvailable - totalPointsSpent;

  const periciasFromCompendium = useMemo(() => {
    return compendiumItems.filter(item => 
        item.type === 'Perícia' && 
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [compendiumItems, searchTerm]);

  const handleToggleSkill = (itemToToggle: CompendiumItem | SelectedCompendiumItem) => {
    const isSelected = formData.skills.some(s => s.id === itemToToggle.id);
    const skillCost = itemToToggle.cost || 0;

    if (isSelected) {
      // Dispatch REMOVE_ITEM action
      dispatch({ type: 'REMOVE_ITEM', field: 'skills', value: itemToToggle.id });
    } else {
      // Check if enough points before adding
      if (pontosRestantes >= skillCost) {
        // Dispatch ADD_ITEM action
        // We need the full item details, so we expect itemToToggle to be CompendiumItem here
        const compendiumSkill = itemToToggle as CompendiumItem;
        // Construct the SelectedCompendiumItem from CompendiumItem
        const skillToAdd: SelectedCompendiumItem = {
          id: compendiumSkill.id,
          name: compendiumSkill.name,
          type: compendiumSkill.type,
          description: compendiumSkill.description,
          cost: compendiumSkill.cost,
          rules: compendiumSkill.rules,
          source: compendiumSkill.source,
          prerequisites: compendiumSkill.prerequisites,
          costType: 'PP', // Assuming Pericias cost PP
          variableCost: compendiumSkill.variableCost,
          costDetails: compendiumSkill.costDetails,
          min: compendiumSkill.min,
          max: compendiumSkill.max,
        };
        // Note: The reducer needs to handle adding the full object, not just the ID
        // Adjusting the action or reducer might be needed.
        // For now, assuming ADD_ITEM takes the ID and the reducer fetches details or we modify ADD_ITEM.
        // Let's modify the action payload for clarity:
        dispatch({ type: 'ADD_ITEM', field: 'skills', value: skillToAdd }); // Pass the whole object
      } else {
        alert("Pontos de personagem insuficientes para adicionar esta perícia.");
        return;
      }
    }
    // TODO: Trigger recalculation of points if not handled automatically by reducer/context effect
  };
  
  const openModal = (item: CompendiumItem) => {
    setModalItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalItem(null);
  };

  // Basic validation: Check if points spent exceed total points
  const canProceed = pontosRestantes >= 0;

  return (
    <StepTemplate 
        title="Perícias"
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
          <p className="text-xs text-slate-400 mt-1">Cada Perícia custa 1 Ponto de Personagem (PP). Este saldo considera Atributos e Perícias selecionadas.</p>
          {pontosRestantes < 0 && <p className="text-xs text-red-400 mt-1">Você gastou mais pontos do que o disponível!</p>}
        </div>

        <div>
          <label htmlFor="searchSkill" className={labelClass}>Buscar Perícia:</label>
          <input
            type="text"
            id="searchSkill"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 placeholder-slate-400 mb-4"
            placeholder="Nome ou descrição..."
          />
        </div>

        <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
          {periciasFromCompendium.length === 0 && <p className="text-slate-400">Nenhuma perícia encontrada com o filtro atual.</p>}
          {periciasFromCompendium.map(skillCompendiumItem => {
            const isSelected = formData.skills.some(s => s.id === skillCompendiumItem.id);
            return (
              <div 
                key={skillCompendiumItem.id} 
                className={`p-3 rounded-md flex justify-between items-center shadow transition-all duration-150 ${
                  isSelected ? 'bg-sky-600 hover:bg-sky-500' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <div className="flex-grow cursor-pointer mr-2" onClick={() => openModal(skillCompendiumItem)}>
                  <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-slate-100'}`}>{skillCompendiumItem.name} <span className="text-xs text-amber-300">({skillCompendiumItem.cost || 0}pt)</span></h4>
                  <p className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'} line-clamp-1`}>{skillCompendiumItem.description}</p>
                </div>
                <button 
                  onClick={() => handleToggleSkill(skillCompendiumItem)} 
                  className={`${buttonClass} ${isSelected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} flex-shrink-0`}
                  disabled={!isSelected && pontosRestantes < (skillCompendiumItem.cost || 0)}
                >
                  {isSelected ? 'Remover' : 'Adicionar'}
                </button>
              </div>
            );
          })}
        </div>
        
        {formData.skills.length > 0 && (
          <div>
              <hr className="border-slate-700 my-4"/>
              <h3 className="text-md font-semibold text-sky-300 mb-2">Perícias Selecionadas ({formData.skills.length}):</h3>
              <div className="flex flex-wrap gap-2">
                  {formData.skills.map(selectedSkill => (
                      <div key={selectedSkill.id} className={`${itemPillClass} ${selectedItemPillClass} flex items-center justify-between`}>
                        <span className="cursor-pointer" onClick={() => openModal(compendiumItems.find(ci => ci.id === selectedSkill.id)!)}>{selectedSkill.name} <span className="text-xs text-amber-200">({selectedSkill.cost || 0}pt)</span></span>
                          <button onClick={() => handleToggleSkill(selectedSkill)} className="ml-2 text-red-300 hover:text-red-100 text-xs font-bold">✕</button>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* Modal - Logic remains similar, uses handleToggleSkill with context */}
        {showModal && modalItem && (
          <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            onClick={closeModal}
          >
            <div 
              className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={closeModal} 
                className="absolute top-3 right-3 text-slate-400 hover:text-sky-400 text-2xl"
                aria-label="Fechar modal"
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold text-sky-400 mb-3">{modalItem.name} <span className="text-base text-amber-400">({modalItem.cost || 0}pt)</span></h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-4">{modalItem.description}</p>
              {modalItem.rules && <p className="text-sm text-slate-400 italic whitespace-pre-line">Regras: {modalItem.rules}</p>}
              {modalItem.prerequisites && <p className="text-sm text-slate-300 italic">Pré-requisitos: {modalItem.prerequisites}</p>}
              {modalItem.source && <p className="text-xs text-slate-500">Fonte: {modalItem.source}</p>}
              <button
                  onClick={() => {
                      handleToggleSkill(modalItem); // Pass CompendiumItem
                      closeModal();
                  }}
                  className={`mt-6 w-full ${buttonClass} ${formData.skills.some(s => s.id === modalItem.id) ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  disabled={!formData.skills.some(s => s.id === modalItem.id) && pontosRestantes < (modalItem.cost || 0)}
              >
                  {formData.skills.some(s => s.id === modalItem.id) ? 'Remover Perícia' : 'Adicionar Perícia'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StepTemplate>
  );
};

export default StepSkills;

