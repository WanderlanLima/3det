import React from 'react';
import { EscalaPersonagem } from '../types';
import { X } from 'lucide-react';

interface ArchetypeOption {
  id: string;
  name: string;
}

interface GalleryFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedArchetypeId: string;
  onArchetypeChange: (archetypeId: string) => void;
  archetypeOptions: ArchetypeOption[];
  selectedEscala: string;
  onEscalaChange: (escala: string) => void;
  escalaOptions: EscalaPersonagem[];
  onClearFilters: () => void;
  resultsCount: number;
  totalCount: number;
}

const inputClass = "w-full px-3 py-2 rounded-md bg-slate-700 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-400 text-sm";
const labelClass = "block text-xs font-medium text-slate-300 mb-1";

const GalleryFilters: React.FC<GalleryFiltersProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedArchetypeId,
  onArchetypeChange,
  archetypeOptions,
  selectedEscala,
  onEscalaChange,
  escalaOptions,
  onClearFilters,
  resultsCount,
  totalCount,
}) => {
  return (
    <div className="mb-6 p-4 bg-slate-800 rounded-lg shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="searchTerm" className={labelClass}>Buscar por Nome:</label>
          <input
            type="text"
            id="searchTerm"
            className={inputClass}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Nome do personagem..."
          />
        </div>
        <div>
          <label htmlFor="archetypeFilter" className={labelClass}>Filtrar por Arquétipo:</label>
          <select
            id="archetypeFilter"
            className={inputClass}
            value={selectedArchetypeId}
            onChange={(e) => onArchetypeChange(e.target.value)}
          >
            <option value="">Todos Arquétipos</option>
            {archetypeOptions.map(arch => (
              <option key={arch.id} value={arch.id}>{arch.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="escalaFilter" className={labelClass}>Filtrar por Escala:</label>
          <select
            id="escalaFilter"
            className={inputClass}
            value={selectedEscala}
            onChange={(e) => onEscalaChange(e.target.value)}
          >
            <option value="">Todas Escalas</option>
            {escalaOptions.map(escala => (
              <option key={escala} value={escala}>{escala}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm text-slate-400">
          Exibindo {resultsCount} de {totalCount} ficha(s).
        </p>
        {(searchTerm || selectedArchetypeId || selectedEscala) && (
          <button
            onClick={onClearFilters}
            className="flex items-center text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            <X size={14} className="mr-1" />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
};

export default GalleryFilters;
