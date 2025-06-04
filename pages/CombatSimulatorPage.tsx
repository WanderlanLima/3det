// File re-processed to address potential persistent syntax errors.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Combatant, CombatLogEntry, CombatState, CombatPhase, RollDetails, ConditionDetails,
  CharacterMinimal, ActiveCondition, EscalaPersonagem, KnownConditionName,
  CHARACTER_GALLERY_LIST_KEY, CharacterSummary, CHARACTER_SHEET_PREFIX_KEY, CharacterFormData, SelectedCompendiumItem 
} from '../types';
import { 
    Swords, Shield, Users, ChevronRight, ChevronLeft, Dices, RotateCcw, 
    Zap, HeartCrack, UserPlus, Trash2, PlayCircle, XCircle, 
    PlusSquare, XSquare as XSquareIcon, AlertCircle, CheckSquare, Target, 
    ChevronDownSquare, Eraser, History, HeartPulse, MessageSquare, ShieldAlert, Bot, Skull, Meh, Smile, Frown, Check, ChevronsRight, Wind, Hand, Square, SkipForward, ShieldCheck, RefreshCw, Settings2, MinusSquare, HelpCircle, ZapOff, Flag
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const KNOWN_CONDITIONS_LIST: { name: KnownConditionName; description: string; grantsPerda?: boolean; preventsCriticals?: boolean; defaultDuration?: number, effect?: ActiveCondition['effect'] }[] = [
  { name: "Perto da Derrota", description: "PV <= Resistência Base. Perda em testes, sem críticos.", grantsPerda: true, preventsCriticals: true, defaultDuration: undefined, effect: { grantsPerda: true, preventsCriticals: true } },
  { name: "Derrotado", description: "PV <= 0. Perda em testes, sem críticos. Sofre Teste de Morte se danificado.", grantsPerda: true, preventsCriticals: true, defaultDuration: undefined, effect: { grantsPerda: true, preventsCriticals: true } },
  { name: "Caído", description: "Consciente, mas não pode agir ou se mover.", defaultDuration: undefined, effect: { grantsPerda: true } },
  { name: "Inconsciente", description: "PV em 0. Acorda com descanso ou Medicina.", defaultDuration: undefined, effect: { grantsPerda: true, preventsCriticals: true } },
  { name: "Quase Morto", description: "Morre em 1D rodadas sem Medicina.", defaultDuration: undefined, effect: { grantsPerda: true, preventsCriticals: true } },
  { name: "Morto", description: "F.", defaultDuration: undefined, effect: { grantsPerda: true, preventsCriticals: true } },
  { name: "Perda Próximo Teste", description: "Sofre Perda no próximo teste realizado.", grantsPerda: true, defaultDuration: 1, effect: { grantsPerda: true } }, // Dura até ser consumido
  { name: "Defesa Total Ativa", description: "Recebe Ganho em testes de Defesa.", grantsPerda: false, defaultDuration: 1, effect: { grantsGanho: true} },
  { name: "Atordoado", description: "Não pode realizar ações, apenas um movimento.", defaultDuration: 1, effect: { grantsPerda: true } },
  { name: "Cego", description: "Perda em ações que usam visão (ataque, etc.).", defaultDuration: undefined, effect: { grantsPerda: true } },
  { name: "Confuso", description: "Alvos de perícias/vantagens escolhidos ao acaso.", defaultDuration: undefined, effect: { grantsPerda: true } },
];


const mockNPCtemplates: CharacterMinimal[] = [
  { id: 'npc_goblin_template', name: 'Goblin Comum', avatarUrl: 'https://via.placeholder.com/40/e74c3c/FFFFFF?Text=G', attributes: { poder: 1, habilidade: 1, resistencia: 1 }, isNPC: true, techniquesAndTricks: [] },
  { id: 'npc_orc_template', name: 'Orc Brutamontes', avatarUrl: 'https://via.placeholder.com/40/2ecc71/FFFFFF?Text=O', attributes: { poder: 3, habilidade: 1, resistencia: 3 }, isNPC: true, techniquesAndTricks: [] },
  { id: 'npc_esqueleto_template', name: 'Esqueleto Guerreiro', avatarUrl: 'https://via.placeholder.com/40/bdc3c7/000000?Text=E', attributes: { poder: 2, habilidade: 0, resistencia: 2 }, isNPC: true, techniquesAndTricks: [] },
];

const initialCombatState: CombatState = {
  combatants: [],
  orderedCombatantIds: [],
  currentCombatantId: null,
  round: 0,
  log: [],
  phase: CombatPhase.SETUP, 
  selectedTargetId: null,
  limiteDeDanoAtivo: false,
};

const formatRollDetails = (details?: RollDetails): string => {
  if (!details) return '';
  let msg = `${details.description || 'Rolagem'}: ${details.total} (Dados: [${details.rolls.join(', ')}]`;
  if (details.attributeValue) msg += ` + Attr: ${details.attributeValue}`;
  if (details.tempModifierValue) msg += ` + Mod Temp: ${details.tempModifierValue}`;
  if (details.bonusFromEffects) msg += ` + Efeitos: ${details.bonusFromEffects}`;
  if (details.isGanho) msg += ` +1D (Ganho)`;
  if (details.isPerda) msg += ` -1D (Perda)`;
  if (details.isCriticalHit) msg += ` CRÍTICO! (+${details.criticalBonuses || 0})`;
  if (details.isCriticalFailure) msg += ` FALHA CRÍTICA!`;
  msg += ')';
  return msg;
};

const rollDie = (sides: number = 6): number => Math.floor(Math.random() * sides) + 1;

interface TestParameters {
  baseAttributeValue: number;
  usaPericia: boolean;
  ganhoBase: number; // Ganho vindo da configuração do teste (modal, etc.)
  perdaBase: number;  // Perda vinda da configuração do teste
  modificadorTemporario: number;
  combatant: Combatant; // O combatente realizando o teste
  testName: string;
}

interface TestResult {
  total: number;
  diceRolls: number[];
  isCriticalHit: boolean;
  isCriticalFailure: boolean;
  criticalBonuses: number;
  rollDetails: RollDetails;
}

const CombatSimulatorPage: React.FC = () => {
  const [combatState, setCombatState] = useState<CombatState>(initialCombatState);
  const { combatants, orderedCombatantIds, currentCombatantId, round, log, phase, selectedTargetId, limiteDeDanoAtivo } = combatState;
  
  const [characterGallery, setCharacterGallery] = useState<CharacterSummary[]>([]);
  const [selectedPCId, setSelectedPCId] = useState<string>('');
  const [selectedNPCTemplateId, setSelectedNPCTemplateId] = useState<string>('');
  const [quickNPCData, setQuickNPCData] = useState({ name: '', poder: 0, habilidade: 0, resistencia: 0 });

  const [isAttackModalOpen, setIsAttackModalOpen] = useState(false);
  const [attackParams, setAttackParams] = useState({ usaPericia: false, ganho: 0, perda: 0, modificador: 0, ignoraLimiteDanoPA: false });
  const [defenseParams, setDefenseParams] = useState({ usaPericia: false, ganho: 0, perda: 0, modificador: 0 });

  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  const [conditionTargetId, setConditionTargetId] = useState<string | null>(null);
  const [selectedConditionName, setSelectedConditionName] = useState<KnownConditionName | string>('');
  const [customConditionDesc, setCustomConditionDesc] = useState('');
  const [conditionDuration, setConditionDuration] = useState<number | undefined>(undefined);
  
  const [isDeathTestModalOpen, setIsDeathTestModalOpen] = useState(false);
  const [deathTestCombatant, setDeathTestCombatant] = useState<Combatant | null>(null);
  const [deathTestRollResult, setDeathTestRollResult] = useState<string>('');
  
  const [combatOutcomeMessage, setCombatOutcomeMessage] = useState<string>('');


  const addLogEntry = useCallback((
    message: string,
    type: CombatLogEntry['type'],
    actorId?: string,
    targetId?: string,
    rollDetails?: RollDetails,
    conditionDetails?: ConditionDetails
  ) => {
    setCombatState(prevState => ({
      ...prevState,
      log: [{ id: `log_${Date.now()}_${prevState.log.length}`, timestamp: new Date(), message, type, actorId, targetId, rollDetails, conditionDetails }, ...prevState.log].slice(0, 100)
    }));
  }, []);

  const applyCondition = useCallback((targetId: string, condition: ActiveCondition) => {
    const targetCombatant = combatants.find(c => c.id === targetId);
    if (!targetCombatant) return;

    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => 
        c.id === targetId ? { ...c, activeConditions: [...c.activeConditions, condition] } : c
      )
    }));
    addLogEntry(`Condição "${condition.name}" aplicada a ${targetCombatant.name}.`, 'condition_applied', condition.sourceCombatantId || undefined, targetId, undefined, {name: String(condition.name), duration: condition.durationInTurns});
  }, [combatants, addLogEntry]);

  const removeCondition = useCallback((targetId: string, conditionId: string, reason: 'expired' | 'manual' = 'manual') => {
    let conditionName = '';
    const targetCombatant = combatants.find(c => c.id === targetId);
    if (!targetCombatant) return;

    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id === targetId) {
          const condToRemove = c.activeConditions.find(ac => ac.id === conditionId);
          conditionName = String(condToRemove?.name || 'Desconhecida');
          return { ...c, activeConditions: c.activeConditions.filter(ac => ac.id !== conditionId) };
        }
        return c;
      })
    }));
    addLogEntry(`Condição "${conditionName}" removida de ${targetCombatant.name} (${reason === 'expired' ? 'expirou' : 'manual'}).`, 'condition_remove', undefined, targetId, undefined, {name: conditionName});
  }, [combatants, addLogEntry]);
  
  const rollTest = useCallback((params: TestParameters): TestResult => {
    const { baseAttributeValue, usaPericia, ganhoBase, perdaBase, modificadorTemporario, combatant, testName } = params;

    let numDice = 1;
    if (usaPericia) numDice++;
    
    let perdaFromConditions = 0;
    let ganhoFromConditions = 0;
    let preventsCriticals = false;
    let bonusFromEffects = 0;

    const perdaProximoTesteCond = combatant.activeConditions.find(c => c.name === "Perda Próximo Teste");
    if (perdaProximoTesteCond) {
        perdaFromConditions++;
        // Temporarily remove the condition if it's single-use for this test instance
        const tempConditions = combatant.activeConditions.filter(ac => ac.id !== perdaProximoTesteCond.id)
        // Update state with the removal after the test in the calling function if needed.
        // For now, we just apply its effect.
        addLogEntry(`Condição "Perda Próximo Teste" consumida por ${combatant.name} para ${testName}.`, 'condition_expired', combatant.id, undefined, undefined, { name: "Perda Próximo Teste" });
        // The actual removal from state should happen in the calling function or a useEffect to avoid race conditions.
    }

    combatant.activeConditions.forEach(cond => {
        if (cond.effect?.grantsPerda && cond.id !== perdaProximoTesteCond?.id) perdaFromConditions++; // Don't double count
        if (cond.effect?.grantsGanho) ganhoFromConditions++;
        if (cond.effect?.preventsCriticals) preventsCriticals = true;
        if (cond.name === "Perto da Derrota" || cond.name === "Derrotado") { 
          if (cond.id !== perdaProximoTesteCond?.id) perdaFromConditions++; // Don't double count if "Perto da Derrota" is already causing Perda
          preventsCriticals = true;
        }
    });

    const netGanho = ganhoBase + ganhoFromConditions;
    const netPerda = perdaBase + perdaFromConditions;

    const effectiveGanho = Math.max(0, netGanho - netPerda);
    const effectivePerda = Math.max(0, netPerda - netGanho);

    numDice += effectiveGanho;
    numDice -= effectivePerda;
    numDice = Math.max(1, Math.min(3, numDice));

    const diceRolls = Array.from({ length: numDice }, () => rollDie());
    const sumOfRolls = diceRolls.reduce((sum, roll) => sum + roll, 0);

    let criticalBonuses = 0;
    const isCriticalHit = !preventsCriticals && diceRolls.some(roll => roll === 6);
    if (isCriticalHit) {
      diceRolls.forEach(roll => {
        if (roll === 6) criticalBonuses += baseAttributeValue;
      });
    }
    
    const isCriticalFailure = diceRolls.length > 0 && diceRolls.every(roll => roll === 1);
    
    if (isCriticalFailure) {
        addLogEntry(`${combatant.name} teve uma FALHA CRÍTICA em ${testName}! Sofrerá Perda no próximo teste.`, 'error', combatant.id);
    }
    
    const total = sumOfRolls + baseAttributeValue + criticalBonuses + modificadorTemporario + bonusFromEffects;

    const currentRollDetails: RollDetails = {
        dice: `${numDice}D6`, rolls: diceRolls, attributeValue: baseAttributeValue,
        tempModifierValue: modificadorTemporario, bonusFromEffects, total, description: testName,
        isCriticalHit, isCriticalFailure, criticalBonuses,
        isGanho: effectiveGanho > 0, isPerda: effectivePerda > 0
    };
    
    return { total, diceRolls, isCriticalHit, isCriticalFailure, criticalBonuses, rollDetails: currentRollDetails };
  }, [addLogEntry]);

  useEffect(() => {
    setCombatState(prev => {
      const newCombatants = prev.combatants.map(c => {
        const isCurrentlyPerto = c.activeConditions.some(cond => cond.name === "Perto da Derrota");
        const shouldBePerto = c.currentPV <= c.resistencia && c.currentPV > 0 && !c.isDefeated;

        let newConditions = [...c.activeConditions];
        if (shouldBePerto && !isCurrentlyPerto) {
          const pertoCond = {
            id: `cond_perto_derrota_${c.id}`, name: "Perto da Derrota" as KnownConditionName,
            description: "PV <= Resistência Base. Perda em testes, sem críticos.", isSystemCondition: true,
            effect: { grantsPerda: true, preventsCriticals: true }
          };
          newConditions.push(pertoCond);
          if(prev.phase === CombatPhase.ACTING) addLogEntry(`${c.name} está Perto da Derrota!`, 'condition_add', c.id, undefined, undefined, {name: "Perto da Derrota"});
        } else if (!shouldBePerto && isCurrentlyPerto) {
          newConditions = newConditions.filter(cond => cond.name !== "Perto da Derrota");
          if(prev.phase === CombatPhase.ACTING) addLogEntry(`Condição "Perto da Derrota" removida de ${c.name}.`, 'condition_remove', c.id, undefined, undefined, {name: "Perto da Derrota"});
        }
        return { ...c, activeConditions: newConditions };
      });
      if (JSON.stringify(prev.combatants.map(c=>c.activeConditions)) !== JSON.stringify(newCombatants.map(c=>c.activeConditions))) {
        return { ...prev, combatants: newCombatants };
      }
      return prev;
    });
  }, [combatants.map(c => `${c.id}_${c.currentPV}_${c.resistencia}_${c.isDefeated}`).join(','), addLogEntry]); 


   useEffect(() => {
    if (phase === CombatPhase.SETUP) {
      const galleryListString = localStorage.getItem(CHARACTER_GALLERY_LIST_KEY);
      if (galleryListString) {
        setCharacterGallery(JSON.parse(galleryListString));
      }
    }
  }, [phase]);

  const calculateInitialStats = (attributes: { poder: number; habilidade: number; resistencia: number; }) => {
    const poder = Math.max(0, attributes.poder);
    const habilidade = Math.max(0, attributes.habilidade);
    const resistencia = Math.max(0, attributes.resistencia);
    const maxPV = resistencia === 0 ? 1 : resistencia * 5;
    const maxPM = habilidade === 0 ? 1 : habilidade * 5;
    const maxPA = Math.max(1, poder);
    return { poder, habilidade, resistencia, maxPV, maxPM, maxPA, currentPV: maxPV, currentPM: maxPM, currentPA: maxPA };
  };
  
  const handleAddPC = useCallback(() => {
    if (!selectedPCId) return;
    const charSheetString = localStorage.getItem(`${CHARACTER_SHEET_PREFIX_KEY}${selectedPCId}`);
    if (charSheetString) {
      const pcData: CharacterFormData = JSON.parse(charSheetString);
      const stats = calculateInitialStats(pcData.attributes);
      const hasLuta = pcData.skills.some(skill => skill.name.toLowerCase().includes('luta'));
      const newCombatant: Combatant = {
        id: `pc_${pcData.id}_${Date.now()}`,
        originalCharacterId: pcData.id!,
        name: pcData.name,
        avatarUrl: pcData.avatarUrl,
        isNPC: false,
        ...stats,
        escala: pcData.escala || 'Ningen',
        initiativeTotal: 0,
        activeConditions: [],
        isCurrentTurn: false,
        isDefeated: false,
        skills: pcData.skills,
        techniquesAndTricks: pcData.techniquesAndTricks,
        tempModifier: 0,
        actionUsedThisTurn: false,
        movementsUsedThisTurn: 0,
        usaPericiaLutaIniciativa: hasLuta,
      };
      setCombatState(prev => ({ ...prev, combatants: [...prev.combatants, newCombatant]}));
      addLogEntry(`${pcData.name} (PC) adicionado ao combate.`, 'info', newCombatant.id);
      setSelectedPCId('');
    }
  }, [selectedPCId, addLogEntry]);

  const handleAddNPCTemplate = useCallback(() => {
    if (!selectedNPCTemplateId) return;
    const template = mockNPCtemplates.find(t => t.id === selectedNPCTemplateId);
    if (template) {
      const stats = calculateInitialStats(template.attributes);
      const newCombatant: Combatant = {
        id: `npc_${template.id}_${Date.now()}`,
        originalCharacterId: template.id,
        name: template.name,
        avatarUrl: template.avatarUrl,
        isNPC: true,
        ...stats,
        escala: 'Ningen', 
        initiativeTotal: 0,
        activeConditions: [],
        isCurrentTurn: false,
        isDefeated: false,
        techniquesAndTricks: [],
        tempModifier: 0,
        actionUsedThisTurn: false,
        movementsUsedThisTurn: 0,
        usaPericiaLutaIniciativa: false, 
      };
      setCombatState(prev => ({ ...prev, combatants: [...prev.combatants, newCombatant]}));
      addLogEntry(`${template.name} (Template) adicionado ao combate.`, 'info', newCombatant.id);
      setSelectedNPCTemplateId('');
    }
  }, [selectedNPCTemplateId, addLogEntry]);

  const handleAddQuickNPC = useCallback(() => {
    if (!quickNPCData.name.trim()) {
      addLogEntry("Nome do NPC rápido é obrigatório.", "error");
      return;
    }
    const stats = calculateInitialStats(quickNPCData);
    const newCombatant: Combatant = {
      id: `qnpc_${quickNPCData.name.replace(/\s+/g, '')}_${Date.now()}`,
      originalCharacterId: `qnpc_${quickNPCData.name.replace(/\s+/g, '')}`,
      name: quickNPCData.name,
      isNPC: true,
      ...stats,
      escala: 'Ningen', 
      initiativeTotal: 0,
      activeConditions: [],
      isCurrentTurn: false,
      isDefeated: false,
      techniquesAndTricks: [],
      tempModifier: 0,
      actionUsedThisTurn: false,
      movementsUsedThisTurn: 0,
      usaPericiaLutaIniciativa: false, 
    };
    setCombatState(prev => ({ ...prev, combatants: [...prev.combatants, newCombatant]}));
    addLogEntry(`${quickNPCData.name} (NPC Rápido) adicionado ao combate.`, 'info', newCombatant.id);
    setQuickNPCData({ name: '', poder: 0, habilidade: 0, resistencia: 0 });
  }, [quickNPCData, addLogEntry]);

  const handleRemoveCombatant = useCallback((idToRemove: string) => {
    const removedName = combatants.find(c => c.id === idToRemove)?.name;
    setCombatState(prev => ({
        ...prev,
        combatants: prev.combatants.filter(c => c.id !== idToRemove),
        orderedCombatantIds: prev.orderedCombatantIds.filter(id => id !== idToRemove),
        currentCombatantId: prev.currentCombatantId === idToRemove ? 
            (prev.orderedCombatantIds.length > 1 ? prev.orderedCombatantIds.find(id => id !== idToRemove) || null : null) 
            : prev.currentCombatantId,
        selectedTargetId: prev.selectedTargetId === idToRemove ? null : prev.selectedTargetId,
    }));
    addLogEntry(`${removedName || 'Combatente'} removido do combate.`, 'info');
  }, [combatants, addLogEntry]);

  const handleEscalaChange = (combatantId: string, newEscala: EscalaPersonagem) => {
    const combatant = combatants.find(c => c.id === combatantId);
    if (!combatant) return;
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => c.id === combatantId ? { ...c, escala: newEscala } : c)
    }));
    addLogEntry(`Escala de ${combatant.name} alterada para ${newEscala}.`, 'info', combatantId);
  };
  
  const handleUsaPericiaIniciativaChange = (combatantId: string, checked: boolean) => {
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => 
        c.id === combatantId ? { ...c, usaPericiaLutaIniciativa: checked } : c
      )
    }));
  };

  const rollInitiativeForCombatant = useCallback((combatant: Combatant): Combatant => {
    const rollResult = rollTest({
      baseAttributeValue: combatant.habilidade,
      usaPericia: combatant.usaPericiaLutaIniciativa,
      ganhoBase: 0, perdaBase: 0, modificadorTemporario: 0,
      combatant, testName: "Iniciativa"
    });
    addLogEntry(
      `${combatant.name} rolou Iniciativa.`, 'initiative', combatant.id, undefined,
      rollResult.rollDetails
    );
    return { ...combatant, initiativeDiceRolls: rollResult.diceRolls, initiativeRollValue: rollResult.rollDetails.rolls.reduce((s,r)=>s+r,0), initiativeTotal: rollResult.total };
  }, [rollTest, addLogEntry]);

  const handleRollIndividualInitiative = useCallback((combatantId: string) => {
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => c.id === combatantId ? rollInitiativeForCombatant(c) : c)
    }));
  }, [rollInitiativeForCombatant]);

  const handleRollAllInitiatives = useCallback(() => {
    addLogEntry("Rolando iniciativa para todos os combatentes pendentes...", 'initiative');
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => 
        c.initiativeTotal === 0 || c.initiativeRollValue === undefined ? rollInitiativeForCombatant(c) : c
      )
    }));
  }, [rollInitiativeForCombatant, addLogEntry]);

  const proceedToInitiativePhase = useCallback(() => {
    if (combatants.length < 1) {
      addLogEntry("Adicione pelo menos 1 combatente para iniciar.", "error");
      return;
    }
    addLogEntry("Início do Combate! Preparando para rolar iniciativas.", 'combat_start');
    setCombatState(prev => ({
      ...prev,
      phase: CombatPhase.INITIATIVE,
      combatants: prev.combatants.map(c => ({ 
        ...c,
        initiativeRollValue: undefined,
        initiativeTotal: 0,
        initiativeDiceRolls: undefined,
        isCurrentTurn: false,
        actionUsedThisTurn: false,
        movementsUsedThisTurn: 0,
        activeConditions: [], 
        currentPV: c.maxPV, 
        currentPM: c.maxPM,
        currentPA: c.maxPA,
        isDefeated: false,
        isRecoveringFromDeathTest: false,
      }))
    }));
  }, [combatants, addLogEntry]);

  const handleProceedToActing = useCallback(() => {
    const allRolled = combatants.every(c => c.initiativeTotal !== 0 && c.initiativeRollValue !== undefined);
    if (!allRolled) {
        addLogEntry("Todos os combatentes precisam rolar iniciativa antes de prosseguir.", "error");
        return;
    }

    let sortedCombatantsData = [...combatants].sort((a, b) => {
        if (b.initiativeTotal !== a.initiativeTotal) {
            return b.initiativeTotal - a.initiativeTotal;
        }
        if (b.habilidade !== a.habilidade) {
            return b.habilidade - a.habilidade;
        }
        const rollA = rollDie();
        const rollB = rollDie();
        addLogEntry(`Desempate de Iniciativa: ${a.name} (${rollA}) vs ${b.name} (${rollB}).`, 'initiative', undefined, undefined, { dice: '1D6', rolls: [rollA], total: rollA, description: `Desempate ${a.name}`});
        addLogEntry('', 'initiative', undefined, undefined, { dice: '1D6', rolls: [rollB], total: rollB, description: `Desempate ${b.name}`});
        return rollB - rollA; 
    });
    
    const orderedIds = sortedCombatantsData.map(c => c.id);
    const firstCombatantId = orderedIds[0];

    sortedCombatantsData = sortedCombatantsData.map(c => {
      let initialConditions: ActiveCondition[] = [];
      if (c.currentPV <= c.resistencia && c.currentPV > 0 && !c.isDefeated) {
        initialConditions.push({
          id: `cond_perto_derrota_${c.id}_init`, name: "Perto da Derrota",
          description: "PV <= Resistência Base. Perda em testes, sem críticos.", isSystemCondition: true,
          effect: { grantsPerda: true, preventsCriticals: true }
        });
      }
      return c.id === firstCombatantId ? 
        { ...c, currentPA: c.maxPA, actionUsedThisTurn: false, movementsUsedThisTurn: 0, isCurrentTurn: true, activeConditions: initialConditions } : 
        { ...c, isCurrentTurn: false, activeConditions: initialConditions };
    });
    
    setCombatState(prev => ({
        ...prev,
        combatants: sortedCombatantsData,
        orderedCombatantIds: orderedIds,
        currentCombatantId: firstCombatantId,
        phase: CombatPhase.ACTING,
        round: 1,
    }));
    addLogEntry(`Ordem de combate definida: ${sortedCombatantsData.map(c => c.name).join(', ')}.`, 'info');
    addLogEntry(`Round 1 iniciado. É o turno de ${sortedCombatantsData.find(c=>c.id === firstCombatantId)?.name || ''}.`, 'turn', firstCombatantId);
  }, [combatants, addLogEntry]);
  
  const handleBackToSetup = useCallback(() => {
    addLogEntry("Retornou à Configuração do Combate. Iniciativas e estados resetados.", 'info');
    setCombatState(prev => ({
      ...prev,
      phase: CombatPhase.SETUP,
      orderedCombatantIds: [],
      currentCombatantId: null,
      round: 0,
      combatOutcomeMessage: '',
      combatants: prev.combatants.map(c => ({ 
        ...c,
        initiativeRollValue: undefined,
        initiativeTotal: 0,
        initiativeDiceRolls: undefined,
        isCurrentTurn: false,
        actionUsedThisTurn: false,
        movementsUsedThisTurn: 0,
        activeConditions: [],
        currentPV: c.maxPV,
        currentPM: c.maxPM,
        currentPA: c.maxPA,
        isDefeated: false,
        isRecoveringFromDeathTest: false,
      }))
    }));
  }, [addLogEntry]);

  const handleStartCombatSetup = useCallback(() => {
    setCombatState({
      ...initialCombatState,
      log: [{id: `log_reset_${Date.now()}`, timestamp: new Date(), message: "Simulador de Combate iniciado. Adicione combatentes.", type: 'combat_start'}]
    });
    setSelectedPCId('');
    setSelectedNPCTemplateId('');
    setQuickNPCData({ name: '', poder: 0, habilidade: 0, resistencia: 0 });
    setCombatOutcomeMessage('');
  }, []);

  const currentActor = useMemo(() => {
    if (!currentCombatantId) return null; 
    return combatants.find(c => c.id === currentCombatantId); 
  }, [currentCombatantId, combatants]); 

  const handleUpdateCombatantResource = useCallback((combatantId: string, resource: 'currentPV' | 'currentPM' | 'currentPA', value: number, isDelta: boolean = false) => {
    setCombatState(prev => {
        const combatantIndex = prev.combatants.findIndex(c => c.id === combatantId);
        if (combatantIndex === -1) return prev;

        const combatant = prev.combatants[combatantIndex];
        let newValue = isDelta ? combatant[resource] + value : value;

        if (resource === 'currentPV') {
             // Allow PV to go below 0 for death test logic
        } else if (resource === 'currentPM') {
            newValue = Math.max(0, Math.min(newValue, combatant.maxPM));
        } else if (resource === 'currentPA') {
            newValue = Math.max(0, Math.min(newValue, combatant.maxPA));
        }
        
        const wasDefeated = combatant.isDefeated;
        const newIsDefeated = resource === 'currentPV' && newValue <= 0;

        let logMsg = `${combatant.name} ${resource === 'currentPV' ? 'PV' : resource === 'currentPM' ? 'PM' : 'PA'} alterado para ${newValue}.`;
        if(isDelta) {
            const changeType = value > 0 ? 'ganhou' : 'perdeu';
            const resourceName = resource === 'currentPV' ? 'PV' : resource === 'currentPM' ? 'PM' : 'PA';
            logMsg = `${combatant.name} ${changeType} ${Math.abs(value)} ${resourceName}. Novo total: ${newValue}.`;
        }
        
        let newConditions = [...combatant.activeConditions];
        if (newIsDefeated && !wasDefeated) {
          logMsg += ` ${combatant.name} foi DERROTADO!`;
          newConditions = newConditions.filter(cond => cond.name !== "Perto da Derrota");
          if (!newConditions.some(cond => cond.name === "Derrotado")) {
            newConditions.push({
              id: `cond_derrotado_${combatantId}`, name: "Derrotado",
              description: "PV <= 0. Perda em testes, sem críticos. Sofre Teste de Morte se danificado.",
              isSystemCondition: true, effect: { grantsPerda: true, preventsCriticals: true }
            });
          }
        } else if (!newIsDefeated && wasDefeated) {
           logMsg += ` ${combatant.name} NÃO está mais derrotado!`;
           newConditions = newConditions.filter(cond => cond.name !== "Derrotado" && cond.name !== "Caído" && cond.name !== "Inconsciente" && cond.name !== "Quase Morto" && cond.name !== "Morto");
        }
        
        const updatedCombatants = [...prev.combatants];
        updatedCombatants[combatantIndex] = { ...combatant, [resource]: newValue, isDefeated: newIsDefeated, activeConditions: newConditions, isRecoveringFromDeathTest: false };
        
        addLogEntry(logMsg, resource === 'currentPV' ? (isDelta && value > 0 ? 'healing' : (isDelta && value < 0 ? 'damage' : 'resource_change')) : 'resource_change', combatantId);
        
        if (newIsDefeated && !combatant.isRecoveringFromDeathTest && resource === 'currentPV' && (isDelta && value < 0)) { 
            const defeatedCombatantForTest = updatedCombatants[combatantIndex];
             addLogEntry(`${defeatedCombatantForTest.name} precisa fazer um Teste de Morte!`, 'info', defeatedCombatantForTest.id);
            setDeathTestCombatant(defeatedCombatantForTest);
            setIsDeathTestModalOpen(true);
            updatedCombatants[combatantIndex].isRecoveringFromDeathTest = true;
        }

        return { ...prev, combatants: updatedCombatants };
    });
  }, [addLogEntry]);

  const handleUseAction = useCallback((actionName: string) => {
    if (!currentActor || currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2) return; 
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => c.id === currentActor.id ? { ...c, actionUsedThisTurn: true } : c)
    }));
    addLogEntry(`${currentActor.name} usou sua Ação: ${actionName}.`, 'action', currentActor.id); 
  }, [currentActor, addLogEntry]);

  const handleUseMovement = useCallback(() => {
    if (!currentActor || currentActor.movementsUsedThisTurn >= 2 || (currentActor.actionUsedThisTurn && currentActor.movementsUsedThisTurn >= 1)) return; 
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => c.id === currentActor.id ? { ...c, movementsUsedThisTurn: c.movementsUsedThisTurn + 1 } : c)
    }));
    addLogEntry(`${currentActor.name} usou 1 Movimento.`, 'action_move', currentActor.id);
  }, [currentActor, addLogEntry]);

  const handleDefenseTotal = useCallback(() => {
    if (!currentActor || currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2) return; 
    const conditionId = `cond_def_total_${currentActor.id}_${Date.now()}`;
    const newCondition: ActiveCondition = {
      id: conditionId, name: "Defesa Total Ativa",
      description: "Recebe Ganho em testes de Defesa. Dura até o final do próximo turno do personagem.",
      durationInTurns: 1, sourceCombatantId: currentActor.id,
      effect: { grantsGanho: true }, isSystemCondition: true,
    };
    applyCondition(currentActor.id, newCondition);
    setCombatState(prev => ({ 
      ...prev,
      combatants: prev.combatants.map(c => c.id === currentActor.id ? { ...c, actionUsedThisTurn: true } : c)
    }));
    addLogEntry(`${currentActor.name} entrou em Defesa Total.`, 'action_defense_total', currentActor.id);
  }, [currentActor, addLogEntry, applyCondition]);

  const determineCombatOutcome = useCallback((): string | null => {
    const activeCombatants = combatants.filter(c => !c.isDefeated);
    
    if (combatants.length === 0 && phase === CombatPhase.ACTING) return "Nenhum combatente presente.";
    if (combatants.length > 0 && activeCombatants.length === 0 && phase === CombatPhase.ACTING) {
      return "Todos os combatentes foram derrotados (Empate/TPK).";
    }
  
    const activePCs = activeCombatants.filter(c => !c.isNPC);
    const activeNPCs = activeCombatants.filter(c => c.isNPC);
  
    if (combatants.length > 0 && phase === CombatPhase.ACTING) {
        if (activePCs.length > 0 && activeNPCs.length === 0) {
            return "Heróis (PCs) Venceram!";
        }
        if (activeNPCs.length > 0 && activePCs.length === 0) {
            return "Antagonistas (NPCs) Venceram!";
        }
        if (activeCombatants.length === 1 && combatants.length > 1) { // More than 1 combatant initially
            return `${activeCombatants[0].name} é o último de pé e venceu!`;
        }
    }
    return null; 
  }, [combatants, phase]);

  const handleNextTurn = useCallback(() => {
    if (!currentCombatantId || !orderedCombatantIds.length || phase !== CombatPhase.ACTING) return; 

    const outcome = determineCombatOutcome();
    if (outcome) {
        addLogEntry(`Fim do Combate! ${outcome}`, 'combat_end');
        setCombatOutcomeMessage(outcome);
        setCombatState(prev => ({ ...prev, phase: CombatPhase.ENDED }));
        return;
    }

    const combatantEndingTurn = combatants.find(c => c.id === currentCombatantId); 
    const currentTurnIndex = orderedCombatantIds.indexOf(currentCombatantId); 
    let nextTurnIndex = (currentTurnIndex + 1) % orderedCombatantIds.length;
    let nextCombatantId = orderedCombatantIds[nextTurnIndex];
    let nextActor = combatants.find(c => c.id === nextCombatantId);
    
    let attempts = 0;
    while(nextActor?.isDefeated && attempts < orderedCombatantIds.length) {
        addLogEntry(`${nextActor.name} está derrotado e não pode agir. Pulando turno.`, 'info', nextActor.id);
        nextTurnIndex = (nextTurnIndex + 1) % orderedCombatantIds.length;
        nextCombatantId = orderedCombatantIds[nextTurnIndex];
        nextActor = combatants.find(c => c.id === nextCombatantId);
        attempts++;
    }
    
    setCombatState(prev => {
        const updatedCombatants = prev.combatants.map(c => {
            let newConditions = c.activeConditions;
            if (c.id === currentCombatantId) { 
                newConditions = c.activeConditions
                    .map(cond => ({ ...cond, durationInTurns: cond.durationInTurns !== undefined ? Math.max(0, cond.durationInTurns -1) : undefined }))
                    .filter(cond => {
                        if(cond.durationInTurns === 0) {
                             addLogEntry(`Condição "${cond.name}" expirou para ${c.name}.`, 'condition_expired', c.id, undefined, undefined, {name: String(cond.name)});
                             return false;
                        }
                        return true;
                    });
                 return { ...c, actionUsedThisTurn: false, movementsUsedThisTurn: 0, isCurrentTurn: false, activeConditions: newConditions, isRecoveringFromDeathTest: false };
            }
            if (c.id === nextCombatantId && !c.isDefeated) { 
                return { ...c, isCurrentTurn: true, currentPA: c.maxPA };
            }
            return { ...c, isCurrentTurn: c.id === nextCombatantId && !c.isDefeated };
        });

        let newRound = prev.round;
        if (nextTurnIndex === 0 && !nextActor?.isDefeated) { 
            newRound++;
            addLogEntry(`Round ${newRound} iniciado.`, 'round');
        }
        
        const nextActorName = updatedCombatants.find(c => c.id === nextCombatantId)?.name || 'Desconhecido';
        if (combatantEndingTurn && !nextActor?.isDefeated) { 
            addLogEntry(`Fim do turno de ${combatantEndingTurn.name}. É o turno de ${nextActorName}.`, 'turn', nextCombatantId);
        } else if (!nextActor?.isDefeated) {
             addLogEntry(`É o turno de ${nextActorName}.`, 'turn', nextCombatantId);
        }
        
        return { ...prev, combatants: updatedCombatants, currentCombatantId: nextCombatantId, round: newRound };
    });
  }, [currentCombatantId, orderedCombatantIds, combatants, addLogEntry, phase, determineCombatOutcome]);

  const handleNewRound = useCallback(() => { 
    if (!orderedCombatantIds.length || phase !== CombatPhase.ACTING) return; 
    
    const outcome = determineCombatOutcome();
    if (outcome) {
        addLogEntry(`Fim do Combate! ${outcome}`, 'combat_end');
        setCombatOutcomeMessage(outcome);
        setCombatState(prev => ({ ...prev, phase: CombatPhase.ENDED }));
        return;
    }

    let firstCombatantId = orderedCombatantIds[0];
    let firstActor = combatants.find(c => c.id === firstCombatantId);
    let currentIdx = 0;

    while(firstActor?.isDefeated && currentIdx < orderedCombatantIds.length -1) {
        addLogEntry(`${firstActor.name} está derrotado e não pode iniciar a rodada. Pulando.`, 'info', firstActor.id);
        currentIdx++;
        firstCombatantId = orderedCombatantIds[currentIdx];
        firstActor = combatants.find(c => c.id === firstCombatantId);
    }
    
    setCombatState(prev => {
        const updatedCombatants = prev.combatants.map(c => {
            let newConditions = c.activeConditions;
             if (prev.currentCombatantId && prev.orderedCombatantIds.indexOf(prev.currentCombatantId) === prev.orderedCombatantIds.length -1) {
                 newConditions = c.activeConditions
                    .map(cond => ({ ...cond, durationInTurns: cond.durationInTurns !== undefined ? Math.max(0, cond.durationInTurns -1) : undefined }))
                    .filter(cond => {
                        if(cond.durationInTurns === 0) {
                             addLogEntry(`Condição "${cond.name}" expirou para ${c.name} (fim de rodada).`, 'condition_expired', c.id, undefined, undefined, {name: String(cond.name)});
                             return false;
                        }
                        return true;
                    });
            }
            return c.id === firstCombatantId ? 
                { ...c, isCurrentTurn: true, currentPA: c.maxPA, actionUsedThisTurn: false, movementsUsedThisTurn: 0, activeConditions: newConditions, isRecoveringFromDeathTest: false } : 
                { ...c, isCurrentTurn: false, activeConditions: newConditions, isRecoveringFromDeathTest: false };
        });
        const newRound = prev.round + 1;
        addLogEntry(`Round ${newRound} iniciado.`, 'round');
        if (!firstActor?.isDefeated) {
            addLogEntry(`É o turno de ${updatedCombatants.find(c=>c.id === firstCombatantId)?.name || ''}.`, 'turn', firstCombatantId);
        }
        return { ...prev, combatants: updatedCombatants, currentCombatantId: firstCombatantId, round: newRound };
    });
  }, [orderedCombatantIds, combatants, addLogEntry, phase, determineCombatOutcome]); 

  const handlePerformAttack = () => {
      if (!currentActor || !selectedTargetId) {
          addLogEntry("Atacante ou alvo não selecionado.", "error", currentActor?.id);
          return;
      }
      const target = combatants.find(c => c.id === selectedTargetId);
      if (!target || target.isDefeated) {
          addLogEntry("Alvo inválido ou já derrotado.", "error", currentActor.id, selectedTargetId);
          return;
      }
      addLogEntry(`${currentActor.name} ataca ${target.name}!`, 'action_attack', currentActor.id, target.id);

      const attackRollResult = rollTest({
          baseAttributeValue: currentActor.poder,
          usaPericia: attackParams.usaPericia,
          ganhoBase: attackParams.ganho,
          perdaBase: attackParams.perda,
          modificadorTemporario: attackParams.modificador,
          combatant: currentActor,
          testName: "Teste de Ataque",
      });
       addLogEntry(`Rolagem de Ataque de ${currentActor.name}.`, 'attack_roll', currentActor.id, target.id, attackRollResult.rollDetails);
      
      const defenseRollResult = rollTest({
          baseAttributeValue: target.resistencia,
          usaPericia: defenseParams.usaPericia,
          ganhoBase: defenseParams.ganho,
          perdaBase: defenseParams.perda,
          modificadorTemporario: defenseParams.modificador,
          combatant: target,
          testName: "Teste de Defesa",
      });
      addLogEntry(`Rolagem de Defesa de ${target.name}.`, 'defense_roll', target.id, currentActor.id, defenseRollResult.rollDetails);


      let dano = 0;
      const isPerfectDefense = defenseRollResult.total >= (attackRollResult.total * 2);

      if (isPerfectDefense) {
          addLogEntry(`${target.name} conseguiu uma DEFESA PERFEITA! Nenhum dano sofrido.`, 'info', target.id, currentActor.id);
      } else {
          dano = Math.max(1, attackRollResult.total - defenseRollResult.total);
          let paGastosIgnorarLimite = 0;
          if (limiteDeDanoAtivo && dano > currentActor.poder && !attackRollResult.rollDetails.isCriticalHit) { 
              if (attackParams.ignoraLimiteDanoPA && currentActor.currentPA >= 1) {
                  addLogEntry(`Limite de Dano seria aplicado (${dano} > Poder ${currentActor.poder}), mas ${currentActor.name} gastou 1 PA para ignorar.`, 'info', currentActor.id);
                  paGastosIgnorarLimite = 1;
              } else {
                 addLogEntry(`Limite de Dano ATIVO: Dano reduzido de ${dano} para ${currentActor.poder}.`, 'info', currentActor.id, target.id);
                 dano = currentActor.poder;
              }
          }
          addLogEntry(`${currentActor.name} causou ${dano} de dano em ${target.name}.`, 'damage', currentActor.id, target.id);
          handleUpdateCombatantResource(target.id, 'currentPV', -dano, true);
          if (paGastosIgnorarLimite > 0) {
            handleUpdateCombatantResource(currentActor.id, 'currentPA', -paGastosIgnorarLimite, true);
          }
      }

      handleUseAction("Ataque"); 
      setIsAttackModalOpen(false);
  };

  const toggleLimiteDeDano = () => {
    setCombatState(prev => ({...prev, limiteDeDanoAtivo: !prev.limiteDeDanoAtivo}));
    addLogEntry(`Regra Opcional: Limite de Dano ${!limiteDeDanoAtivo ? 'ATIVADO' : 'DESATIVADO'}.`, 'info');
  };

  const handleOpenAddConditionModal = (targetId: string) => {
    setConditionTargetId(targetId);
    setSelectedConditionName('');
    setCustomConditionDesc('');
    setConditionDuration(undefined);
    setIsAddConditionModalOpen(true);
  };

  const handleSaveCondition = () => {
    if (!conditionTargetId || !selectedConditionName.trim()) {
        addLogEntry("Alvo e nome da condição são obrigatórios para adicionar condição.", 'error');
        return;
    }
    
    const knownCondData = KNOWN_CONDITIONS_LIST.find(kc => kc.name === selectedConditionName);
    const newCond: ActiveCondition = {
        id: `cond_${conditionTargetId}_${Date.now()}`,
        name: selectedConditionName,
        description: knownCondData?.description || customConditionDesc || String(selectedConditionName),
        durationInTurns: conditionDuration === undefined ? knownCondData?.defaultDuration : (conditionDuration === 0 ? undefined : conditionDuration), 
        sourceCombatantId: currentActor?.id,
        effect: knownCondData?.effect || { grantsPerda: knownCondData?.grantsPerda, preventsCriticals: knownCondData?.preventsCriticals },
        isSystemCondition: !!knownCondData,
    };
    applyCondition(conditionTargetId, newCond);
    setIsAddConditionModalOpen(false);
  };

  const handleDeathTestSubmit = (roll: string) => {
    if (!deathTestCombatant) return;
    const resultValue = parseInt(roll);
    if (isNaN(resultValue)) {
      addLogEntry("Resultado do Teste de Morte inválido.", "error", deathTestCombatant.id);
      return;
    }
    addLogEntry(`${deathTestCombatant.name} fez um Teste de Morte com resultado total ${resultValue}.`, 'death_test_roll', deathTestCombatant.id);


    let outcomeConditionName: KnownConditionName = "Inconsciente"; 
    let outcomeDescription = "";

    if (resultValue >= 12) { outcomeConditionName = "Caído"; outcomeDescription = "Consciente, mas não pode agir ou se mover."; }
    else if (resultValue >= 8) { outcomeConditionName = "Inconsciente"; outcomeDescription = "PV em 0. Acorda com descanso ou Medicina."; }
    else if (resultValue >= 6) { outcomeConditionName = "Quase Morto"; outcomeDescription = "Morre em 1D rodadas sem Medicina."; }
    else { outcomeConditionName = "Morto"; outcomeDescription = "Fim da linha."; }
    
    const newConditions = deathTestCombatant.activeConditions.filter(c => 
        c.name !== "Derrotado" && c.name !== "Caído" && c.name !== "Inconsciente" && c.name !== "Quase Morto" && c.name !== "Morto"
    );
    newConditions.push({
        id: `cond_death_${deathTestCombatant.id}_${Date.now()}`, name: outcomeConditionName,
        description: outcomeDescription, isSystemCondition: true,
        effect: { grantsPerda: true, preventsCriticals: true } 
    });

    setCombatState(prev => ({
        ...prev,
        combatants: prev.combatants.map(c => c.id === deathTestCombatant.id ? {...c, activeConditions: newConditions, isDefeated: true, currentPV: 0 } : c) 
    }));
    addLogEntry(`${deathTestCombatant.name} está ${outcomeConditionName}!`, 'death_test_result', deathTestCombatant.id, undefined, undefined, { name: outcomeConditionName });
    setIsDeathTestModalOpen(false);
    setDeathTestCombatant(null);
  };

  const handleEndCombatManually = () => {
    const manualOutcome = "Combate encerrado manualmente pelo Mestre.";
    addLogEntry(manualOutcome, 'combat_end');
    setCombatOutcomeMessage(manualOutcome);
    setCombatState(prev => ({ ...prev, phase: CombatPhase.ENDED }));
  };
    
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-sky-400 text-center font-['Orbitron']">Simulador de Combate 3DeT Victory</h1>
      <div className="text-center text-xs text-slate-400">
        <label className="flex items-center justify-center cursor-pointer">
          <input type="checkbox" checked={limiteDeDanoAtivo} onChange={toggleLimiteDeDano} className="mr-2 h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"/>
          Ativar Regra Opcional: Limite de Dano (p. 174)
        </label>
      </div>

      {phase === CombatPhase.SETUP && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl space-y-6">
           <h2 className="text-xl font-semibold text-sky-300">Configuração do Combate</h2>
           <div className="border-b border-slate-700 pb-4">
            <h3 className="text-md font-semibold text-slate-200 mb-2">Adicionar PC da Galeria</h3>
            <div className="flex gap-2">
              <select value={selectedPCId} onChange={e => setSelectedPCId(e.target.value)} className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm">
                <option value="">Selecione um PC...</option>
                {characterGallery.map(char => <option key={char.id} value={char.id}>{char.name} ({char.conceito})</option>)}
              </select>
              <button onClick={handleAddPC} disabled={!selectedPCId} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm disabled:opacity-50 flex items-center"><UserPlus size={16} className="mr-1.5"/> Add PC</button>
            </div>
          </div>
          <div className="border-b border-slate-700 pb-4">
            <h3 className="text-md font-semibold text-slate-200 mb-2">Adicionar NPC (Template)</h3>
            <div className="flex gap-2">
              <select value={selectedNPCTemplateId} onChange={e => setSelectedNPCTemplateId(e.target.value)} className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm">
                <option value="">Selecione um Template...</option>
                {mockNPCtemplates.map(npc => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
              </select>
              <button onClick={handleAddNPCTemplate} disabled={!selectedNPCTemplateId} className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-3 rounded text-sm disabled:opacity-50 flex items-center"><Bot size={16} className="mr-1.5"/> Add Template</button>
            </div>
          </div>
          <div className="border-b border-slate-700 pb-4 space-y-2">
            <h3 className="text-md font-semibold text-slate-200">Criar NPC Rápido</h3>
            <input type="text" placeholder="Nome do NPC" value={quickNPCData.name} onChange={e => setQuickNPCData(p => ({...p, name: e.target.value}))} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm"/>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="P" value={quickNPCData.poder} onChange={e => setQuickNPCData(p => ({...p, poder: parseInt(e.target.value)||0}))} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm" />
              <input type="number" placeholder="H" value={quickNPCData.habilidade} onChange={e => setQuickNPCData(p => ({...p, habilidade: parseInt(e.target.value)||0}))} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm" />
              <input type="number" placeholder="R" value={quickNPCData.resistencia} onChange={e => setQuickNPCData(p => ({...p, resistencia: parseInt(e.target.value)||0}))} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm" />
            </div>
            <button onClick={handleAddQuickNPC} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded text-sm flex items-center justify-center"><UserPlus size={16} className="mr-1.5"/> Add NPC Rápido</button>
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mt-4">Combatentes Adicionados: {combatants.length}</h3>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {combatants.map(c => (
                  <div key={c.id} className="bg-slate-700 p-2.5 rounded-md flex justify-between items-center text-sm">
                      <div className="flex items-center">
                          <img src={c.avatarUrl || (c.isNPC ? 'https://via.placeholder.com/32/7f8c8d/FFFFFF?Text=N' : 'https://via.placeholder.com/32/3498db/FFFFFF?Text=P')} alt={c.name} className="w-8 h-8 rounded-full mr-2 object-cover"/>
                          <div>
                            <span className="font-semibold text-sky-300">{c.name}</span> 
                            <span className="text-xs text-slate-400"> (P{c.poder} H{c.habilidade} R{c.resistencia} | PV:{c.maxPV} PM:{c.maxPM} PA:{c.maxPA})</span>
                          </div>
                          <select value={c.escala} onChange={(e) => handleEscalaChange(c.id, e.target.value as EscalaPersonagem)} className="ml-2 p-0.5 bg-slate-600 border border-slate-500 rounded text-xs text-slate-200">
                              {(['Ningen', 'Sugoi', 'Kiodai', 'Kami'] as EscalaPersonagem[]).map(escala => <option key={escala} value={escala}>{escala}</option>)}
                          </select>
                      </div>
                      <button onClick={() => handleRemoveCombatant(c.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                  </div>
              ))}
          </div>
          <button onClick={proceedToInitiativePhase} disabled={combatants.length < 1} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center disabled:opacity-50 mt-4">
            <PlayCircle size={18} className="mr-2"/> Prosseguir para Iniciativa
          </button>
           <button onClick={handleStartCombatSetup} className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded flex items-center justify-center text-sm">
                <RotateCcw size={16} className="mr-2"/> Limpar Combatentes e Reiniciar
            </button>
        </div>
      )}

      {phase === CombatPhase.INITIATIVE && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl space-y-4">
          <h2 className="text-xl font-semibold text-sky-300">Fase de Iniciativa</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {combatants.map(c => (
              <div key={c.id} className="bg-slate-700 p-3 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm">
                <div className="flex items-center">
                  <img src={c.avatarUrl || (c.isNPC ? 'https://via.placeholder.com/32/7f8c8d/FFFFFF?Text=N' : 'https://via.placeholder.com/32/3498db/FFFFFF?Text=P')} alt={c.name} className="w-8 h-8 rounded-full mr-2 object-cover"/>
                  <span className="font-semibold text-sky-300">{c.name}</span>
                  <span className="text-xs text-slate-400 ml-1"> (H:{c.habilidade})</span>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <label htmlFor={`pericia-${c.id}`} className="flex items-center text-xs text-slate-300 cursor-pointer">
                    <input type="checkbox" id={`pericia-${c.id}`} checked={c.usaPericiaLutaIniciativa} onChange={(e) => handleUsaPericiaIniciativaChange(c.id, e.target.checked)} className="mr-1.5 h-3.5 w-3.5 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"/>
                    Usar Perícia (Luta)?
                  </label>
                  {c.initiativeRollValue !== undefined ? (
                    <div className="text-xs">
                      <span className="text-slate-400">Dados: [{c.initiativeDiceRolls?.join(', ')}]</span>
                      <span className="font-bold text-sky-200 ml-2">Total: {c.initiativeTotal}</span>
                    </div>
                  ) : (
                    <button onClick={() => handleRollIndividualInitiative(c.id)} className="bg-sky-600 hover:bg-sky-700 text-white py-1 px-2.5 rounded text-xs flex items-center"><Dices size={14} className="mr-1"/> Rolar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button onClick={handleRollAllInitiatives} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 px-3 rounded flex items-center justify-center text-sm"><Dices size={16} className="mr-1.5"/>Rolar Todas Pendentes</button>
            <button onClick={handleProceedToActing} disabled={!combatants.every(c => c.initiativeTotal !== 0 && c.initiativeRollValue !== undefined)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded flex items-center justify-center disabled:opacity-50 text-sm"><Check size={16} className="mr-1.5"/>Definir Ordem e Iniciar</button>
          </div>
          <button onClick={handleBackToSetup} className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded flex items-center justify-center text-sm">
            <RotateCcw size={16} className="mr-2"/> Voltar ao Setup (Resetar Iniciativas)
          </button>
        </div>
      )}
      
      {phase === CombatPhase.ACTING && currentActor && (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-700 pb-3 mb-3 gap-2">
                <h2 className="text-2xl font-bold text-sky-300">Round: {round}</h2>
                <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                    <button 
                        onClick={handleNextTurn}
                        className="bg-sky-500 hover:bg-sky-600 text-white py-1.5 px-3 rounded text-xs sm:text-sm flex items-center disabled:opacity-50"
                    >
                        Próximo Turno <ChevronRight size={14} className="ml-1"/>
                    </button>
                    <button 
                        onClick={handleNewRound}
                        disabled={orderedCombatantIds.indexOf(currentActor.id) !== orderedCombatantIds.length - 1}
                        className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded text-xs sm:text-sm flex items-center disabled:opacity-50"
                    >
                        Nova Rodada <RefreshCw size={14} className="ml-1"/>
                    </button>
                     <button 
                        onClick={handleEndCombatManually}
                        className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 py-1.5 px-3 rounded text-xs sm:text-sm flex items-center"
                    >
                        Encerrar Manualmente <Flag size={14} className="ml-1"/>
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-md font-semibold text-slate-200 mb-1.5">Ordem de Turno:</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                    {orderedCombatantIds.map((id, index) => {
                        const c = combatants.find(cb => cb.id === id);
                        if (!c) return null;
                        return (
                            <span key={id} className={`p-1.5 rounded ${c.isDefeated ? 'bg-red-800/70 text-red-300 line-through' : (c.id === currentCombatantId ? 'bg-sky-500 text-white font-bold ring-2 ring-sky-300' : 'bg-slate-700 text-slate-300')}`}>
                                {index + 1}. {c.name} (Init: {c.initiativeTotal}) {c.isDefeated ? "[Derrotado]" : ""}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                    <img src={currentActor.avatarUrl || (currentActor.isNPC ? 'https://via.placeholder.com/40/7f8c8d/FFFFFF?Text=N' : 'https://via.placeholder.com/40/3498db/FFFFFF?Text=P')} alt={currentActor.name} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                    <h3 className="text-xl font-semibold text-sky-200">Turno de: {currentActor.name}</h3>
                    {currentActor.isDefeated && <span className="ml-2 text-sm font-bold text-red-400">(DERROTADO)</span>}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                    {(['currentPV', 'currentPM', 'currentPA'] as const).map(res => (
                        <div key={res} className="bg-slate-600 p-2 rounded">
                            <label htmlFor={`${currentActor.id}-${res}`} className="block text-xs text-slate-300 mb-0.5">
                                {res === 'currentPV' ? 'PV' : res === 'currentPM' ? 'PM' : 'PA'}:
                            </label>
                            <div className="flex items-center">
                                <button onClick={() => handleUpdateCombatantResource(currentActor.id, res, -1, true)} className="px-1.5 py-0.5 bg-slate-500 hover:bg-red-600 rounded-l text-xs">-</button>
                                <input 
                                    type="number" 
                                    id={`${currentActor.id}-${res}`}
                                    value={currentActor[res]} 
                                    onChange={e => handleUpdateCombatantResource(currentActor.id, res, parseInt(e.target.value) || (res === 'currentPV' ? currentActor[res] : 0) )}
                                    className="w-full text-center bg-slate-700 text-slate-100 border-y border-slate-500 py-0.5 text-xs"
                                />
                                <button onClick={() => handleUpdateCombatantResource(currentActor.id, res, 1, true)} className="px-1.5 py-0.5 bg-slate-500 hover:bg-green-600 rounded-r text-xs">+</button>
                                <span className="ml-1.5 text-slate-400 text-xs">/ {currentActor[res === 'currentPV' ? 'maxPV' : res === 'currentPM' ? 'maxPM' : 'maxPA']}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-4 mb-2 text-xs">
                    <label className="flex items-center text-slate-300">
                        <input type="checkbox" checked={currentActor.actionUsedThisTurn} readOnly className="mr-1.5 h-3.5 w-3.5 rounded bg-slate-600 border-slate-500 text-sky-500 cursor-not-allowed"/> Ação Usada
                    </label>
                    <span className="text-slate-300">Movimentos Usados: {currentActor.movementsUsedThisTurn} / 2</span>
                </div>
                
                {!currentActor.isDefeated && (
                  <div className="border-t border-slate-600 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <label htmlFor="targetSelect" className="text-xs text-slate-300">Alvo:</label>
                      <select 
                        id="targetSelect"
                        value={selectedTargetId || ''} 
                        onChange={e => setCombatState(prev => ({...prev, selectedTargetId: e.target.value || null}))}
                        className="flex-grow p-1 bg-slate-600 border border-slate-500 rounded text-xs text-slate-100"
                      >
                        <option value="">Selecione o Alvo...</option>
                        {combatants.filter(c => c.id !== currentActor.id && !c.isDefeated).map(c => (
                          <option key={c.id} value={c.id}>{c.name} (PV: {c.currentPV})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                      <button 
                        onClick={() => {
                           if (!selectedTargetId) { addLogEntry("Selecione um alvo para atacar.", "error", currentActor.id); return; }
                           setAttackParams({ usaPericia: currentActor.skills?.some(s => s.name.toLowerCase().includes('luta')) || false, ganho: 0, perda: 0, modificador: 0, ignoraLimiteDanoPA: false });
                           setDefenseParams({ usaPericia: combatants.find(c=>c.id===selectedTargetId)?.skills?.some(s => s.name.toLowerCase().includes('luta')) || false, ganho: 0, perda: 0, modificador: 0 });
                           setIsAttackModalOpen(true);
                        }} 
                        disabled={currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2 || !selectedTargetId} 
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded flex items-center justify-center disabled:opacity-50"><Swords size={14} className="mr-1"/>Atacar</button>
                      <button onClick={() => handleUseAction("Teste Atributo/Perícia")} disabled={currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded flex items-center justify-center disabled:opacity-50"><Dices size={14} className="mr-1"/>Teste</button>
                      <button onClick={() => handleUseAction("Usar Técnica/Truque")} disabled={currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-2 rounded flex items-center justify-center disabled:opacity-50"><Zap size={14} className="mr-1"/>Técnica</button>
                      <button onClick={handleDefenseTotal} disabled={currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2} className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-2 rounded flex items-center justify-center disabled:opacity-50"><ShieldCheck size={14} className="mr-1"/>Def. Total</button>
                      <button onClick={() => handleUseAction("Manobra de Combate")} disabled={currentActor.actionUsedThisTurn || currentActor.movementsUsedThisTurn === 2} className="bg-yellow-600 hover:bg-yellow-700 text-slate-900 py-2 px-2 rounded flex items-center justify-center disabled:opacity-50"><Hand size={14} className="mr-1"/>Manobra</button>
                      <button onClick={handleUseMovement} disabled={currentActor.movementsUsedThisTurn >= 2 || (currentActor.actionUsedThisTurn && currentActor.movementsUsedThisTurn >= 1)} className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-2 rounded flex items-center justify-center disabled:opacity-50"><Wind size={14} className="mr-1"/>Movimento</button>
                      <button onClick={handleNextTurn} className="bg-slate-500 hover:bg-slate-400 text-slate-900 py-2 px-2 rounded flex items-center justify-center col-span-2 sm:col-span-1 lg:col-span-2"><SkipForward size={14} className="mr-1"/>Passar Turno</button>
                       <button onClick={() => handleOpenAddConditionModal(currentActor.id)} className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-2 rounded flex items-center justify-center text-xs"><PlusSquare size={14} className="mr-1"/>Add Condição</button>
                    </div>
                  </div>
                )}
                 {currentActor.activeConditions.length > 0 && (
                    <div className="mt-3">
                        <p className="text-xs text-slate-300 mb-1">Condições Ativas em {currentActor.name}:</p>
                        <div className="flex flex-wrap gap-1">
                            {currentActor.activeConditions.map(cond => (
                                <div key={cond.id} title={cond.description} className="bg-yellow-700/50 text-yellow-200 px-1.5 py-0.5 rounded-full text-xxs flex items-center">
                                    {cond.name} {cond.durationInTurns !== undefined && cond.durationInTurns > 0 ? `(${cond.durationInTurns}t)` : ''}
                                    <button onClick={() => removeCondition(currentActor.id, cond.id, 'manual')} className="ml-1 text-yellow-300 hover:text-white"><XCircle size={10}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
             <button onClick={handleBackToSetup} className="mt-6 w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded flex items-center justify-center mx-auto text-sm">
                <RotateCcw size={16} className="mr-2"/> Resetar Combate (Voltar ao Setup)
            </button>
        </div>
      )}

      {isAttackModalOpen && currentActor && selectedTargetId && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsAttackModalOpen(false)}>
              <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold text-sky-300 mb-4">Configurar Ataque de {currentActor.name}</h3>
                  <div className="space-y-3 text-sm">
                      <div><label className="text-slate-300 block"><input type="checkbox" checked={attackParams.usaPericia} onChange={e => setAttackParams(p => ({...p, usaPericia: e.target.checked}))} className="mr-2"/> Usar Perícia Luta no Ataque?</label></div>
                      <div><label className="text-slate-300">Ganho Ataque:</label><input type="number" value={attackParams.ganho} onChange={e => setAttackParams(p => ({...p, ganho: parseInt(e.target.value)||0}))} className="ml-2 w-16 p-1 bg-slate-700 rounded"/></div>
                      <div><label className="text-slate-300">Perda Ataque:</label><input type="number" value={attackParams.perda} onChange={e => setAttackParams(p => ({...p, perda: parseInt(e.target.value)||0}))} className="ml-2 w-16 p-1 bg-slate-700 rounded"/></div>
                      <div><label className="text-slate-300">Mod. Ataque:</label><input type="number" value={attackParams.modificador} onChange={e => setAttackParams(p => ({...p, modificador: parseInt(e.target.value)||0}))} className="ml-2 w-16 p-1 bg-slate-700 rounded"/></div>
                      {limiteDeDanoAtivo && currentActor.currentPA > 0 && <div><label className="text-slate-300 block"><input type="checkbox" checked={attackParams.ignoraLimiteDanoPA} onChange={e => setAttackParams(p => ({...p, ignoraLimiteDanoPA: e.target.checked}))} className="mr-2"/> Gastar 1 PA para ignorar Limite de Dano?</label></div>}
                  </div>
                  <hr className="my-3 border-slate-700"/>
                  <h4 className="text-md font-semibold text-sky-300 mb-2">Configurar Defesa de {combatants.find(c=>c.id ===selectedTargetId)?.name}</h4>
                   <div className="space-y-3 text-sm">
                      <div><label className="text-slate-300 block"><input type="checkbox" checked={defenseParams.usaPericia} onChange={e => setDefenseParams(p => ({...p, usaPericia: e.target.checked}))} className="mr-2"/> Usar Perícia Luta na Defesa?</label></div>
                      <div><label className="text-slate-300">Ganho Defesa:</label><input type="number" value={defenseParams.ganho} onChange={e => setDefenseParams(p => ({...p, ganho: parseInt(e.target.value)||0}))} className="ml-2 w-16 p-1 bg-slate-700 rounded"/></div>
                      <div><label className="text-slate-300">Perda Defesa:</label><input type="number" value={defenseParams.perda} onChange={e => setDefenseParams(p => ({...p, perda: parseInt(e.target.value)||0}))} className="ml-2 w-16 p-1 bg-slate-700 rounded"/></div>
                      <div><label className="text-slate-300">Mod. Defesa:</label><input type="number" value={defenseParams.modificador} onChange={e => setDefenseParams(p => ({...p, modificador: parseInt(e.target.value)||0}))} className="ml-2 w-16 p-1 bg-slate-700 rounded"/></div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                      <button onClick={() => setIsAttackModalOpen(false)} className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-3 rounded text-sm">Cancelar</button>
                      <button onClick={handlePerformAttack} className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm">Realizar Ataque!</button>
                  </div>
              </div>
          </div>
      )}

      {isAddConditionModalOpen && conditionTargetId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsAddConditionModalOpen(false)}>
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-sky-300 mb-4">Adicionar Condição a {combatants.find(c=>c.id === conditionTargetId)?.name}</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-slate-300">Condição Padrão:</label>
                <select value={selectedConditionName} onChange={e => setSelectedConditionName(e.target.value)} className="w-full p-2 mt-1 bg-slate-700 rounded border border-slate-600">
                  <option value="">-- Selecione ou Digite Customizada --</option>
                  {KNOWN_CONDITIONS_LIST.map(kc => <option key={kc.name} value={kc.name}>{kc.name}</option>)}
                </select>
              </div>
              {!KNOWN_CONDITIONS_LIST.some(kc => kc.name === selectedConditionName) && (
                <div>
                  <label className="text-slate-300">Nome Customizado:</label>
                  <input type="text" value={selectedConditionName} onChange={e => setSelectedConditionName(e.target.value)} placeholder="Nome da Condição" className="w-full p-2 mt-1 bg-slate-700 rounded border border-slate-600"/>
                </div>
              )}
              <div>
                <label className="text-slate-300">Descrição (opcional se padrão):</label>
                <textarea value={customConditionDesc} onChange={e => setCustomConditionDesc(e.target.value)} rows={2} placeholder="Efeitos da condição" className="w-full p-2 mt-1 bg-slate-700 rounded border border-slate-600"/>
              </div>
              <div>
                <label className="text-slate-300">Duração em Turnos (0 ou vazio = permanente):</label>
                <input type="number" value={conditionDuration === undefined ? '' : conditionDuration} onChange={e => setConditionDuration(e.target.value === '' ? undefined : parseInt(e.target.value) || 0)} min="0" className="w-full p-2 mt-1 bg-slate-700 rounded border border-slate-600"/>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsAddConditionModalOpen(false)} className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-3 rounded text-sm">Cancelar</button>
              <button onClick={handleSaveCondition} disabled={!selectedConditionName.trim()} className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm disabled:opacity-50">Aplicar Condição</button>
            </div>
          </div>
        </div>
      )}

      {isDeathTestModalOpen && deathTestCombatant && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm text-center border border-red-500" onClick={e => e.stopPropagation()}>
            <Skull size={36} className="text-red-400 mx-auto mb-3"/>
            <h3 className="text-xl font-bold text-red-300 mb-2">TESTE DE MORTE!</h3>
            <p className="text-sm text-slate-300 mb-3">
              {deathTestCombatant.name} (R{deathTestCombatant.resistencia}) sofreu dano enquanto Derrotado!
              <br/>Mestre, role 1D6 e some à Resistência. O personagem já tem Perda neste teste.
            </p>
            <input 
              type="number" 
              value={deathTestRollResult} 
              onChange={(e) => setDeathTestRollResult(e.target.value)}
              placeholder="Resultado Total (R + 1D6 com Perda)"
              className="w-full p-2 mb-4 bg-slate-700 rounded border border-slate-600 text-center"
            />
            <button onClick={() => handleDeathTestSubmit(deathTestRollResult)} disabled={deathTestRollResult === ''} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm disabled:opacity-50">Confirmar Resultado</button>
            <div className="mt-3 text-xs text-slate-400">
              Lembretes: 12+ Caído, 8-11 Inconsciente, 6-7 Quase Morto, 5- Morto.
            </div>
          </div>
        </div>
      )}

      {phase === CombatPhase.ENDED && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-3">Combate Encerrado!</h2>
            <p className="text-lg text-sky-300 mb-6">{combatOutcomeMessage}</p>
            <button onClick={handleStartCombatSetup} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-5 rounded-lg transition duration-300 text-base flex items-center justify-center mx-auto">
              <RotateCcw size={18} className="mr-2"/> Novo Combate (Ir para Setup)
            </button>
        </div>
      )}

       <div className="bg-slate-800 p-4 mt-4 rounded-lg shadow-xl max-h-72 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-sky-300 flex items-center"><History size={18} className="mr-2"/>Log de Combate</h3>
              <button onClick={() => {
                setCombatState(prev => ({...prev, log: []}));
                addLogEntry("Log de combate limpo.", 'info');
              }} className="text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 py-1 px-2 rounded flex items-center">
                <Eraser size={14} className="mr-1"/> Limpar Log
              </button>
            </div>
            {log.length === 0 ? (
                <p className="text-slate-400 italic text-sm">Nenhuma ação registrada ainda.</p>
            ) : (
                <ul className="space-y-1.5">
                    {log.map(entry => (
                        <li key={entry.id} className={`text-xs p-1.5 rounded-sm break-words ${
                            entry.type === 'error' ? 'bg-red-900/50 text-red-300' :
                            entry.type === 'damage' ? 'bg-red-800/40 text-red-200' :
                            entry.type === 'healing' ? 'bg-green-800/40 text-green-200' :
                            entry.type === 'condition_add' || entry.type === 'condition_applied' ? 'bg-yellow-800/40 text-yellow-200' :
                            entry.type === 'condition_remove' || entry.type === 'condition_expired' ? 'bg-blue-800/40 text-blue-200' :
                            entry.type === 'turn' || entry.type === 'round' || entry.type === 'initiative' || entry.type === 'combat_start' ? 'bg-sky-800/40 text-sky-200 font-semibold' :
                            entry.type === 'combat_end' || entry.type === 'death_test_result' ? 'bg-purple-800/40 text-purple-200 font-semibold' :
                             'bg-slate-700/50 text-slate-300'
                        }`}>
                            <span className="text-slate-500 mr-1.5">[{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span> 
                            {entry.message}
                            {entry.rollDetails && <span className="block pl-4 text-slate-400">{formatRollDetails(entry.rollDetails)}</span>}
                            {entry.conditionDetails && <span className="text-slate-400 italic"> ({entry.conditionDetails.name}{entry.conditionDetails.duration ? `, ${entry.conditionDetails.duration}t` : ''})</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
  );
};

export default CombatSimulatorPage;