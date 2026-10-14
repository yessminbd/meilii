import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, UserPlus, Sparkles, ShoppingBag } from "lucide-react";
import { useLang } from "../context/LangContext";
import { ShopContext } from "../context/ShopContext";

export default function BannerCta() {
  const { t, lang } = useLang();
  const { token } = useContext(ShopContext);

  const isFr = lang === "fr";

  return (
    <section className="bg-gradient-to-b from-white via-primaryLight/30 to-primaryLight/60 py-8 sm:py-12 border-b border-gray-100">
      <div className="max-padd-container">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm p-6 sm:p-10">
          {/* Subtle decorative background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#e63946]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            {/* Text content */}
            <div className="max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e63946]/10 text-[#e63946] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFr ? "Meilleurs Prix en Tunisie" : "Best Prices in Tunisia"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary tracking-tight">
                {isFr ? "Découvrez Notre Collection Exclusive" : "Explore Our Exclusive Collection"}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 max-w-xl">
                {isFr
                  ? "Import direct de Chine sur commande. Rejoignez notre communauté pour profiter des nouveautés et des meilleures offres."
                  : "Direct import from China on order. Join our community to access latest drops and exclusive deals."}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto shrink-0">
              {/* Découvrir la collection */}
              <Link
                to="/collection"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#e63946] text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-[#d62839] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-102 active:scale-95 text-sm sm:text-base"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isFr ? "Découvrir la Collection" : "Discover Collection"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Join us / Inscription (ou Profil si connecté) */}
              {!token ? (
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary/5 text-primary hover:bg-primary hover:text-white font-bold px-7 py-3.5 rounded-2xl border border-primary/10 hover:border-transparent transition-all duration-300 hover:scale-102 active:scale-95 text-sm sm:text-base"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isFr ? "Rejoignez-nous" : "Join Us"}</span>
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary/5 text-primary hover:bg-primary hover:text-white font-bold px-7 py-3.5 rounded-2xl border border-primary/10 hover:border-transparent transition-all duration-300 hover:scale-102 active:scale-95 text-sm sm:text-base"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.myProfile || (isFr ? "Mon Compte" : "My Account")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
