import React, { useState } from 'react';
import { CharacterFormData, SelectedEquipmentItem, CompendiumItem } from '../../types';

interface Props {
  formData: Pick<CharacterFormData, 'equipment'>;
  updateFormData: (data: Partial<Pick<CharacterFormData, 'equipment'>>) => void;
  compendiumItems: CompendiumItem[]; // Equipamentos do compêndio
}

const inputClass = "px-3 py-2 rounded-md bg-slate-700 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-100";
const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm";
const removeButtonClass = "bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md text-xs transition duration-300";

const StepEquipment: React.FC<Props> = ({ formData, updateFormData, compendiumItems }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddItem = () => {
    const itemToAdd = compendiumItems.find(item => item.id === selectedItemId);
    if (itemToAdd && quantity > 0) {
      const existingItemIndex = formData.equipment.findIndex(eq => eq.id === itemToAdd.id);
      if (existingItemIndex > -1) {
        // Item já existe, atualiza quantidade
        const updatedEquipment = [...formData.equipment];
        updatedEquipment[existingItemIndex].quantity += quantity;
        updateFormData({ equipment: updatedEquipment });
      } else {
        // Novo item
        const newItem: SelectedEquipmentItem = {
          id: itemToAdd.id,
          name: itemToAdd.name,
          type: itemToAdd.type,
          description: itemToAdd.description,
          rules: itemToAdd.rules,
          source: itemToAdd.source,
          quantity: quantity,
        };
        updateFormData({ equipment: [...formData.equipment, newItem] });
      }
      setSelectedItemId('');
      setQuantity(1);
    } else if (!itemToAdd) {
        alert("Selecione um item.")
    } else if (quantity <=0) {
        alert("Quantidade deve ser maior que zero.")
    }
  };

  const handleRemoveItem = (itemId: string) => {
    updateFormData({ equipment: formData.equipment.filter(item => item.id !== itemId) });
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId); // Remove se quantidade for 0 ou menor
    } else {
      updateFormData({
        equipment: formData.equipment.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
      });
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">Adicionar Equipamento do Compêndio</h3>
        {compendiumItems.length === 0 && (
          <div className="mb-4 p-4 bg-slate-700/50 rounded-md">
            <p className="text-slate-400 text-sm">
              Nenhum item do tipo "Equipamento" encontrado no compêndio.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              No sistema 3DeT Victory, equipamentos são frequentemente narrativos, 
              parte do conceito do personagem, ou gerenciados através de Vantagens como 
              "Inventário" (para consumíveis) ou "Artefato" (para itens únicos e poderosos).
            </p>
          </div>
        )}
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-grow">
            <label htmlFor="compendiumEquipment" className={labelClass}>Escolha um Equipamento:</label>
            <select 
              id="compendiumEquipment" 
              value={selectedItemId} 
              onChange={(e) => setSelectedItemId(e.target.value)}
              className={`${inputClass} w-full`}
              disabled={compendiumItems.length === 0}
            >
              <option value="">Selecione...</option>
              {compendiumItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label htmlFor="itemQuantity" className={labelClass}>Qtd.:</label>
            <input 
              type="number" 
              id="itemQuantity" 
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
              min="1"
              disabled={compendiumItems.length === 0}
            />
          </div>
          <button 
            onClick={handleAddItem} 
            className={buttonClass} 
            disabled={!selectedItemId || compendiumItems.length === 0}
          >
            Adicionar
          </button>
        </div>
      </div>
      <hr className="border-slate-700"/>
      <div>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">Equipamentos Adicionados ({formData.equipment.length})</h3>
        {formData.equipment.length === 0 ? (
          <p className="text-slate-400">Nenhum equipamento adicionado.</p>
        ) : (
          <ul className="space-y-3">
            {formData.equipment.map(item => (
              <li key={item.id} className="p-3 bg-slate-700/70 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-slate-100">{item.name} <span className="text-xs text-amber-400">({item.type})</span></h4>
                    <p className="text-sm text-slate-300 my-1">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor={`qty-${item.id}`} className="text-xs text-slate-400">Qtd:</label>
                    <input 
                      type="number" 
                      id={`qty-${item.id}`}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                      className={`${inputClass} w-20 text-center`}
                      min="0" /* Min 0 to allow removal by setting to 0 */
                    />
                    <button onClick={() => handleRemoveItem(item.id)} className={removeButtonClass}>Remover</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StepEquipment;