import { useLang } from "../context/LangContext";

/* Marques mondiales les plus populaires (celles qu'on retrouve sur Alibaba, AliExpress, Shein…).
   Noms en texte, couleurs approximatives. */

// Ligne 1 : vêtements & chaussures
const fashionBrands = [
  { name: "NIKE", color: "#111111", italic: true },
  { name: "ADIDAS", color: "#111111" },
  { name: "ZARA", color: "#111111" },
  { name: "H&M", color: "#E50010" },
  { name: "UNIQLO", color: "#E60012" },
  { name: "PUMA", color: "#111111" },
  { name: "LEVI'S", color: "#C41230" },
  { name: "LACOSTE", color: "#006A4E" },
  { name: "TOMMY HILFIGER", color: "#0B2A5B" },
  { name: "CALVIN KLEIN", color: "#111111" },
  { name: "THE NORTH FACE", color: "#D7000F" },
  { name: "CHAMPION", color: "#0B3D91" },
  { name: "FILA", color: "#002D62" },
  { name: "UNDER ARMOUR", color: "#111111" },
  { name: "MANGO", color: "#111111" },
  { name: "NEW BALANCE", color: "#E4002B" },
];

// Ligne 2 : cosmétiques & soins
const beautyBrands = [
  { name: "MAYBELLINE", color: "#E6007E" },
  { name: "L'ORÉAL", color: "#111111" },
  { name: "MAC", color: "#111111" },
  { name: "NYX", color: "#111111" },
  { name: "REVLON", color: "#C8102E" },
  { name: "NIVEA", color: "#003A8F" },
  { name: "GARNIER", color: "#2E8B3D" },
  { name: "THE ORDINARY", color: "#111111" },
  { name: "CERAVE", color: "#0072BC" },
  { name: "ESSENCE", color: "#E6007E" },
  { name: "HUDA BEAUTY", color: "#111111" },
  { name: "FENTY BEAUTY", color: "#111111" },
];

// Triplé pour une boucle continue
const fashionTrack = [...fashionBrands, ...fashionBrands, ...fashionBrands];
const beautyTrack = [...beautyBrands, ...beautyBrands, ...beautyBrands];

export default function Partners() {
  const { t } = useLang();

  return (
    <section className="py-16 bg-primaryLight overflow-hidden">
      {/* Header */}
      <div className="max-padd-container mb-10 text-center">
        <p className="text-tertiary text-xs font-bold uppercase tracking-[4px] mb-2">
          {t.trustedPartners}
        </p>
        <h2 className="text-primary text-3xl font-black tracking-tight">
          {t.bestBrands}
        </h2>
        <p className="text-gray-50 text-sm mt-2 max-w-sm mx-auto">
          {t.bestBrandsSub}
        </p>
      </div>

      {/* Ligne 1 — vêtements & chaussures (défile vers la gauche) */}
      <div className="relative w-full mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-primaryLight to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-primaryLight to-transparent" />
        <div className="flex marquee-track">
          {fashionTrack.map((brand, i) => (
            <BrandCard key={`r1-${i}`} brand={brand} />
          ))}
        </div>
      </div>

      {/* Ligne 2 — cosmétiques (défile vers la droite) */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-primaryLight to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-primaryLight to-transparent" />
        <div className="flex marquee-track-reverse">
          {beautyTrack.map((brand, i) => (
            <BrandCard key={`r2-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandCard({ brand }) {
  // Taille du texte adaptée à la longueur du nom
  const fontSize = Math.min(28, 104 / (brand.name.length * 0.68));

  return (
    <div
      className="
        flex-shrink-0 mx-4
        flex flex-col items-center justify-center
        w-36 h-20
        rounded-2xl
        border border-gray-20/20 shadow-sm
        bg-white
        hover:border-tertiary/50 hover:scale-105 hover:shadow-md
        transition-all duration-300 cursor-pointer
      "
      style={{ color: brand.color }}
    >
      <svg viewBox="0 0 120 50" fill="currentColor" className="h-10 w-28">
        <text
          x="60"
          y="32"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="900"
          fontStyle={brand.italic ? "italic" : "normal"}
          fontFamily="sans-serif"
          letterSpacing="1"
        >
          {brand.name}
        </text>
      </svg>
    </div>
  );
}