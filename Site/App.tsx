import React, { useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, X } from 'lucide-react';
import { translations } from './translations';
import { Language } from './types';

/* ---------- GoGo Board SVG ---------- */
const GoGoBoardSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 500 500" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M250 30 L440 140 L440 360 L250 470 L60 360 L60 140 Z" fill="#6B21A8" />
    <rect x="150" y="170" width="200" height="160" rx="4" fill="#1A1A1A" stroke="#FFFFFF" strokeWidth="4" />
    <text x="250" y="240" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="60" fill="white" textAnchor="middle">GO</text>
    <text x="250" y="300" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="60" fill="white" textAnchor="middle">GO</text>
  </svg>
);

/* ---------- Language Context ---------- */
interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

/* ---------- Navbar ---------- */
const Navbar = () => {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: t.nav.home },
    { path: '/about', label: t.nav.about },
    { path: '/activities', label: t.nav.activities },
    { path: '/tools', label: t.nav.tools },
    { path: '/docs', label: t.nav.docs },
    { path: '/team', label: t.nav.team },
    { path: '/contact', label: t.nav.contact }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-brand-beige/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9">
            <GoGoBoardSVG className="w-full h-full" />
          </div>
          <span className="font-bold text-xl">
            GoGo<span className="text-brand-lilac">Data</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`text-sm font-semibold ${
                location.pathname === l.path
                  ? 'text-brand-lilac underline underline-offset-4'
                  : 'text-gray-500'
              }`}
            >
              {l.label}
            </Link>
          ))}

          <select
            value={lang}
            onChange={e => setLang(e.target.value as Language)}
            className="text-xs font-bold px-3 py-1 rounded-full border"
          >
            <option value="pt">BR</option>
            <option value="en">EN</option>
          </select>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden px-4 pb-4 space-y-2">
          {navLinks.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className="block py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

/* ---------- Footer ---------- */
const Footer = () => (
  <footer className="border-t border-gray-200 py-10 text-center text-sm text-gray-400">
    © {new Date().getFullYear()} GoGoData Research Project
  </footer>
);

/* ---------- Home ---------- */
const Home = () => {
  const { t } = useLanguage();

  return (
    <div>
      <section className="px-4 pt-10 pb-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t.home.heroTitle}
              <span className="text-brand-lilac">.</span>
            </h1>

            <p className="text-lg text-gray-500 mb-6 max-w-xl">
              {t.home.heroSub}
            </p>

            <Link
              to="/activities"
              className="inline-flex items-center gap-2 bg-brand-lilac text-white px-6 py-3 rounded-xl font-bold"
            >
              {t.home.cta}
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="flex justify-center">
            <div className="w-[260px] md:w-[320px] animate-float">
              <GoGoBoardSVG className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-gray-200 text-center px-4">
        <h2 className="text-xl md:text-2xl italic max-w-3xl mx-auto">
          "{t.home.coreMessage}"
        </h2>
      </section>
    </div>
  );
};

/* ---------- Simple Pages ---------- */
const Page = ({ title }: { title: string }) => (
  <div className="py-20 px-4 max-w-4xl mx-auto">
    <h1 className="text-4xl font-bold">{title}</h1>
  </div>
);

const About = () => <Page title="About" />;
const Activities = () => <Page title="Activities" />;
const ActivityPage = () => <Page title="Activity" />;
const Tools = () => <Page title="Tools" />;
const Documentation = () => <Page title="Documentation" />;
const Team = () => <Page title="Team" />;
const Contact = () => <Page title="Contact" />;

/* ---------- App ---------- */
const App = () => {
  const [lang, setLang] = useState<Language>('pt');
  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/activities/:id" element={<ActivityPage />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/team" element={<Team />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </HashRouter>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </LanguageContext.Provider>
  );
};

export default App;
