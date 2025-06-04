import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import {
  CharacterFormData,
  SelectedCompendiumItem,
  SelectedEquipmentItem,
} from '../../types';

// Estado inicial
const initialState: CharacterFormData = {
  name: '',
  avatarUrl: '',
  conceito: '',
  aparencia: '',
  nivelDePoder: 0,
  xpInicial: 0,
  xp: 0,
  escala: 'Ningen',
  description: '',
  archetype: null,
  attributes: {
    poder: 0,
    habilidade: 0,
    resistencia: 0,
    armadura: 0,
    agilidade: 0,
    pontosDeVida: 0,
    pontosDeMana: 0,
    pontosDeAcao: 0,
  },
  advantages: [] as SelectedCompendiumItem[],
  disadvantages: [] as SelectedCompendiumItem[],
  skills: [] as SelectedCompendiumItem[],
  kits: [] as SelectedCompendiumItem[],
  techniquesAndTricks: [] as SelectedCompendiumItem[],
  equipment: [] as SelectedEquipmentItem[],
  points: 0,
  hp: 0,
  mp: 0,
};

// Define as ações possíveis para o reducer
// TODO: Adicionar mais tipos de ação conforme necessário
type ListField =
  | 'advantages'
  | 'disadvantages'
  | 'skills'
  | 'kits'
  | 'techniquesAndTricks'
  | 'equipment';

type Action =
  | { type: 'SET_FIELD'; field: keyof CharacterFormData; value: any }
  | { type: 'SET_ATTRIBUTE'; attribute: keyof CharacterFormData['attributes']; value: number }
  | { type: 'ADD_ITEM'; field: ListField; value: SelectedCompendiumItem | SelectedEquipmentItem }
  | { type: 'REMOVE_ITEM'; field: ListField; value: string }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_CHARACTER'; payload: CharacterFormData }; // Para carregar um personagem existente

// O reducer que gerencia as atualizações de estado
const characterReducer = (state: CharacterFormData, action: Action): CharacterFormData => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ATTRIBUTE':
      return {
        ...state,
        attributes: {
          ...state.attributes,
          [action.attribute]: action.value,
        },
      };
    case 'ADD_ITEM': {
      const list = state[action.field] as (SelectedCompendiumItem | SelectedEquipmentItem)[];
      if (!list.some((item) => item.id === action.value.id)) {
        return { ...state, [action.field]: [...list, action.value] };
      }
      return state;
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        [action.field]: (state[action.field] as (SelectedCompendiumItem | SelectedEquipmentItem)[]).filter(
          (item) => item.id !== action.value
        ),
      };
    case 'RESET_FORM':
      return initialState;
    case 'LOAD_CHARACTER':
        return { ...action.payload }; // Substitui o estado atual pelo personagem carregado
    // TODO: Adicionar casos para calcular pontos, PV, PM automaticamente?
    default:
      return state;
  }
};

// Cria o Context
interface CharacterWizardContextProps {
  state: CharacterFormData;
  dispatch: Dispatch<Action>;
}

const CharacterWizardContext = createContext<CharacterWizardContextProps | undefined>(undefined);

// Cria o Provider
interface CharacterWizardProviderProps {
  children: ReactNode;
}

export const CharacterWizardProvider: React.FC<CharacterWizardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(characterReducer, initialState);

  // TODO: Adicionar lógica para carregar/salvar do storage.ts aqui?

  return (
    <CharacterWizardContext.Provider value={{ state, dispatch }}>
      {children}
    </CharacterWizardContext.Provider>
  );
};

// Hook customizado para usar o context
export const useCharacterWizard = () => {
  const context = useContext(CharacterWizardContext);
  if (context === undefined) {
    throw new Error('useCharacterWizard must be used within a CharacterWizardProvider');
  }
  return context;
};

// Exporta tipos para uso externo, se necessário
export type { CharacterFormData, Action as CharacterWizardAction };

