import { useEffect, useRef, useState } from "react";
import { Plane, Wallet, Truck, CheckCircle2 } from "lucide-react";
import { useLang } from "../context/LangContext";

/* Apparition au scroll (une seule fois) */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* Carte : inclinaison 3D + halo lumineux qui suit la souris */
function TiltCard({ children, className = "", style }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = (0.5 - y / r.height) * 8;
    const ry = (x / r.width - 0.5) * 8;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

export default function Features() {
  const { t } = useLang();
  const [sectionRef, inView] = useInView(0.15);

  /* 3 étapes : import de Chine → avance → appel à l'arrivage + envoi */
  const features = [
    {
      icon: Plane,
      iconAnim: "feat-drive",
      title: t.importTitle,
      subtitle: t.importSub,
      badge: t.importBadge,
      dotColor: "bg-blue-500",
      description: t.importDesc,
      points: [t.importP1, t.importP2, t.importP3],
      footerNote: t.importNote,
    },
    {
      icon: Wallet,
      iconAnim: "feat-shield",
      title: t.advanceTitle,
      subtitle: t.advanceSub,
      badge: t.advanceBadge,
      dotColor: "bg-tertiary",
      description: t.advanceDesc,
      points: [t.advanceP1, t.advanceP2, t.advanceP3],
      footerNote: t.advanceNote,
    },
    {
      icon: Truck,
      iconAnim: "feat-drive",
      title: t.arrivalTitle,
      subtitle: t.arrivalSub,
      badge: t.arrivalBadge,
      dotColor: "bg-emerald-500",
      description: t.arrivalDesc,
      points: [t.arrivalP1, t.arrivalP2, t.arrivalP3],
      footerNote: t.arrivalNote,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-primaryLight border-y border-gray-10 relative overflow-hidden"
    >
      <style>{`
        @keyframes feat-rise { from { opacity:0; transform: translateY(40px) scale(.96); } to { opacity:1; transform:none; } }
        @keyframes feat-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.12); } }
        @keyframes feat-drive { 0%,100% { transform: translateX(-2px); } 50% { transform: translateX(3px); } }
        @keyframes feat-road { to { background-position: -24px 0; } }
        @keyframes feat-shield { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes feat-spin { 0%,70%,100% { transform: rotate(0); } 85% { transform: rotate(180deg) scale(1.1); } }
        @keyframes feat-shine { from { transform: translateX(-150%) skewX(-20deg); } to { transform: translateX(250%) skewX(-20deg); } }
        @keyframes feat-ring { 0% { transform: scale(.8); opacity:.6; } 100% { transform: scale(1.7); opacity:0; } }
        @keyframes feat-pop { from { opacity:0; transform: translateX(-12px); } to { opacity:1; transform:none; } }

        .feat-card { transition: transform .25s ease-out, box-shadow .3s, border-color .3s; transform-style: preserve-3d; will-change: transform; }
        .feat-card::before {
          content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none; opacity:0; transition: opacity .3s;
          background: radial-gradient(320px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.0), rgba(0,0,0,.0)),
                      radial-gradient(260px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, currentColor 10%, transparent), transparent 70%);
        }
        .feat-card:hover::before { opacity:1; }
        .feat-card:hover .feat-icon-anim { animation-play-state: running; }
        .feat-icon-anim { animation-duration: 1.6s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .feat-drive { animation-name: feat-drive; animation-duration: .9s; }
        .feat-shield { animation-name: feat-shield; animation-duration: 2.4s; }
        .feat-spin { animation-name: feat-spin; animation-duration: 3.2s; }
        .feat-shine::after {
          content:""; position:absolute; inset:0; width:40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
          transform: translateX(-150%) skewX(-20deg);
        }
        .feat-card:hover .feat-shine::after { animation: feat-shine .9s ease-out; }
        .feat-bar { transform: scaleX(0); transform-origin: left; transition: transform .7s cubic-bezier(.2,.8,.2,1); }
        .feat-card:hover .feat-bar { transform: scaleX(1); }
        .feat-point { opacity:0; }
        .feat-card.is-in .feat-point { animation: feat-pop .5s ease-out forwards; }
        .feat-road { background-image: repeating-linear-gradient(90deg, currentColor 0 10px, transparent 10px 24px); animation: feat-road .6s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .feat-card, .feat-icon-anim, .feat-road, .feat-blob, .feat-ring { animation: none !important; transition: none !important; }
          .feat-point { opacity:1 !important; animation: none !important; }
        }
      `}</style>

      {/* Fond : bulles lumineuses flottantes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="feat-blob absolute -top-24 -left-20 w-80 h-80 rounded-full bg-tertiary/15 blur-3xl"
          style={{ animation: "feat-float 12s ease-in-out infinite" }}
        />
        <div
          className="feat-blob absolute -bottom-28 -right-16 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl"
          style={{ animation: "feat-float 15s ease-in-out infinite reverse" }}
        />
        <div
          className="feat-blob absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl"
          style={{ animation: "feat-float 18s ease-in-out infinite" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* En-tête */}
        <div
          className="text-center max-w-2xl mx-auto mb-14"
          style={inView ? { animation: "feat-rise .7s ease-out both" } : { opacity: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-10 shadow-xs text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            <span className="relative flex w-2 h-2">
              <span className="feat-ring absolute inset-0 rounded-full bg-tertiary" style={{ animation: "feat-ring 1.6s ease-out infinite" }} />
              <span className="relative w-2 h-2 rounded-full bg-tertiary" />
            </span>
            {t.guaranteeBadge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary tracking-tight">
            {t.whyChooseUs}
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-50">{t.whyChooseUsSub}</p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ perspective: "1200px" }}>
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <TiltCard
                key={item.title}
                className={`feat-card text-tertiary group relative overflow-hidden flex flex-col justify-between p-8 rounded-3xl bg-white border border-gray-10 hover:border-gray-20 shadow-sm hover:shadow-2xl ${inView ? "is-in" : ""}`}
                style={
                  inView
                    ? { animation: `feat-rise .8s cubic-bezier(.2,.8,.2,1) ${0.15 + i * 0.18}s both` }
                    : { opacity: 0 }
                }
              >
                <div className="relative">
                  {/* Icône + badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="feat-shine relative overflow-hidden w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center transition-colors duration-300 group-hover:bg-tertiary shadow-md">
                      <Icon className={`feat-icon-anim ${item.iconAnim} w-6 h-6`} />
                    </div>

                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-10/70 text-primary border border-gray-10">
                      <span className="relative flex w-2 h-2">
                        <span
                          className={`feat-ring absolute inset-0 rounded-full ${item.dotColor}`}
                          style={{ animation: "feat-ring 1.4s ease-out infinite" }}
                        />
                        <span className={`relative w-2 h-2 rounded-full ${item.dotColor}`} />
                      </span>
                      {item.badge}
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="text-2xl font-black text-primary tracking-tight">{item.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">{item.subtitle}</p>
                  <p className="text-sm text-gray-50 leading-relaxed mb-6">{item.description}</p>

                  {/* Route animée (étape livraison uniquement) */}
                  {i === 2 && (
                    <div aria-hidden className="feat-road h-0.5 w-full mb-5 opacity-40 rounded" />
                  )}

                  {/* Points forts, apparition en cascade */}
                  <ul className="space-y-2.5 pt-4 border-t border-gray-10">
                    {item.points.map((point, k) => (
                      <li
                        key={point}
                        className="feat-point flex items-center gap-2.5 text-xs text-secondary font-medium"
                        style={{ animationDelay: `${0.6 + i * 0.18 + k * 0.12}s` }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0 transition-transform duration-300 group-hover:scale-125" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pied de carte */}
                <div className="relative mt-8 pt-4 border-t border-dashed border-gray-10 flex items-center justify-between text-[11px] font-semibold text-gray-30">
                  <span>{item.footerNote}</span>
                  <span className="text-tertiary font-bold inline-flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                    {`0${i + 1}`}
                  </span>
                  {/* Barre qui se remplit au survol */}
                  <span className="feat-bar absolute -bottom-8 left-0 right-0 h-1 bg-tertiary rounded-full" />
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}