import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Tag, Check } from "lucide-react";
import { useLang } from '../context/LangContext';

export default function CategoryTreeFilter({
  backendUrl,
  products = [],
  selectedCategory = [],
  selectedSubCategory = [],
  onToggleCategory,
  onToggleSubCategory,
  onSelectOnlySubCategory,
}) {
  const [categories, setCategories] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const { t } = useLang();

  // 1. Charger les catégories depuis le backend (/api/category/list)
  // ou construire l'arbre à partir des produits existants en secours
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        if (backendUrl) {
          const res = await fetch(`${backendUrl}/api/category/list`);
          const data = await res.json();
          if (data?.success && Array.isArray(data.categories) && data.categories.length > 0) {
            if (isMounted) {
              setCategories(data.categories);
              // Ouvrir par défaut la première catégorie ou celles ayant une sélection
              const initialOpen = {};
              data.categories.forEach((c) => {
                const hasSelectedSub = c.subCategories?.some((s) => selectedSubCategory.includes(s));
                const isCatSelected = selectedCategory.includes(c.name);
                if (isCatSelected || hasSelectedSub) {
                  initialOpen[c._id || c.name] = true;
                }
              });
              setOpenMap((prev) => ({ ...initialOpen, ...prev }));
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch categories from backend, fallback to product data:", err);
      }

      // Secours : déduire des produits
      if (isMounted && products.length > 0) {
        const tree = {};
        products.forEach((p) => {
          let catNames = [];
          if (Array.isArray(p.category)) catNames = p.category;
          else if (typeof p.category === "string") {
            try {
              const parsed = JSON.parse(p.category);
              catNames = Array.isArray(parsed) ? parsed : [p.category];
            } catch {
              catNames = [p.category];
            }
          }
          if (p.gender && !catNames.includes(p.gender)) {
            catNames.push(p.gender);
          }

          catNames.filter(Boolean).forEach((c) => {
            if (!tree[c]) tree[c] = new Set();
            if (p.subCategory) tree[c].add(p.subCategory);
            if (p.brand) tree[c].add(p.brand);
          });
        });

        const fallbackList = Object.entries(tree).map(([name, subs], idx) => ({
          _id: `fallback_${idx}`,
          name,
          subCategories: Array.from(subs),
        }));
        setCategories(fallbackList);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [backendUrl, products]);

  // Si l'utilisateur clique sur une catégorie/sous-catégorie extérieurement, ouvrir son nœud parent
  useEffect(() => {
    if (categories.length > 0) {
      setOpenMap((prev) => {
        const next = { ...prev };
        categories.forEach((cat) => {
          const key = cat._id || cat.name;
          const hasSelectedSub = cat.subCategories?.some((s) => selectedSubCategory.includes(s));
          const isCatSelected = selectedCategory.includes(cat.name);
          if (hasSelectedSub || isCatSelected) {
            next[key] = true;
          }
        });
        return next;
      });
    }
  }, [selectedCategory, selectedSubCategory, categories]);

  const toggleOpen = (key) => {
    setOpenMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-20 rounded-2xl p-5 mb-5 bg-white shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-10">
        <p className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
          <span>{t.category}</span>
        </p>
      </div>

      <div className="space-y-1.5 select-none">
        {categories.map((cat) => {
          const key = cat._id || cat.name;
          const isOpen = !!openMap[key];
          const isCatSelected = selectedCategory.includes(cat.name);
          const hasSubs = Array.isArray(cat.subCategories) && cat.subCategories.length > 0;

          // Nombre de sous-catégories sélectionnées sous ce parent
          const selectedSubCount = hasSubs
            ? cat.subCategories.filter((sub) => selectedSubCategory.includes(sub)).length
            : 0;

          return (
            <div key={key} className="rounded-xl transition-colors">
              {/* Ligne Parent (Catégorie) */}
              <div
                className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${isCatSelected
                    ? "bg-[#e63946]/5 text-[#e63946] font-bold"
                    : "hover:bg-gray-10/70 text-primary"
                  }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Flèche d'ouverture repliement de l'arbre */}
                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOpen(key);
                      }}
                      className="p-1 rounded-md hover:bg-black/5 text-gray-40 hover:text-primary transition-colors cursor-pointer"
                      title={isOpen ? "Fermer" : "Ouvrir"}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-tertiary" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <span className="w-6" />
                  )}

                  {/* Case à cocher pour filtrer par la catégorie */}
                  <label
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isCatSelected}
                      onChange={() => onToggleCategory(cat.name)}
                      className="w-4 h-4 rounded text-tertiary focus:ring-tertiary border-gray-30 cursor-pointer accent-[#e63946]"
                    />
                    <span
                      onClick={() => toggleOpen(key)}
                      className="text-sm font-semibold truncate hover:text-[#e63946] transition-colors"
                    >
                      {cat.name}
                    </span>
                  </label>
                </div>

                {/* Badge nombre sous-catégories */}
                {hasSubs && (
                  <button
                    type="button"
                    onClick={() => toggleOpen(key)}
                    className="ml-2 flex items-center gap-1 text-[11px] font-bold text-gray-40 bg-gray-10 hover:bg-gray-20 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    {selectedSubCount > 0 ? (
                      <span className="text-[#e63946]">{selectedSubCount}/</span>
                    ) : null}
                    <span>{cat.subCategories.length}</span>
                  </button>
                )}
              </div>

              {/* Sous-catégories (Branches de l'arbre) */}
              {hasSubs && isOpen && (
                <div className="ml-6 pl-3 my-1 border-l-2 border-gray-20/80 space-y-1 py-1 animate-in fade-in duration-200">
                  {cat.subCategories.map((sub) => {
                    const isSubSelected = selectedSubCategory.includes(sub);
                    return (
                      <label
                        key={sub}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${isSubSelected
                            ? "bg-[#e63946]/10 text-[#e63946] font-bold"
                            : "hover:bg-gray-10 text-gray-600 hover:text-primary"
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSubSelected}
                            onChange={() => onToggleSubCategory(sub)}
                            className="w-3.5 h-3.5 rounded text-tertiary focus:ring-tertiary border-gray-30 cursor-pointer accent-[#e63946]"
                          />
                          <span className="truncate">{sub}</span>
                        </div>
                        {isSubSelected && (
                          <Check className="w-3.5 h-3.5 text-[#e63946] shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
