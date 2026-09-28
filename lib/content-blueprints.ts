import type { VisualFamily } from "@/lib/visual-families";

export type ContentArchetype =
  | "general"
  | "checklist"
  | "story"
  | "comparison"
  | "product"
  | "authority";

export type ArtDirection = "editorial" | "split" | "minimal";

export type BlueprintRole =
  | "hook"
  | "second_hook"
  | "context"
  | "item"
  | "comparison"
  | "proof"
  | "transition"
  | "result"
  | "takeaway"
  | "cta"
  | "body";

export type BlueprintEmphasis = "high" | "medium" | "low";
export type BlueprintVisualPriority = "text" | "image" | "balanced";

export type BlueprintSlot = {
  role: BlueprintRole;
  badge: string | null;
  emphasis: BlueprintEmphasis;
  visualPriority: BlueprintVisualPriority;
  instruction: string;
};

export type ContentBlueprint = {
  id: string;
  archetype: ContentArchetype;
  slots: BlueprintSlot[];
  promisedItemCount?: number;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function inferArchetypeFromBriefing(briefing: string): ContentArchetype {
  const source = normalize(briefing);

  // List intent must win over segment nouns such as "restaurante" or "produto".
  if (
    /\b\d+\s+(erros|passos|dicas|formas|maneiras|motivos|ideias|sinais|itens|pontos|razoes)\b/.test(source) ||
    /\b(checklist|lista|erros|passos|dicas)\b/.test(source)
  ) {
    return "checklist";
  }

  if (/\b(antes\s+e\s+depois|antes|depois|versus|vs\.?|comparacao|comparar|mito|verdade|errado|certo)\b/.test(source)) {
    return "comparison";
  }

  if (/\b(case|historia|jornada|bastidor|bastidores|transformacao|virada)\b/.test(source)) {
    return "story";
  }

  if (/\b(dado|dados|estatistica|pesquisa|estudo|numero|numeros|insight|tendencia|benchmark)\b/.test(source)) {
    return "authority";
  }

  if (/\b(produto|prato|cardapio|lancamento|colecao|embalagem|ambiente|showcase|vitrine)\b/.test(source)) {
    return "product";
  }

  return "general";
}

function explicitCount(briefing: string) {
  const source = normalize(briefing);
  const match = source.match(/\b(\d{1,2})\s+(erros|passos|dicas|formas|maneiras|motivos|ideias|sinais|itens|pontos|razoes)\b/);
  if (!match) return null;

  const count = Number(match[1]);
  if (!Number.isFinite(count)) return null;
  return Math.max(3, Math.min(7, count));
}

function checklistNoun(briefing: string) {
  const source = normalize(briefing);
  if (/\berros?\b/.test(source)) return "ERRO";
  if (/\bpassos?\b/.test(source)) return "PASSO";
  if (/\bdicas?\b/.test(source)) return "DICA";
  if (/\bsinais?\b/.test(source)) return "SINAL";
  if (/\bmotivos?\b|\brazoes?\b/.test(source)) return "MOTIVO";
  if (/\bideias?\b/.test(source)) return "IDEIA";
  return "ITEM";
}

export function chooseVisualFamily({
  archetype,
  briefing,
  segment,
}: {
  archetype: ContentArchetype;
  objective: string;
  briefing: string;
  segment?: string | null;
}): VisualFamily {
  const source = normalize(`${briefing} ${segment || ""}`);

  if (/\b(software|saas|tecnologia|tech|inteligencia artificial|\bia\b|automacao|digital|app|aplicativo)\b/.test(source)) {
    if (archetype !== "story") return "orbit";
  }

  if (archetype === "checklist" || archetype === "comparison") return "pulse";
  if (archetype === "authority") return "atlas";
  if (archetype === "story") return "margem";
  if (archetype === "product") return "vitrine";
  return "atlas";
}

export function chooseArtDirection(
  archetype: ContentArchetype,
  family: VisualFamily
): ArtDirection {
  if (family === "atlas") return archetype === "comparison" ? "split" : "minimal";
  if (family === "orbit") return "split";
  if (family === "vitrine") return "editorial";
  if (family === "margem") return "editorial";
  if (archetype === "comparison") return "split";
  return "editorial";
}

function slot(
  role: BlueprintRole,
  badge: string | null,
  emphasis: BlueprintEmphasis,
  visualPriority: BlueprintVisualPriority,
  instruction: string
): BlueprintSlot {
  return { role, badge, emphasis, visualPriority, instruction };
}

export function buildContentBlueprint(
  type: string,
  archetype: ContentArchetype,
  briefing: string
): ContentBlueprint {
  if (type === "post") {
    return {
      id: "post-single",
      archetype,
      slots: [
        slot(
          "hook",
          null,
          "high",
          archetype === "product" ? "image" : "balanced",
          "Uma única peça: headline memorável, uma ideia central e body curto. Não tente condensar uma lista inteira."
        ),
      ],
    };
  }

  if (type === "reel") {
    return { id: "reel-script", archetype, slots: [] };
  }

  if (archetype === "checklist") {
    const count = explicitCount(briefing) || 5;
    const noun = checklistNoun(briefing);
    const priorities: BlueprintVisualPriority[] = ["text", "image", "text", "image", "text", "balanced", "text"];
    const items = Array.from({ length: count }, (_, index) =>
      slot(
        "item",
        `${noun} ${String(index + 1).padStart(2, "0")}`,
        "medium",
        priorities[index] || "text",
        `Item ${index + 1} de ${count}. Entregue um ponto único e diferente dos demais. A headline NÃO deve repetir "${noun} ${index + 1}" porque o badge já fará isso.`
      )
    );

    return {
      id: `checklist-${count}`,
      archetype,
      promisedItemCount: count,
      slots: [
        slot(
          "hook",
          "CHECKLIST",
          "high",
          "balanced",
          `Capa. Prometa exatamente ${count} itens e deixe claro o benefício ou risco. Não entregue o primeiro item ainda.`
        ),
        ...items,
        slot(
          "cta",
          "PRÓXIMO PASSO",
          "high",
          "text",
          "Fechamento e chamada para ação. NÃO introduza um novo item, erro, passo ou dica. Resuma a implicação e conduza o leitor ao próximo passo."
        ),
      ],
    };
  }

  if (archetype === "comparison") {
    return {
      id: "comparison-7",
      archetype,
      slots: [
        slot("hook", "COMPARAÇÃO", "high", "balanced", "Capa que apresenta claramente o contraste que será demonstrado."),
        slot("comparison", "01", "high", "balanced", "Primeiro contraste. Preencha os dois lados com ideias realmente opostas ou comparáveis."),
        slot("comparison", "02", "medium", "balanced", "Segundo contraste, sem repetir o anterior."),
        slot("comparison", "03", "medium", "balanced", "Terceiro contraste, avançando o raciocínio."),
        slot("comparison", "04", "medium", "balanced", "Quarto e último contraste."),
        slot("takeaway", "LEITURA", "medium", "text", "Síntese: explique o padrão por trás das comparações."),
        slot("cta", "PRÓXIMO PASSO", "high", "text", "CTA final. Não crie uma quinta comparação."),
      ],
    };
  }

  if (archetype === "story") {
    return {
      id: "story-7",
      archetype,
      slots: [
        slot("hook", "HISTÓRIA", "high", "balanced", "Abra com tensão, curiosidade ou transformação. Não revele tudo."),
        slot("context", "CONTEXTO", "medium", "image", "Situação inicial e contexto necessário."),
        slot("body", "PROBLEMA", "medium", "text", "Mostre o problema concreto e por que ele importava."),
        slot("transition", "VIRADA", "high", "balanced", "Momento de mudança, descoberta ou decisão."),
        slot("result", "RESULTADO", "high", "image", "Mostre o que mudou. Não invente números que não existam no briefing."),
        slot("takeaway", "APRENDIZADO", "medium", "text", "Extraia uma lição aplicável ao público."),
        slot("cta", "PRÓXIMO PASSO", "high", "text", "Feche com uma ação coerente com a história."),
      ],
    };
  }

  if (archetype === "authority") {
    return {
      id: "authority-7",
      archetype,
      slots: [
        slot("hook", "INSIGHT", "high", "text", "Capa com uma tese forte e defensável."),
        slot("context", "CONTEXTO", "medium", "text", "Explique o cenário e o que está em jogo."),
        slot("proof", "EVIDÊNCIA 01", "high", "balanced", "Primeira evidência, observação ou lógica. Não invente estatísticas."),
        slot("proof", "EVIDÊNCIA 02", "medium", "balanced", "Segunda evidência diferente da primeira."),
        slot("proof", "EVIDÊNCIA 03", "medium", "balanced", "Terceira evidência ou implicação."),
        slot("takeaway", "LEITURA", "high", "text", "Interprete o conjunto e traduza para uma decisão prática."),
        slot("cta", "PRÓXIMO PASSO", "high", "text", "CTA final, sem criar uma nova evidência."),
      ],
    };
  }

  if (archetype === "product") {
    return {
      id: "product-7",
      archetype,
      slots: [
        slot("hook", "DESTAQUE", "high", "image", "Capa image-led: benefício, desejo ou proposta central."),
        slot("context", "POR QUÊ", "medium", "image", "Contextualize o problema ou ocasião de uso."),
        slot("item", "DETALHE 01", "medium", "image", "Primeiro atributo ou benefício concreto."),
        slot("item", "DETALHE 02", "medium", "image", "Segundo atributo ou benefício, diferente do primeiro."),
        slot("proof", "PROVA", "high", "image", "Prova plausível baseada apenas no briefing; não invente depoimentos ou números."),
        slot("takeaway", "PARA QUEM", "medium", "balanced", "Mostre para quem faz mais sentido ou quando usar."),
        slot("cta", "PRÓXIMO PASSO", "high", "balanced", "CTA de consideração ou compra sem inventar urgência."),
      ],
    };
  }

  return {
    id: "general-7",
    archetype,
    slots: [
      slot("hook", "IDEIA", "high", "balanced", "Capa com uma ideia central forte."),
      slot("context", "CONTEXTO", "medium", "text", "Contextualize o problema ou oportunidade."),
      slot("body", "PONTO 01", "medium", "text", "Primeiro desenvolvimento."),
      slot("body", "PONTO 02", "medium", "balanced", "Segundo desenvolvimento."),
      slot("proof", "POR QUÊ", "medium", "balanced", "Dê sustentação lógica sem inventar evidências."),
      slot("takeaway", "RESUMO", "high", "text", "Síntese prática."),
      slot("cta", "PRÓXIMO PASSO", "high", "text", "CTA final."),
    ],
  };
}

export function blueprintPrompt(blueprint: ContentBlueprint) {
  if (blueprint.slots.length === 0) {
    return "Este formato não usa slides. Gere somente o roteiro solicitado.";
  }

  return blueprint.slots
    .map(
      (slot, index) =>
        `SLIDE ${index + 1} — ${slot.role.toUpperCase()} — badge do sistema: ${slot.badge || "sem badge"}\n${slot.instruction}`
    )
    .join("\n\n");
}

export function stripChecklistPrefix(headline: string) {
  return headline
    .replace(/^(erro|passo|dica|item|sinal|motivo|ideia)\s*0*\d+\s*[:\-–—]?\s*/i, "")
    .trim();
}
