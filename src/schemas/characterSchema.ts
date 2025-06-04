import { z } from 'zod';

// Esquema básico para Vantagens/Desvantagens/Perícias selecionadas (pode precisar de refinamento)
const selectedCompendiumItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(), // Vantagem, Desvantagem, Perícia, Kit, etc.
  description: z.string(),
  cost: z.number().optional(), // Custo em PP ou outro recurso
  costType: z.string().optional(), // PP, XP, etc.
  rules: z.string().optional(),
  source: z.string().optional(),
  prerequisites: z.string().optional(),
  isFromArchetype: z.boolean().optional(), // Indica se veio do arquétipo
  variableCost: z.boolean().optional(),
  costDetails: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  currentLevel: z.number().optional(),
  originalCost: z.number().optional(),
  // Campos específicos de Kit (a serem adicionados quando o modelo Kit for definido)
  nucleos: z.array(z.string()).optional(), 
  powers: z.array(z.string()).optional(), // Ou um schema mais complexo para poderes
});

// Esquema para Atributos
const attributesSchema = z.object({
  poder: z.number().min(0).max(5).default(0),
  habilidade: z.number().min(0).max(5).default(0),
  resistencia: z.number().min(0).max(5).default(0),
  armadura: z.number().min(0).default(0), // Armadura base, pode ser modificada por itens/vantagens
  agilidade: z.number().min(0).default(0), // Calculado (H + Vantagens)
  // PV e PM são calculados, mas podemos validar o resultado se necessário
  // pontosDeVida: z.number().min(1),
  // pontosDeMana: z.number().min(1),
  // pontosDeAcao: z.number().min(1), // Calculado (P + Vantagens)
});

// Esquema principal para os dados do formulário do personagem
export const characterSchema = z.object({
  id: z.string().optional(), // ID para personagens existentes
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  avatarUrl: z.string().url().or(z.string().startsWith('data:image')).optional().nullable(),
  conceito: z.string().min(1, { message: 'Conceito é obrigatório' }),
  aparencia: z.string().min(1, { message: 'Aparência é obrigatória' }),
  nivelDePoder: z.number().min(0).default(10), // Pontos de Personagem
  xpInicial: z.number().min(0).default(0),
  xp: z.number().min(0).default(0),
  escala: z.enum(["Ningen", "Sugoi", "Kiodai", "Kami"]).default("Ningen"),
  history: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  
  attributes: attributesSchema,
  
  archetype: selectedCompendiumItemSchema.nullable().optional(), // Arquétipo selecionado
  
  advantages: z.array(selectedCompendiumItemSchema).default([]),
  disadvantages: z.array(selectedCompendiumItemSchema).default([]),
  skills: z.array(selectedCompendiumItemSchema).default([]), // Perícias
  kits: z.array(selectedCompendiumItemSchema).default([]), // Kits selecionados
  
  // Campos calculados (podem ser validados no final)
  points: z.number().default(0), // Pontos totais gastos/ganhos
  hp: z.number().min(1).default(1), // Pontos de Vida calculados
  mp: z.number().min(1).default(1), // Pontos de Magia calculados

  // TODO: Adicionar outros campos conforme necessário (técnicas, truques, equipamento)
  // tecnicas: z.array(selectedCompendiumItemSchema).default([]),
  // truques: z.array(selectedCompendiumItemSchema).default([]),
  // equipamento: z.array(selectedCompendiumItemSchema).default([]),
})
.superRefine((data, ctx) => {
  // Validação de Pontos Totais
  const attributePoints = data.attributes.poder + data.attributes.habilidade + data.attributes.resistencia;
  const skillPoints = data.skills.reduce((acc, item) => acc + (item.cost || 0), 0);
  const advantagePoints = data.advantages.filter(v => !v.isFromArchetype).reduce((acc, item) => acc + (item.cost || 0), 0);
  const disadvantagePointsGained = Math.min(
    data.disadvantages.filter(d => !d.isFromArchetype).reduce((acc, item) => acc + Math.abs(item.cost || 0), 0),
    2 // Limite de 2 pontos ganhos por desvantagens
  );
  const archetypeCost = data.archetype?.cost || 0;
  
  // TODO: Adicionar custo de Kits quando implementado
  // const kitCost = data.kits.reduce((acc, kit, index) => acc + (index + 1), 0); // Custo incremental 1, 2, 3...
  const kitCost = 0; // Placeholder

  const totalPointsSpent = attributePoints + skillPoints + advantagePoints + archetypeCost + kitCost - disadvantagePointsGained;

  if (totalPointsSpent > data.nivelDePoder) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nivelDePoder"], // Associar erro ao campo de pontos totais
      message: `Pontos gastos (${totalPointsSpent}) excedem o Nível de Poder (${data.nivelDePoder}). Pontos restantes: ${data.nivelDePoder - totalPointsSpent}`,
    });
  }

  // Validação de Pré-requisitos (Simplificada - idealmente verificar cada item)
  // Exemplo: Verificar se Vantagem X requer Atributo Y >= 2
  data.advantages.forEach((adv, index) => {
    if (adv.prerequisites) {
      // Implementar lógica de parsing e verificação de pré-requisitos aqui
      // Exemplo básico: Checar se requer Habilidade 2
      if (adv.prerequisites.includes("Habilidade 2") && data.attributes.habilidade < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["advantages", index, "prerequisites"], // Associar erro à vantagem específica
          message: `Pré-requisito não cumprido para ${adv.name}: ${adv.prerequisites}`,
        });
      }
      // Adicionar mais verificações conforme necessário
    }
  });
  data.disadvantages.forEach((dis, index) => {
     if (dis.prerequisites) {
        // Lógica similar para desvantagens
     }
  });
  data.skills.forEach((skill, index) => {
     if (skill.prerequisites) {
        // Lógica similar para perícias
     }
  });
  // TODO: Adicionar validação de pré-requisitos para Kits quando implementado

  // Validação de Incompatibilidades
  const hasAntipatico = data.disadvantages.some(d => d.name === "Antipático" && !d.isFromArchetype);
  const hasCarismatico = data.advantages.some(v => v.name === "Carismático" && !v.isFromArchetype);
  if (hasAntipatico && hasCarismatico) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["advantages"], // Ou disadvantages
        message: "Não pode ter Carismático e Antipático juntos.",
     });
  }
  
  // TODO: Adicionar validação de PV/PM calculados (se necessário)
  // Ex: Verificar se PV calculado é >= 1

});

// Tipo inferido a partir do schema
export type CharacterSchema = z.infer<typeof characterSchema>;

