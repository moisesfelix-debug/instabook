"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/workspace-context";

const MODEL = "openai/gpt-5.4-mini";

const generatedContentSchema = z.object({
  title: z.string().min(3).max(120),
  hook: z.string().max(220),
  caption: z.string().max(2200),
  cta: z.string().max(300),
  hashtags: z.array(z.string()).max(12),
  reelScript: z.string().max(4000),
  slides: z.array(
    z.object({
      headline: z.string().max(140),
      body: z.string().max(600),
    })
  ).max(10),
});

function fail(message: string): never {
  redirect("/create?error=" + encodeURIComponent(message));
}

export async function generateContent(formData: FormData) {
  const brandId = String(formData.get("brandId") || "");
  const briefing = String(formData.get("briefing") || "").trim();
  const type = String(formData.get("type") || "carousel");
  const objective = String(formData.get("objective") || "educar");

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
      ? "Crie exatamente 7 slides. O slide 1 é a capa/hook e o slide 7 fecha com CTA."
      : type === "post"
        ? "Crie exatamente 1 slide com uma headline curta e uma ideia visual/textual de apoio."
        : "Não crie slides. Entregue um roteiro de Reel claro, gravável e dividido em abertura, desenvolvimento e CTA.";

  const prompt = `
Crie conteúdo para Instagram em português do Brasil.

MARCA
Nome: ${brand.name}
Segmento: ${brand.segment || "não informado"}
Público: ${brand.audience || "não informado"}
Tom de voz: ${brand.tone || "não informado"}
Proposta de valor: ${guidelines?.value_proposition || "não informada"}
Pilares de conteúdo: ${(guidelines?.content_pillars || []).join(", ") || "não informados"}
Palavras preferidas: ${(guidelines?.preferred_words || []).join(", ") || "nenhuma"}
Palavras proibidas: ${(guidelines?.forbidden_words || []).join(", ") || "nenhuma"}
CTA padrão: ${guidelines?.default_cta || "não informado"}
Observações de voz: ${guidelines?.voice_notes || "nenhuma"}

PEDIDO
Formato: ${type}
Objetivo: ${objective}
Briefing: ${briefing}

REGRAS
- Não invente dados, números, depoimentos ou resultados específicos que não estejam no briefing.
- Evite clichês e linguagem genérica de IA.
- Priorize clareza, utilidade e uma abertura forte.
- A legenda deve complementar o criativo, não apenas repetir os slides.
- Hashtags devem ser específicas e sem "#"; o sistema adicionará o símbolo depois.
- ${formatInstruction}
`.trim();

  let generated: z.infer<typeof generatedContentSchema>;

  try {
    const result = await generateObject({
      model: MODEL,
      schema: generatedContentSchema,
      prompt,
    });
    generated = result.object;
  } catch (error) {
    console.error("instabook.ai_generation_failed", error);
    fail("A IA não conseguiu gerar o conteúdo agora. Se for a primeira tentativa, pode ser necessário habilitar o AI Gateway na Vercel.");
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
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (contentError || !content) {
    fail("O conteúdo foi gerado, mas não foi possível salvar o rascunho.");
  }

  if (generated.slides.length > 0) {
    const { error: slidesError } = await supabase.from("content_slides").insert(
      generated.slides.map((slide, index) => ({
        content_id: content.id,
        workspace_id: workspace.id,
        position: index + 1,
        headline: slide.headline,
        body: slide.body,
      }))
    );

    if (slidesError) {
      await supabase.from("contents").delete().eq("id", content.id);
      fail("Não foi possível salvar os slides gerados.");
    }
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

  revalidatePath("/");
  revalidatePath("/library");
  redirect(`/content/${content.id}`);
}
