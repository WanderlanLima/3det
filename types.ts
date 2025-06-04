export interface CharacterSummary {
  id: string;
  name: string;
  conceito?: string; 
  description?: string; 
  avatarUrl?: string;
  nivelDePoder?: number;
  archetype?: string;
  lastModified: string;
}

// CharacterAttributes for 3DeT Victory
export interface CharacterAttributes {
  poder: number;
  habilidade: number;
  resistencia: number;
  pontosDeVida: number; 
  pontosDeMana: number; 
  pontosDeAcao: number; 
  [key: string]: number | string | undefined; 
}

export interface SelectedCompendiumItem {
  id: string;
  name: string;
  type: CompendiumItem['type'];
  description: string;
  cost?: number; 
  rules?: string;
  source?: string;
  isFromArchetype?: boolean; 
  subtype?: CompendiumItem['subtype'];
  prerequisites?: string; 

  variableCost?: boolean;
  costDetails?: string;
  min?: number;
  max?: number;
  currentLevel?: number; 
  originalCost?: number; 

  costType?: 'XP' | 'PP';
}

export interface SelectedEquipmentItem extends SelectedCompendiumItem {
  quantity: number;
  subtype?: CompendiumItem['subtype'] | 'Artefato' | 'Consumível'; 
}

export type EscalaPersonagem = 'Ningen' | 'Sugoi' | 'Kiodai' | 'Kami';

export interface CharacterFormData {
  id?: string;
  name: string;
  avatarUrl?: string;
  conceito: string;
  aparencia: string;
  nivelDePoder: number; 
  xpInicial: number; 
  xp: number; 
  escala: EscalaPersonagem;
  description?: string; 
  attributes: CharacterAttributes;
  skills: SelectedCompendiumItem[]; 
  advantages: SelectedCompendiumItem[];
  disadvantages: SelectedCompendiumItem[];
  archetype: SelectedCompendiumItem | null;
  techniquesAndTricks: SelectedCompendiumItem[]; 
  equipment: SelectedEquipmentItem[]; 
  history?: string; 
  notes?: string;
}

// --- Campaign Types ---
export interface CampaignFormData {
  id?: string;
  name: string;
  description: string; 
  longDescription?: string; 
  status: 'ativa' | 'finalizada' | 'planejada';
  gm?: string;
  imageUrl?: string;
  setting?: string; 
  playerCount?: number; 
  sessionCount?: number;
  npcCount?: number;
  title?: string; 
}

export interface CampaignSummary extends CampaignFormData {
  id: string;
  playerCount: number;
  lastSessionDate?: string;
  sessionCount: number;
  npcCount: number;
}

export interface CampaignSession {
  id: string;
  title: string;
  date: string; 
  status: 'planejada' | 'ativa' | 'concluída';
  summary: string; 
}

export interface CampaignParticipant {
  characterId: string; 
  characterName: string;
  playerName?: string; 
  avatarUrl?: string;
  status?: 'ativo' | 'ausente' | 'eliminado'; 
}

export interface CampaignFull extends CampaignFormData {
  id: string;
  sessions: CampaignSession[];
  participants: CampaignParticipant[];
  npcs?: CharacterSummary[]; 
}


export interface CompendiumItem {
  id: string;
  name: string;
  type: 'Vantagem' | 'Desvantagem' | 'Perícia' | 'Técnica' | 'Arquétipo' | 'Consumível' | 'Artefato' | 'Regra Opcional' | 'Monstro' | 'Kit';
  subtype?: 'Truque' | 'Comum' | 'Lendária' | 'Arma' | 'Armadura' | 'Escudo' | 'Item' | 'Acessório' | 'Qualidade de Artefato' | 'Artefato' | 'Consumível';
  description: string;
  rules?: string;
  source?: string;
  tags?: string[];
  cost?: number; 
  prerequisites?: string;

  variableCost?: boolean;
  costDetails?: string;
  min?: number;
  max?: number;

  costType?: 'XP' | 'PP';
  
  // Kit specific fields (optional on the base type)
  nucleos?: string[];
  requirements?: KitRequirement[];
  powers?: KitPower[];
  baseCost?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  characters?: CharacterSummary[];
  campaignsAsGM?: CampaignSummary[];
  campaignsAsPlayer?: CampaignSummary[];
}

export enum UserRole {
  MESTRE = 'mestre',
  JOGADOR = 'jogadora', 
  CONVIDADO = 'convidado',
}

export interface QueuedCompendiumItem {
  id: string;
  type: CompendiumItem['type']; 
  name: string;
  cost?: number; 
  costType?: 'XP' | 'PP';
  variableCost?: boolean;
  costDetails?: string;
  min?: number;
  max?: number;
  subtype?: CompendiumItem['subtype']; 
  prerequisites?: string; 
}

// --- Combat Simulator Types ---
export interface CharacterMinimal { 
  id: string;
  name: string;
  avatarUrl?: string;
  attributes: { 
    poder: number;
    habilidade: number;
    resistencia: number;
  };
  isNPC?: boolean; 
  skills?: SelectedCompendiumItem[]; 
  techniquesAndTricks?: SelectedCompendiumItem[]; 
}

export type KnownConditionName = 
  | "Perto da Derrota" 
  | "Derrotado" 
  | "Caído" 
  | "Inconsciente" 
  | "Quase Morto" 
  | "Morto"
  | "Perda Próximo Teste"
  | "Defesa Total Ativa"
  | "Atordoado" // Exemplo de condição do livro
  | "Cego"      // Exemplo
  | "Confuso"   // Exemplo
  | "Exausto"
  | "Fraco (Condição)"
  | "Imóvel"
  | "Indefeso (Condição)"
  | "Lento (Condição)";


export interface ActiveCondition {
  id: string; 
  name: string | KnownConditionName; 
  description: string;
  durationInTurns?: number; // Undefined for permanent until removed, or specific number of turns
  sourceCombatantId?: string; 
  effect?: { 
    grantsGanho?: boolean; // Se a condição impõe Ganho em testes
    grantsPerda?: boolean; // Se a condição impõe Perda em testes
    preventsCriticals?: boolean; // Se a condição impede acertos críticos
    // ... outros modificadores específicos de stats ou flags
    // Ex: modPoder, modHabilidade, modResistencia, cannotAct, cannotMove
    icon?: string; // Nome de um ícone Lucide para exibir
    isBuff?: boolean; 
    isDebuff?: boolean; 
  };
  isSystemCondition?: boolean; 
}

export interface Combatant {
  id: string; 
  originalCharacterId: string; 
  name: string;
  avatarUrl?: string;
  isNPC: boolean;
  
  poder: number;
  habilidade: number;
  resistencia: number; // Resistência base
  escala: EscalaPersonagem; 

  currentPV: number;
  maxPV: number;
  currentPM: number;
  maxPM: number; 
  currentPA: number; 
  maxPA: number;   

  initiativeRollValue?: number; 
  initiativeTotal: number;     
  initiativeDiceRolls?: number[]; 
  usaPericiaLutaIniciativa: boolean; 

  activeConditions: ActiveCondition[];
  isCurrentTurn: boolean;
  isDefeated: boolean; 
  isRecoveringFromDeathTest?: boolean; // Para evitar múltiplos testes de morte na mesma rodada de dano

  skills?: SelectedCompendiumItem[]; 
  techniquesAndTricks?: SelectedCompendiumItem[]; 
  tempModifier: number; 
  actionUsedThisTurn: boolean; 
  movementsUsedThisTurn: number; 
}

export interface RollDetails {
  dice: string; 
  rolls: number[];
  modifier?: number; // Modificador manual, não de atributo
  attributeValue?: number; 
  tempModifierValue?: number; // Specific temp modifier from UI
  bonusFromEffects?: number; 
  total: number;
  description?: string; 
  isCriticalHit?: boolean;
  isCriticalFailure?: boolean;
  criticalBonuses?: number; // Total bonus from criticals
  isPerda?: boolean;
  isGanho?: boolean;
}

export interface ConditionDetails {
  name: string;
  duration?: number;
}

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 
    | 'info' 
    | 'roll' 
    | 'action' 
    | 'damage' 
    | 'healing' 
    | 'resource_change'
    | 'condition_add' 
    | 'condition_remove' 
    | 'condition_applied' // Para quando uma condição de fato é adicionada
    | 'condition_expired' // Para quando uma condição expira
    | 'turn' 
    | 'round' 
    | 'error' 
    | 'combat_start' 
    | 'combat_end' 
    | 'initiative' 
    | 'attack_roll' // Específico para rolagens de ataque
    | 'defense_roll' // Específico para rolagens de defesa
    | 'skill_test_roll' // Para testes de perícia/atributo gerais
    | 'death_test_roll'
    | 'death_test_result'
    | 'action_attack'
    | 'action_skill_test'
    | 'action_technique'
    | 'action_defense_total'
    | 'action_maneuver'
    | 'action_move'
    | 'action_pass_turn';
  actorId?: string; 
  targetId?: string; 
  rollDetails?: RollDetails;
  conditionDetails?: ConditionDetails;
}

export enum CombatPhase {
  SETUP = 'setup',
  INITIATIVE = 'initiative',
  ACTING = 'acting',
  ENDED = 'ended',
}

export enum CombatActionType {
  ATTACK_MELEE = 'attack_melee',
  ATTACK_RANGED = 'attack_ranged',
  DEFEND = 'defend', 
  USE_TECHNIQUE = 'use_technique',
  USE_ADVANTAGE = 'use_advantage',
  MOVE = 'move',
  PASS_TURN = 'pass_turn',
}

export interface CombatState {
  combatants: Combatant[];
  orderedCombatantIds: string[]; 
  currentCombatantId: string | null;
  round: number;
  log: CombatLogEntry[];
  phase: CombatPhase;
  selectedTargetId: string | null; 
  limiteDeDanoAtivo: boolean; 
}

export const LAST_EDITED_CHAR_ID_KEY = 'rpgCompanion.lastEditedCharacterId';
export const CHARACTER_GALLERY_LIST_KEY = 'rpgCompanion.characterGalleryList';
export const CHARACTER_SHEET_PREFIX_KEY = 'rpgCompanion.characterSheet_';

export const CAMPAIGN_LIST_KEY = 'rpgCompanion.campaignList';
export const CAMPAIGN_SHEET_PREFIX_KEY = 'rpgCompanion.campaignSheet_';



// --- Kit Types ---
export interface KitRequirement {
  type: 'skill' | 'advantage' | 'disadvantage' | 'attribute';
  id?: string; // ID for skill/advantage/disadvantage
  name: string; // Name of the item or attribute (e.g., "Esquiva", "Poder")
  value?: number; // Minimum value required (for attributes or skill/advantage levels)
}

export interface KitPower {
  name: string;
  description: string;
  // Add other relevant fields for powers if needed
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  nucleos: string[]; // Array of core concepts/themes
  requirements: KitRequirement[];
  powers: KitPower[]; // Array of 3 powers
  baseCost: number; // Fixed cost (usually 1 PP)
  source?: string; // e.g., "Manual do Arcanauta"
  type: 'Kit'; // To distinguish from other CompendiumItems
}

// Update CharacterFormData to include kits
export interface CharacterFormData {
  id?: string;
  name: string;
  avatarUrl?: string;
  conceito: string;
  aparencia: string;
  nivelDePoder: number; 
  xpInicial: number; 
  xp: number; 
  escala: EscalaPersonagem;
  description?: string; 
  attributes: CharacterAttributes;
  skills: SelectedCompendiumItem[]; 
  advantages: SelectedCompendiumItem[];
  disadvantages: SelectedCompendiumItem[];
  archetype: SelectedCompendiumItem | null;
  kits: SelectedCompendiumItem[]; // Changed from Kit[] to SelectedCompendiumItem[] for consistency
  techniquesAndTricks: SelectedCompendiumItem[]; 
  equipment: SelectedEquipmentItem[]; 
  history?: string; 
  notes?: string;
  // Calculated fields
  points?: number;
  hp?: number;
  mp?: number;
}

// Update SelectedCompendiumItem to potentially include Kit-specific fields if needed when selected
export interface SelectedCompendiumItem {
  id: string;
  name: string;
  type: CompendiumItem['type'];
  description: string;
  cost?: number; 
  rules?: string;
  source?: string;
  isFromArchetype?: boolean; 
  subtype?: CompendiumItem['subtype'];
  prerequisites?: string; 

  variableCost?: boolean;
  costDetails?: string;
  min?: number;
  max?: number;
  currentLevel?: number; 
  originalCost?: number; 

  costType?: 'XP' | 'PP';
  
  // Kit specific fields (might be useful to carry over)
  nucleos?: string[]; 
  powers?: KitPower[]; 
}

