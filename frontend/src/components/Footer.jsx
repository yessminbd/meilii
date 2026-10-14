import { MapPin, Mail, Phone, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import logo from "../assets/logo-meili.png";

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL;

// Inline social SVGs
const InstagramIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const TiktokIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);
const FacebookIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const TwitterIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
);

const socials = [
    { Icon: InstagramIcon, href: "https://www.instagram.com/meilii.store/", label: "Instagram" },
    { Icon: FacebookIcon, href: "https://www.facebook.com/p/M%C3%AAil%C3%AC-61556771036025/", label: "Facebook" },
    { Icon: TiktokIcon, href: "https://www.tiktok.com/@meilii.store", label: "TikTok" },
];

export default function Footer() {
    const { t } = useLang();

    const footerSections = [
        {
            category: t.shopSection,
            links: [
                { label: t.newArrivals, href: "/collection" },
                { label: t.collection, href: "/collection" },
                { label: t.bestSellers, href: "/collection" },
                { label: t.sale, href: "/collection" },
            ],
        },
        {
            category: t.companySection,
            links: [
                { label: t.aboutUs, href: "/about" },
                { label: t.contact, href: "/about" },
                { label: t.ordersTitle, href: "/profile" },
                { label: t.trackOrder, href: "/orders" },
            ],
        },
        {
            category: t.supportSection,
            links: [
                { label: t.faq, href: "/about" },
                { label: t.returns, href: "/about" },
                { label: t.sizeGuide, href: "/size-guide" },
                { label: t.shippingInfo, href: "/about" },
            ],
        },
    ];

    return (
        <footer className="bg-primary text-primaryLight">
            {/* Main footer grid */}
            <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

                {/* Brand column */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <Link to="/" className="inline-block transition-opacity hover:opacity-80">
                        <img src={logo} alt="Měilì" className="h-8 w-auto" />
                    </Link>
                    <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                        {t.footerSlogan}
                    </p>

                    {/* Contact info */}
                    <div className="flex flex-col gap-2 text-sm text-white/50">
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-tertiary shrink-0" />
                           Nabeul, Tunisia
                        </span>
                    </div>

                    {/* Socials */}
                    <div className="flex items-center gap-3 mt-1">
                        {socials.map(({ Icon, href, label }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="p-2 rounded-full border border-white/10 text-white/50 hover:border-tertiary hover:text-tertiary transition-all duration-200 hover:scale-110"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Links columns */}
                {footerSections.map((sec, idx) => (
                    <div key={idx}>
                        <h3 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4">
                            {sec.category}
                        </h3>
                        <ul className="flex flex-col gap-3">
                            {sec.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.href}
                                        className="text-sm text-white/60 hover:text-tertiary transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
                    <p>© {new Date().getFullYear()} Měilì. {t.rightsReserved}</p>
                    <div className="flex items-center gap-6">
                        <span className="hover:text-white/60 transition-colors cursor-pointer">{t.privacyPolicy}</span>
                        <span className="hover:text-white/60 transition-colors cursor-pointer">{t.termsOfService}</span>
                        <a
                            href="https://meiliiadminpanel.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-white/60 transition-colors"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t.adminPanel}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
