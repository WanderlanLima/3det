import React from 'react';
import { useCharacterWizard } from '../../src/contexts/CharacterWizardContext'; // Import context hook
import StepTemplate from '../../src/components/StepTemplate'; // Import StepTemplate
import { CharacterAttributes } from '../../types'; // Assuming types are defined here

// Removed Props interface as we use context now

const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-100 placeholder-slate-400";
const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const derivedValueClass = "text-sky-300 font-semibold";

// Added props for navigation functions from the parent wizard component
interface StepAttributesProps {
    onNext?: () => void;
    onPrevious?: () => void;
}

const StepAttributes: React.FC<StepAttributesProps> = ({ onNext, onPrevious }) => {
  const { state, dispatch } = useCharacterWizard(); // Use context
  const formData = state; // Use state from context

  const pontosDePersonagemTotal = formData.nivelDePoder || 10; // Default to 10 if not set
  const { poder, habilidade, resistencia } = formData.attributes;
  
  // TODO: This calculation needs to consider points spent on advantages, disadvantages, skills, kits etc.
  // For now, it only considers base attributes.
  const pontosGastosAtributos = (poder || 0) + (habilidade || 0) + (resistencia || 0);
  
  // Placeholder: Calculate points spent elsewhere (needs data from other steps)
  const pontosGastosOutros = 0; // Replace with actual calculation later
  const remainingPoints = pontosDePersonagemTotal - pontosGastosAtributos - pontosGastosOutros;

  const handleAttributeChange = (attr: keyof Pick<CharacterAttributes, 'poder' | 'habilidade' | 'resistencia'>, value: string) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) numValue = 0; 
    
    numValue = Math.max(0, Math.min(5, numValue)); // Clamp between 0 and 5

    // Dispatch action to update the specific attribute in the context
    dispatch({ type: 'SET_ATTRIBUTE', attribute: attr, value: numValue });
    
    // TODO: Trigger recalculation of points, PV, PM if necessary (might be handled centrally)
  };
  
  const renderAttributeInput = (
    attrKey: keyof Pick<CharacterAttributes, 'poder' | 'habilidade' | 'resistencia'>,
    label: string
  ) => (
    <div>
      <label htmlFor={String(attrKey)} className={labelClass}>
        {label} (0-5)
      </label>
      <input
        type="number"
        id={String(attrKey)}
        value={formData.attributes[attrKey] || 0}
        onChange={(e) => handleAttributeChange(attrKey, e.target.value)}
        className={inputClass}
        min="0"
        max="5"
      />
    </div>
  );

  // Basic validation: Check if points spent exceed total points
  const canProceed = remainingPoints >= 0;

  return (
    <StepTemplate 
        title="Atributos"
        onNext={onNext}
        onPrevious={onPrevious}
        canProceed={canProceed}
        isFirstStep={false} // Assuming this is not the first step
    >
      <div className="space-y-6">
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <p className="text-lg font-semibold text-sky-300">
            Pontos de Personagem Totais: <span className={derivedValueClass}>{pontosDePersonagemTotal}</span>
          </p>
          {/* TODO: Update this calculation to be accurate */} 
          <p className={`text-sm ${remainingPoints < 0 ? 'text-red-400' : 'text-slate-300'}`}>
            Pontos Restantes (Após Atributos): <span className={`font-bold ${remainingPoints < 0 ? 'text-red-400' : derivedValueClass}`}>{remainingPoints}</span>
          </p>
          {remainingPoints < 0 && <p className="text-xs text-red-400 mt-1">Você gastou mais pontos do que o disponível!</p>}
          <p className="text-xs text-slate-400 mt-1">Cada ponto de Atributo (P, H, R) custa 1 Ponto de Personagem. O total restante considera apenas os atributos base por enquanto.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderAttributeInput('poder', 'Poder (P)')}
          {renderAttributeInput('habilidade', 'Habilidade (H)')}
          {renderAttributeInput('resistencia', 'Resistência (R)')}
        </div>
        
        <hr className="border-slate-700 my-6"/>
        
        <h4 className="text-md font-semibold text-slate-200 mb-2">Atributos Derivados:</h4>
        {/* Display derived attributes from context state */} 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-700/30 rounded-lg">
          <div>
            <p className={labelClass}>Pontos de Vida (PV)</p>
            {/* TODO: PV calculation needs to be implemented, likely in the reducer or a useEffect hook watching dependencies */} 
            <p className={derivedValueClass}>{formData.hp} <span className="text-xs text-slate-400">(R×5 + Vantagens, Mín. 1)</span></p>
          </div>
          <div>
            <p className={labelClass}>Pontos de Magia (PM)</p>
            {/* TODO: PM calculation needs to be implemented */} 
            <p className={derivedValueClass}>{formData.mp} <span className="text-xs text-slate-400">(H×5 + Vantagens, Mín. 1)</span></p>
          </div>
           <div>
            <p className={labelClass}>Agilidade (Iniciativa)</p>
            {/* TODO: Agilidade calculation needs to be implemented */} 
            <p className={derivedValueClass}>{formData.attributes.agilidade || 0} <span className="text-xs text-slate-400">(H + Vantagens)</span></p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Atributos variam de 0 a 5. Os totais de PV e PM são recalculados automaticamente considerando os atributos base e vantagens como +Vida e +Mana. Se o atributo base (H ou R) for 0, o recurso correspondente (PM ou PV) terá um valor mínimo de 1 antes de somar bônus de vantagens. Agilidade baseia-se em Habilidade e Vantagens.
          <br/><strong>Nota:</strong> O cálculo de pontos restantes e os valores de PV/PM/Agilidade serão refinados nas próximas etapas para incluir Vantagens, Desvantagens, Kits, etc.
        </p>
      </div>
    </StepTemplate>
  );
};

export default StepAttributes;

