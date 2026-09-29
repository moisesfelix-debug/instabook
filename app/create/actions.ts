"use server";

import { generateText } from "ai";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateAndStoreVisuals, type VisualSlideInput } from "@/lib/visual-generation";
import { isVisualFamily, visualFamilyById, type VisualFamily } from "@/lib/visual-families";
import {
  blueprintPrompt,
  buildContentBlueprint,
  chooseArtDirection,
  chooseVisualFamily,
  inferArchetypeFromBriefing,
  stripChecklistPrefix,
  type ArtDirection,
  type ContentArchetype,
  type ContentBlueprint,
} from "@/lib/content-blueprints";

const MODEL = "openai/gpt-5.6-sol";

const archetypeSchema = z.enum(["general", "checklist", "story", "comparison", "product", "authority"]);
const artDirectionSchema = z.enum(["editorial", "split", "minimal"]);

const generatedSlideSchema = z.object({
  headline: z.string().min(2).max(140),
  body: z.string().max(600).nullable().optional(),
  highlight: z.string().max(90).nullable().optional(),
  secondaryHeadline: z.string().max(140).nullable().optional(),
  secondaryBody: z.string().max(400).nullable().optional(),
});

const generatedContentSchema = z.object({
  title: z.string().min(3).max(120),
  hook: z.string().max(220),
  caption: z.string().max(2200),
  cta: z.string().max(300),
  hashtags: z.array(z.string()).max(12),
  reelScript: z.string().max(4000).nullable().optional(),
  slides: z.array(generatedSlideSchema).max(12),
});

type Generated = z.infer<typeof generatedContentSchema>;

function fail(message: string): never {
  redirect("/create?error=" + encodeURIComponent(message));
}

function parseGeneratedContent(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI returned no JSON object");
  }

  return generatedContentSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
}

function plain(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashtagSlug(value: string) {
  return plain(value).replace(/\s+/g, "");
}

function editDistance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return rows[a.length][b.length];
}

function normalizeHashtags(values: string[], brandName: string) {
  const canonicalBrand = hashtagSlug(brandName);
  const unique = new Set<string>();

  for (const raw of values) {
    const tag = hashtagSlug(raw.replace(/^#+/, ""));
    if (!tag || tag.length < 3) continue;

    // Remove near-miss spellings of the brand; the canonical form is appended below.
    if (
      canonicalBrand &&
      tag !== canonicalBrand &&
      Math.abs(tag.length - canonicalBrand.length) <= 2 &&
      editDistance(tag, canonicalBrand) <= 2
    ) {
      continue;
    }

    unique.add(tag);
  }

  if (canonicalBrand) unique.add(canonicalBrand);
  return Array.from(unique).slice(0, 12);
}

function validateGenerated(
  generated: Generated,
  type: string,
  blueprint: ContentBlueprint
) {
  const errors: string[] = [];

  if (type === "reel") {
    if (generated.slides.length !== 0) errors.push("Reel deve retornar slides vazio.");
    if (!generated.reelScript?.trim()) errors.push("Reel precisa de reelScript.");
    return errors;
  }

  if (generated.slides.length !== blueprint.slots.length) {
    errors.push(
      `Esperados ${blueprint.slots.length} slides na ordem do blueprint; recebidos ${generated.slides.length}.`
    );
    return errors;
  }

  const normalizedHeadlines = generated.slides.map((slide) => plain(slide.headline));
  if (new Set(normalizedHeadlines).size !== normalizedHeadlines.length) {
    errors.push("Existem headlines repetidas.");
  }

  blueprint.slots.forEach((slot, index) => {
    const slide = generated.slides[index];
    if (!slide) return;

    if (slot.role === "comparison") {
      if (!slide.secondaryHeadline?.trim() || !slide.secondaryBody?.trim()) {
        errors.push(`Slide ${index + 1} de comparação precisa dos dois lados preenchidos.`);
      }
    }

    if (slot.role === "cta") {
      const headline = plain(slide.headline);
      if (/^(erro|passo|dica|item|sinal|motivo|ideia)\s*\d+/.test(headline)) {
        errors.push("O CTA final está introduzindo mais um item da lista.");
      }
    }
  });

  if (blueprint.promisedItemCount) {
    const count = blueprint.promisedItemCount;
    const titleNumber = generated.title.match(/\b(\d{1,2})\b/);
    if (titleNumber && Number(titleNumber[1]) !== count) {
      errors.push(`O título promete ${titleNumber[1]} itens, mas o blueprint exige ${count}.`);
    }
  }

  return errors;
}

function normalizeGenerated({
  generated,
  blueprint,
  archetype,
  artDirection,
  visualFamily,
  type,
  brandName,
}: {
  generated: Generated;
  blueprint: ContentBlueprint;
  archetype: ContentArchetype;
  artDirection: ArtDirection;
  visualFamily: VisualFamily;
  type: string;
  brandName: string;
}) {
  const family = visualFamilyById(visualFamily);

  return {
    title: generated.title.trim(),
    hook: generated.hook.trim(),
    caption: generated.caption.trim(),
    cta: generated.cta.trim(),
    hashtags: normalizeHashtags(generated.hashtags, brandName),
    reelScript: type === "reel" ? generated.reelScript?.trim() || "" : "",
    contentArchetype: archetype,
    artDirection,
    visualFamily,
    visualStyle: family.internalStyle,
    blueprintId: blueprint.id,
    slides:
      type === "reel"
        ? []
        : blueprint.slots.map((slot, index) => {
            const source = generated.slides[index];
            let headline = source.headline.trim();

            if (archetype === "checklist" && slot.role === "item") {
              headline = stripChecklistPrefix(headline);
            }

            return {
              headline,
              body: source.body?.trim() || null,
              role: slot.role,
              emphasis: slot.emphasis,
              visualPriority: slot.visualPriority,
              badge: slot.badge,
              highlight: source.highlight?.trim() || null,
              secondaryHeadline: source.secondaryHeadline?.trim() || null,
              secondaryBody: source.secondaryBody?.trim() || null,
            };
          }),
  };
}

function responseShape(type: string) {
  if (type === "reel") {
    return `{
  "title": "string",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": ["string"],
  "reelScript": "roteiro completo",
  "slides": []
}`;
  }

  return `{
  "title": "string",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": ["string"],
  "reelScript": "",
  "slides": [
    {
      "headline": "string",
      "body": "string ou null",
      "highlight": "string curto ou null",
      "secondaryHeadline": "string ou null",
      "secondaryBody": "string ou null"
    }
  ]
}`;
}

export async function generateContent(formData: FormData) {
  const brandId = String(formData.get("brandId") || "");
  const briefing = String(formData.get("briefing") || "").trim();
  const type = String(formData.get("type") || "carousel");
  const objective = String(formData.get("objective") || "educar");
  const archetypeInput = String(formData.get("archetype") || "auto");
  const artDirectionInput = String(formData.get("artDirection") || "auto");
  const visualFamilyInput = String(formData.get("visualFamily") || "auto");

  const parsedArchetype = archetypeSchema.safeParse(archetypeInput);
  const parsedArtDirection = artDirectionSchema.safeParse(artDirectionInput);

  const requestedArchetype: ContentArchetype | null =
    archetypeInput === "auto" ? null : parsedArchetype.success ? parsedArchetype.data : null;
  const requestedArtDirection: ArtDirection | null =
    artDirectionInput === "auto" ? null : parsedArtDirection.success ? parsedArtDirection.data : null;
  const requestedVisualFamily: VisualFamily | null =
    visualFamilyInput === "auto" ? null : isVisualFamily(visualFamilyInput) ? visualFamilyInput : null;

  if (!brandId || briefing.length < 8) {
    fail("Escolha uma marca e descreva melhor a ideia do conteúdo.");
  }

  if (!["post", "carousel", "reel"].includes(type)) {
    fail("Formato de conteúdo inválido.");
  }

  const { supabase, workspace, user } = await getWorkspaceContext();

  const [{ data: brand }, { data: guidelines }] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,segment,audience,tone,website,instagram_handle")
      .eq("id", brandId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("brand_guidelines")
      .select("primary_color,secondary_color,default_cta,voice_notes,preferred_words,forbidden_words,content_pillars,value_proposition,visual_direction")
      .eq("brand_id", brandId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  if (!brand) {
    fail("A marca selecionada não pertence a este workspace.");
  }

  // Resolve creative strategy before asking the model to write anything.
  const archetype =
    requestedArchetype || inferArchetypeFromBriefing(briefing);
  const visualFamily =
    requestedVisualFamily ||
    chooseVisualFamily({
      archetype,
      objective,
      briefing,
      segment: brand.segment,
    });
  const artDirection =
    requestedArtDirection || chooseArtDirection(archetype, visualFamily);
  const blueprint = buildContentBlueprint(type, archetype, briefing);

  const formatInstruction =
    type === "reel"
      ? "Este pedido é um Reel. Não gere slides; concentre-se no roteiro."
      : `Este pedido usa um blueprint fechado de ${blueprint.slots.length} slide(s). Gere exatamente essa quantidade, na ordem indicada. Não invente slides extras e não mude a função de nenhum slot.`;

  const prompt = `
Crie conteúdo para Instagram em português do Brasil com padrão profissional de direção criativa.

MARCA
Nome: ${brand.name}
Segmento: ${brand.segment || "não informado"}
Público: ${brand.audience || "não informado"}
Tom de voz: ${brand.tone || "não informado"}
Proposta de valor: ${guidelines?.value_proposition || "não informada"}
Pilares de conteúdo: ${(guidelines?.content_pillars || []).join(", ") || "não informados"}
Direção visual informada pela marca: ${guidelines?.visual_direction || "não informada"}
Palavras preferidas: ${(guidelines?.preferred_words || []).join(", ") || "nenhuma"}
Palavras proibidas: ${(guidelines?.forbidden_words || []).join(", ") || "nenhuma"}
CTA padrão: ${guidelines?.default_cta || "não informado"}
Observações de voz: ${guidelines?.voice_notes || "nenhuma"}

PEDIDO
Formato: ${type}
Objetivo: ${objective}
Briefing: ${briefing}

DECISÕES JÁ TOMADAS PELO DIRETOR CRIATIVO
Arquétipo: ${archetype}
Família visual: ${visualFamily}
Direção estrutural: ${artDirection}
Blueprint: ${blueprint.id}

IMPORTANTE
Você NÃO deve escolher arquétipo, família, direção, papéis de slide, badges, ênfase ou prioridade visual.
Essas decisões já foram tomadas pelo sistema. Sua função é escrever a melhor copy possível para cada slot.

BLUEPRINT OBRIGATÓRIO
${blueprintPrompt(blueprint)}

REGRAS DE COPY
- Cada slide deve acrescentar uma ideia nova.
- Nunca repita a mesma headline em dois slides.
- Se um badge do blueprint já contém "ERRO 01", "PASSO 01" etc., não escreva esse rótulo novamente na headline.
- O último slide CTA deve ser fechamento. Não use o CTA para introduzir outro erro, passo, dica, comparação ou evidência.
- Headlines precisam ser curtas o suficiente para uma arte 4:5.
- Body deve ser curto; detalhes adicionais ficam na legenda.
- highlight é opcional e deve complementar, não repetir literalmente a headline.
- Em slots comparison, secondaryHeadline e secondaryBody são obrigatórios e representam o segundo lado.
- Não invente dados, números, pesquisas, depoimentos ou resultados.
- A legenda complementa o criativo e não repete os slides.
- Hashtags devem ser específicas, sem "#". Escreva o nome da marca corretamente: ${brand.name}.
- ${formatInstruction}
- Para ${type === "reel" ? "Reel" : "post/carrossel"}, o campo reelScript deve ser ${type === "reel" ? "preenchido" : 'uma string vazia ""'}.

RESPONDA SOMENTE COM JSON VÁLIDO, sem markdown, comentários ou texto fora do JSON.
Use exatamente este formato:
${responseShape(type)}
`.trim();

  let parsed: Generated;

  try {
    const first = await generateText({
      model: MODEL,
      prompt,
      maxOutputTokens: 5000,
    });

    parsed = parseGeneratedContent(first.text);
    let validationErrors = validateGenerated(parsed, type, blueprint);

    if (validationErrors.length > 0) {
      const repairPrompt = `
A resposta abaixo não respeitou um blueprint obrigatório.

ERROS DETECTADOS PELO VALIDADOR
- ${validationErrors.join("\n- ")}

BLUEPRINT
${blueprintPrompt(blueprint)}

RESPOSTA ANTERIOR
${JSON.stringify(parsed)}

Reescreva TODO o JSON corrigindo os problemas. Não acrescente explicações.
Use exatamente este formato:
${responseShape(type)}
`.trim();

      const repaired = await generateText({
        model: MODEL,
        prompt: repairPrompt,
        maxOutputTokens: 5000,
      });

      parsed = parseGeneratedContent(repaired.text);
      validationErrors = validateGenerated(parsed, type, blueprint);

      if (validationErrors.length > 0) {
        throw new Error("Blueprint validation failed after repair: " + validationErrors.join(" | "));
      }
    }
  } catch (error) {
    console.error("instabook.ai_generation_failed", error);
    const message = error instanceof Error ? error.message : "";

    if (
      message.includes("valid credit card") ||
      message.includes("customer_verification_required")
    ) {
      fail("O AI Gateway da Vercel está bloqueado até a conta validar um cartão. Depois disso, tente gerar novamente.");
    }

    if (message.includes("Free tier users do not have access")) {
      fail("O modelo configurado não está liberado no plano gratuito do AI Gateway.");
    }

    fail("A IA não conseguiu gerar um conteúdo válido agora. Tente novamente em instantes.");
  }

  const generated = normalizeGenerated({
    generated: parsed,
    blueprint,
    archetype,
    artDirection,
    visualFamily,
    type,
    brandName: brand.name,
  });

  const { data: content, error: contentError } = await supabase
    .from("contents")
    .insert({
      workspace_id: workspace.id,
      brand_id: brand.id,
      type,
      title: generated.title,
      hook: generated.hook || null,
      caption: generated.caption || null,
      cta: generated.cta || null,
      hashtags: generated.hashtags,
      reel_script: generated.reelScript || null,
      briefing,
      objective,
      content_archetype: generated.contentArchetype,
      art_direction: generated.artDirection,
      visual_style: generated.visualStyle,
      visual_family: generated.visualFamily,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (contentError || !content) {
    fail("O conteúdo foi gerado, mas não foi possível salvar o rascunho.");
  }

  let savedSlides: VisualSlideInput[] = [];

  if (generated.slides.length > 0) {
    const { data: insertedSlides, error: slidesError } = await supabase
      .from("content_slides")
      .insert(
        generated.slides.map((slide, index) => ({
          content_id: content.id,
          workspace_id: workspace.id,
          position: index + 1,
          headline: slide.headline,
          body: slide.body,
          slide_role: slide.role,
          emphasis: slide.emphasis,
          visual_priority: slide.visualPriority,
          badge: slide.badge,
          highlight: slide.highlight,
          secondary_headline: slide.secondaryHeadline,
          secondary_body: slide.secondaryBody,
        }))
      )
      .select("id,position,headline,body,slide_role,visual_priority,image_path");

    if (slidesError) {
      await supabase.from("contents").delete().eq("id", content.id);
      fail("Não foi possível salvar os slides gerados.");
    }

    savedSlides = insertedSlides || [];
  }

  await supabase.from("ai_generations").insert({
    workspace_id: workspace.id,
    brand_id: brand.id,
    content_id: content.id,
    user_id: user.id,
    model: MODEL,
    prompt,
    result_json: {
      ...generated,
      blueprint: {
        id: blueprint.id,
        promisedItemCount: blueprint.promisedItemCount || null,
        slots: blueprint.slots,
      },
    },
  });

  let generatedVisuals = 0;

  if ((type === "carousel" || type === "post") && savedSlides.length > 0) {
    try {
      const visualResult = await generateAndStoreVisuals({
        supabase,
        workspaceId: workspace.id,
        content: {
          id: content.id,
          content_archetype: generated.contentArchetype,
          art_direction: generated.artDirection,
          visual_style: generated.visualStyle,
          visual_family: generated.visualFamily,
        },
        brand: {
          name: brand.name,
          segment: brand.segment || null,
        },
        guidelines: guidelines
          ? {
              primary_color: guidelines.primary_color || null,
              secondary_color: guidelines.secondary_color || null,
            }
          : null,
        slides: savedSlides,
        maxVisuals: type === "post" ? 1 : generated.visualFamily === "vitrine" ? 4 : 3,
      });

      generatedVisuals = visualResult.generatedCount;

      if (visualResult.failedCount > 0) {
        console.warn("instabook.auto_visual_generation_partial", {
          contentId: content.id,
          generatedCount: visualResult.generatedCount,
          failedCount: visualResult.failedCount,
        });
      }
    } catch (error) {
      console.error("instabook.auto_visual_generation_failed", error);
    }
  }

  revalidatePath("/");
  revalidatePath("/library");
  redirect(`/content/${content.id}?asset=auto&generated=${generatedVisuals}`);
}
