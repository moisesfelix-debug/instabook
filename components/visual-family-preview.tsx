import type { VisualFamily } from "@/lib/visual-families";

const sampleHeadline = "5 erros que travam suas vendas";

export function VisualFamilyPreview({ family }: { family: VisualFamily | "auto" }) {
  if (family === "auto") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 300" role="img" aria-label="A IA escolhe a melhor família visual">
        <rect width="240" height="300" rx="16" fill="#f6f4ff" />
        <text x="18" y="26" fontSize="8" fontWeight="900" letterSpacing="1.4" fill="#6548e7">DIRETOR CRIATIVO</text>
        <text x="18" y="49" fontSize="17" fontWeight="900" fill="#171923">A IA escolhe o</text>
        <text x="18" y="69" fontSize="17" fontWeight="900" fill="#171923">melhor sistema visual.</text>
        <rect x="18" y="91" width="94" height="88" rx="10" fill="#fff7ef" stroke="#ded7cf" />
        <rect x="128" y="91" width="94" height="88" rx="10" fill="#f6f2e9" stroke="#ded7cf" />
        <rect x="18" y="195" width="94" height="87" rx="10" fill="#0d1324" />
        <rect x="128" y="195" width="94" height="87" rx="10" fill="#24181a" />
        <path d="M29 116h54M29 131h63M29 146h44" stroke="#15171e" strokeWidth="7" />
        <rect x="83" y="108" width="20" height="30" fill="#ff5a3d" />
        <path d="M140 116h67M140 128h52" stroke="#35322f" strokeWidth="4" />
        <rect x="140" y="143" width="49" height="22" fill="#cbd2d3" />
        <circle cx="81" cy="238" r="23" fill="#5967ff" />
        <path d="M32 257h58" stroke="#f5f7ff" strokeWidth="7" />
        <circle cx="176" cy="231" r="27" fill="#d89161" />
        <rect x="143" y="254" width="66" height="14" rx="7" fill="#fff" opacity=".9" />
      </svg>
    );
  }

  if (family === "pulse") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 300" role="img" aria-label="Preview da família Pulse">
        <rect width="240" height="300" rx="16" fill="#fff6ed" />
        <rect x="0" y="0" width="8" height="300" fill="#ff553d" />
        <rect x="20" y="20" width="77" height="18" rx="3" fill="#ff553d" />
        <text x="29" y="32" fontSize="7" fontWeight="900" fill="#fff">GUIA PRÁTICO</text>
        <rect x="132" y="30" width="86" height="102" rx="5" fill="#171922" transform="rotate(-3 132 30)" />
        <circle cx="173" cy="80" r="28" fill="#ff553d" />
        <circle cx="181" cy="70" r="10" fill="#ffb08f" />
        <text x="22" y="75" fontSize="27" fontWeight="950" fill="#14161d">5 ERROS</text>
        <text x="22" y="105" fontSize="27" fontWeight="950" fill="#14161d">QUE TRAVAM</text>
        <text x="22" y="135" fontSize="27" fontWeight="950" fill="#14161d">SUAS VENDAS</text>
        <rect x="22" y="158" width="130" height="8" fill="#ff553d" />
        <text x="22" y="188" fontSize="9" fontWeight="700" fill="#464954">O que corrigir antes de investir</text>
        <text x="22" y="201" fontSize="9" fontWeight="700" fill="#464954">mais em mídia e conteúdo.</text>
        <rect x="22" y="230" width="42" height="42" rx="8" fill="#ff553d" />
        <text x="34" y="257" fontSize="19" fontWeight="900" fill="#fff">01</text>
        <path d="M83 244h119M83 260h91" stroke="#171922" strokeWidth="7" />
        <path d="M204 276v-26M191 263h26" stroke="#ff553d" strokeWidth="5" />
      </svg>
    );
  }

  if (family === "atlas") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 300" role="img" aria-label="Preview da família Atlas">
        <rect width="240" height="300" rx="16" fill="#f7f3ea" />
        <text x="20" y="25" fontSize="6.5" letterSpacing="2" fill="#8c7865">PERSPECTIVA / 01</text>
        <path d="M20 38h200" stroke="#b7aa9d" />
        <rect x="20" y="56" width="200" height="92" rx="2" fill="#cfd5d4" />
        <path d="M20 125l39-34 26 18 34-41 31 57z" fill="#879397" />
        <circle cx="177" cy="93" r="23" fill="#a77f64" opacity=".65" />
        <text x="20" y="181" fontFamily="Georgia,serif" fontSize="21" fontWeight="700" fill="#20201f">Crescer exige foco,</text>
        <text x="20" y="205" fontFamily="Georgia,serif" fontSize="21" fontWeight="700" fill="#20201f">não mais ruído.</text>
        <path d="M20 220h200" stroke="#b7aa9d" />
        <text x="20" y="244" fontSize="8" fill="#5f6064">5 erros que parecem detalhe, mas</text>
        <text x="20" y="257" fontSize="8" fill="#5f6064">diminuem a clareza da sua oferta.</text>
        <text x="20" y="283" fontSize="6" letterSpacing="1.3" fill="#8c7865">INSTABOOK / ESTRATÉGIA</text>
      </svg>
    );
  }

  if (family === "margem") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 300" role="img" aria-label="Preview da família Margem">
        <rect width="240" height="300" rx="16" fill="#fffaf0" />
        <path d="M35 0v300" stroke="#e7a79e" />
        <path d="M0 48h240M0 76h240M0 104h240M0 132h240M0 160h240M0 188h240M0 216h240M0 244h240M0 272h240" stroke="#dce7ea" strokeWidth=".8" />
        <rect x="88" y="27" width="117" height="102" fill="#cfd4cf" transform="rotate(3 88 27)" />
        <rect x="119" y="19" width="54" height="11" fill="#e8c78f" opacity=".82" transform="rotate(-4 119 19)" />
        <circle cx="153" cy="73" r="26" fill="#889b8d" />
        <path d="M109 112l29-28 21 17 22-33 17 44z" fill="#5f6d63" />
        <text x="48" y="161" fontFamily="Georgia,serif" fontStyle="italic" fontSize="19" fontWeight="700" fill="#1d1f24">5 erros que você</text>
        <text x="48" y="183" fontFamily="Georgia,serif" fontStyle="italic" fontSize="19" fontWeight="700" fill="#1d1f24">não percebe no feed</text>
        <path d="M48 194c37 7 79 5 128-2" stroke="#e95f4b" strokeWidth="3" fill="none" />
        <text x="48" y="222" fontSize="8" fill="#565860">anote isso antes do próximo post →</text>
        <circle cx="189" cy="249" r="21" fill="none" stroke="#e95f4b" strokeWidth="3" />
        <text x="182" y="254" fontSize="14" fontWeight="900" fill="#e95f4b">!</text>
        <text x="48" y="279" fontSize="6.5" fontWeight="700" fill="#62636a">@saborboost</text>
      </svg>
    );
  }

  if (family === "orbit") {
    return (
      <svg className="familyPreviewSvg" viewBox="0 0 240 300" role="img" aria-label="Preview da família Orbit">
        <defs>
          <linearGradient id="orbitGlowLarge" x1="0" x2="1">
            <stop stopColor="#6d67ff" />
            <stop offset="1" stopColor="#50d5ff" />
          </linearGradient>
        </defs>
        <rect width="240" height="300" rx="16" fill="#0d1324" />
        <path d="M0 40h240M0 80h240M0 120h240M0 160h240M0 200h240M0 240h240M0 280h240M40 0v300M80 0v300M120 0v300M160 0v300M200 0v300" stroke="#27314b" strokeWidth=".55" />
        <rect x="18" y="18" width="60" height="18" rx="9" fill="#161f3a" stroke="#586aa8" />
        <text x="30" y="30" fontSize="7" fill="#b8c1ff">SIGNAL 05</text>
        <circle cx="177" cy="79" r="42" fill="url(#orbitGlowLarge)" opacity=".88" />
        <circle cx="177" cy="79" r="25" fill="#0d1324" />
        <text x="18" y="153" fontSize="25" fontWeight="900" fill="#f7f9ff">5 ERROS QUE</text>
        <text x="18" y="181" fontSize="25" fontWeight="900" fill="#f7f9ff">QUEBRAM SUA</text>
        <text x="18" y="209" fontSize="25" fontWeight="900" fill="#88ddff">CONVERSÃO</text>
        <text x="18" y="236" fontSize="8" fill="#aeb7cf">sinais que parecem pequenos no feed</text>
        <text x="18" y="249" fontSize="8" fill="#aeb7cf">mas viram perda de atenção.</text>
        <rect x="18" y="269" width="76" height="16" rx="8" fill="#151d35" stroke="#6177ff" />
        <text x="31" y="280" fontSize="6.5" fill="#b8c1ff">DIAGNÓSTICO</text>
      </svg>
    );
  }

  return (
    <svg className="familyPreviewSvg" viewBox="0 0 240 300" role="img" aria-label="Preview da família Vitrine">
      <defs>
        <linearGradient id="showcaseBgLarge" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e8b383" />
          <stop offset=".48" stopColor="#934f3c" />
          <stop offset="1" stopColor="#2c171c" />
        </linearGradient>
      </defs>
      <rect width="240" height="300" rx="16" fill="url(#showcaseBgLarge)" />
      <ellipse cx="140" cy="104" rx="76" ry="63" fill="#241518" opacity=".4" />
      <circle cx="145" cy="97" r="48" fill="#e7a060" />
      <circle cx="157" cy="82" r="23" fill="#ffd3a4" opacity=".72" />
      <circle cx="118" cy="116" r="14" fill="#7a382f" />
      <rect x="18" y="183" width="204" height="96" rx="14" fill="#fff" opacity=".92" />
      <text x="31" y="204" fontSize="6.5" letterSpacing="1.5" fill="#95533d">DESTAQUE / EXPERIÊNCIA</text>
      <text x="31" y="229" fontFamily="Georgia,serif" fontSize="18" fontWeight="700" fill="#2b1a1d">O visual também</text>
      <text x="31" y="250" fontFamily="Georgia,serif" fontSize="18" fontWeight="700" fill="#2b1a1d">vende antes do clique.</text>
      <text x="31" y="268" fontSize="7" fill="#6e5a5c">produto, contexto e desejo em uma peça.</text>
    </svg>
  );
}
