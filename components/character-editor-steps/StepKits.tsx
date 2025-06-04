import React, { useState, useMemo } from 'react';
import { useCharacterWizard } from '../../src/contexts/CharacterWizardContext'; // Corrected path
import StepTemplate from '../../src/components/StepTemplate'; // Corrected path
import { SelectedCompendiumItem, CompendiumItem } from '../../types'; // Corrected path

const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-300 text-xs";

interface StepKitsProps {
    onNext?: () => void;
    onPrevious?: () => void;
    compendiumItems: CompendiumItem[]; // Pass kit data from compendium
    allCompendiumItems: CompendiumItem[]; // Pass all items for V/D lookup
}

const StepKits: React.FC<StepKitsProps> = ({ onNext, onPrevious, compendiumItems, allCompendiumItems }) => {
  const { state, dispatch } = useCharacterWizard();
  const formData = state;

  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState<CompendiumItem | null>(null);

  const kits = useMemo(() => 
    compendiumItems.filter(item => item.type === 'Kit').sort((a,b) => a.name.localeCompare(b.name)),
    [compendiumItems]
  );

  // TODO: Refine point calculation - needs a central function (ensure kit cost is included)
  const calculateTotalPointsSpent = (): number => {
    const attributePoints = (formData.attributes.poder || 0) + (formData.attributes.habilidade || 0) + (formData.attributes.resistencia || 0);
    const skillPoints = formData.skills.reduce((acc, skill) => acc + (skill.cost || 0), 0);
    const advantagePoints = formData.advantages
        .filter(v => !v.isFromArchetype && !v.isFromKit) // Exclude kit advantages
        .reduce((acc, adv) => acc + (adv.cost || 0), 0);
    const disadvantagePointsGained = Math.min(
        formData.disadvantages
            .filter(d => !d.isFromArchetype && !d.isFromKit) // Exclude kit disadvantages
            .reduce((acc, dis) => acc + Math.abs(dis.cost || 0), 0),
        2 // Max 2 points from disadvantages
    );
    const archetypeCost = formData.archetype?.cost || 0;
    const kitCost = formData.kit?.cost || 0; // Include kit cost
    return attributePoints + skillPoints + advantagePoints - disadvantagePointsGained + archetypeCost + kitCost;
  };

  const totalPointsAvailable = formData.nivelDePoder || 10;
  const totalPointsSpent = calculateTotalPointsSpent();
  const pontosRestantes = totalPointsAvailable - totalPointsSpent;

  // Function to extract V/D from kit description (similar to archetype)
  const getVantagensDesvantagensFromKitDescription = (kit: CompendiumItem | SelectedCompendiumItem | null): { advantages: SelectedCompendiumItem[], disadvantages: SelectedCompendiumItem[] } => {
    const autoAdvantages: SelectedCompendiumItem[] = [];
    const autoDisadvantages: SelectedCompendiumItem[] = [];
    if (!kit || !kit.description) return { advantages: [], disadvantages: [] };
    
    // Match lines starting with Vantagem(ns): or Desvantagem(ns):
    const advMatch = kit.description.match(/Vantagem\(ns\):\s*(.*)/i);
    const disMatch = kit.description.match(/Desvantagem\(ns\):\s*(.*)/i);

    const processLine = (line: string, type: 'Vantagem' | 'Desvantagem') => {
        if (!line) return;
        const itemNames = line.split(',').map(name => name.trim());
        itemNames.forEach(itemName => {
            if (!itemName) return;
            const foundItem = allCompendiumItems.find(item => 
                item.name.toLowerCase() === itemName.toLowerCase() && 
                item.type === type
            );
            if (foundItem) {
                const kitVDItem: SelectedCompendiumItem = { 
                    ...foundItem, 
                    cost: 0, // Free as part of kit
                    originalCost: foundItem.variableCost ? foundItem.cost : undefined,
                    currentLevel: foundItem.variableCost ? (foundItem.min || 1) : undefined,
                    isFromKit: true, // Mark as from kit
                    isFromArchetype: false,
                    costType: 'PP'
                };
                if (type === 'Vantagem') {
                    autoAdvantages.push(kitVDItem);
                } else {
                    autoDisadvantages.push(kitVDItem);
                }
            }
        });
    };

    if (advMatch && advMatch[1]) {
        processLine(advMatch[1], 'Vantagem');
    }
    if (disMatch && disMatch[1]) {
        processLine(disMatch[1], 'Desvantagem');
    }

    return { advantages: autoAdvantages, disadvantages: autoDisadvantages };
  };

  const handleSelectKit = (itemId: string | null) => {
    // 1. Get currently selected kit (if any) to remove its effects
    const oldKit = formData.kit;
    const oldKitEffects = getVantagensDesvantagensFromKitDescription(oldKit);

    // 2. Filter out V/D granted by the old kit
    let currentAdvantages = formData.advantages.filter(adv => !oldKitEffects.advantages.some(autoAdv => autoAdv.id === adv.id && adv.isFromKit));
    let currentDisadvantages = formData.disadvantages.filter(dis => !oldKitEffects.disadvantages.some(autoDis => autoDis.id === dis.id && dis.isFromKit));

    // 3. If deselecting (itemId is null), update state and return
    if (!itemId) {
      dispatch({ type: 'SET_FIELD', field: 'kit', value: null });
      dispatch({ type: 'SET_FIELD', field: 'advantages', value: currentAdvantages });
      dispatch({ type: 'SET_FIELD', field: 'disadvantages', value: currentDisadvantages });
      return;
    }

    // 4. Find the new kit to be selected
    const newKit = kits.find(item => item.id === itemId);
    if (!newKit) return; // Should not happen

    // 5. Check affordability (consider points freed by deselecting old one)
    const pointsAvailableForNew = totalPointsAvailable - (totalPointsSpent - (oldKit?.cost || 0));
    if (pointsAvailableForNew < (newKit.cost || 0)) {
      alert("Pontos de personagem insuficientes para este Kit.");
      return;
    }

    // 6. Get V/D granted by the new kit
    const newKitEffects = getVantagensDesvantagensFromKitDescription(newKit);

    // 7. Add new V/D (marked as from kit)
    const finalAdvantages = [...currentAdvantages, ...newKitEffects.advantages];
    const finalDisadvantages = [...currentDisadvantages, ...newKitEffects.disadvantages];

    // 8. Create the SelectedCompendiumItem for the kit itself
    const selectedKitItem: SelectedCompendiumItem = { 
        ...newKit, 
        cost: newKit.cost || 0,
        costType: 'PP'
    };

    // 9. Dispatch updates to the context
    dispatch({ type: 'SET_FIELD', field: 'kit', value: selectedKitItem });
    dispatch({ type: 'SET_FIELD', field: 'advantages', value: finalAdvantages });
    dispatch({ type: 'SET_FIELD', field: 'disadvantages', value: finalDisadvantages });
  };
  
  const openModal = (item: CompendiumItem) => { setModalItem(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalItem(null); };

  // Basic validation: Check if points spent exceed total points
  const canProceed = pontosRestantes >= 0;

  return (
    <StepTemplate 
        title="Kit de Personagem"
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
              <p className="text-xs text-slate-400 mt-1">Kits têm custo em Pontos de Personagem (PP) e podem conceder Vantagens/Desvantagens automaticamente (sem custo adicional de PP para estas).</p>
              {pontosRestantes < 0 && <p className="text-xs text-red-400 mt-1">Você gastou mais pontos do que o disponível!</p>}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kits.map(kitItem => {
            const isSelected = formData.kit?.id === kitItem.id;
            const pointsAvailableForThis = totalPointsAvailable - (totalPointsSpent - (isSelected ? (kitItem.cost || 0) : 0));
            const canAfford = pointsAvailableForThis >= (kitItem.cost || 0);
            
            return (
              <div key={kitItem.id} className={`p-4 rounded-lg shadow-md cursor-pointer transition-all 
                              ${isSelected ? 'bg-sky-600 ring-2 ring-sky-400' : (canAfford ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-600 opacity-50 cursor-not-allowed')}`}
                   onClick={() => (isSelected || canAfford) ? handleSelectKit(isSelected ? null : kitItem.id) : alert("Pontos insuficientes.")}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-sky-300'}`}>{kitItem.name}</h4>
                  <span className={`text-sm font-mono ${isSelected ? 'text-sky-100' : 'text-amber-400'}`}>
                    ({kitItem.cost || 0}pts)
                  </span>
                </div>
                <p className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'} line-clamp-2`}>{kitItem.description.split('\n')[0]}</p> {/* Show first line of description */} 
                <button onClick={(e) => { e.stopPropagation(); openModal(kitItem);}} className="mt-2 text-xs text-sky-400 hover:underline">Ver Detalhes</button>
              </div>
            );
          })}
        </div>
        {formData.kit && (
          <div className="mt-4 p-3 bg-slate-600 rounded-md">
              <p className="text-sm text-slate-200">Selecionado: <span className="font-bold text-sky-300">{formData.kit.name}</span></p>
              {/* Display V/D granted by kit */} 
              {(formData.advantages.filter(a => a.isFromKit).length > 0 || formData.disadvantages.filter(d => d.isFromKit).length > 0) && (
                <div className="mt-2 text-xs">
                  <span className="text-slate-400">Concede: </span>
                  {formData.advantages.filter(a => a.isFromKit).map(a => a.name).join(', ')}
                  {formData.advantages.filter(a => a.isFromKit).length > 0 && formData.disadvantages.filter(d => d.isFromKit).length > 0 && '; '}
                  {formData.disadvantages.filter(d => d.isFromKit).map(d => d.name).join(', ')}
                </div>
              )}
          </div>
        )}

        {/* Modal */} 
        {showModal && modalItem && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={closeModal}>
            <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-slate-700" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-sky-400 text-2xl" aria-label="Fechar modal">&times;</button>
              <h3 className="text-2xl font-bold text-sky-400 mb-3">{modalItem.name} <span className="text-base text-amber-400">({modalItem.cost || 0}pts)</span></h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-4">{modalItem.description}</p>
              {modalItem.rules && <p className="text-sm text-slate-400 italic whitespace-pre-line">Regras: {modalItem.rules}</p>}
              {modalItem.prerequisites && <p className="text-sm text-slate-300 italic">Pré-requisitos: {modalItem.prerequisites}</p>}
              {modalItem.source && <p className="text-xs text-slate-500">Fonte: {modalItem.source}</p>}
              <button
                  onClick={() => {
                      const isCurrentlySelected = formData.kit?.id === modalItem.id;
                      const pointsAvailableForModal = totalPointsAvailable - (totalPointsSpent - (isCurrentlySelected ? (modalItem.cost || 0) : 0));
                      const canAffordModalItem = pointsAvailableForModal >= (modalItem.cost || 0);
                      
                      if (isCurrentlySelected || canAffordModalItem) {
                          handleSelectKit(isCurrentlySelected ? null : modalItem.id);
                          closeModal();
                      } else {
                          alert("Pontos de personagem insuficientes para selecionar este Kit.");
                      }
                  }}
                  className={`mt-6 w-full ${buttonClass} ${formData.kit?.id === modalItem.id ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} 
                             ${!(formData.kit?.id === modalItem.id || (totalPointsAvailable - (totalPointsSpent - (formData.kit?.id === modalItem.id ? (modalItem.cost || 0) : 0)) >= (modalItem.cost || 0))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!(formData.kit?.id === modalItem.id || (totalPointsAvailable - (totalPointsSpent - (formData.kit?.id === modalItem.id ? (modalItem.cost || 0) : 0)) >= (modalItem.cost || 0)))}
              >
                  {formData.kit?.id === modalItem.id ? 'Remover Kit' : 'Selecionar Kit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StepTemplate>
  );
};

export default StepKits;

