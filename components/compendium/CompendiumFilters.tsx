import React from 'react';
import { CompendiumItem } from '../../types';

interface Props {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  availableTypes: CompendiumItem['type'][];
  selectedTypes: Set<CompendiumItem['type']>;
  onTypeToggle: (type: CompendiumItem['type']) => void;
  onClearFilters: () => void;
  resultsCount: number;
}

const CompendiumFilters: React.FC<Props> = ({
  searchTerm,
  onSearchChange,
  availableTypes,
  selectedTypes,
  onTypeToggle,
  onClearFilters,
  resultsCount
}) => {
  const inputClass = "flex-grow px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100 placeholder-slate-400 shadow-sm";
  const buttonClass = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeTypeButtonClass = "bg-sky-500 text-white";
  const inactiveTypeButtonClass = "bg-slate-700 hover:bg-slate-600 text-slate-300";

  return (
    <div className="p-6 bg-slate-800 rounded-xl shadow-lg space-y-6">
      <div>
        <label htmlFor="search-compendium" className="sr-only">Buscar no Compêndio</label>
        <input
          id="search-compendium"
          type="text"
          placeholder="Buscar por nome, descrição, tag..."
          className={inputClass}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div>
        <p className="text-sm font-medium text-slate-300 mb-2">Filtrar por Tipo:</p>
        <div className="flex flex-wrap gap-2">
          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              className={`${buttonClass} ${selectedTypes.has(type) ? activeTypeButtonClass : inactiveTypeButtonClass}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-700">
        <p className="text-sm text-slate-400">{resultsCount} item(s) encontrado(s)</p>
        <button 
          onClick={onClearFilters}
          className="text-sky-400 hover:text-sky-300 text-sm font-medium"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default CompendiumFilters;