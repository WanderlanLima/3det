
import React from 'react';

interface Props {
  onSave: () => void;
  characterName: string;
}

const StepFinalSave: React.FC<Props> = ({ onSave, characterName }) => {
  return (
    <div className="space-y-6 text-center">
      <h3 className="text-2xl font-semibold text-sky-300">Salvar Personagem</h3>
      <p className="text-slate-300">
        Você revisou todos os detalhes de <span className="font-bold text-sky-400">{characterName || "seu personagem"}</span>.
      </p>
      <p className="text-slate-400">
        Clique no botão "Salvar Personagem" abaixo para finalizar a criação ou edição da sua ficha.
      </p>
      <button 
        onClick={onSave}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300"
      >
        Salvar Personagem
      </button>
      <p className="text-xs text-slate-500 mt-4">
        (Esta é uma simulação. Em um aplicativo real, os dados seriam enviados para um servidor ou salvos localmente de forma persistente.)
      </p>
    </div>
  );
};

export default StepFinalSave;
