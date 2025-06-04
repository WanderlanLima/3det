
import React, { useState, useMemo } from 'react';
import { CharacterFormData, SelectedCompendiumItem, CompendiumItem, SelectedEquipmentItem } from '../../types';

interface Props {
  formData: Pick<CharacterFormData, 'techniquesAndTricks' | 'equipment' | 'attributes' | 'skills' | 'advantages' | 'xp'>; 
  updateFormData: (data: Partial<CharacterFormData>) => void;
  compendiumItems: CompendiumItem[]; // For Técnicas (includes Truques, Comuns, Lendárias)
  artefatos: CompendiumItem[]; 
  consumiveis: CompendiumItem[]; 
  // availablePoints: number; // PP available for this step (after archetype) - REMOVIDO
  // currentXP: number; // Total XP character has - REMOVIDO, usar formData.xp
  remainingXP: number; // XP remaining after spending on techniques & artefatos
}

const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-300 text-xs";

const StepCombinedItems: React.FC<Props> = ({ formData, updateFormData, compendiumItems, artefatos, consumiveis, /*availablePoints, currentXP,*/ remainingXP }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemTypeFilter, setSelectedItemTypeFilter] = useState<'Técnica' | 'Artefato' | 'Consumível' | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState<CompendiumItem | null>(null);
  
  // Este helper agora só é relevante para o cálculo de PONTOS TOTAIS da ficha na revisão, não para o gasto direto aqui.
  // Para esta etapa, Técnicas e Artefatos custam XP. Consumíveis não custam XP nem PP aqui.
  const getXPCost = (item: { cost?: number, type: CompendiumItem['type'], costType?: 'XP' | 'PP' }): number => {
    if ((item.type === 'Técnica' || item.type === 'Artefato') && item.costType === 'XP') {
        return item.cost || 0;
    }
    return 0; 
  };


  const allSelectableItems = useMemo(() => [
    ...compendiumItems.filter(i => i.type === 'Técnica'), 
    ...artefatos, 
    ...consumiveis, 
  ], [compendiumItems, artefatos, consumiveis]);

  const filteredItems = useMemo(() => {
    let items = allSelectableItems;
    if (selectedItemTypeFilter) {
        if (selectedItemTypeFilter === 'Técnica') {
            items = items.filter(item => item.type === 'Técnica'); 
        } else {
            items = items.filter(item => item.type === selectedItemTypeFilter);
        }
    }
    if (searchTerm) {
      items = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [allSelectableItems, selectedItemTypeFilter, searchTerm]);
  
  const checkPrerequisites = (item: CompendiumItem): boolean => {
    if (!item.prerequisites || item.prerequisites.toLowerCase() === 'n/a' || item.prerequisites.trim() === '') return true;
    const reqLower = item.prerequisites.toLowerCase();
    let meetsAll = true;
    let alertMsg = "";

    const checkAttribute = (attr: 'habilidade' | 'poder' | 'resistencia', reqName: string, humanReadableName: string) => {
        const regex = new RegExp(`${reqName}\\s*(\\d+)`);
        const match = reqLower.match(regex);
        if (match && match[1]) {
            const val = parseInt(match[1]);
            if (formData.attributes[attr] < val) {
                alertMsg += `${humanReadableName} ${val}. `;
                meetsAll = false;
            }
        }
    };

    checkAttribute('habilidade', 'habilidade', 'Habilidade');
    checkAttribute('poder', 'poder', 'Poder');
    checkAttribute('resistencia', 'resistência', 'Resistência'); 
    
    const skillReqMatch = reqLower.match(/perícia\s*([^,.(]+)/i); 
    if (skillReqMatch && skillReqMatch[1]) {
        const requiredSkillName = skillReqMatch[1].trim();
        if (!formData.skills.some(s => s.name.toLowerCase().includes(requiredSkillName.toLowerCase()))) { 
             alertMsg += `Perícia ${requiredSkillName}. `;
             meetsAll = false;
        }
    }

    const advReqMatch = reqLower.match(/vantagem\s*([^,.(]+)/i);
    if (advReqMatch && advReqMatch[1]) {
        const requiredAdvantageName = advReqMatch[1].trim();
        if (!formData.advantages.some(v => v.name.toLowerCase().includes(requiredAdvantageName.toLowerCase()))) {
             alertMsg += `Vantagem ${requiredAdvantageName}. `;
             meetsAll = false;
        }
    }

    if (!meetsAll) {
      alert(`Pré-requisitos não atendidos para ${item.name}: ${alertMsg.trim()}`);
    }
    return meetsAll;
  };


  const handleToggleItem = (compendiumItem: CompendiumItem) => {
    const xpCostForItem = getXPCost(compendiumItem);
    
    if (compendiumItem.type === 'Técnica') { 
      const isSelected = formData.techniquesAndTricks.some(item => item.id === compendiumItem.id);
      if (isSelected) {
        updateFormData({ techniquesAndTricks: formData.techniquesAndTricks.filter(item => item.id !== compendiumItem.id) });
      } else {
        if (remainingXP < xpCostForItem) { alert("Pontos de Experiência (XP) insuficientes."); return; }
        if (!checkPrerequisites(compendiumItem)) return;
        
        const itemToAdd: SelectedCompendiumItem = { 
            ...compendiumItem, 
            cost: compendiumItem.cost, // Store original XP cost 
            costType: 'XP', 
            subtype: compendiumItem.subtype 
        }; 
        updateFormData({ techniquesAndTricks: [...formData.techniquesAndTricks, itemToAdd] });
      }
    } else if (compendiumItem.type === 'Artefato') {
        const isSelected = formData.equipment.some(item => item.id === compendiumItem.id && item.subtype === 'Artefato');
        if (isSelected) {
            updateFormData({ equipment: formData.equipment.filter(item => !(item.id === compendiumItem.id && item.subtype === 'Artefato')) });
        } else {
            if (remainingXP < xpCostForItem) { alert("Pontos de Experiência (XP) insuficientes para este Artefato."); return; }
            if (!checkPrerequisites(compendiumItem)) return;
            const itemToAdd: SelectedEquipmentItem = { 
              ...compendiumItem, 
              cost: compendiumItem.cost, // Store original XP cost
              quantity: 1, 
              type: 'Artefato', 
              subtype: compendiumItem.subtype || 'Artefato', 
              costType: 'XP' 
            };
            updateFormData({ equipment: [...formData.equipment, itemToAdd] });
        }
    } else if (compendiumItem.type === 'Consumível') {
        // Consumíveis não custam XP nem PP para adicionar à lista de equipamentos.
        // Seu custo é narrativo ou gerenciado pela Vantagem Inventário.
        const isSelected = formData.equipment.some(item => item.id === compendiumItem.id && item.subtype === 'Consumível');
        if (isSelected) {
            // Para remover, filtramos o item específico.
            updateFormData({ equipment: formData.equipment.filter(item => !(item.id === compendiumItem.id && item.subtype === 'Consumível')) });
        } else {
            // Para adicionar, não verificamos custo de XP/PP.
            const itemToAdd: SelectedEquipmentItem = { 
              ...compendiumItem, 
              cost: 0, // Custo em PP/XP é 0 para simples adição à lista.
              quantity: 1, 
              type: 'Consumível', 
              subtype: compendiumItem.subtype || 'Consumível',
              costType: 'PP' // Default, mas irrelevante para o custo de adição.
            };
            updateFormData({ equipment: [...formData.equipment, itemToAdd] });
        }
    }
  };
  
  const openModal = (item: CompendiumItem) => { setModalItem(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalItem(null); };

  const renderGroup = (title: string, itemsToRender: CompendiumItem[], colorClass: string) => (
    itemsToRender.length > 0 && (
      <section className={`p-4 rounded-lg border-2 ${colorClass}`}>
        <h3 className={`text-lg font-semibold mb-3 ${colorClass.replace('border-', 'text-')}`}>{title}</h3>
        <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
          {itemsToRender.map(item => {
            let isSelected;
            if (item.type === 'Técnica') {
                isSelected = formData.techniquesAndTricks.some(s => s.id === item.id);
            } else if (item.type === 'Artefato') {
                isSelected = formData.equipment.some(s => s.id === item.id && s.subtype === 'Artefato');
            } else if (item.type === 'Consumível') {
                isSelected = formData.equipment.some(s => s.id === item.id && s.subtype === 'Consumível');
            } else {
                isSelected = false;
            }

            const xpCostForItem = getXPCost(item);
            const canAffordXP = (item.type === 'Técnica' || item.type === 'Artefato') ? remainingXP >= xpCostForItem : true; 
            const canAfford = canAffordXP; // Consumíveis são sempre "affordáveis" nesta etapa

            return (
              <div key={item.id} className={`p-3 rounded-md flex justify-between items-center shadow transition-all duration-150 ${isSelected ? 'bg-sky-600' : (canAfford ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-600 opacity-60')}`}>
                <div className="flex-grow cursor-pointer" onClick={() => openModal(item)}>
                  <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                    {item.name} 
                    <span className="text-xs text-amber-300 ml-1">
                      ({(item.type === 'Técnica' || item.type === 'Artefato') ? `${item.cost || 0}XP` : `Consumível`})
                    </span>
                  </h4>
                  <p className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'} line-clamp-1`}>{item.description.split('•')[0]}</p>
                </div>
                <button onClick={() => handleToggleItem(item)} className={`${buttonClass} ${isSelected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} disabled={!isSelected && !canAfford}>
                  {isSelected ? 'Remover' : 'Adicionar'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    )
  );

  const truques = useMemo(() => filteredItems.filter(i => i.type === 'Técnica' && i.subtype === 'Truque'), [filteredItems]);
  const tecnicasComuns = useMemo(() => filteredItems.filter(i => i.type === 'Técnica' && i.subtype === 'Comum'), [filteredItems]);
  const tecnicasLendarias = useMemo(() => filteredItems.filter(i => i.type === 'Técnica' && i.subtype === 'Lendária'), [filteredItems]);
  const currentArtefatos = useMemo(() => filteredItems.filter(i => i.type === 'Artefato'), [filteredItems]);
  const currentConsumiveis = useMemo(() => filteredItems.filter(i => i.type === 'Consumível'), [filteredItems]);
  
  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-700/50 rounded-lg">
        <p className="text-lg font-semibold">
          XP Restante: <span className={`${remainingXP < 0 ? 'text-red-400' : 'text-green-400'}`}>{remainingXP}</span> / {formData.xp}
        </p>
        <p className="text-xs text-slate-400 mt-1">
            Técnicas e Artefatos custam XP.
            <br/>Consumíveis são listados aqui mas geralmente vêm de Vantagens (ex: Inventário) e não têm custo de XP direto nesta etapa.
        </p>
        {remainingXP < 0 && <p className="text-xs text-red-400 mt-1">Você gastou mais XP do que o disponível!</p>}
      </div>
      <div>
        <label htmlFor="searchCombined" className={labelClass}>Buscar Item:</label>
        <input type="text" id="searchCombined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 placeholder-slate-400 mb-2"
               placeholder="Nome ou descrição..."/>
        <label htmlFor="itemTypeFilter" className={labelClass}>Filtrar por Tipo:</label>
        <select id="itemTypeFilter" value={selectedItemTypeFilter} onChange={(e) => setSelectedItemTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 mb-4">
          <option value="">Todos</option>
          <option value="Técnica">Técnicas (inclui Truques)</option>
          <option value="Artefato">Artefatos</option>
          <option value="Consumível">Consumíveis</option>
        </select>
      </div>

      {allSelectableItems.length === 0 && (
        <p className="text-center text-sm text-slate-400 mb-2">Nenhum item encontrado.</p>
      )}

      {renderGroup("Truques (10XP)", truques, "border-sky-500")}
      {renderGroup("Técnicas Comuns (10XP)", tecnicasComuns, "border-purple-500")}
      {renderGroup("Técnicas Lendárias (20XP)", tecnicasLendarias, "border-amber-500")}
      {renderGroup("Artefatos (Custo XP Variável)", currentArtefatos, "border-emerald-500")}
      {renderGroup("Consumíveis (Sem custo de XP aqui)", currentConsumiveis, "border-gray-500")}

      {showModal && modalItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={closeModal}>
          <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 hover:text-sky-400 text-2xl" aria-label="Fechar modal">&times;</button>
            <h3 className="text-2xl font-bold text-sky-400 mb-1">{modalItem.name}</h3>
             <p className="text-sm text-amber-400 mb-3">
                ({modalItem.type}{modalItem.subtype ? ` - ${modalItem.subtype}` : ''}) 
                Custo: {(modalItem.type === 'Técnica' || modalItem.type === 'Artefato') ? `${modalItem.cost || 0}XP` : `Consumível`}
            </p>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-4">{modalItem.description}</p>
            {modalItem.prerequisites && modalItem.prerequisites.toLowerCase() !== 'n/a' && modalItem.prerequisites.trim() !== '' && <p className="text-sm text-slate-100 bg-slate-700 p-2 rounded-md">Pré-requisitos: <span className="italic text-slate-300">{modalItem.prerequisites}</span></p>}
            {modalItem.rules && <p className="text-sm text-slate-400 italic whitespace-pre-line">Regras: {modalItem.rules}</p>}
            {modalItem.source && <p className="text-xs text-slate-500">Fonte: {modalItem.source}</p>}
             <button
                onClick={() => { handleToggleItem(modalItem); closeModal(); }}
                className={`mt-6 w-full ${buttonClass} ${
                    (modalItem.type === 'Técnica' ? formData.techniquesAndTricks.some(s => s.id === modalItem.id) :
                     (modalItem.type === 'Artefato') ? formData.equipment.some(s => s.id === modalItem.id && s.subtype === 'Artefato') :
                     (modalItem.type === 'Consumível') ? formData.equipment.some(s => s.id === modalItem.id && s.subtype === 'Consumível') : false
                    ) ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                disabled={
                  // Check if already selected (then it's a remove button, not disabled)
                  !((modalItem.type === 'Técnica' ? !formData.techniquesAndTricks.some(s => s.id === modalItem.id) :
                    (modalItem.type === 'Artefato') ? !formData.equipment.some(s => s.id === modalItem.id && s.subtype === 'Artefato') :
                    (modalItem.type === 'Consumível') ? !formData.equipment.some(s => s.id === modalItem.id && s.subtype === 'Consumível') : true
                  )) 
                  // And if can't afford XP (only for Técnicas and Artefatos)
                  && (
                      ((modalItem.type === 'Técnica' || modalItem.type === 'Artefato') && remainingXP < (getXPCost(modalItem)))
                     )
                }
            >
                 {(modalItem.type === 'Técnica' ? formData.techniquesAndTricks.some(s => s.id === modalItem.id) :
                   (modalItem.type === 'Artefato') ? formData.equipment.some(s => s.id === modalItem.id && s.subtype === 'Artefato') :
                   (modalItem.type === 'Consumível') ? formData.equipment.some(s => s.id === modalItem.id && s.subtype === 'Consumível') : false
                  ) ? 'Remover' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepCombinedItems;
