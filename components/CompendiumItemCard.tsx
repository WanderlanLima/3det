
import React from 'react';
import { CompendiumItem } from '../../types';

interface Props {
  item: CompendiumItem;
  onViewDetails: (item: CompendiumItem) => void;
  onAddToSheet: (item: CompendiumItem) => void;
  isAdded: boolean; 
}

const CompendiumItemCard: React.FC<Props> = ({ item, onViewDetails, onAddToSheet, isAdded }) => {
  
  const getDisplayCost = (item: CompendiumItem): string => {
    if (item.cost === undefined) return '';
    // Truques are Técnicas.
    if (item.type === 'Técnica' || item.type === 'Artefato') {
      return `(${item.cost}XP)`; // Show original XP cost
    }
    return `(${item.cost}pts)`; // Show direct point cost
  };
  
  return (
    <div className={`bg-slate-800 rounded-lg shadow-xl flex flex-col h-full transition-all duration-200 border-2 ${isAdded ? 'border-green-500' : 'border-transparent hover:border-sky-600'}`}>
      <div className="p-5 flex-grow">
        <h3 className="text-lg font-semibold text-sky-400 mb-1">{item.name}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${
          item.type === 'Vantagem' ? 'bg-green-500/20 text-green-300' :
          item.type === 'Desvantagem' ? 'bg-red-500/20 text-red-300' :
          item.type === 'Perícia' ? 'bg-yellow-500/20 text-yellow-300' :
          item.type === 'Técnica' && item.subtype === 'Truque' ? 'bg-blue-500/20 text-blue-300' : 
          item.type === 'Técnica' && item.subtype === 'Comum' ? 'bg-purple-500/20 text-purple-300' : 
          item.type === 'Técnica' && item.subtype === 'Lendária' ? 'bg-amber-500/20 text-amber-300' : 
          item.type === 'Técnica' ? 'bg-indigo-500/20 text-indigo-300' : 
          item.type === 'Arquétipo' ? 'bg-cyan-500/20 text-cyan-300' :
          item.type === 'Artefato' ? 'bg-emerald-500/20 text-emerald-300' :
          item.type === 'Consumível' ? 'bg-pink-500/20 text-pink-300' :
          'bg-slate-600 text-slate-300'
        }`}>
          {item.subtype && (item.type === 'Técnica' || item.type === 'Artefato') ? `${item.type} - ${item.subtype}` : item.type} {getDisplayCost(item)}
        </span>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-1">
          {item.description}
        </p>
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 text-xs">
            {item.tags.slice(0,3).map(tag => (
              <span key={tag} className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded mr-1 mb-1 inline-block">#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-700/50 flex flex-col sm:flex-row gap-2">
        <button 
          onClick={() => onViewDetails(item)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-3 rounded-md text-sm transition-colors"
        >
          Ver Detalhes
        </button>
        <button 
          onClick={() => onAddToSheet(item)}
          disabled={isAdded}
          className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
            isAdded 
            ? 'bg-green-700 text-green-300 cursor-default' 
            : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {isAdded ? 'Adicionado' : 'Add à Ficha'}
        </button>
      </div>
    </div>
  );
};

export default CompendiumItemCard;
