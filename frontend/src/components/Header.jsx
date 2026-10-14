import { useState, useContext } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LayoutGrid,
  Globe,
  LogOut,
  LogIn,
  ChevronRight,
  Home as HomeIcon,
  Ruler,
  Info,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { useLang } from "../context/LangContext";
import logo from '../assets/logo-meili.png'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const {
    getCartCount,
    search,
    setSearch,
    token,
    logout,
  } = useContext(ShopContext);

  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate("/collection");
      setSearchOpen(false);
      closeMenu();
    }
  };

  const navLinks = [
    { to: "/collection", label: t.collection || (lang === "fr" ? "Collection" : "Collection"), icon: LayoutGrid },
    { to: "/size-guide", label: t.sizeGuide || (lang === "fr" ? "Guide des tailles" : "Size Guide"), icon: Ruler },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primaryLight/95 backdrop-blur-md shadow-xs border-b border-gray-20/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-18">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="Měilì"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-bold tracking-wide transition-colors duration-200 hover:text-tertiary ${
                  isActive ? "text-tertiary font-extrabold" : "text-primary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">

          {/* Desktop Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) navigate("/collection");
              }}
              placeholder={t.searchPlaceholder}
              className="pl-9 pr-4 py-2 w-44 xl:w-56 rounded-full bg-white/80 border border-gray-20/60 text-sm text-primary placeholder:text-gray-30 outline-none focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary transition-all shadow-2xs"
            />
          </div>

          {/* Cart Icon (Visible on all screens) */}
          <Link
            to="/cart"
            onClick={closeMenu}
            className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors text-primary active:scale-95"
            aria-label={t.cart}
          >
            <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5" />
            {getCartCount() > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-tertiary text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-scaleIn shadow-xs">
                {getCartCount()}
              </span>
            )}
          </Link>

          {/* Desktop User Profile Icon / Connection Button */}
          <div className="hidden md:flex items-center gap-1.5">
            {token ? (
              <div className="flex items-center gap-1">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors text-primary"
                  aria-label={t.myProfile}
                  title={t.myProfile}
                >
                  <User className="w-5 h-5" />
                </Link>

                <button
                  onClick={logout}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-20 bg-white/70 text-primary hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="text-xs font-bold px-3.5 py-2 rounded-full bg-primary text-primaryLight hover:bg-tertiary transition-all duration-200 shadow-sm active:scale-95"
              >
                {t.login}
              </Link>
            )}
          </div>

          {/* Desktop Language Switcher Button */}
          <button
            id="lang-toggle-btn"
            onClick={toggleLang}
            aria-label={lang === "en" ? "Passer en Français" : "Switch to English"}
            title={lang === "en" ? "Passer en Français" : "Switch to English"}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-gray-20/80 bg-white/80 text-primary text-xs font-bold hover:bg-white hover:border-tertiary transition-all select-none cursor-pointer shadow-2xs active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-tertiary" />
            <span className="tracking-wider uppercase font-black text-[11px] sm:text-xs">
              {lang === "en" ? "FR" : "EN"}
            </span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-full text-primary hover:bg-black/5 transition-colors cursor-pointer active:scale-95"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Full Overlay Menu ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white border-b border-gray-20/40 shadow-2xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto animate-[fadeDown_0.2s_ease-out]">
          <div className="px-4 py-5 flex flex-col gap-3">

            {/* Mobile Search Bar inside Menu */}
            <form onSubmit={handleMobileSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-30 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="pl-10 pr-4 py-3 w-full rounded-2xl bg-gray-10/70 border border-gray-20/50 text-sm text-primary placeholder:text-gray-30 outline-none focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary focus:bg-white transition-all shadow-xs"
                />
              </div>
            </form>

            {/* Navigation links */}
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-30 px-2 pt-2 pb-0.5">
              Navigation
            </div>

            <div className="flex flex-col gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-primary hover:bg-gray-10 bg-gray-10/40"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </NavLink>
                );
              })}
            </div>

            {/* Account / User Section */}
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-30 px-2 pt-3 pb-0.5">
              {lang === "fr" ? "Compte & Préférences" : "Account & Preferences"}
            </div>

            <div className="flex flex-col gap-1.5">
              {token ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-primary hover:bg-gray-10 bg-gray-10/40"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5" />
                      <span>{t.myProfile}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </NavLink>

                  <NavLink
                    to="/orders"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-primary hover:bg-gray-10 bg-gray-10/40"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <PackageCheck className="w-5 h-5" />
                      <span>{t.ordersTitle || (lang === "fr" ? "Mes Commandes" : "My Orders")}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-primary hover:bg-gray-10 bg-gray-10/40"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5" />
                    <span>{t.login}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </NavLink>
              )}

              {/* Language toggle row in mobile menu */}
              <button
                onClick={toggleLang}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold text-primary hover:bg-gray-10 bg-gray-10/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-tertiary" />
                  <span>{lang === "en" ? "Language" : "Langue"}</span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white border border-gray-20 text-xs font-black text-primary uppercase shadow-2xs">
                  {lang === "en" ? "Français (FR)" : "English (EN)"}
                </span>
              </button>
            </div>

            {/* Logout button if authenticated */}
            {token && (
              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-red-200 bg-red-50/80 text-red-600 text-sm font-bold hover:bg-red-100 transition-all cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            )}

          </div>
        </div>
      )}
    </header>
  );
}