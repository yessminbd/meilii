import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Ruler, Search, Info, ArrowRight } from "lucide-react";
import { useLang } from "../context/LangContext";

/* Colonnes : [EU, US, UK, CM (longueur du pied)] — la colonne CN (mm) est calculée */
const SIZE_DATA = {
  men: [
    ["36", "4.5", "3.5", "22.5"],
    ["36.5", "5", "4", "23"],
    ["37", "5.5", "4.5", "23.5"],
    ["37.5", "6", "5", "23.5"],
    ["38", "6.5", "5.5", "24"],
    ["38.5", "6.5", "5.5", "24"],
    ["39", "6.5", "6", "24.5"],
    ["40", "7", "6", "25"],
    ["40.5", "7.5", "6.5", "25.5"],
    ["41", "8", "7", "26"],
    ["42", "8.5", "7.5", "26.5"],
    ["42.5", "9", "8", "27"],
    ["43", "9.5", "8.5", "27.5"],
    ["44", "10", "9", "28"],
    ["44.5", "10.5", "9.5", "28.5"],
    ["45", "11", "10", "29"],
    ["45.5", "11.5", "10.5", "29.5"],
    ["46", "12", "11", "30"],
    ["47.5", "13", "12", "31"],
  ],
  women: [
    ["35", "4.5", "2", "21.5"],
    ["35.5", "5", "2.5", "22"],
    ["36", "5.5", "3", "22.5"],
    ["36.5", "6", "3.5", "23"],
    ["37", "6.5", "4", "23.5"],
    ["37.5", "6.5", "4", "23.5"],
    ["38", "7", "4.5", "24"],
    ["38.5", "7.5", "5", "24.5"],
    ["39", "8", "5.5", "25"],
    ["40", "8.5", "6", "25.5"],
    ["40.5", "9", "6.5", "26"],
    ["41", "9.5", "7", "26.5"],
    ["42", "10", "7.5", "27"],
    ["42.5", "10.5", "8", "27.5"],
    ["43", "11", "8.5", "28"],
  ],
  kids: [
    ["27", "10C", "9.5", "16"],
    ["28", "11C", "10.5", "17"],
    ["29.5", "12C", "11.5", "18"],
    ["31", "13C", "12.5", "19"],
    ["32", "1Y", "13.5", "20"],
    ["33.5", "2Y", "1.5", "21"],
    ["35", "3Y", "2.5", "22"],
    ["36", "4Y", "3.5", "23"],
    ["37", "4.5Y", "4", "23.5"],
    ["37.5", "5Y", "4.5", "24"],
    ["38.5", "6Y", "5.5", "25"],
    ["40", "7Y", "6", "26"],
  ],
};

/* ───────── Vêtements : tailles chinoises (CN) ─────────
   Les colonnes (cols) sont des clés de traduction. Valeurs approximatives
   (norme chinoise GB/T 1335) : les tailles chinoises taillent plus petit qu'en EU/US. */
const CLOTHING = {
  men: {
    cols: ["sgColCN", "sgColCode", "sgColChest", "sgColWaist", "sgColIntl"],
    rows: [
      ["S", "165/84A", "84", "70", "XS"],
      ["M", "170/88A", "88", "74", "S"],
      ["L", "175/92A", "92", "78", "M"],
      ["XL", "180/96A", "96", "82", "L"],
      ["2XL", "185/100A", "100", "86", "XL"],
      ["3XL", "190/104A", "104", "90", "2XL"],
      ["4XL", "195/108A", "108", "94", "3XL"],
    ],
  },
  women: {
    cols: ["sgColCN", "sgColCode", "sgColBust", "sgColWaist", "sgColHips", "sgColIntl"],
    rows: [
      ["S", "155/80A", "80", "64", "86", "34 / XS"],
      ["M", "160/84A", "84", "68", "90", "36 / S"],
      ["L", "165/88A", "88", "72", "94", "38 / M"],
      ["XL", "170/92A", "92", "76", "98", "40 / L"],
      ["2XL", "175/96A", "96", "80", "102", "42 / XL"],
      ["3XL", "180/100A", "100", "84", "106", "44 / 2XL"],
    ],
  },
  kids: {
    cols: ["sgColCN", "sgColHeight", "sgColAge", "sgColChest"],
    rows: [
      ["90", "90", "1–2", "52"],
      ["100", "100", "2–3", "54"],
      ["110", "110", "4–5", "57"],
      ["120", "120", "6–7", "60"],
      ["130", "130", "8–9", "64"],
      ["140", "140", "10–11", "68"],
      ["150", "150", "12–13", "72"],
      ["160", "160", "14–15", "76"],
    ],
  },
};

/* id = index dans la ligne. CN = longueur du pied en millimètres (ex. 25 cm → 250) */
const SYSTEMS = [
  { id: 0, key: "EU" },
  { id: 1, key: "US" },
  { id: 2, key: "UK" },
  { id: 3, key: "CM" },
  { id: 4, key: "CN" },
];

export default function SizeGuide() {
  const { t } = useLang();
  const [type, setType] = useState("shoes"); // "shoes" | "clothing"
  const [category, setCategory] = useState("men");
  const [system, setSystem] = useState(0); // 0 = EU
  const [picked, setPicked] = useState(null); // ligne cliquée
  const [foot, setFoot] = useState("");

  // Ajoute la colonne CN (mm) à chaque ligne
  const rows = useMemo(
    () =>
      SIZE_DATA[category].map((r) => [
        ...r,
        String(Math.round(parseFloat(r[3]) * 10)),
      ]),
    [category]
  );

  // Le système choisi passe en première colonne
  const columns = useMemo(
    () => [system, ...SYSTEMS.map((s) => s.id).filter((id) => id !== system)],
    [system]
  );

  // Recherche de taille selon la longueur du pied
  const finder = useMemo(() => {
    const v = parseFloat(String(foot).replace(",", "."));
    if (!v || v <= 0) return null;
    const idx = rows.findIndex((r) => parseFloat(r[3]) >= v);
    if (idx === -1) return { idx: rows.length - 1, status: "above" };
    if (v < parseFloat(rows[0][3])) return { idx: 0, status: "below" };
    return { idx, status: "ok" };
  }, [foot, rows]);

  const activeIdx = finder ? finder.idx : picked;

  const changeCategory = (c) => {
    setCategory(c);
    setPicked(null);
    setFoot("");
  };

  const isShoes = type === "shoes";
  const clothing = CLOTHING[category];

  const changeType = (tp) => {
    setType(tp);
    setPicked(null);
    setFoot("");
  };

  const steps = isShoes
    ? [t.sgStep1, t.sgStep2, t.sgStep3, t.sgStep4]
    : [t.sgClothStep1, t.sgClothStep2, t.sgClothStep3, t.sgClothStep4];
  const tips = isShoes
    ? [t.sgTip1, t.sgTip2, t.sgTip3]
    : [t.sgClothTip1, t.sgClothTip2, t.sgTip3];

  return (
    <div className="bg-primaryLight min-h-screen">
      <style>{`
        @keyframes sg-rise { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform:none; } }
        @keyframes sg-row { from { opacity:0; transform: translateX(-10px); } to { opacity:1; transform:none; } }
        [dir="rtl"] .sg-row { animation-name: sg-row-rtl !important; }
        @keyframes sg-row-rtl { from { opacity:0; transform: translateX(10px); } to { opacity:1; transform:none; } }
        @keyframes sg-ruler { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
        @media (prefers-reduced-motion: reduce) { .sg-row, .sg-anim, .sg-ruler { animation: none !important; } }
      `}</style>

      {/* ───────── En-tête ───────── */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div
          className="sg-ruler inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg mb-5"
          style={{ animation: "sg-ruler 3s ease-in-out infinite" }}
        >
          <Ruler className="w-8 h-8" />
        </div>
        <h1 className="sg-anim text-3xl sm:text-5xl font-black text-primary tracking-tight" style={{ animation: "sg-rise .6s ease-out both" }}>
          {t.sizeGuide}
        </h1>
        <p className="sg-anim mt-3 text-sm sm:text-base text-gray-50 max-w-xl mx-auto" style={{ animation: "sg-rise .6s ease-out .1s both" }}>
          {isShoes ? t.sgSubtitle : t.sgClothSubtitle}
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20 grid lg:grid-cols-3 gap-8">
        {/* ───────── Colonne principale : tableau ───────── */}
        <div className="lg:col-span-2">
          {/* Type : chaussures / vêtements */}
          <div className="inline-flex p-1 mb-4 rounded-full bg-white border border-gray-10 shadow-sm">
            {[
              ["shoes", t.sgTabShoes],
              ["clothing", t.sgTabClothing],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => changeType(id)}
                aria-pressed={type === id}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  type === id ? "bg-tertiary text-white shadow" : "text-gray-50 hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Catégories */}
          <div className="flex gap-2 mb-4">
            {[
              ["men", t.men],
              ["women", t.women],
              ["kids", t.kids],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => changeCategory(id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  category === id
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white text-gray-50 border-gray-20 hover:border-tertiary hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sélecteur de système (chaussures) */}
          {isShoes && (
          <div className="bg-white rounded-2xl border border-gray-10 p-4 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-primary">{t.sgSystemLabel}</span>
            <div className="flex gap-1.5 flex-wrap">
              {SYSTEMS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSystem(s.id)}
                  aria-pressed={system === s.id}
                  className={`min-w-14 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    system === s.id
                      ? "bg-tertiary text-white shadow"
                      : "bg-gray-10 text-primary hover:bg-gray-20"
                  }`}
                >
                  {s.key}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Tableau vêtements (CN) */}
          {!isShoes && (
          <div className="bg-white rounded-2xl border border-gray-10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    {clothing.cols.map((key, i) => (
                      <th key={key} className={`px-4 py-3 font-bold ${i === 0 ? "bg-tertiary" : ""}`}>
                        {t[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody key={"c" + category}>
                  {clothing.rows.map((row, idx) => {
                    const active = picked === idx;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setPicked(picked === idx ? null : idx)}
                        className={`sg-row cursor-pointer border-t border-gray-10 transition-colors duration-200 ${
                          active ? "bg-tertiary/10" : "hover:bg-primaryLight"
                        }`}
                        style={{ animation: `sg-row .35s ease-out ${idx * 0.03}s both` }}
                      >
                        {row.map((cell, i) => (
                          <td
                            key={i}
                            className={`px-4 py-2.5 ${
                              i === 0 ? "font-black text-primary bg-tertiary/5" : "text-gray-50 font-medium"
                            } ${active && i === 0 ? "text-tertiary" : ""}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Tableau chaussures */}
          {isShoes && (
          <div className="bg-white rounded-2xl border border-gray-10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    {columns.map((c, i) => (
                      <th key={c} className={`px-4 py-3 font-bold ${i === 0 ? "bg-tertiary" : ""}`}>
                        {SYSTEMS[c].key}
                        {c === 3 && <span className="block text-[10px] font-medium opacity-80">{t.sgFootLength}</span>}
                        {c === 4 && <span className="block text-[10px] font-medium opacity-80">{t.sgFootLengthMm}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody key={category + system}>
                  {rows.map((row, idx) => {
                    const active = activeIdx === idx;
                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          setFoot("");
                          setPicked(picked === idx ? null : idx);
                        }}
                        className={`sg-row cursor-pointer border-t border-gray-10 transition-colors duration-200 ${
                          active ? "bg-tertiary/10" : "hover:bg-primaryLight"
                        }`}
                        style={{ animation: `sg-row .35s ease-out ${idx * 0.03}s both` }}
                      >
                        {columns.map((c, i) => (
                          <td
                            key={c}
                            className={`px-4 py-2.5 ${
                              i === 0 ? "font-black text-primary bg-tertiary/5" : "text-gray-50 font-medium"
                            } ${active && i === 0 ? "text-tertiary" : ""}`}
                          >
                            {row[c]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-30">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {isShoes ? t.sgTableHint : t.sgClothTableHint}
          </p>
        </div>

        {/* ───────── Colonne latérale ───────── */}
        <aside className="flex flex-col gap-6">
          {/* Trouver ma taille (chaussures) */}
          {isShoes && (
          <div className="bg-primary text-white rounded-2xl p-6 shadow-lg">
            <h2 className="flex items-center gap-2 font-black text-lg mb-1">
              <Search className="w-5 h-5 text-tertiary" />
              {t.sgFinderTitle}
            </h2>
            <p className="text-xs text-gray-20 mb-4">{t.sgFinderDesc}</p>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min="10"
                max="35"
                step="0.1"
                value={foot}
                onChange={(e) => {
                  setFoot(e.target.value);
                  setPicked(null);
                }}
                placeholder={t.sgFinderPlaceholder}
                className="w-full rounded-xl bg-white border border-white/20 px-4 py-3 pe-12 text-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
              <span className="absolute inset-y-0 end-4 flex items-center text-xs font-bold text-gray-20">cm</span>
            </div>

            {finder && (
              <div className="mt-4 rounded-xl  p-4" style={{ animation: "sg-rise .35s ease-out both" }}>
                <p className="text-xs text-gray-20 mb-2">{t.sgYourSize}</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  {[0, 1, 2, 4].map((c) => (
                    <div key={c} className="rounded-lg bg-white/10 py-2">
                      <p className="text-[10px] font-bold text-gray-20">{SYSTEMS[c].key}</p>
                      <p className="text-lg font-black text-tertiary">{rows[finder.idx][c]}</p>
                    </div>
                  ))}
                </div>
                {finder.status !== "ok" && (
                  <p className="mt-3 text-xs text-gray-20">
                    {finder.status === "below" ? t.sgBelowRange : t.sgAboveRange}
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {/* Comment mesurer */}
          <div className="bg-white rounded-2xl border border-gray-10 p-6">
            <h2 className="font-black text-primary text-lg mb-4">{isShoes ? t.sgHowTitle : t.sgClothHowTitle}</h2>
            <ol className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-50 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Conseils */}
          <div className="bg-white rounded-2xl border border-dashed border-gray-20 p-6">
            <ul className="flex flex-col gap-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-50 leading-relaxed">
                  <Info className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 pt-4 border-t border-gray-10 text-[11px] text-gray-30">{isShoes ? t.sgNote : t.sgClothNote}</p>
          </div>

          <Link
            to="/collection"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-tertiary px-6 py-3 text-sm font-bold text-white hover:bg-primary transition-colors"
          >
            {t.viewCollection}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        </aside>
      </div>
    </div>
  );
}