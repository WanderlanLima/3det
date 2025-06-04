import React from 'react';
import { CharacterFormData, CompendiumItem, SelectedCompendiumItem, SelectedEquipmentItem } from '../../types';

interface Props {
  formData: CharacterFormData;
  spentXP: number; // XP spent on Techniques & Artifacts
  isLastStep?: boolean;
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-xl font-semibold text-sky-300 mt-4 mb-2 border-b border-slate-700 pb-1">{title}</h3>
);

const AttributePill: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
  <div className="bg-slate-600/50 px-3 py-1.5 rounded-md text-sm">
    <span className="font-medium text-slate-300">{label}: </span>
    <span className="text-sky-200">{value === undefined ? 'N/A' : String(value)}</span>
  </div>
);

const ItemPill: React.FC<{ 
    name: string, 
    type?: string, 
    costText?: string, 
    quantity?: number, 
    isFromArchetype?: boolean, 
    subtype?: string 
}> = ({name, type, costText, quantity, isFromArchetype, subtype}) => (
 <div className={`px-3 py-1.5 rounded-md text-sm text-slate-200 flex-shrink-0 ${isFromArchetype ? 'bg-sky-700' : 'bg-slate-600/50'}`}>
    {name} 
    {subtype && <span className="text-xs text-purple-300"> ({subtype})</span>}
    {type && !subtype && <span className="text-xs text-amber-400"> ({type})</span>}
    {costText && <span className="text-xs text-sky-300"> {costText}</span>}
    {quantity && quantity > 1 && <span className="text-xs text-sky-300"> x{quantity}</span>}
    {isFromArchetype && <span className="text-xs text-sky-200 ml-1 italic">(Arquétipo)</span>}
 </div>
);


const StepReview: React.FC<Props> = ({ formData, spentXP }) => {
  const { attributes, skills, advantages, disadvantages, archetype, techniquesAndTricks, equipment } = formData;
  
  const getPPCostString = (item: SelectedCompendiumItem): string => {
    if (['Vantagem', 'Desvantagem', 'Perícia', 'Arquétipo'].includes(item.type)) {
      let cost = item.cost || 0;
      return `(${cost}pts)`;
    }
    return "";
  };

  const getXPCostString = (item: SelectedCompendiumItem | SelectedEquipmentItem): string => {
    if ((item.type === 'Técnica' || item.type === 'Artefato' || item.subtype === 'Artefato') && item.costType === 'XP') {
        return `(${item.cost || 0}XP)`;
    }
    return "";
  };


  const pontosGastosAtributos = attributes.poder + attributes.habilidade + attributes.resistencia;
  const pontosGastosPericias = skills.reduce((acc, s) => acc + (s.cost || 0), 0);
  const pontosGastosVantagensManuais = advantages
    .filter(v => !v.isFromArchetype)
    .reduce((acc, v) => acc + (v.cost || 0), 0);
  const pontosGanhosDesvantagensManuais = Math.min(
    disadvantages
      .filter(d => !d.isFromArchetype)
      .reduce((acc, d) => acc + Math.abs(d.cost || 0), 0),
    2 
  );
  const pontoGastoArquétipo = archetype?.cost || 0;
  
  // Total PP from Nivel de Poder items
  const totalPPFromNivel = pontosGastosAtributos + pontosGastosPericias + pontosGastosVantagensManuais + pontoGastoArquétipo;
  
  // Convert spentXP (from Techniques and Artifacts) to its PP equivalent for the final summary
  const ppFromSpentXP = Math.ceil(spentXP / 10);

  const totalPontosGastosPPFinal = totalPPFromNivel + ppFromSpentXP;
  const saldoFinalPP = formData.nivelDePoder - totalPontosGastosPPFinal + pontosGanhosDesvantagensManuais;
  
  const saldoFinalXP = formData.xp - spentXP; // spentXP already includes techniques and artifacts


  return (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
      <p className="text-lg text-slate-200">Por favor, revise todas as informações do seu personagem.</p>
      
      <SectionTitle title="Identidade e Conceito" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-2">
        <AttributePill label="Nome" value={formData.name} />
        <AttributePill label="Nível de Poder (PP Base)" value={formData.nivelDePoder} />
        <AttributePill label="Escala" value={formData.escala} />
        <AttributePill label="XP Total Disponível" value={formData.xp} /> 
        {formData.avatarUrl && <AttributePill label="Avatar" value="Definido" />}
      </div>
      <div className="space-y-1 text-sm text-slate-300 bg-slate-700 p-3 rounded-md">
        <p><span className="font-medium text-slate-100">Conceito:</span> {formData.conceito || "Não definido"}</p>
        <p><span className="font-medium text-slate-100">Aparência:</span> {formData.aparencia || "Não definida"}</p>
        {formData.description && <p><span className="font-medium text-slate-100">Descrição (Galeria):</span> {formData.description}</p>}
      </div>

      <SectionTitle title="Atributos (3DeT Victory)" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <AttributePill label="Poder (P)" value={attributes.poder} />
          <AttributePill label="Pontos de Ação (PA)" value={attributes.pontosDeAcao} />
        </div>
        <div className="space-y-1">
          <AttributePill label="Habilidade (H)" value={attributes.habilidade} />
          <AttributePill label="Pontos de Mana (PM)" value={attributes.pontosDeMana} />
        </div>
        <div className="space-y-1">
          <AttributePill label="Resistência (R)" value={attributes.resistencia} />
          <AttributePill label="Pontos de Vida (PV)" value={attributes.pontosDeVida} />
        </div>
      </div>

      {archetype && (
        <>
          <SectionTitle title="Arquétipo" />
          <ItemPill name={archetype.name} type={archetype.type} costText={getPPCostString(archetype)} />
        </>
      )}

      {skills.length > 0 && (
        <>
          <SectionTitle title="Perícias" />
          <div className="flex flex-wrap gap-2">
            {skills.map(s => <ItemPill key={s.id} name={s.name} costText={getPPCostString(s)} />)}
          </div>
        </>
      )}

      {advantages.length > 0 && (
        <>
          <SectionTitle title="Vantagens" />
           <div className="flex flex-wrap gap-2">
            {advantages.map(v => <ItemPill key={v.id} name={v.name} costText={getPPCostString(v)} isFromArchetype={v.isFromArchetype} />)}
          </div>
        </>
      )}

      {disadvantages.length > 0 && (
        <>
          <SectionTitle title="Desvantagens" />
          <div className="flex flex-wrap gap-2">
            {disadvantages.map(d => <ItemPill key={d.id} name={d.name} costText={getPPCostString(d)} isFromArchetype={d.isFromArchetype} />)}
          </div>
        </>
      )}
      
      {techniquesAndTricks.length > 0 && (
        <>
          <SectionTitle title="Técnicas & Truques" />
          <div className="flex flex-wrap gap-2">
            {techniquesAndTricks.map(t => (
                <ItemPill key={t.id} name={t.name} subtype={t.subtype} costText={getXPCostString(t)} />
            ))}
          </div>
        </>
      )}

      {equipment.length > 0 && (
        <>
          <SectionTitle title="Artefatos & Consumíveis" />
          <div className="flex flex-wrap gap-2">
            {equipment.map(e => (
                 <ItemPill key={e.id} name={e.name} subtype={e.subtype || e.type} costText={getXPCostString(e)} quantity={e.quantity} />
            ))}
          </div>
        </>
      )}

      {formData.history && (
        <>
          <SectionTitle title="História & Objetivos" />
          <p className="text-sm text-slate-300 whitespace-pre-line bg-slate-700 p-3 rounded">{formData.history}</p>
        </>
      )}
      {formData.notes && (
        <>
          <SectionTitle title="Anotações Livres" />
          <p className="text-sm text-slate-300 whitespace-pre-line bg-slate-700 p-3 rounded">{formData.notes}</p>
        </>
      )}
       <div className="mt-6 pt-4 border-t border-slate-600">
            <h3 className="text-lg font-semibold text-sky-300">Resumo dos Pontos:</h3>
            <p className="text-sm text-slate-300">Nível de Poder (PP Base para distribuição): {formData.nivelDePoder}</p>
            <p className="text-sm text-slate-300">PP Gastos (Atributos, Perícias, Vantagens, Arquétipo): {totalPPFromNivel}</p>
            <p className="text-sm text-slate-300">PP Ganhos com Desvantagens (Máx. +2): +{pontosGanhosDesvantagensManuais}</p>
             <p className="text-sm text-slate-300">PP equivalentes de XP gasto em Técnicas/Artefatos (XP/10): {ppFromSpentXP}</p>
            <p className={`text-md font-bold ${saldoFinalPP < 0 ? 'text-red-400' : 'text-green-400'}`}>
                Saldo Final de Pontos de Personagem (Considerando Nível de Poder e XP): {saldoFinalPP}
            </p>
            {saldoFinalPP < 0 && <p className="text-red-400 text-xs">Atenção: Você excedeu os Pontos de Personagem totais da ficha (Nível + XP)!</p>}
            
            <hr className="my-2 border-slate-700"/>

            <p className="text-sm text-slate-300 mt-2">XP Total Disponível: {formData.xp}</p>
            <p className="text-sm text-slate-300">XP Gastos em Técnicas e Artefatos: {spentXP}</p>
             <p className={`text-md font-bold ${saldoFinalXP < 0 ? 'text-red-400' : 'text-green-400'}`}>
                Saldo Final de XP: {saldoFinalXP}
            </p>
            {saldoFinalXP < 0 && <p className="text-red-400 text-xs">Atenção: Você excedeu os Pontos de Experiência disponíveis!</p>}
        </div>
    </div>
  );
};

export default StepReview;
