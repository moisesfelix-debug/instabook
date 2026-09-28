import type { VisualFamily } from "@/lib/visual-families";

export function VisualFamilyPreview({ family }: { family: VisualFamily | "auto" }) {
  if (family === "auto") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 170" role="img" aria-label="A IA escolhe a melhor família visual">
        <rect width="240" height="170" rx="14" fill="#f5f3ff" />
        <rect x="12" y="12" width="102" height="68" rx="10" fill="#11131a" />
        <rect x="126" y="12" width="102" height="68" rx="10" fill="#fff" stroke="#dadce7" />
        <rect x="12" y="92" width="102" height="66" rx="10" fill="#fff8ef" stroke="#e9ddd0" />
        <rect x="126" y="92" width="102" height="66" rx="10" fill="#e8f2ff" />
        <circle cx="42" cy="40" r="13" fill="#7857ff" />
        <rect x="62" y="31" width="38" height="7" rx="3" fill="#fff" />
        <rect x="62" y="44" width="28" height="5" rx="2" fill="#a9afc0" />
        <rect x="140" y="28" width="70" height="9" rx="3" fill="#242634" />
        <rect x="140" y="45" width="52" height="6" rx="2" fill="#8b8f9f" />
        <path d="M25 113h72M25 124h52M25 135h62" stroke="#242634" strokeWidth="5" strokeLinecap="round" />
        <circle cx="174" cy="124" r="22" fill="#5b86ff" opacity=".7" />
        <path d="M145 143h58" stroke="#172033" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  if (family === "pulse") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 170" role="img" aria-label="Preview da família Pulse">
        <rect width="240" height="170" rx="14" fill="#fff7ef" />
        <rect x="16" y="14" width="76" height="18" rx="3" fill="#ff5a3d" />
        <text x="23" y="27" fontSize="9" fontWeight="900" fill="#fff">NOVO PLAYBOOK</text>
        <rect x="126" y="25" width="92" height="74" rx="7" fill="#171922" transform="rotate(-3 126 25)" />
        <circle cx="173" cy="61" r="24" fill="#ff5a3d" />
        <path d="M24 58h82M24 76h94M24 94h72" stroke="#11131a" strokeWidth="11" strokeLinecap="square" />
        <rect x="20" y="119" width="152" height="8" fill="#ff5a3d" />
        <path d="M20 139h119M20 151h84" stroke="#393c49" strokeWidth="5" strokeLinecap="round" />
        <path d="M202 118v34M185 135h34" stroke="#ff5a3d" strokeWidth="6" />
      </svg>
    );
  }

  if (family === "atlas") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 170" role="img" aria-label="Preview da família Atlas">
        <rect width="240" height="170" rx="14" fill="#f8f5ee" />
        <text x="20" y="24" fontSize="7" letterSpacing="2" fill="#8e7964">PERSPECTIVA 01</text>
        <path d="M20 34h200" stroke="#b9aa9a" />
        <rect x="20" y="48" width="84" height="54" rx="2" fill="#c9d0d3" />
        <path d="M29 90l22-23 16 13 15-18 13 28z" fill="#818f94" />
        <text x="119" y="60" fontFamily="Georgia,serif" fontSize="16" fill="#171717">Crescer exige</text>
        <text x="119" y="79" fontFamily="Georgia,serif" fontSize="16" fill="#171717">foco, não ruído.</text>
        <path d="M119 93h86" stroke="#b9aa9a" />
        <path d="M20 122h74M20 133h61M119 122h83M119 133h68" stroke="#64666b" strokeWidth="4" strokeLinecap="round" />
        <text x="20" y="155" fontSize="6" fill="#8e7964">INSTABOOK / INSIGHT</text>
      </svg>
    );
  }

  if (family === "margem") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 170" role="img" aria-label="Preview da família Margem">
        <rect width="240" height="170" rx="14" fill="#fffaf1" />
        <path d="M31 0v170" stroke="#efb6ad" />
        <path d="M0 35h240M0 58h240M0 81h240M0 104h240M0 127h240M0 150h240" stroke="#dce6ea" strokeWidth=".8" />
        <rect x="76" y="18" width="118" height="72" rx="2" fill="#cdd4cf" transform="rotate(3 76 18)" />
        <rect x="102" y="12" width="48" height="10" fill="#edc892" opacity=".75" transform="rotate(-3 102 12)" />
        <text x="45" y="111" fontFamily="Georgia,serif" fontStyle="italic" fontSize="15" fontWeight="700" fill="#191a20">A ideia que ninguém</text>
        <text x="45" y="129" fontFamily="Georgia,serif" fontStyle="italic" fontSize="15" fontWeight="700" fill="#191a20">anota na reunião.</text>
        <path d="M45 142c28 6 61 5 106-1" stroke="#ef5e46" strokeWidth="3" fill="none" />
        <circle cx="202" cy="132" r="12" fill="none" stroke="#ef5e46" strokeWidth="3" />
      </svg>
    );
  }

  if (family === "orbit") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 170" role="img" aria-label="Preview da família Orbit">
        <defs>
          <linearGradient id="orbitGlow" x1="0" x2="1">
            <stop stopColor="#6d67ff" />
            <stop offset="1" stopColor="#51d4ff" />
          </linearGradient>
        </defs>
        <rect width="240" height="170" rx="14" fill="#0c1020" />
        <path d="M0 34h240M0 68h240M0 102h240M0 136h240M48 0v170M96 0v170M144 0v170M192 0v170" stroke="#27304a" strokeWidth=".6" />
        <rect x="18" y="18" width="52" height="16" rx="8" fill="#1c2340" stroke="#5969a6" />
        <text x="29" y="29" fontSize="7" fill="#aeb9ff">SIGNAL 04</text>
        <circle cx="178" cy="55" r="35" fill="url(#orbitGlow)" opacity=".85" />
        <circle cx="178" cy="55" r="20" fill="#0c1020" />
        <path d="M20 78h112M20 98h89" stroke="#f6f8ff" strokeWidth="10" strokeLinecap="round" />
        <path d="M20 124h142M20 138h105" stroke="#8a95b4" strokeWidth="4" strokeLinecap="round" />
        <rect x="181" y="121" width="39" height="28" rx="7" fill="#151d35" stroke="#51d4ff" />
      </svg>
    );
  }

  return (
    <svg className="familyPreviewSvg" viewBox="0 0 240 170" role="img" aria-label="Preview da família Vitrine">
      <defs>
        <linearGradient id="showcaseBg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f1c7a4" />
          <stop offset=".55" stopColor="#9d5b44" />
          <stop offset="1" stopColor="#321c20" />
        </linearGradient>
      </defs>
      <rect width="240" height="170" rx="14" fill="url(#showcaseBg)" />
      <ellipse cx="156" cy="71" rx="54" ry="42" fill="#2b171a" opacity=".35" />
      <circle cx="160" cy="66" r="28" fill="#f0a45d" />
      <circle cx="170" cy="58" r="17" fill="#ffd3a0" opacity=".75" />
      <rect x="16" y="104" width="208" height="50" rx="12" fill="#fff" opacity=".9" />
      <text x="29" y="123" fontSize="7" letterSpacing="1.5" fill="#8f4d39">DESTAQUE</text>
      <text x="29" y="141" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#261719">Um produto que</text>
      <text x="142" y="141" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#261719">merece desejo.</text>
    </svg>
  );
}
