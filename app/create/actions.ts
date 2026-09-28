"use server";

import { generateText } from "ai";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateAndStoreVisuals, type VisualSlideInput } from "@/lib/visual-generation";

const MODEL = "openai/gpt-5.4-mini";

const archetypeSchema = z.enum(["general", "checklist", "story", "comparison", "product", "authority"]);
const artDirectionSchema = z.enum(["editorial", "split", "minimal"]);
const visualStyleSchema = z.enum(["bold_performance", "clean_consulting", "human_editorial", "zine_collage", "sensory_product"]);
const slideRoleSchema = z.enum(["hook", "second_hook", "context", "item", "comparison", "proof", "transition", "result", "takeaway", "cta", "body"]);
const emphasisSchema = z.enum(["high", "medium", "low"]);
const visualPrioritySchema = z.enum(["text", "image", "balanced"]);

const generatedContentSchema = z.object({
  title: z.string().min(3).max(120),
  hook: z.string().max(220),
  caption: z.string().max(2200),
  cta: z.string().max(300),
  hashtags: z.array(z.string()).max(12),
  reelScript: z.string().max(4000),
  contentArchetype: archetypeSchema.optional(),
  artDirection: artDirectionSchema.optional(),
  visualStyle: visualStyleSchema.optional(),
  slides: z.array(
    z.object({
      headline: z.string().max(140),
      body: z.string().max(600).nullable().optional(),
      role: slideRoleSchema.optional(),
      emphasis: emphasisSchema.optional(),
      visualPriority: visualPrioritySchema.optional(),
      badge: z.string().max(50).nullable().optional(),
      highlight: z.string().max(90).nullable().optional(),
      secondaryHeadline: z.string().max(140).nullable().optional(),
      secondaryBody: z.string().max(400).nullable().optional(),
    })
  ).max(10),
});

type Archetype = z.infer<typeof archetypeSchema>;
type ArtDirection = z.infer<typeof artDirectionSchema>;
type VisualStyle = z.infer<typeof visualStyleSchema>;
type SlideRole = z.infer<typeof slideRoleSchema>;
type Emphasis = z.infer<typeof emphasisSchema>;
type VisualPriority = z.infer<typeof visualPrioritySchema>;
type Generated = z.infer<typeof generatedContentSchema>;

function fail(message: string): never {
  redirect("/create?error=" + encodeURIComponent(message));
}

function parseGeneratedContent(text: string) {
  const cleaned = text
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/i, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI returned no JSON object");
  }

  return generatedContentSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
}

function inferArchetype(briefing: string, title: string): Archetype {
  const source = (briefing + " " + title).toLowerCase();

  if (/\b(antes|depois|versus|vs\.?|compar|mito|verdade|errado|certo)\b/.test(source)) return "comparison";
  if (/\b(case|história|historia|jornada|como .* conseguiu|bastidor)\b/.test(source)) return "story";
  if (/\b(produto|prato|restaurante|ambiente|lançamento|lancamento|showcase|cardápio|cardapio)\b/.test(source)) return "product";
  if (/\b(dado|dados|estatística|estatistica|pesquisa|estudo|número|numero|insight|tendência|tendencia)\b/.test(source)) return "authority";
  if (/\b(\d+\s+(erros|passos|dicas|formas|maneiras|motivos|ideias|sinais)|checklist|lista|erros|passos|dicas)\b/.test(source)) return "checklist";

  return "general";
}

function suggestedDirection(archetype: Archetype): ArtDirection {
  if (archetype === "comparison" || archetype === "product") return "split";
  if (archetype === "authority") return "minimal";
  return "editorial";
}

function suggestedStyle(archetype: Archetype): VisualStyle {
  if (archetype === "checklist" || archetype === "comparison") return "bold_performance";
  if (archetype === "authority") return "clean_consulting";
  if (archetype === "product") return "sensory_product";
  if (archetype === "story") return "human_editorial";
  return "human_editorial";
}

function fallbackRole(archetype: Archetype, position: number, total: number): SlideRole {
  if (position === 1) return "hook";
  if (position === total) return "cta";

  if (archetype === "checklist") {
    if (position === 2) return "second_hook";
    return "item";
  }

  if (archetype === "story") {
    if (position === 2) return "context";
    if (position === 4) return "transition";
    if (position === 5) return "result";
    if (position === 6) return "takeaway";
    return "body";
  }

  if (archetype === "comparison") {
    if (position === 2) return "second_hook";
    return "comparison";
  }

  if (archetype === "product") {
    if (position === 2) return "context";
    if (position === total - 1) return "proof";
    return "item";
  }

  if (archetype === "authority") {
    if (position === 2) return "context";
    if (position <= total - 2) return "proof";
    return "takeaway";
  }

  return position === 2 ? "context" : "body";
}

function fallbackEmphasis(role: SlideRole): Emphasis {
  if (["hook", "second_hook", "proof", "result", "cta"].includes(role)) return "high";
  if (["context", "takeaway", "transition"].includes(role)) return "medium";
  return "medium";
}

function fallbackVisualPriority(archetype: Archetype, role: SlideRole): VisualPriority {
  if (archetype === "product") return role === "cta" ? "balanced" : "image";
  if (role === "hook") return "balanced";
  if (["proof", "comparison", "result"].includes(role)) return "balanced";
  return "text";
}

function normalizeGenerated(
  generated: Generated,
  briefing: string,
  requested: {
    archetype: Archetype | null;
    artDirection: ArtDirection | null;
    visualStyle: VisualStyle | null;
  }
) {
  const archetype =
    requested.archetype || generated.contentArchetype || inferArchetype(briefing, generated.title);
  const artDirection =
    requested.artDirection || generated.artDirection || suggestedDirection(archetype);
  const visualStyle =
    requested.visualStyle || generated.visualStyle || suggestedStyle(archetype);
  const total = generated.slides.length;

  return {
    ...generated,
    contentArchetype: archetype,
    artDirection,
    visualStyle,
    slides: generated.slides.map((slide, index) => {
      const position = index + 1;
      const role: SlideRole =
        position === 1
          ? "hook"
          : position === total && total > 1
            ? "cta"
            : slide.role || fallbackRole(archetype, position, total);

      return {
        ...slide,
        role,
        emphasis: slide.emphasis || fallbackEmphasis(role),
        visualPriority: slide.visualPriority || fallbackVisualPriority(archetype, role),
        badge: slide.badge || null,
        highlight: slide.highlight || null,
        secondaryHeadline: slide.secondaryHeadline || null,
        secondaryBody: slide.secondaryBody || null,
      };
    }),
  };
}

export async function generateContent(formData: FormData) {
  const brandId = String(formData.get("brandId") || "");
  const briefing = String(formData.get("briefing") || "").trim();
  const type = String(formData.get("type") || "carousel");
  const objective = String(formData.get("objective") || "educar");
  const archetypeInput = String(formData.get("archetype") || "auto");
  const artDirectionInput = String(formData.get("artDirection") || "auto");
  const visualStyleInput = String(formData.get("visualStyle") || "auto");

  const parsedArchetype = archetypeSchema.safeParse(archetypeInput);
  const parsedArtDirection = artDirectionSchema.safeParse(artDirectionInput);
  const parsedVisualStyle = visualStyleSchema.safeParse(visualStyleInput);

  const requestedArchetype =
    archetypeInput === "auto" ? null : parsedArchetype.success ? parsedArchetype.data : null;
  const requestedArtDirection =
    artDirectionInput === "auto" ? null : parsedArtDirection.success ? parsedArtDirection.data : null;
  const requestedVisualStyle =
    visualStyleInput === "auto" ? null : parsedVisualStyle.success ? parsedVisualStyle.data : null;

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

  const formatInstruction =
    type === "carousel"
      ? "Crie exatamente 7 slides. Os 7 slides precisam formar uma narrativa visual: não repita a mesma função em todos."
      : type === "post"
        ? "Crie exatamente 1 slide com função hook e uma ideia visual/textual forte."
        : "Não crie slides. O campo slides deve ser um array vazio. Entregue um roteiro de Reel claro, gravável e dividido em abertura, desenvolvimento e CTA.";

  const prompt = `
Crie conteúdo para Instagram em português do Brasil com padrão de direção criativa profissional.

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

DECISÕES DO USUÁRIO
Arquétipo solicitado: ${requestedArchetype || "IA escolhe"}
Direção estrutural solicitada: ${requestedArtDirection || "IA escolhe"}
Estilo visual solicitado: ${requestedVisualStyle || "IA escolhe"}

Se o usuário escolheu um valor específico acima, RESPEITE-O. Só escolha livremente quando estiver "IA escolhe".

ESCOLHA UM ARQUÉTIPO
- checklist: listas, erros, passos, dicas, frameworks e sequências práticas.
- story: case, jornada, problema → tensão → virada → solução → resultado.
- comparison: antes/depois, errado/certo, mito/verdade, A versus B.
- product: produto, serviço, ambiente, showcase ou conteúdo em que a fotografia deve protagonizar.
- authority: dados, pesquisas, tendências, análise e conteúdo de autoridade.
- general: quando nenhum dos anteriores se encaixar bem.

DIREÇÃO DE ARTE
Escolha uma entre editorial, split ou minimal.
- editorial: impacto, headline forte e narrativa.
- split: contraste, comparação, imagem + texto.
- minimal: informação premium, dados, respiro e sofisticação.

ESTILO VISUAL
Escolha um Style Pack:
- bold_performance: alto contraste, marketing/growth, headlines fortes, números e energia.
- clean_consulting: consultoria/B2B premium, grid organizado, respiro, credibilidade e sobriedade.
- human_editorial: fotografia humana, linguagem de revista, sofisticação e narrativa.
- zine_collage: recortes, textura, camadas, personalidade e estética autoral.
- sensory_product: imagem protagonista, produto/comida/ambiente, textura e desejo visual.

O Style Pack deve influenciar a linguagem do texto, a densidade dos slides e quais slides precisam de imagem.

PAPÉIS DOS SLIDES
Use apenas: hook, second_hook, context, item, comparison, proof, transition, result, takeaway, cta, body.
O slide 1 deve ser hook. Em carrossel, o último deve ser cta.
O slide 2 deve ser forte o suficiente para funcionar como uma segunda entrada no conteúdo.

CAMPOS VISUAIS
- badge: rótulo curto, ex.: "ERRO 01", "ANTES", "DADO", "PASSO 2".
- highlight: palavra, número ou pequena frase que merece protagonismo visual. Não invente números.
- secondaryHeadline/secondaryBody: use principalmente em slides comparison para criar os dois lados da comparação.
- emphasis: high, medium ou low.
- visualPriority: text, image ou balanced.

REGRAS
- Não invente dados, números, depoimentos, pesquisas ou resultados específicos que não estejam no briefing.
- Se o conteúdo pedir autoridade mas não fornecer números confiáveis, use ideias e conceitos, não estatísticas inventadas.
- Evite clichês e linguagem genérica de IA.
- Cada slide deve acrescentar algo novo.
- Headlines devem ser curtas o suficiente para uma arte de Instagram.
- Evite parágrafos longos nos slides; detalhes adicionais podem ir para a legenda.
- A legenda deve complementar o criativo, não apenas repetir os slides.
- Hashtags devem ser específicas e sem "#".
- ${formatInstruction}

RESPONDA SOMENTE COM JSON VÁLIDO, sem markdown, sem comentários e sem texto fora do JSON.
Use exatamente estas chaves:
{
  "title": "string",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": ["string"],
  "reelScript": "string",
  "contentArchetype": "checklist|story|comparison|product|authority|general",
  "artDirection": "editorial|split|minimal",
  "visualStyle": "bold_performance|clean_consulting|human_editorial|zine_collage|sensory_product",
  "slides": [
    {
      "headline": "string",
      "body": "string",
      "role": "hook|second_hook|context|item|comparison|proof|transition|result|takeaway|cta|body",
      "emphasis": "high|medium|low",
      "visualPriority": "text|image|balanced",
      "badge": "string ou null",
      "highlight": "string ou null",
      "secondaryHeadline": "string ou null",
      "secondaryBody": "string ou null"
    }
  ]
}
`.trim();

  let generated: ReturnType<typeof normalizeGenerated>;

  try {
    const result = await generateText({
      model: MODEL,
      prompt,
      maxOutputTokens: 5000,
    });

    const parsed = parseGeneratedContent(result.text);
    generated = normalizeGenerated(parsed, briefing, {
      archetype: requestedArchetype,
      artDirection: requestedArtDirection,
      visualStyle: requestedVisualStyle,
    });

    if (type === "carousel" && generated.slides.length !== 7) {
      throw new Error(`Expected 7 slides, received ${generated.slides.length}`);
    }
    if (type === "post" && generated.slides.length !== 1) {
      throw new Error(`Expected 1 slide, received ${generated.slides.length}`);
    }
    if (type === "reel" && generated.slides.length !== 0) {
      throw new Error(`Expected no slides, received ${generated.slides.length}`);
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

    fail("A IA não conseguiu gerar o conteúdo agora. Tente novamente em instantes.");
  }

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
          body: slide.body || null,
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
    result_json: generated,
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
        maxVisuals: type === "post" ? 1 : 3,
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
