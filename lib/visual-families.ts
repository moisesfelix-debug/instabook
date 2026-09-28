export type VisualFamily = "pulse" | "atlas" | "margem" | "orbit" | "vitrine";

export const visualFamilies: Array<{
  id: VisualFamily;
  label: string;
  description: string;
  bestFor: string;
  internalStyle: "bold_performance" | "clean_consulting" | "human_editorial" | "zine_collage" | "sensory_product";
  prompt: string;
}> = [
  {
    id: "pulse",
    label: "Pulse",
    description: "Alta energia, contraste e mensagens que chegam rápido.",
    bestFor: "Growth, listas, lançamentos, erros, dicas e performance",
    internalStyle: "bold_performance",
    prompt: "high-energy campaign system, bold typographic hierarchy, asymmetric graphic framing, strong contrast, punchy crops, editorial advertising confidence",
  },
  {
    id: "atlas",
    label: "Atlas",
    description: "Sofisticação editorial com clareza e autoridade.",
    bestFor: "B2B, consultoria, dados, estratégia e posicionamento",
    internalStyle: "clean_consulting",
    prompt: "premium editorial and consulting system, disciplined grid, generous whitespace, refined typography, thin rules, restrained image framing, credible and sophisticated",
  },
  {
    id: "margem",
    label: "Margem",
    description: "Autoral, tátil e humano, com sensação de material feito à mão.",
    bestFor: "Storytelling, creator, bastidores, opinião e educação",
    internalStyle: "zine_collage",
    prompt: "authorial tactile editorial system, paper texture, annotation language, imperfect collage details, expressive framing, human and crafted rather than polished-corporate",
  },
  {
    id: "orbit",
    label: "Orbit",
    description: "Digital, modular e contemporâneo sem cair no sci-fi genérico.",
    bestFor: "Tecnologia, inovação, produto digital, IA e tendências",
    internalStyle: "clean_consulting",
    prompt: "contemporary digital design system, modular interface-inspired geometry, dark-light contrast, precise grid, luminous accents, premium technology editorial art direction",
  },
  {
    id: "vitrine",
    label: "Vitrine",
    description: "Imagem protagonista, desejo visual e acabamento de campanha.",
    bestFor: "Produto, gastronomia, moda, ambiente e experiência",
    internalStyle: "sensory_product",
    prompt: "premium sensory campaign system, image-led composition, tactile materials, commercial art direction, product desire, cinematic crop, elegant information overlays",
  },
];

export function isVisualFamily(value: string): value is VisualFamily {
  return visualFamilies.some((family) => family.id === value);
}

export function visualFamilyById(value?: string | null) {
  return visualFamilies.find((family) => family.id === value) || visualFamilies[1];
}

export function suggestedVisualFamily(archetype: string): VisualFamily {
  if (archetype === "checklist" || archetype === "comparison") return "pulse";
  if (archetype === "authority") return "atlas";
  if (archetype === "product") return "vitrine";
  if (archetype === "story") return "margem";
  return "atlas";
}
