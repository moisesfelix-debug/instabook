export type ArtDirectionFamily = "pulse" | "atlas" | "margem" | "orbit" | "vitrine";

type Composition = {
  id: string;
  instruction: string;
};

type FamilyPlaybook = {
  name: string;
  identity: string[];
  antiPatterns: string[];
  cover: Composition;
  itemSequence: Composition[];
  cta: Composition;
  roleRules: Record<string, string>;
  imageDiversity: string[];
};

const playbooks: Record<ArtDirectionFamily, FamilyPlaybook> = {
  pulse: {
    name: "Pulse",
    identity: [
      "Prefer a dark or near-black dominant field. Orange is an accent and energy color, not automatically the full-canvas background.",
      "Use heavy condensed or bold grotesk typography with aggressive but controlled scale contrast.",
      "Photography must feel art-directed, appetizing or contextually relevant, with dramatic crops and directional lighting.",
      "Use one graphic accent language consistently: brush strokes, compact rays, outlined marks or one geometric device. Do not stack all of them together.",
      "Keep the hierarchy brutally clear: one primary message, one secondary message, one small supporting layer.",
      "Preserve generous negative space around the main headline even in high-energy layouts.",
    ],
    antiPatterns: [
      "Do not use the exact same left-text/right-photo split on consecutive slides.",
      "Do not make every slide a product hero shot. Visuals must explain the idea, not just repeat the category.",
      "Do not flood the canvas with orange. Avoid full-orange backgrounds in more than one slide of the carousel.",
      "Do not add giant arrows, decorative bursts, stickers or scribbles unless they have a clear compositional purpose.",
      "Do not place the main headline inside a large opaque rectangle by default.",
      "Do not use more than two strong accent colors beyond neutral black/white.",
      "Do not create two competing headline blocks of similar scale.",
    ],
    cover: {
      id: "pulse_cover_campaign",
      instruction:
        "COVER COMPOSITION: use a dark-dominant campaign layout. Reserve roughly 35–48% of the canvas for one strong photographic subject, preferably cropped from an edge. Keep the headline in a distinct negative-space zone and let 1–2 words carry the largest scale. Use orange as accent on selected words or compact graphic marks, not as a blanket. The cover must feel premium and stop-scroll, not like a generic performance ad.",
    },
    itemSequence: [
      {
        id: "pulse_editorial_split",
        instruction:
          "COMPOSITION A — EDITORIAL SPLIT: text owns about 55–62% of the canvas and the image occupies the opposite 38–45%. Use a clearly different crop from the cover. Prefer a HUMAN/CONTEXTUAL or SYMBOLIC subject rather than repeating the cover hero product. Badge is compact. Headline is 2–4 lines maximum. Supporting copy sits in a quieter zone with no large colored box.",
      },
      {
        id: "pulse_image_led",
        instruction:
          "COMPOSITION B — IMAGE LED: let the photograph dominate 55–70% of the canvas. Use a CONCEPT-SPECIFIC DETAIL, PROCESS or ENVIRONMENT image rather than the same subject category used on the previous slide. Place the headline over a controlled dark quiet zone or in a narrow adjacent column. Use one small orange annotation or brush accent. The image should carry the concept before the reader finishes the headline.",
      },
      {
        id: "pulse_type_monument",
        instruction:
          "COMPOSITION C — TYPE MONUMENT: make typography the hero. This slide should be primarily TYPOGRAPHIC, with only a smaller contextual photograph, icon-like object or evidence detail cropped into a corner, strip or card. Keep the canvas mostly dark and avoid a standard two-column split. Do not use another large food/product hero here.",
      },
      {
        id: "pulse_full_bleed_story",
        instruction:
          "COMPOSITION D — FULL-BLEED STORY: use an edge-to-edge HUMAN, ENVIRONMENT or REAL-SCENE photograph with a deliberate dark gradient or naturally quiet area for text. The headline should anchor to one corner or edge, not float in the middle. Use orange only for one phrase or marker. Avoid repeating the cover hero product as the dominant subject.",
      },
      {
        id: "pulse_modular_card",
        instruction:
          "COMPOSITION E — MODULAR CAMPAIGN: create two or three purposeful zones with unequal proportions, for example a large text field plus a smaller PROCESS/OBJECT/HUMAN visual evidence card and one micro-detail. Do not resemble the cover. Avoid symmetrical grids and avoid another full-size product hero.",
      },
    ],
    cta: {
      id: "pulse_closing",
      instruction:
        "CTA COMPOSITION: simplify. Use one strong closing headline, one clear action line and one focused ACTION/OUTCOME visual. Reduce decorative noise by at least 30% versus the item slides. The final slide should feel like a conclusion, not 'another error', not another product beauty shot, and not a copy of the cover.",
    },
    roleRules: {
      item: "Show the consequence or mental model of this item. The badge identifies the item; never repeat its number inside the headline.",
      proof: "Use a more evidence-led composition with stronger restraint and more whitespace than an item slide.",
      takeaway: "Create a visual pause: fewer elements, larger whitespace and a distilled statement.",
      comparison: "Use a genuine visual contrast, not two identical cards with different labels.",
      context: "Establish the scene with more image and less typographic aggression than the cover.",
      result: "Make the outcome visually obvious before reading all supporting copy.",
      transition: "Use a change in scale or image crop to create rhythm without abandoning the family.",
      body: "Prioritize one clear idea and avoid decorative overload.",
    },
    imageDiversity: [
      "Across a 7-slide carousel, use at least four distinct photographic situations or subject types.",
      "The same hero object or close-up food shot should appear on no more than two slides unless the content explicitly requires it.",
      "Vary between product/detail, human/context, environment, symbolic object, process and negative-space photography when semantically appropriate.",
      "Do not use a burger or food close-up merely because the brand is a restaurant; the image must support the specific slide idea.",
    ],
  },
  atlas: {
    name: "Atlas",
    identity: [
      "Use restrained editorial layouts, disciplined grids, generous whitespace and premium typography.",
      "Prefer warm neutral or off-white fields with dark ink-like text and restrained brand accents.",
      "Photography should feel documentary, architectural or editorial rather than advertising-heavy.",
      "Use thin rules, precise alignment and controlled asymmetry.",
    ],
    antiPatterns: [
      "Do not turn every slide into the same centered magazine cover.",
      "Do not use oversized badges, loud stickers or decorative arrows.",
      "Do not fill every available space; whitespace is part of the system.",
      "Do not use more than one decorative device per slide.",
    ],
    cover: {
      id: "atlas_cover_editorial",
      instruction:
        "COVER COMPOSITION: create a sophisticated editorial cover with one strong thesis, generous negative space and one restrained image frame or crop. Use serif/grotesk contrast if appropriate and keep branding discreet.",
    },
    itemSequence: [
      { id: "atlas_image_column", instruction: "COMPOSITION A: narrow image column plus wide editorial text field with thin rules and generous whitespace." },
      { id: "atlas_statement", instruction: "COMPOSITION B: typography-led statement with one small documentary image or data-like detail; no large hero photo." },
      { id: "atlas_grid", instruction: "COMPOSITION C: asymmetric two-zone editorial grid with headline, body and a compact image card." },
      { id: "atlas_full_photo", instruction: "COMPOSITION D: quiet full-bleed editorial photograph with a restrained caption-like text block anchored to one edge." },
    ],
    cta: {
      id: "atlas_closing",
      instruction:
        "CTA COMPOSITION: reduce the layout to one elegant statement, one action and a subtle brand signature. Use the most whitespace of the carousel.",
    },
    roleRules: {
      item: "Treat each item like a concise editorial point, not a marketing card.",
      proof: "Prioritize credibility and hierarchy; avoid invented charts or fake data.",
      takeaway: "Use a strong thesis statement with generous whitespace.",
      comparison: "Use a refined split or matrix with visibly distinct sides.",
      context: "Let image and text establish context calmly.",
      result: "Emphasize the outcome with a single strong fact or statement.",
      transition: "Use a typographic interlude or restrained image break.",
      body: "Keep the grid disciplined and the hierarchy calm.",
    },
    imageDiversity: [
      "Alternate documentary image, detail crop, environment and typography-led slides.",
      "Do not repeat the same image framing on consecutive slides.",
      "At least one middle slide should be primarily typographic to create rhythm.",
    ],
  },
  margem: {
    name: "Margem",
    identity: [
      "Use tactile editorial energy: paper, annotations, taped crops, imperfect edges and human-scale typography.",
      "Layouts should feel assembled by a thoughtful designer, not randomly collaged.",
      "Use warm off-white or paper-like surfaces with one expressive accent.",
    ],
    antiPatterns: [
      "Do not overload every slide with tape, doodles and torn paper.",
      "Do not repeat the same notebook-page composition.",
      "Do not let decorative texture reduce readability.",
      "Do not fake handwriting for long body text.",
    ],
    cover: {
      id: "margem_cover",
      instruction:
        "COVER COMPOSITION: one strong tactile image or photo crop, one expressive headline and one annotation gesture. Keep at least 25% of the canvas visually quiet.",
    },
    itemSequence: [
      { id: "margem_photo_note", instruction: "COMPOSITION A: photo pinned/taped asymmetrically with a strong note-like headline beside it." },
      { id: "margem_margin_type", instruction: "COMPOSITION B: typography-led page with a margin annotation and only a small supporting image." },
      { id: "margem_collage", instruction: "COMPOSITION C: controlled two-layer collage with one dominant image and one secondary detail, never more than three visual fragments." },
      { id: "margem_full_photo", instruction: "COMPOSITION D: full photo with a paper caption or underlined note treatment anchored to a corner." },
    ],
    cta: {
      id: "margem_closing",
      instruction:
        "CTA COMPOSITION: feel like the final note in a notebook—simple, personal, one action, one visual gesture.",
    },
    roleRules: {
      item: "Make the item feel annotated or discovered, not templated.",
      proof: "Use documentary evidence cues such as a crop, underline or margin note without fabricating data.",
      takeaway: "Use an underlined or circled key thought with more breathing room.",
      comparison: "Use two clearly different paper/photo zones rather than symmetric cards.",
      context: "Establish a human scene or artifact.",
      result: "Show an outcome with a before/after feeling without literal split if unnecessary.",
      transition: "Use a visual note, quote or image break.",
      body: "Keep tactile details secondary to the message.",
    },
    imageDiversity: [
      "Mix human moments, objects, documents, environment and detail crops.",
      "Do not use the same tape/rotation angle twice in a row.",
      "At least one slide should be primarily typographic.",
    ],
  },
  orbit: {
    name: "Orbit",
    identity: [
      "Use premium digital geometry, dark/light contrast, modular information zones and precise alignment.",
      "Technology should feel contemporary and editorial, not neon sci-fi.",
      "Use luminous accents sparingly and keep the grid purposeful.",
    ],
    antiPatterns: [
      "Do not use hologram clichés, cyberpunk neon overload or fake dashboards everywhere.",
      "Do not repeat the same glowing-circle motif on every slide.",
      "Do not make every slide a UI mockup.",
      "Do not sacrifice readability for futuristic decoration.",
    ],
    cover: {
      id: "orbit_cover",
      instruction:
        "COVER COMPOSITION: one strong modular digital field, one focal image or abstract form and a sharp headline. Use controlled luminous accents and large dark negative space.",
    },
    itemSequence: [
      { id: "orbit_module", instruction: "COMPOSITION A: asymmetric modular grid with one large text zone and one image/data zone." },
      { id: "orbit_signal", instruction: "COMPOSITION B: large typographic signal or number with a small contextual visual and thin technical markers." },
      { id: "orbit_full_visual", instruction: "COMPOSITION C: image-led or abstract full-bleed field with compact anchored typography." },
      { id: "orbit_stack", instruction: "COMPOSITION D: vertical stack of two unequal modules, one visual and one message, with precise spacing." },
    ],
    cta: {
      id: "orbit_closing",
      instruction:
        "CTA COMPOSITION: simplify to one decisive action with a clear luminous focal element and minimal supporting information.",
    },
    roleRules: {
      item: "Treat each item as a distinct signal/module, not the same card repeated.",
      proof: "Use structured evidence cues without inventing metrics.",
      takeaway: "Create a clean synthesis module with extra negative space.",
      comparison: "Use a true A/B system with visibly different information zones.",
      context: "Set the scene with a larger visual field and fewer modules.",
      result: "Make the result the dominant signal.",
      transition: "Use a dramatic scale change between modules.",
      body: "Favor clarity over sci-fi decoration.",
    },
    imageDiversity: [
      "Alternate people/product, environment, abstract geometry and typography-led slides.",
      "Do not use the same circular glow treatment more than twice.",
      "At least one slide should have no hero photograph.",
    ],
  },
  vitrine: {
    name: "Vitrine",
    identity: [
      "Photography is the hero: tactile, desirable, cinematic and commercially polished.",
      "Typography supports the image and should feel like premium campaign art direction.",
      "Use overlays, cropping and negative space rather than large generic text boxes.",
    ],
    antiPatterns: [
      "Do not make every slide the same centered product beauty shot.",
      "Do not bury the product under text.",
      "Do not use stock-looking compositions or generic ecommerce cards.",
      "Do not repeat the exact same camera angle on consecutive slides.",
    ],
    cover: {
      id: "vitrine_cover",
      instruction:
        "COVER COMPOSITION: one irresistible hero visual, strong crop, premium lighting and a concise headline placed in intentional negative space. Keep graphic decoration minimal.",
    },
    itemSequence: [
      { id: "vitrine_macro", instruction: "COMPOSITION A: macro/detail photography with concise typography anchored to a quiet edge." },
      { id: "vitrine_context", instruction: "COMPOSITION B: contextual lifestyle or environment scene with headline integrated into negative space." },
      { id: "vitrine_object", instruction: "COMPOSITION C: sculptural product/object composition with strong shadow and restrained text." },
      { id: "vitrine_full_bleed", instruction: "COMPOSITION D: immersive full-bleed image with small premium campaign typography." },
    ],
    cta: {
      id: "vitrine_closing",
      instruction:
        "CTA COMPOSITION: one desirable final visual, one concise action and minimal supporting copy. End like a campaign key visual, not a catalogue.",
    },
    roleRules: {
      item: "Change the camera logic and scene while preserving the campaign treatment.",
      proof: "Use real visual evidence from the concept, not invented reviews or labels.",
      takeaway: "Let one premium visual and one concise message carry the slide.",
      comparison: "Use two clearly different visual situations, not duplicated product cards.",
      context: "Show the product or experience in its real context.",
      result: "Show the desired outcome or emotional payoff.",
      transition: "Use a cinematic detail or environment break.",
      body: "Keep copy compact and let the image lead.",
    },
    imageDiversity: [
      "Vary macro, hero, lifestyle, environment and process/detail photography.",
      "Do not repeat the same camera angle more than once.",
      "At least two slides should show context or human interaction rather than isolated product.",
    ],
  },
};

export function normalizeArtDirectionFamily(value?: string | null): ArtDirectionFamily {
  return value === "pulse" || value === "atlas" || value === "margem" || value === "orbit" || value === "vitrine"
    ? value
    : "atlas";
}

export function getArtDirectionPlan({
  family,
  role,
  position,
  totalSlides,
}: {
  family?: string | null;
  role?: string | null;
  position: number;
  totalSlides: number;
}) {
  const familyId = normalizeArtDirectionFamily(family);
  const playbook = playbooks[familyId];
  const normalizedRole = role || "body";

  let composition = playbook.itemSequence[Math.max(0, position - 2) % playbook.itemSequence.length];

  if (position === 1 || normalizedRole === "hook" || normalizedRole === "second_hook") {
    composition = playbook.cover;
  } else if (normalizedRole === "cta" || position === totalSlides) {
    composition = playbook.cta;
  }

  return {
    familyId,
    familyName: playbook.name,
    compositionId: composition.id,
    compositionInstruction: composition.instruction,
    identityRules: playbook.identity,
    antiPatterns: playbook.antiPatterns,
    roleRule: playbook.roleRules[normalizedRole] || playbook.roleRules.body,
    imageDiversityRules: playbook.imageDiversity,
  };
}

export function artDirectionPromptBlock(plan: ReturnType<typeof getArtDirectionPlan>) {
  return [
    `ART DIRECTION PLAYBOOK — ${plan.familyName}`,
    `Assigned composition ID: ${plan.compositionId}.`,
    plan.compositionInstruction,
    `ROLE-SPECIFIC RULE: ${plan.roleRule}`,
    "IDENTITY RULES:",
    ...plan.identityRules.map((rule) => `- ${rule}`),
    "ANTI-PATTERNS — MUST NOT DO:",
    ...plan.antiPatterns.map((rule) => `- ${rule}`),
    "IMAGE DIVERSITY RULES:",
    ...plan.imageDiversityRules.map((rule) => `- ${rule}`),
    "Before rendering, silently verify: (1) this composition differs from the previous slide's likely structure, (2) the hierarchy has one obvious focal message, (3) the image supports this specific slide idea, (4) text remains readable on mobile, and (5) no prohibited pattern above is present.",
  ].join("\n");
}
