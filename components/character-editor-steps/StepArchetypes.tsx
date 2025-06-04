import React, { useState, useMemo } from 'react';
import { useCharacterWizard } from '../../src/contexts/CharacterWizardContext'; // Import context hook
import StepTemplate from '../../src/components/StepTemplate'; // Import StepTemplate
import { SelectedCompendiumItem, CompendiumItem } from '../../types'; // Assuming types are defined here

// Removed Props interface as we use context now

const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-300 text-xs";

// Added props for navigation functions from the parent wizard component
interface StepArchetypesProps {
    onNext?: () => void;
    onPrevious?: () => void;
    compendiumItems: CompendiumItem[]; // Pass compendium data as prop
    allCompendiumItems: CompendiumItem[]; // Pass all items for V/D lookup
}

const StepArchetypes: React.FC<StepArchetypesProps> = ({ onNext, onPrevious, compendiumItems, allCompendiumItems }) => {
  const { state, dispatch } = useCharacterWizard(); // Use context
  const formData = state; // Use state from context

  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState<CompendiumItem | null>(null);

  const archetypes = useMemo(() => 
    compendiumItems.filter(item => item.type === 'Arquétipo').sort((a,b) => a.name.localeCompare(b.name)),
    [compendiumItems]
  );

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
    const archetypeCost = formData.archetype?.cost || 0;
    // Add costs from kits, etc. here later
    const kitPoints = 0; // Placeholder
    return attributePoints + skillPoints + advantagePoints - disadvantagePointsGained + archetypeCost + kitPoints;
  };

  const totalPointsAvailable = formData.nivelDePoder || 10;
  const totalPointsSpent = calculateTotalPointsSpent();
  const pontosRestantes = totalPointsAvailable - totalPointsSpent;

  // Function to extract V/D from archetype description (needs allCompendiumItems)
  const getVantagensDesvantagensFromArchetypeDescription = (archetype: CompendiumItem | SelectedCompendiumItem | null): { advantages: SelectedCompendiumItem[], disadvantages: SelectedCompendiumItem[] } => {
    const autoAdvantages: SelectedCompendiumItem[] = [];
    const autoDisadvantages: SelectedCompendiumItem[] = [];
    if (!archetype || !archetype.description) return { advantages: [], disadvantages: [] };
    
    const descLines = archetype.description.split(/[\n•]+/); // Split by newline or bullet point
    descLines.forEach(line => {
        const trimmedLine = line.trim().toLowerCase();
        if (!trimmedLine) return;

        allCompendiumItems.forEach(item => {
            if (item.type === 'Vantagem' || item.type === 'Desvantagem') {
                const itemNameLower = item.name.toLowerCase();
                // Check if line starts with the item name (more robust than includes)
                if (trimmedLine.startsWith(itemNameLower)) {
                    const archetypeVDItem: SelectedCompendiumItem = { 
                        ...item, 
                        cost: 0, // Free as part of archetype
                        originalCost: item.variableCost ? item.cost : undefined,
                        currentLevel: item.variableCost ? (item.min || 1) : undefined,
                        isFromArchetype: true,
                        costType: 'PP'
                    };

                    if (item.type === 'Vantagem') {
                         autoAdvantages.push(archetypeVDItem);
                    } else if (item.type === 'Desvantagem') {
                         autoDisadvantages.push(archetypeVDItem);
                    }
                }
            }
        });
    });
    return { advantages: autoAdvantages, disadvantages: autoDisadvantages };
  };

  const handleSelectArchetype = (itemId: string | null) => {
    // 1. Get currently selected archetype (if any) to remove its effects
    const oldArchetype = formData.archetype;
    const oldArchetypeEffects = getVantagensDesvantagensFromArchetypeDescription(oldArchetype);

    // 2. Filter out V/D granted by the old archetype
    let currentAdvantages = formData.advantages.filter(adv => !oldArchetypeEffects.advantages.some(autoAdv => autoAdv.id === adv.id && adv.isFromArchetype));
    let currentDisadvantages = formData.disadvantages.filter(dis => !oldArchetypeEffects.disadvantages.some(autoDis => autoDis.id === dis.id && dis.isFromArchetype));

    // 3. If deselecting (itemId is null), update state and return
    if (!itemId) {
      dispatch({ type: 'SET_FIELD', field: 'archetype', value: null });
      dispatch({ type: 'SET_FIELD', field: 'advantages', value: currentAdvantages });
      dispatch({ type: 'SET_FIELD', field: 'disadvantages', value: currentDisadvantages });
      return;
    }

    // 4. Find the new archetype to be selected
    const newArchetype = archetypes.find(item => item.id === itemId);
    if (!newArchetype) return; // Should not happen

    // 5. Check affordability (consider points freed by deselecting old one)
    const pointsAvailableForNew = totalPointsAvailable - (totalPointsSpent - (oldArchetype?.cost || 0));
    if (pointsAvailableForNew < (newArchetype.cost || 0)) {
      alert("Pontos de personagem insuficientes para este Arquétipo.");
      return;
    }

    // 6. Get V/D granted by the new archetype
    const newArchetypeEffects = getVantagensDesvantagensFromArchetypeDescription(newArchetype);

    // 7. Add new V/D (marked as from archetype)
    const finalAdvantages = [...currentAdvantages, ...newArchetypeEffects.advantages];
    const finalDisadvantages = [...currentDisadvantages, ...newArchetypeEffects.disadvantages];

    // 8. Create the SelectedCompendiumItem for the archetype itself
    const selectedArchetypeItem: SelectedCompendiumItem = { 
        ...newArchetype, 
        cost: newArchetype.cost || 0,
        costType: 'PP'
    };

    // 9. Dispatch updates to the context
    dispatch({ type: 'SET_FIELD', field: 'archetype', value: selectedArchetypeItem });
    dispatch({ type: 'SET_FIELD', field: 'advantages', value: finalAdvantages });
    dispatch({ type: 'SET_FIELD', field: 'disadvantages', value: finalDisadvantages });
  };
  
  const openModal = (item: CompendiumItem) => { setModalItem(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalItem(null); };

  // Basic validation: Check if points spent exceed total points
  const canProceed = pontosRestantes >= 0;

  return (
    <StepTemplate 
        title="Arquétipo"
        onNext={onNext}
        onPrevious={onPrevious}
        canProceed={canProceed}
        isFirstStep={false} // Assuming this follows Identity/Attributes
    >
      <div className="space-y-6">
          <div className="p-4 bg-slate-700/50 rounded-lg">
              <p className="text-lg font-semibold text-sky-300">
              Pontos Restantes: <span className={`${pontosRestantes < 0 ? 'text-red-400' : 'text-green-400'}`}>{pontosRestantes}</span> / {totalPointsAvailable}
              </p>
              <p className="text-xs text-slate-400 mt-1">Arquétipos têm custo em Pontos de Personagem (PP) e podem conceder Vantagens/Desvantagens automaticamente (sem custo adicional de PP para estas).</p>
              {pontosRestantes < 0 && <p className="text-xs text-red-400 mt-1">Você gastou mais pontos do que o disponível!</p>}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {archetypes.map(arch => {
            const isSelected = formData.archetype?.id === arch.id;
            const pointsAvailableForThis = totalPointsAvailable - (totalPointsSpent - (isSelected ? (arch.cost || 0) : 0));
            const canAfford = pointsAvailableForThis >= (arch.cost || 0);
            
            return (
              <div key={arch.id} className={`p-4 rounded-lg shadow-md cursor-pointer transition-all 
                              ${isSelected ? 'bg-sky-600 ring-2 ring-sky-400' : (canAfford ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-600 opacity-50 cursor-not-allowed')}`}
                   onClick={() => (isSelected || canAfford) ? handleSelectArchetype(isSelected ? null : arch.id) : alert("Pontos insuficientes.")}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-sky-300'}`}>{arch.name}</h4>
                  <span className={`text-sm font-mono ${isSelected ? 'text-sky-100' : 'text-amber-400'}`}>
                    ({arch.cost || 0}pts)
                  </span>
                </div>
                <p className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'} line-clamp-2`}>{arch.description.split(/[\n•]+/)[0]}</p>
                <button onClick={(e) => { e.stopPropagation(); openModal(arch);}} className="mt-2 text-xs text-sky-400 hover:underline">Ver Detalhes</button>
              </div>
            );
          })}
        </div>
        {formData.archetype && (
          <div className="mt-4 p-3 bg-slate-600 rounded-md">
              <p className="text-sm text-slate-200">Selecionado: <span className="font-bold text-sky-300">{formData.archetype.name}</span></p>
              {/* Display V/D granted by archetype */} 
              {(formData.advantages.filter(a => a.isFromArchetype).length > 0 || formData.disadvantages.filter(d => d.isFromArchetype).length > 0) && (
                <div className="mt-2 text-xs">
                  <span className="text-slate-400">Concede: </span>
                  {formData.advantages.filter(a => a.isFromArchetype).map(a => a.name).join(', ')}
                  {formData.advantages.filter(a => a.isFromArchetype).length > 0 && formData.disadvantages.filter(d => d.isFromArchetype).length > 0 && '; '}
                  {formData.disadvantages.filter(d => d.isFromArchetype).map(d => d.name).join(', ')}
                </div>
              )}
          </div>
        )}

        {/* Modal - Logic remains similar, uses handleSelectArchetype */} 
        {showModal && modalItem && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={closeModal}>
            <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-slate-700" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-sky-400 text-2xl" aria-label="Fechar modal">&times;</button>
              <h3 className="text-2xl font-bold text-sky-400 mb-3">{modalItem.name} <span className="text-base text-amber-400">({modalItem.cost || 0}pts)</span></h3>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line mb-4" dangerouslySetInnerHTML={{ __html: modalItem.description.replace(/[\n•]+/g, (match) => match === '•' ? '<br/>• ' : '<br/>') }} />
              {modalItem.rules && <p className="text-sm text-slate-400 italic whitespace-pre-line">Regras: {modalItem.rules}</p>}
              {modalItem.prerequisites && <p className="text-sm text-slate-300 italic">Pré-requisitos: {modalItem.prerequisites}</p>}
              {modalItem.source && <p className="text-xs text-slate-500">Fonte: {modalItem.source}</p>}
              <button
                  onClick={() => {
                      const isCurrentlySelected = formData.archetype?.id === modalItem.id;
                      const pointsAvailableForModal = totalPointsAvailable - (totalPointsSpent - (isCurrentlySelected ? (modalItem.cost || 0) : 0));
                      const canAffordModalItem = pointsAvailableForModal >= (modalItem.cost || 0);
                      
                      if (isCurrentlySelected || canAffordModalItem) {
                          handleSelectArchetype(isCurrentlySelected ? null : modalItem.id);
                          closeModal();
                      } else {
                          alert("Pontos de personagem insuficientes para selecionar este Arquétipo.");
                      }
                  }}
                  className={`mt-6 w-full ${buttonClass} ${formData.archetype?.id === modalItem.id ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} 
                             ${!(formData.archetype?.id === modalItem.id || (totalPointsAvailable - (totalPointsSpent - (formData.archetype?.id === modalItem.id ? (modalItem.cost || 0) : 0)) >= (modalItem.cost || 0))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!(formData.archetype?.id === modalItem.id || (totalPointsAvailable - (totalPointsSpent - (formData.archetype?.id === modalItem.id ? (modalItem.cost || 0) : 0)) >= (modalItem.cost || 0)))}
              >
                  {formData.archetype?.id === modalItem.id ? 'Remover Arquétipo' : 'Selecionar Arquétipo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StepTemplate>
  );
};

export default StepArchetypes;

