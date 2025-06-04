import React from 'react';
import { CompendiumItem } from '../../types';

interface Props {
  item: CompendiumItem;
  onClose: () => void;
  onAddToSheet: (item: CompendiumItem) => void;
  isAdded: boolean;
}

const CompendiumItemModal: React.FC<Props> = ({ item, onClose, onAddToSheet, isAdded }) => {

  const getDisplayCost = (item: CompendiumItem): string => {
    if (item.cost === undefined) return '';
    // Truques are Técnicas. Artefatos also use XP.
    if (item.type === 'Técnica' || item.type === 'Artefato') {
      return `Custo: ${item.cost}XP`; // Show original XP cost
    }
    return `Custo: ${item.cost}pts`; // Show direct point cost
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-slate-700"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-sky-400 text-2xl"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-sky-400 mb-3">{item.name}</h2>
        <div className="mb-4">
          <span className={`text-sm font-semibold px-2.5 py-1 rounded-full inline-block mr-2 ${
            item.type === 'Vantagem' ? 'bg-green-500/30 text-green-300' :
            item.type === 'Desvantagem' ? 'bg-red-500/30 text-red-300' :
            item.type === 'Perícia' ? 'bg-yellow-500/30 text-yellow-300' :
            item.type === 'Técnica' && item.subtype === 'Truque' ? 'bg-blue-500/30 text-blue-300' :
            item.type === 'Técnica' && item.subtype === 'Comum' ? 'bg-purple-500/30 text-purple-300' :
            item.type === 'Técnica' && item.subtype === 'Lendária' ? 'bg-amber-500/30 text-amber-300' :
            item.type === 'Técnica' ? 'bg-indigo-500/30 text-indigo-300' : // Fallback for Técnica
            item.type === 'Arquétipo' ? 'bg-cyan-500/30 text-cyan-300' :
            item.type === 'Artefato' ? 'bg-emerald-500/30 text-emerald-300' :
            item.type === 'Consumível' ? 'bg-pink-500/30 text-pink-300' :
            'bg-slate-600 text-slate-300' // Default for Monstro, Regra Opcional etc.
          }`}>
            {item.subtype && (item.type === 'Técnica' || item.type === 'Artefato') ? `${item.type} - ${item.subtype}` : item.type}
          </span>
          {item.cost !== undefined && (
            <span className="text-sm text-amber-400 font-mono">{getDisplayCost(item)}</span>
          )}
        </div>

        <p className="text-slate-300 leading-relaxed mb-4 whitespace-pre-line">{item.description}</p>
        
        {item.rules && (
          <div className="mb-4">
            <h4 className="font-semibold text-slate-200 mb-1">Regras:</h4>
            <p className="text-sm text-slate-400 italic whitespace-pre-line">{item.rules}</p>
          </div>
        )}
         {item.prerequisites && (
             <div className="mb-4">
                <h4 className="font-semibold text-slate-200 mb-1">Pré-requisitos:</h4>
                <p className="text-sm text-slate-300 italic">{item.prerequisites}</p>
            </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-slate-200 mb-1">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">#{tag}</span>
              ))}
            </div>
          </div>
        )}

        {item.source && (
          <p className="text-xs text-slate-500 mt-4">Fonte: {item.source}</p>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700">
          <button 
            onClick={() => {
              onAddToSheet(item);
              // Optionally close modal after adding, or rely on user to close
              // onClose(); 
            }}
            disabled={isAdded}
            className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition-colors ${
            isAdded 
            ? 'bg-green-700 text-green-300 cursor-default' 
            : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
          >
            {isAdded ? 'Adicionado à Ficha' : 'Adicionar à Ficha'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompendiumItemModal;