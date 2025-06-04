import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CharacterFormData, CompendiumItem, SelectedCompendiumItem, 
  SelectedEquipmentItem, QueuedCompendiumItem, EscalaPersonagem, 
  CharacterSummary, LAST_EDITED_CHAR_ID_KEY, CHARACTER_GALLERY_LIST_KEY, CHARACTER_SHEET_PREFIX_KEY 
} from '../types';

// Import Context and Provider
import { CharacterWizardProvider, useCharacterWizard, CharacterWizardAction } from '../src/contexts/CharacterWizardContext'; 

// Import Step Components
import StepIdentity from '../components/character-editor-steps/StepIdentity';
import StepAttributes from '../components/character-editor-steps/StepAttributes';
import StepSkills from '../components/character-editor-steps/StepSkills';
import StepAdvantagesDisadvantages from '../components/character-editor-steps/StepAdvantagesDisadvantages'; 
import StepArchetypes from '../components/character-editor-steps/StepArchetypes'; 
import StepKits from '../components/character-editor-steps/StepKits'; 
import StepCombinedItems from '../components/character-editor-steps/StepCombinedItems'; 
import StepReview from '../components/character-editor-steps/StepReview';
import LoadingSpinner from '../components/LoadingSpinner';

// Import Zod schema and type
import { characterSchema, CharacterSchema } from '../src/schemas/characterSchema';
import { ZodError } from 'zod';

// Define steps - TODO: Add 'Kits' step later
const WIZARD_STEPS = [
  "Identidade", "Atributos", "Perícias",
  "Vantagens & Desvantagens", "Arquétipos", 
  "Kits", // Added Kit step
  "Técnicas & Equipamentos",
  "Revisar & Salvar" 
];

const ADD_ITEM_QUEUE_KEY = 'rpgCompanion.addItemToSheetQueue';

// CharacterEditorCore component containing the main logic
const CharacterEditorCore: React.FC = () => {
  const { id: characterIdFromParams } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: formData, dispatch } = useCharacterWizard(); // Use context state and dispatch

  const [currentStep, setCurrentStep] = useState(0);
  const [allCompendiumItems, setAllCompendiumItems] = useState<CompendiumItem[]>([]);
  const [loadingCompendium, setLoadingCompendium] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ZodError | null>(null);

  // Derived state calculations (Points, HP, MP, etc.)
  const [pontosRestantes, setPontosRestantes] = useState(0);
  const [remainingXP, setRemainingXP] = useState(0);

  const showNotification = (message: string, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  // Helper to update form data fields using the reducer
  const updateFormData = useCallback((data: Partial<CharacterFormData>) => {
    Object.entries(data).forEach(([key, value]) => {
      dispatch({ type: 'SET_FIELD', field: key as keyof CharacterFormData, value });
    });
  }, [dispatch]);

  // Load Compendium Data
  useEffect(() => {
    setLoadingCompendium(true);
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/compendium.json`).then(res => {
        if (!res.ok) throw new Error('Falha ao carregar compendium.json');
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/kits.json`).then(res => {
        if (!res.ok) throw new Error('Falha ao carregar kits.json');
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/artefatos.json`).then(res => {
        if (!res.ok) throw new Error('Falha ao carregar artefatos.json');
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/consumiveis.json`).then(res => {
        if (!res.ok) throw new Error('Falha ao carregar consumiveis.json');
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/equipamentos.json`).then(res => {
        if (!res.ok) throw new Error('Falha ao carregar equipamentos.json');
        return res.json();
      })
    ])
      .then(([items, kits, artefatos, consumiveis, equipamentos]) => {
        const normalizedKits: CompendiumItem[] = kits.map((k: any) => ({
          id: k.id,
          name: k.nome,
          type: 'Kit',
          description: [
            k.exigencias && k.exigencias.length ? `Pré-requisitos: ${k.exigencias.join(', ')}` : null,
            ...k.poderes.map((p: any) => `• ${p.nome}: ${p.descricao}`)
          ].filter(Boolean).join('\n'),
          cost: 1,
          prerequisites: k.exigencias ? k.exigencias.join(', ') : undefined,
          nucleos: k.nucleos,
          powers: k.poderes
        }));
        setAllCompendiumItems([
          ...items,
          ...normalizedKits,
          ...artefatos,
          ...consumiveis,
          ...equipamentos
        ]);
        setLoadingCompendium(false);
      })
      .catch(err => {
        console.error('Falha ao carregar dados base:', err);
        setLoadingCompendium(false);
        showNotification(`Erro ao carregar dados base: ${err.message}`, 5000);
      });
  }, []);

  // Process Item Queue from Compendium Page
  const processItemQueue = useCallback(() => {
    const queueJson = localStorage.getItem(ADD_ITEM_QUEUE_KEY);
    if (queueJson) {
      try {
        const queuedItemData: { id: string } = JSON.parse(queueJson);
        const fullItem = allCompendiumItems.find((ci: CompendiumItem) => ci.id === queuedItemData.id);

        if (fullItem) {
          let actionType: CharacterWizardAction['type'] | null = null;
          let field: 'skills' | 'advantages' | 'disadvantages' | 'techniquesAndTricks' | 'equipment' | null = null;
          let valueToAdd: SelectedCompendiumItem | SelectedEquipmentItem | null = null;

          // Determine action based on item type
          if (fullItem.type === 'Perícia') {
            field = 'skills';
            valueToAdd = { ...fullItem, cost: fullItem.cost, costType: 'PP' };
          } else if (fullItem.type === 'Vantagem') {
            field = 'advantages';
            valueToAdd = { 
              ...fullItem, 
              cost: fullItem.variableCost ? (fullItem.cost || 0) * (fullItem.min || 1) : fullItem.cost,
              originalCost: fullItem.variableCost ? fullItem.cost : undefined,
              currentLevel: fullItem.variableCost ? (fullItem.min || 1) : undefined,
              costType: 'PP',
              variableCost: fullItem.variableCost,
              costDetails: fullItem.costDetails,
              min: fullItem.min,
              max: fullItem.max,
            };
          } else if (fullItem.type === 'Desvantagem') {
            field = 'disadvantages';
             valueToAdd = { 
              ...fullItem, 
              cost: fullItem.variableCost ? (fullItem.cost || 0) * (fullItem.min || 1) : fullItem.cost,
              originalCost: fullItem.variableCost ? fullItem.cost : undefined,
              currentLevel: fullItem.variableCost ? (fullItem.min || 1) : undefined,
              costType: 'PP',
              variableCost: fullItem.variableCost,
              costDetails: fullItem.costDetails,
              min: fullItem.min,
              max: fullItem.max,
             };
          } else if (fullItem.type === 'Técnica') {
             field = 'techniquesAndTricks';
             valueToAdd = { ...fullItem, cost: fullItem.cost || 0, costType: 'XP' };
          } else if (fullItem.type === 'Artefato' || fullItem.type === 'Consumível') {
             field = 'equipment';
             valueToAdd = { 
                 ...fullItem, 
                 cost: fullItem.type === 'Artefato' ? (fullItem.cost || 0) : 0, // Artefact cost XP, Consumable cost 0 PP/XP initially
                 quantity: 1, 
                 subtype: fullItem.type, // Store original type here
                 costType: fullItem.type === 'Artefato' ? 'XP' : 'PP' // Artefact cost XP
             };
          }
          // TODO: Add Kit handling later

          if (field && valueToAdd && !formData[field].some((i: any) => i.id === fullItem.id)) {
            actionType = 'ADD_ITEM';
            dispatch({ type: actionType, field: field as any, value: valueToAdd });
            showNotification(`"${fullItem.name}" adicionado à ficha.`, 2500);
          } else if (field) {
             showNotification(`"${fullItem.name}" já está na ficha.`, 2500);
          }
        }
      } catch (e) {
        console.error("Erro ao processar fila de itens:", e);
      } finally {
        localStorage.removeItem(ADD_ITEM_QUEUE_KEY);
      }
    }
  }, [allCompendiumItems, dispatch, formData]); // Added formData dependency

  // Setup listeners for item queue
  useEffect(() => {
    if (allCompendiumItems.length > 0) processItemQueue();
    window.addEventListener('storage', processItemQueue);
    window.addEventListener('focus', processItemQueue);
    return () => {
      window.removeEventListener('storage', processItemQueue);
      window.removeEventListener('focus', processItemQueue);
    }
  }, [processItemQueue, allCompendiumItems]);
  
  // Load existing character or initialize new one
  useEffect(() => {
    const charIdToLoad = characterIdFromParams;
    if (charIdToLoad) {
      setIsLoadingCharacter(true);
      const charDataString = localStorage.getItem(`${CHARACTER_SHEET_PREFIX_KEY}${charIdToLoad}`);
      if (charDataString) {
        try {
          const charData = JSON.parse(charDataString);
          // Validate loaded data against schema (optional but recommended)
          const validation = characterSchema.safeParse(charData);
          if (validation.success) {
            // Preenche campos obrigatórios ausentes e corrige avatarUrl
            const data: CharacterFormData = {
              ...validation.data,
              skills: (validation.data.skills as SelectedCompendiumItem[]) ?? [],
              advantages: (validation.data.advantages as SelectedCompendiumItem[]) ?? [],
              disadvantages: (validation.data.disadvantages as SelectedCompendiumItem[]) ?? [],
              techniquesAndTricks: (validation.data as any).techniquesAndTricks ?? [],
              equipment: (validation.data as any).equipment ?? [],
              avatarUrl: validation.data.avatarUrl ?? undefined,
              description: validation.data.description ?? undefined,
              archetype: validation.data.archetype
                ? {
                    ...validation.data.archetype,
                    type: (['Vantagem', 'Desvantagem', 'Perícia', 'Técnica', 'Arquétipo', 'Consumível', 'Artefato', 'Regra Opcional', 'Monstro', 'Kit'] as const).includes(validation.data.archetype.type as any)
                      ? validation.data.archetype.type as SelectedCompendiumItem['type']
                      : 'Arquétipo',
                    costType: (validation.data.archetype.costType === 'XP' || validation.data.archetype.costType === 'PP')
                      ? validation.data.archetype.costType
                      : undefined,
                    powers: Array.isArray(validation.data.archetype.powers)
                      ? (validation.data.archetype.powers as any[]).map((p: any) =>
                          typeof p === 'string'
                            ? { name: p, description: '' }
                            : { name: p.nome || p.name || '', description: p.descricao || p.description || '' }
                        )
                      : undefined,
                  }
                : null,
              attributes: {
                poder: validation.data.attributes?.poder ?? 0,
                habilidade: validation.data.attributes?.habilidade ?? 0,
                resistencia: validation.data.attributes?.resistencia ?? 0,
                armadura: validation.data.attributes?.armadura ?? 0,
                agilidade: validation.data.attributes?.agilidade ?? 0,
                pontosDeVida: 'pontosDeVida' in (validation.data.attributes ?? {}) ? (validation.data.attributes as any).pontosDeVida ?? 1 : 1,
                pontosDeMana: 'pontosDeMana' in (validation.data.attributes ?? {}) ? (validation.data.attributes as any).pontosDeMana ?? 1 : 1,
                pontosDeAcao: 'pontosDeAcao' in (validation.data.attributes ?? {}) ? (validation.data.attributes as any).pontosDeAcao ?? 1 : 1,
              },
              history: validation.data.history ?? undefined,
              notes: validation.data.notes ?? undefined,
              kits: Array.isArray(validation.data.kits)
                ? (validation.data.kits as any[]).map((k: any) => ({
                    ...k,
                    type: 'Kit',
                    powers: Array.isArray(k.powers)
                      ? k.powers.map((p: any) =>
                          typeof p === 'string'
                            ? { name: p, description: '' }
                            : { name: p.nome || p.name || '', description: p.descricao || p.description || '' }
                        )
                      : undefined,
                  }))
                : [],
            };
            dispatch({ type: 'LOAD_CHARACTER', payload: data });
            setIsEditing(true);
            localStorage.setItem(LAST_EDITED_CHAR_ID_KEY, charIdToLoad);
          } else {
             console.error("Erro de validação ao carregar ficha:", validation.error);
             showNotification("Erro de validação ao carregar ficha. Verifique o console.", 5000);
             // Load anyway or reset?
             dispatch({ type: 'LOAD_CHARACTER', payload: charData }); // Load potentially invalid data
             setIsEditing(true);
             localStorage.setItem(LAST_EDITED_CHAR_ID_KEY, charIdToLoad);
          }
        } catch (e) {
          console.error("Erro ao carregar ficha do localStorage:", e);
          showNotification("Erro ao carregar ficha.", 3000);
          navigate("/characters");
        }
      } else {
        showNotification("Ficha não encontrada.", 3000);
        navigate("/characters");
      }
      setIsLoadingCharacter(false);
    } else {
      // Initialize new character state via reducer
      dispatch({ type: 'RESET_FORM' }); 
      // Optionally set a new ID immediately if needed, or on first save
      // dispatch({ type: 'SET_FIELD', field: 'id', value: `${Date.now()}` });
      setIsEditing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterIdFromParams, navigate, dispatch]); // dispatch is stable

  // Centralized calculation effect (HP, MP, Points, XP)
  useEffect(() => {
    const { poder = 0, habilidade = 0, resistencia = 0 } = formData.attributes;
    
    // Calculate HP/MP based on attributes and advantages
    const maisVidaAdv = formData.advantages.find((adv: SelectedCompendiumItem) => adv.id === 'van_057'); // +Vida
    const pvFromAdvantage = maisVidaAdv ? (maisVidaAdv.currentLevel || 0) * 10 : 0;
    const basePVFromResistencia = resistencia === 0 ? 1 : resistencia * 5;
    const finalPV = Math.max(1, basePVFromResistencia + pvFromAdvantage);

    const maisManaAdv = formData.advantages.find((adv: SelectedCompendiumItem) => adv.id === 'van_042'); // +Mana
    const pmFromAdvantage = maisManaAdv ? (maisManaAdv.currentLevel || 0) * 10 : 0;
    const basePMFromHabilidade = habilidade === 0 ? 1 : habilidade * 5;
    const finalPM = Math.max(1, basePMFromHabilidade + pmFromAdvantage);

    // Calculate Agilidade
    const agilidadeBase = habilidade;
    // TODO: Add Agilidade from advantages if any exist
    const finalAgilidade = agilidadeBase;

    // Update HP/MP/Agilidade in state if changed
    if (formData.hp !== finalPV || formData.mp !== finalPM || formData.attributes.agilidade !== finalAgilidade) {
      dispatch({ type: 'SET_FIELD', field: 'hp', value: finalPV });
      dispatch({ type: 'SET_FIELD', field: 'mp', value: finalPM });
      dispatch({ type: 'SET_ATTRIBUTE', attribute: 'agilidade', value: finalAgilidade });
    }

    // Calculate total PP spent
    const attributePoints = poder + habilidade + resistencia;
    const skillPoints = formData.skills.reduce((acc: number, item: SelectedCompendiumItem) => acc + (item.cost || 0), 0);
    const advantagePoints = formData.advantages.filter((v: SelectedCompendiumItem) => !v.isFromArchetype).reduce((acc: number, item: SelectedCompendiumItem) => acc + (item.cost || 0), 0);
    const disadvantagePointsGained = Math.min(
      formData.disadvantages.filter((d: SelectedCompendiumItem) => !d.isFromArchetype).reduce((acc: number, item: SelectedCompendiumItem) => acc + Math.abs(item.cost || 0), 0),
      2
    );
    const archetypeCost = formData.archetype?.cost || 0;
    // TODO: Add Kit cost calculation
    const kitCost = 0; // Placeholder
    const totalSpentPP = attributePoints + skillPoints + advantagePoints + archetypeCost + kitCost - disadvantagePointsGained;
    
    const totalPointsAvailable = formData.nivelDePoder || 10;
    const remainingPP = totalPointsAvailable - totalSpentPP;
    setPontosRestantes(remainingPP);
    // Update total points spent in state if needed
    if (formData.points !== totalSpentPP) {
        dispatch({ type: 'SET_FIELD', field: 'points', value: totalSpentPP });
    }

    // Calculate total XP spent
    const xpGastosEmTecnicas = formData.techniquesAndTricks?.reduce((total: number, tech: SelectedCompendiumItem) => total + (tech.cost || 0), 0) || 0;
    const xpGastosEmArtefatos = formData.equipment
        ?.filter((e: SelectedEquipmentItem) => e.subtype === 'Artefato' && e.costType === 'XP')
        .reduce((total: number, art: SelectedEquipmentItem) => total + (art.cost || 0), 0) || 0;
    const totalSpentXP = xpGastosEmTecnicas + xpGastosEmArtefatos;
    setRemainingXP((formData.xp || 0) - totalSpentXP);

  }, [formData, dispatch]); // Recalculate whenever formData changes

  // Validate and Save Character
  const handleSave = () => {
    // Validate using Zod
    const validationResult = characterSchema.safeParse(formData);
    if (!validationResult.success) {
      setValidationErrors(validationResult.error);
      console.error("Erro de validação: ", validationResult.error.flatten());
      // Find the first step with an error
      const errorPaths = Object.keys(validationResult.error.flatten().fieldErrors);
      let errorStepIndex = WIZARD_STEPS.length - 1; // Default to review step
      if (errorPaths.includes('name') || errorPaths.includes('conceito') || errorPaths.includes('aparencia') || errorPaths.includes('escala')) errorStepIndex = 0;
      else if (errorPaths.includes('attributes') || errorPaths.includes('nivelDePoder')) errorStepIndex = 1;
      else if (errorPaths.includes('skills')) errorStepIndex = 2;
      else if (errorPaths.includes('advantages') || errorPaths.includes('disadvantages')) errorStepIndex = 3;
      else if (errorPaths.includes('archetype')) errorStepIndex = 4;
      // TODO: Add check for Kits step when implemented
      else if (errorPaths.includes('techniquesAndTricks') || errorPaths.includes('equipment') || errorPaths.includes('xp')) errorStepIndex = 5; // Assuming step 5 is Techniques/Equipment
      
      setCurrentStep(errorStepIndex);
      showNotification("Erro de validação. Verifique os campos marcados.", 4000);
      return;
    }
    
    setValidationErrors(null); // Clear errors on successful validation
    const characterToSave = validationResult.data;

    // Ensure character has an ID
    const finalCharId = characterToSave.id || `${Date.now()}`;
    characterToSave.id = finalCharId;

    try {
      // Save full character sheet
      localStorage.setItem(`${CHARACTER_SHEET_PREFIX_KEY}${finalCharId}`, JSON.stringify(characterToSave));
      
      // Update character list summary
      const summary: CharacterSummary = {
        id: finalCharId,
        name: characterToSave.name,
        description: characterToSave.description || characterToSave.conceito,
        avatarUrl: characterToSave.avatarUrl || '',
        nivelDePoder: characterToSave.nivelDePoder,
        archetype: characterToSave.archetype?.name || 'N/A',
        lastModified: new Date().toISOString(),
      };
      const listJson = localStorage.getItem(CHARACTER_GALLERY_LIST_KEY);
      let list: CharacterSummary[] = listJson ? JSON.parse(listJson) : [];
      const existingIndex = list.findIndex((c: CharacterSummary) => c.id === finalCharId);
      if (existingIndex > -1) {
        list[existingIndex] = summary;
      } else {
        list.push(summary);
      }
      localStorage.setItem(CHARACTER_GALLERY_LIST_KEY, JSON.stringify(list));
      localStorage.setItem(LAST_EDITED_CHAR_ID_KEY, finalCharId);

      showNotification("Personagem salvo com sucesso!", 2000);
      navigate(`/character/${finalCharId}`); // Navigate to view page

    } catch (e) {
      console.error("Erro ao salvar personagem:", e);
      showNotification("Erro ao salvar personagem. Verifique o console.", 5000);
    }
  };

  // Navigation Handlers
  const handleNext = () => {
    // Basic validation before proceeding (e.g., required fields for the current step)
    // More robust validation happens on save
    if (currentStep === 0 && (!formData.name || !formData.conceito || !formData.aparencia)) {
        showNotification("Nome, Conceito e Aparência são obrigatórios.", 3000);
        return;
    }
    // Check PP before leaving PP-spending steps
    if (currentStep < WIZARD_STEPS.findIndex((step: string) => step.includes("Técnicas"))) { // Check before moving to XP steps
        if (pontosRestantes < 0) {
            showNotification(`Pontos de Personagem insuficientes (${pontosRestantes}). Ajuste suas escolhas.`, 4000);
            return;
        }
    }
     // Check XP before leaving XP-spending step
    if (currentStep === WIZARD_STEPS.findIndex((step: string) => step.includes("Técnicas"))) {
        if (remainingXP < 0) {
            showNotification(`XP insuficiente (${remainingXP}). Ajuste suas escolhas.`, 4000);
            return;
        }
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setValidationErrors(null); // Clear errors when moving step
    } else {
      handleSave(); // Save on the last step
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationErrors(null); // Clear errors when moving step
    }
  };

  // Render Logic
  if (loadingCompendium || isLoadingCharacter) {
    return <LoadingSpinner message={loadingCompendium ? "Carregando dados base..." : "Carregando personagem..."} />;
  }

  const renderStep = () => {
    const stepProps = { 
        onNext: handleNext, 
        onPrevious: handlePrevious, 
        // Pass necessary data down
        compendiumItems: allCompendiumItems, 
        allCompendiumItems: allCompendiumItems, // Pass all for lookups if needed
        // availablePoints: pontosRestantes, // Pass remaining points
        // availableXP: remainingXP, // Pass remaining XP
        validationErrors: validationErrors?.flatten().fieldErrors, // Pass flattened errors
    };

    switch (currentStep) {
      case 0: return <StepIdentity {...stepProps} isFirstStep={true} />;
      case 1: return <StepAttributes {...stepProps} />;
      case 2: return <StepSkills {...stepProps} />;
      case 3: return <StepAdvantagesDisadvantages {...stepProps} />;
      case 4: return <StepArchetypes {...stepProps} />;
      case 5:
        return <StepKits {...stepProps} />; // Integrate StepKits
      case 6: {
        const artefatos = allCompendiumItems.filter((ci: CompendiumItem) => ci.type === 'Artefato');
        const consumiveis = allCompendiumItems.filter((ci: CompendiumItem) => ci.type === 'Consumível');
        return (
          <StepCombinedItems
            {...stepProps}
            isFirstStep={false}
            isLastStep={false}
            formData={{
              techniquesAndTricks: formData.techniquesAndTricks,
              equipment: formData.equipment,
              attributes: formData.attributes,
              skills: formData.skills,
              advantages: formData.advantages,
              xp: formData.xp,
            }}
            updateFormData={updateFormData}
            artefatos={artefatos}
            consumiveis={consumiveis}
            remainingXP={remainingXP}
          />
        );
      }
      case 7: {
        const spentXP =
          (formData.techniquesAndTricks?.reduce((t: number, i: SelectedCompendiumItem) => t + (i.cost || 0), 0) || 0) +
          (formData.equipment
            ?.filter((e: SelectedEquipmentItem) => e.subtype === 'Artefato' && e.costType === 'XP')
            .reduce((t: number, e: SelectedEquipmentItem) => t + (e.cost || 0), 0) || 0);
        return (
          <StepReview
            {...stepProps}
            formData={formData}
            spentXP={spentXP}
            isLastStep={true}
          />
        );
      }
      default: return <div>Passo desconhecido</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-sky-300">
        {isEditing ? `Editando: ${formData.name || 'Personagem'}` : 'Criar Novo Personagem'}
      </h1>
      
      {/* Step Indicator */} 
      <div className="mb-6 overflow-x-auto pb-2">
          <nav aria-label="Progress">
              <ol role="list" className="flex space-x-4">
                  {WIZARD_STEPS.map((stepName, stepIdx) => (
                      <li key={stepName} className="flex-shrink-0">
                          <button
                              onClick={() => {
                                  // Allow navigation only if previous steps are valid (basic check)
                                  if (stepIdx < currentStep && pontosRestantes >= 0 && remainingXP >= 0) {
                                      setCurrentStep(stepIdx);
                                      setValidationErrors(null);
                                  } else if (stepIdx === currentStep) {
                                      // Already on this step
                                  } else {
                                      // Potentially validate before jumping forward?
                                      // For now, only allow backward jumps or staying put.
                                  }
                              }}
                              className={`group flex flex-col items-center border-t-4 pt-2 px-2 text-xs font-medium 
                                  ${stepIdx === currentStep
                                      ? 'border-sky-500 text-sky-400'
                                      : stepIdx < currentStep
                                          ? 'border-emerald-500 text-emerald-400 hover:border-emerald-700'
                                          : 'border-gray-600 text-gray-500 hover:text-gray-400'}`}
                          >
                              <span className={`rounded-full px-2 py-0.5 text-xs mb-1 ${stepIdx === currentStep ? 'bg-sky-500 text-white' : stepIdx < currentStep ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-gray-300'}`}>{stepIdx + 1}</span>
                              <span className="text-center whitespace-nowrap">{stepName}</span>
                          </button>
                      </li>
                  ))}
              </ol>
          </nav>
      </div>

      {/* Render Current Step */} 
      <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-xl">
        {renderStep()}
      </div>

      {/* Global Point Summary (Optional) */} 
      <div className="mt-6 p-3 bg-slate-900/50 rounded-md text-center text-xs text-slate-400">
          Pontos Restantes: <span className={`font-bold ${pontosRestantes < 0 ? 'text-red-400' : 'text-green-400'}`}>{pontosRestantes}</span> PP / 
          XP Restante: <span className={`font-bold ${remainingXP < 0 ? 'text-red-400' : 'text-green-400'}`}>{remainingXP}</span> XP
      </div>

      {/* Notification Area */} 
      {notification && (
        <div className="fixed bottom-4 right-4 bg-sky-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-pulse">
          {notification}
        </div>
      )}
    </div>
  );
};

// Wrap the core component with the Provider
const CharacterEditorPage: React.FC = () => {
    return (
        <CharacterWizardProvider>
            <CharacterEditorCore />
        </CharacterWizardProvider>
    );
};

export default CharacterEditorPage;

