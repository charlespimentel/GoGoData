
import React, { useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { 
  Activity, 
  BarChart3, 
  MessageSquare, 
  GraduationCap, 
  Users, 
  PlayCircle, 
  Cpu, 
  Settings2, 
  Database,
  ChevronRight,
  Mail,
  Menu,
  X,
  Clock,
  Target,
  Zap,
  PieChart,
  Share2
} from 'lucide-react';
import { translations } from './translations';
import { Language, TranslationContent } from './types';

// --- Visual Component: GoGo Board SVG ---
const GoGoBoardSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 500 500" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M250 30 L440 140 L440 360 L250 470 L60 360 L60 140 Z" fill="#6B21A8" />
    <rect x="150" y="170" width="200" height="160" rx="4" fill="#1A1A1A" stroke="#FFFFFF" strokeWidth="4" />
    <text x="250" y="240" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="60" fill="white" textAnchor="middle">GO</text>
    <text x="250" y="300" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="60" fill="white" textAnchor="middle">GO</text>
    <rect x="160" y="65" width="30" height="30" fill="white" />
    <rect x="205" y="65" width="30" height="30" fill="white" />
    <rect x="265" y="65" width="30" height="30" fill="white" />
    <rect x="310" y="65" width="30" height="30" fill="white" />
    <rect x="180" y="410" width="40" height="25" fill="white" />
    <rect x="230" y="410" width="40" height="25" fill="white" />
    <rect x="280" y="410" width="40" height="25" fill="white" />
  </svg>
);

// --- Context ---
interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationContent;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

// --- Navbar & Footer ---
const Navbar = () => {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: t.nav.home },
    { path: '/about', label: t.nav.about },
    { path: '/activities', label: t.nav.activities },
    { path: '/tools', label: t.nav.tools },
    { path: '/docs', label: t.nav.docs },
    { path: '/team', label: t.nav.team },
    { path: '/contact', label: t.nav.contact },
  ];

  return (
    <nav className="bg-brand-beige/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12 lg:h-14 items-center">
          <Link to="/" className="flex items-center gap-1.5 group">
            <div className="w-7 h-7 lg:w-9 lg:h-9 flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110">
              <GoGoBoardSVG className="w-full h-full drop-shadow-sm" />
            </div>
            <span className="text-base lg:text-lg font-bold text-brand-dark tracking-tighter">
              GoGo<span className="text-brand-lilac">Data</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-3">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`text-[11px] font-semibold transition-colors hover:text-brand-lilac ${location.pathname === link.path ? 'text-brand-lilac underline underline-offset-2' : 'text-gray-500'}`}>{link.label}</Link>
            ))}
            <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="text-[9px] font-bold bg-brand-lilacLight text-brand-lilac border border-brand-lilac/20 rounded-full px-1.5 py-0.5 outline-none cursor-pointer hover:bg-brand-lilac hover:text-white transition-colors">
              <option value="pt">BR</option>
              <option value="en">EN</option>
            </select>
          </div>

          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 focus:outline-none p-1 rounded-lg bg-gray-100">
              {isOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="lg:hidden bg-brand-beige border-b border-gray-200 animate-fade-in px-4 pt-1 pb-2 space-y-0.5">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className="block px-2 py-1 rounded-md text-[11px] font-semibold text-gray-700 hover:bg-brand-lilacLight hover:text-brand-lilac">{link.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-transparent border-t border-gray-200 py-4">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex flex-wrap justify-center gap-4 mb-3 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="text-[8px] font-bold tracking-widest uppercase">GRECO UFRJ</div>
        <div className="text-[8px] font-bold tracking-widest uppercase">TLTL COLUMBIA</div>
        <div className="text-[8px] font-bold tracking-widest uppercase">TLIC CMU</div>
      </div>
      <p className="text-[8px] text-gray-400 font-medium tracking-tight">© {new Date().getFullYear()} GoGoData Research Project.</p>
    </div>
  </footer>
);

// --- Pages ---
const Home = () => {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden py-4 lg:py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
          <div className="text-left z-10 lg:max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-brand-lilacLight text-brand-lilac px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2">
              {t.home.tag}
            </div>
            <h1 className="text-5xl lg:text-[7rem] font-black text-brand-dark mb-2 tracking-tighter leading-[0.85]">
              {t.home.heroTitle}<span className="text-brand-lilac">.</span>
            </h1>
            <p className="text-base lg:text-xl text-gray-500 mb-6 max-w-md leading-snug font-medium">
              {t.home.heroSub}
            </p>
            <Link to="/activities" className="inline-flex items-center gap-2 bg-brand-lilac text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-lilac/20 hover:bg-brand-dark transition-all transform hover:-translate-y-0.5 text-sm">
              {t.home.cta} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="relative z-10 w-full max-w-[280px] lg:max-w-sm animate-float">
               <GoGoBoardSVG className="w-full h-auto drop-shadow-2xl" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-brand-lilac/5 rounded-full blur-3xl -z-0"></div>
          </div>
        </div>
      </section>

      <section className="py-6 lg:py-10 px-4 border-y border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-brand-lilacLight p-6 lg:p-10 rounded-[2rem] relative overflow-hidden shadow-sm border border-brand-lilac/10">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-brand-dark mb-6 italic leading-snug">"{t.home.coreMessage}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { label: t.home.features.sensors, icon: <Activity size={24} color="#8B5CF6"/> },
                { label: t.home.features.interpretation, icon: <BarChart3 size={24} color="#4A90E2"/> },
                { label: t.home.features.communication, icon: <MessageSquare size={24} color="#8B5CF6"/> }
              ].map(item => (
                <div key={item.label} className="group">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl flex items-center justify-center mb-2 mx-auto shadow-sm group-hover:bg-brand-lilac group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-xs lg:text-sm text-brand-dark">{item.label}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-lilac rounded-[2rem] rotate-1 group-hover:rotate-0 transition-transform duration-500 -z-10 opacity-10"></div>
            <img src="https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1200" className="rounded-[2rem] shadow-lg w-full h-[250px] lg:h-[350px] object-cover" alt="Research Env" />
          </div>
          <div className="space-y-4 lg:space-y-5">
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-dark tracking-tight">{t.home.activeLearningTitle}</h2>
            <p className="text-sm lg:text-base text-gray-500 leading-relaxed font-medium">{t.home.activeLearningDesc}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: t.home.features.age, icon: <Users size={16}/> }, 
                { label: t.home.features.bloom, icon: <GraduationCap size={16}/> }, 
                { label: t.home.features.board, icon: <Cpu size={16}/> }, 
                { label: t.home.features.sensors, icon: <Activity size={16}/> }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                  <div className="text-brand-lilac">{item.icon}</div>
                  <span className="font-bold text-[10px] text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const About = () => {
  const { t } = useLanguage();
  return (
    <div className="py-4 lg:py-8 px-4 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-3 tracking-tighter">{t.about.title}</h1>
      <p className="text-sm lg:text-base text-gray-500 mb-6 leading-snug font-medium">{t.about.description}</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-brand-blueLight p-4 rounded-xl border border-brand-blue/10 shadow-sm">
             <GraduationCap className="text-brand-blue mb-2" size={18} />
             <h2 className="text-base lg:text-lg font-bold text-brand-dark mb-1">{t.about.focusTitle}</h2>
             <p className="text-gray-600 leading-snug text-[10px] font-medium">{t.about.focusDesc}</p>
           </div>
           <div className="bg-brand-lilacLight p-4 rounded-xl border border-brand-lilac/10 shadow-sm">
             <BarChart3 className="text-brand-lilac mb-2" size={18} />
             <h2 className="text-base lg:text-lg font-bold text-brand-dark mb-1">{t.about.bloomTitle}</h2>
             <p className="text-gray-600 leading-snug text-[10px] font-medium">{t.about.bloomDesc}</p>
           </div>
        </div>
        <div className="bg-brand-white p-4 lg:p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
           <h2 className="text-lg lg:text-xl font-bold text-brand-dark mb-2 flex items-center gap-3">
             <Activity className="text-brand-lilac" size={20} />
             {t.about.realTimeTitle}
           </h2>
           <p className="text-gray-500 text-xs lg:text-sm leading-relaxed font-medium">{t.about.realTimeDesc}</p>
        </div>
      </div>
    </div>
  );
};

const Activities = () => {
  const { t } = useLanguage();
  return (
    <div className="py-4 lg:py-8 px-4 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-1 tracking-tight">{t.activities.title}</h1>
        <p className="text-xs lg:text-sm text-gray-500 font-medium">{t.activities.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {t.activities.items.map((act: any, idx: number) => (
          <div key={act.id} className={`${idx % 2 === 0 ? 'bg-brand-white' : 'bg-brand-blueLight'} rounded-xl overflow-hidden border border-gray-200 group hover:shadow-md transition-all flex flex-col`}>
            <div className="p-4 lg:p-6 flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg lg:text-xl font-bold text-brand-dark leading-tight">{act.title}</h3>
                <span className="bg-brand-lilacLight text-brand-lilac px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{act.level.split(' ')[0]}</span>
              </div>
              <p className="text-gray-500 text-xs mb-3 font-medium">{act.desc}</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400">
                  <Clock size={10} /> {act.duration}
                </div>
                <div className="flex items-center gap-1 text-[8px] font-bold text-brand-blue">
                  <Target size={10} /> {act.level}
                </div>
              </div>
            </div>
            <div className="p-4 lg:p-6 pt-0">
              <Link to={`/activities/${act.id}`} className="flex items-center justify-center gap-1.5 w-full bg-brand-lilac text-white py-2 rounded-lg font-bold hover:bg-brand-dark transition-all text-[10px]">
                {t.activities.knowMore} <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityPage = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const activity = t.activities.items.find((a: any) => a.id === id);

  if (!activity) return <div>Activity not found</div>;

  return (
    <div className="py-4 lg:py-8 px-4 max-w-4xl mx-auto animate-fade-in">
      <Link to="/activities" className="text-brand-lilac text-[9px] font-bold mb-3 block flex items-center gap-1">← {t.nav.activities}</Link>
      <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-3 tracking-tighter">{activity.title}</h1>
      <div className="flex gap-1.5 mb-4">
        <span className="bg-brand-lilac text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">{t.activities.targetAge}</span>
        <span className="bg-brand-white border border-gray-200 text-brand-dark px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">{activity.duration}</span>
      </div>

      <div className="space-y-4">
        <section className="bg-brand-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-base lg:text-lg font-bold mb-2 flex items-center gap-2"><Target className="text-brand-lilac" size={18}/> {t.activities.objectivesTitle}</h2>
          <ul className="space-y-1">
            {activity.objectives.map((obj: string, i: number) => (
              <li key={i} className="flex gap-2 text-gray-600 font-medium text-[10px] lg:text-xs">
                <span className="text-brand-lilac font-black">•</span> {obj}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-brand-dark text-white p-4 rounded-xl shadow-lg">
          <h2 className="text-base lg:text-lg font-bold mb-1.5 flex items-center gap-2"><Activity className="text-brand-lilac" size={18}/> {t.activities.overviewTitle}</h2>
          <p className="text-white/80 text-[11px] leading-relaxed">{activity.desc}</p>
        </section>

        <section>
          <h2 className="text-base lg:text-lg font-bold mb-3 flex items-center gap-2 text-brand-dark"><PlayCircle className="text-brand-lilac" size={18}/> {t.activities.stepsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activity.steps.map((step: string, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-brand-white rounded-lg border border-gray-200 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-brand-lilacLight text-brand-lilac flex items-center justify-center font-black flex-shrink-0 text-[10px]">{i + 1}</div>
                <p className="font-bold text-gray-700 text-[9px] leading-tight">{step}</p>
              </div>
            ))}
          </div>
        </section>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-brand-blueLight rounded-lg border border-brand-blue/10">
            <h3 className="font-bold text-[10px] flex items-center gap-1.5 mb-1"><Cpu size={14}/> {t.activities.hardwareTitle}</h3>
            <p className="text-[9px] text-gray-500">{t.activities.hardwareDesc}</p>
          </div>
          <div className="p-3 bg-brand-lilacLight rounded-lg border border-brand-lilac/10">
            <h3 className="font-bold text-[10px] flex items-center gap-1.5 mb-1"><Database size={14}/> {t.activities.analysisTitle}</h3>
            <p className="text-[9px] text-gray-500">{t.activities.analysisDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tools = () => {
  const { t } = useLanguage();
  
  const getIcon = (id: string) => {
    switch(id) {
      case 'gogoboard': return <GoGoBoardSVG className="w-full h-full" />;
      case 'sensores': return <Activity size={20} />;
      case 'codap': return <Database size={20} />;
      default: return <Settings2 size={20} />;
    }
  };

  return (
    <div className="py-4 lg:py-8 px-4 max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-2 text-center tracking-tight">{t.tools.title}</h1>
      <p className="text-sm lg:text-base text-center text-gray-500 mb-6 lg:mb-8 max-w-2xl mx-auto font-medium">{t.tools.description}</p>
      
      <div className="space-y-4 lg:space-y-6">
        {t.tools.items.map((tool: any, idx: number) => (
          <div key={tool.id} className="bg-brand-white rounded-xl p-4 lg:p-6 border border-gray-200 group hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-lilac text-white rounded-lg flex items-center justify-center shadow-md p-1.5 flex-shrink-0">
                {getIcon(tool.id)}
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-brand-dark">{tool.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-3 ${idx % 2 === 0 ? 'bg-brand-lilacLight' : 'bg-brand-blueLight'} rounded-lg border border-black/5`}>
                <div className="flex items-center gap-1.5 mb-1.5 text-brand-lilac font-bold text-[8px] uppercase tracking-widest">
                  <Zap size={12} /> {t.tools.roles.coleta}
                </div>
                <p className="text-gray-600 text-[9px] lg:text-[10px] leading-tight font-medium">{tool.coleta}</p>
              </div>
              <div className={`p-3 ${idx % 2 === 0 ? 'bg-brand-blueLight' : 'bg-brand-lilacLight'} rounded-lg border border-black/5`}>
                <div className="flex items-center gap-1.5 mb-1.5 text-brand-blue font-bold text-[8px] uppercase tracking-widest">
                  <PieChart size={12} /> {t.tools.roles.analise}
                </div>
                <p className="text-gray-600 text-[9px] lg:text-[10px] leading-tight font-medium">{tool.analise}</p>
              </div>
              <div className={`p-3 bg-brand-white rounded-lg border border-black/5`}>
                <div className="flex items-center gap-1.5 mb-1.5 text-brand-lilac font-bold text-[8px] uppercase tracking-widest">
                  <Share2 size={12} /> {t.tools.roles.comunicacao}
                </div>
                <p className="text-gray-600 text-[9px] lg:text-[10px] leading-tight font-medium">{tool.comunicacao}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Documentation = () => {
  const { t } = useLanguage();
  return (
    <div className="py-4 lg:py-8 px-4 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-6 text-center">{t.docs.title}</h1>
      <div className="space-y-6 lg:space-y-8">
        <section>
          <h2 className="text-lg lg:text-xl font-bold mb-3 flex items-center gap-2 text-brand-lilac"><GraduationCap size={20}/> {t.docs.teachers}</h2>
          <div className="bg-brand-white p-4 lg:p-6 rounded-xl border border-gray-200 italic text-[11px] lg:text-xs text-gray-500 shadow-sm">{t.docs.teacherQuote}</div>
        </section>
        <section>
          <h2 className="text-lg lg:text-xl font-bold mb-3 flex items-center gap-2 text-brand-blue"><Users size={20}/> {t.docs.students}</h2>
          <div className="bg-brand-blueLight p-4 lg:p-6 rounded-xl border border-brand-blue/10 text-brand-blue font-bold shadow-sm text-[11px]">{t.docs.studentQuote}</div>
        </section>
      </div>
    </div>
  );
};

const Team = () => {
  const { t } = useLanguage();
  const members = [
    { name: 'Charles Pimentel', roleKey: 'pi' },
    { name: 'Maria Luiza Campos', roleKey: 'advisor' },
    { name: 'Giseli Lopes', roleKey: 'coadvisor' }
  ];
  return (
    <div className="py-4 lg:py-8 px-4 max-w-4xl mx-auto animate-fade-in text-center">
      <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-6 tracking-tight">{t.team.title}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {members.map((m) => (
          <div key={m.name} className="bg-brand-white p-4 rounded-xl border border-gray-200 flex flex-col items-center gap-2 group hover:border-brand-lilac transition-all shadow-sm">
             <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg bg-brand-lilac text-white flex items-center justify-center text-lg lg:text-xl font-black">{m.name.charAt(0)}</div>
             <div className="text-center">
                <h3 className="text-xs lg:text-sm font-bold text-brand-dark">{m.name}</h3>
                <div className="text-brand-lilac font-black text-[7px] uppercase tracking-widest">{t.team.roles[m.roleKey]}</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Contact = () => {
  const { t } = useLanguage();
  return (
    <div className="py-4 lg:py-8 px-4 max-w-3xl mx-auto text-center animate-fade-in">
      <div className="bg-brand-white p-6 lg:p-10 rounded-[2rem] border border-gray-200 shadow-sm">
        <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark mb-2 tracking-tight">{t.contact.title}</h1>
        <p className="text-sm text-gray-500 mb-6 font-medium">{t.contact.subtitle}</p>
        <div className="bg-brand-lilacLight p-4 lg:p-6 rounded-xl border border-brand-lilac/10">
          <Mail className="mx-auto mb-1.5 text-brand-lilac" size={20} />
          <a href="mailto:charlespimentel@ufrj.br" className="text-base lg:text-lg font-black text-brand-dark hover:text-brand-lilac transition-colors">charlespimentel@ufrj.br</a>
        </div>
      </div>
    </div>
  );
};

// --- App Shell ---
const App = () => {
  const [lang, setLang] = useState<Language>('pt');
  const t = translations[lang];
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <HashRouter>
        <div className="min-h-screen flex flex-col font-sans selection:bg-brand-lilac selection:text-white">
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0% { transform: translateY(0px) rotate(1deg); } 50% { transform: translateY(-5px) rotate(0deg); } 100% { transform: translateY(0px) rotate(1deg); } }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </LanguageContext.Provider>
  );
};

export default App;
