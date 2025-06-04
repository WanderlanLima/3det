import React, { useState } from 'react';
import { CharacterFormData, SelectedCompendiumItem, CompendiumItem } from '../../types';

interface Props {
  formData: Pick<CharacterFormData, 'advantages'>;
  updateFormData: (data: Partial<Pick<CharacterFormData, 'advantages'>>) => void;
  compendiumItems: CompendiumItem[]; // Vantagens do compêndio
}

const inputClass = "px-3 py-2 rounded-md bg-slate-700 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-100";
const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm";
const removeButtonClass = "bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md text-xs transition duration-300";

const StepAdvantages: React.FC<Props> = ({ formData, updateFormData, compendiumItems }) => {
  const [selectedItemId, setSelectedItemId] = useState('');

  const handleAddItem = () => {
    const itemToAdd = compendiumItems.find(item => item.id === selectedItemId);
    if (itemToAdd && !formData.advantages.find(adv => adv.id === itemToAdd.id)) {
      const newItem: SelectedCompendiumItem = {
        id: itemToAdd.id,
        name: itemToAdd.name,
        type: itemToAdd.type,
        description: itemToAdd.description,
        rules: itemToAdd.rules,
        source: itemToAdd.source,
      };
      updateFormData({ advantages: [...formData.advantages, newItem] });
      setSelectedItemId(''); // Reset selector
    } else if (itemToAdd) {
      alert(`Vantagem "${itemToAdd.name}" já adicionada.`);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    updateFormData({ advantages: formData.advantages.filter(item => item.id !== itemId) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">Selecionar Vantagem do Compêndio</h3>
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-grow">
            <label htmlFor="compendiumAdvantage" className={labelClass}>Escolha uma Vantagem:</label>
            <select 
              id="compendiumAdvantage" 
              value={selectedItemId} 
              onChange={(e) => setSelectedItemId(e.target.value)}
              className={`${inputClass} w-full`}
            >
              <option value="">Selecione...</option>
              {compendiumItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} {item.cost ? `(${item.cost}pts)` : ''}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAddItem} className={buttonClass} disabled={!selectedItemId}>Adicionar</button>
        </div>
      </div>
      <hr className="border-slate-700"/>
      <div>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">Vantagens Adicionadas ({formData.advantages.length})</h3>
        {formData.advantages.length === 0 ? (
          <p className="text-slate-400">Nenhuma vantagem adicionada.</p>
        ) : (
          <ul className="space-y-3">
            {formData.advantages.map(item => (
              <li key={item.id} className="p-4 bg-slate-700/70 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-100">{item.name} <span className="text-xs text-amber-400">({item.type})</span></h4>
                    <p className="text-sm text-slate-300 my-1">{item.description}</p>
                    {item.rules && <p className="text-xs text-slate-400 italic">Regras: {item.rules}</p>}
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className={removeButtonClass}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StepAdvantages;