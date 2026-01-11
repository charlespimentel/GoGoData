
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
import { Language } from './types';

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
  t: any;
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
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110">
              <GoGoBoardSVG className="w-full h-full drop-shadow-md" />
            </div>
            <span className="text-2xl font-bold text-brand-dark tracking-tighter">
              GoGo<span className="text-brand-lilac">Data</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`text-sm font-semibold transition-colors hover:text-brand-lilac ${location.pathname === link.path ? 'text-brand-lilac underline underline-offset-8' : 'text-gray-500'}`}>{link.label}</Link>
            ))}
            <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="text-xs font-bold bg-brand-lilacLight text-brand-lilac border border-brand-lilac/20 rounded-full px-4 py-2 outline-none cursor-pointer hover:bg-brand-lilac hover:text-white transition-colors">
              <option value="pt">BR</option>
              <option value="en">EN</option>
            </select>
          </div>

          <div className="lg:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 focus:outline-none p-2 rounded-lg bg-gray-100">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="lg:hidden bg-brand-beige border-b border-gray-200 animate-fade-in px-4 pt-4 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-base font-semibold text-gray-700 hover:bg-brand-lilacLight hover:text-brand-lilac">{link.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-transparent border-t border-gray-200 py-16">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex flex-wrap justify-center gap-12 mb-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="text-sm font-bold tracking-widest uppercase">GRECO UFRJ</div>
        <div className="text-sm font-bold tracking-widest uppercase">TLTL COLUMBIA</div>
        <div className="text-sm font-bold tracking-widest uppercase">TLIC CMU</div>
      </div>
      <div className="w-16 h-1 bg-brand-lilac/20 mx-auto mb-8 rounded-full"></div>
      <p className="text-sm text-gray-400 font-medium tracking-tight">© {new Date().getFullYear()} GoGoData Research Project.</p>
    </div>
  </footer>
);

// --- Pages ---
const Home = () => {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden py-16 lg:py-28 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-left z-10">
            <div className="inline-flex items-center gap-2 bg-brand-lilacLight text-brand-lilac px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              Iniciativa GRECO - UFRJ
            </div>
            <h1 className="text-6xl lg:text-8xl font-bold text-brand-dark mb-8 tracking-tighter leading-none">
              {t.home.heroTitle}<span className="text-brand-lilac">.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-500 mb-12 max-w-xl leading-relaxed font-medium">
              {t.home.heroSub}
            </p>
            <Link to="/activities" className="inline-flex items-center gap-2 bg-brand-lilac text-white px-10 py-5 rounded-2xl font-bold shadow-xl shadow-brand-lilac/20 hover:bg-brand-dark transition-all transform hover:-translate-y-1">
              {t.home.cta} <ChevronRight size={20} />
            </Link>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="relative z-10 w-full max-w-md animate-float">
               <GoGoBoardSVG className="w-full h-auto drop-shadow-[0_35px_35px_rgba(139,92,246,0.15)]" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-lilac/5 rounded-full blur-3xl -z-0"></div>
          </div>
        </div>
      </section>

      <section className="py-32 px-4 border-y border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-brand-lilacLight p-16 rounded-[3rem] relative overflow-hidden shadow-sm border border-brand-lilac/10">
            <h2 className="text-3xl md:text-4xl font-semibold text-brand-dark mb-10 italic leading-snug">"{t.home.coreMessage}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
              {[
                { label: 'Monitoramento', icon: <Activity size={32} color="#8B5CF6"/> },
                { label: 'Interpretação', icon: <BarChart3 size={32} color="#4A90E2"/> },
                { label: 'Comunicação', icon: <MessageSquare size={32} color="#8B5CF6"/> }
              ].map(item => (
                <div key={item.label} className="group">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm group-hover:bg-brand-lilac group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg text-brand-dark">{item.label}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-lilac rounded-[3rem] rotate-3 group-hover:rotate-0 transition-transform duration-500 -z-10 opacity-20"></div>
            <img src="https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1200" className="rounded-[3rem] shadow-xl w-full h-[500px] object-cover" alt="Research Env" />
          </div>
          <div className="space-y-8">
            <h2 className="text-5xl font-bold text-brand-dark tracking-tight">Aprendizagem Ativa com <span className="text-brand-lilac">Dados</span></h2>
            <p className="text-xl text-gray-500 leading-relaxed font-medium">Investigação constante via hardware aberto, conectando estudantes aos anos finais do Ensino Fundamental com a realidade científica digital.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {[{ label: '13-14 Anos', icon: <Users size={20}/> }, { label: 'Bloom Digital', icon: <GraduationCap size={20}/> }, { label: 'GoGo Board', icon: <Cpu size={20}/> }, { label: 'Sensores Reais', icon: <Activity size={20}/> }].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-brand-lilac">{item.icon}</div>
                  <span className="font-bold text-sm text-gray-700">{item.label}</span>
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
    <div className="py-24 px-4 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-5xl font-bold text-brand-dark mb-10 tracking-tighter">{t.about.title}</h1>
      <p className="text-2xl text-gray-500 mb-16 leading-relaxed font-medium">{t.about.description}</p>
      <div className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="bg-brand-blueLight p-10 rounded-[2.5rem] border border-brand-blue/10 shadow-sm">
             <GraduationCap className="text-brand-blue mb-8" size={28} />
             <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.about.focusTitle}</h2>
             <p className="text-gray-600 leading-relaxed text-sm font-medium">{t.about.focusDesc}</p>
           </div>
           <div className="bg-brand-lilacLight p-10 rounded-[2.5rem] border border-brand-lilac/10 shadow-sm">
             <BarChart3 className="text-brand-lilac mb-8" size={28} />
             <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.about.bloomTitle}</h2>
             <p className="text-gray-600 leading-relaxed text-sm font-medium">{t.about.bloomDesc}</p>
           </div>
        </div>
        <div className="bg-brand-white p-12 rounded-[3rem] border border-gray-200 shadow-sm">
           <h2 className="text-3xl font-bold text-brand-dark mb-6 flex items-center gap-4">
             <Activity className="text-brand-lilac" size={32} />
             {t.about.realTimeTitle}
           </h2>
           <p className="text-gray-500 text-lg leading-relaxed font-medium">{t.about.realTimeDesc}</p>
        </div>
      </div>
    </div>
  );
};

const Activities = () => {
  const { t } = useLanguage();
  return (
    <div className="py-24 px-4 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-20 text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold text-brand-dark mb-6 tracking-tight">{t.activities.title}</h1>
        <p className="text-lg text-gray-500 font-medium">{t.activities.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
        {t.activities.items.map((act: any, idx: number) => (
          <div key={act.id} className={`${idx % 2 === 0 ? 'bg-brand-white' : 'bg-brand-blueLight'} rounded-[2.5rem] overflow-hidden border border-gray-200 group hover:shadow-xl transition-all flex flex-col`}>
            <div className="p-10 flex-grow">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-bold text-brand-dark leading-tight">{act.title}</h3>
                <span className="bg-brand-lilacLight text-brand-lilac px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{act.level.split(' ')[0]}</span>
              </div>
              <p className="text-gray-500 text-lg mb-8 font-medium">{act.desc}</p>
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Clock size={16} /> {act.duration}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-blue">
                  <Target size={16} /> {act.level}
                </div>
              </div>
            </div>
            <div className="p-10 pt-0">
              <Link to={`/activities/${act.id}`} className="flex items-center justify-center gap-2 w-full bg-brand-lilac text-white py-5 rounded-2xl font-bold hover:bg-brand-dark transition-all">
                {t.activities.knowMore} <ChevronRight size={18} />
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
    <div className="py-24 px-4 max-w-4xl mx-auto animate-fade-in">
      <Link to="/activities" className="text-brand-lilac font-bold mb-8 block flex items-center gap-2">← {t.nav.activities}</Link>
      <h1 className="text-5xl font-bold text-brand-dark mb-8 tracking-tighter">{activity.title}</h1>
      <div className="flex gap-4 mb-12">
        <span className="bg-brand-lilac text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">{t.activities.targetAge}</span>
        <span className="bg-brand-white border border-gray-200 text-brand-dark px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">{activity.duration}</span>
      </div>

      <div className="space-y-16">
        <section className="bg-brand-white p-12 rounded-[3rem] border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Target className="text-brand-lilac" /> Objetivos de Aprendizagem</h2>
          <ul className="space-y-4">
            {activity.objectives.map((obj: string, i: number) => (
              <li key={i} className="flex gap-4 text-gray-600 font-medium">
                <span className="text-brand-lilac font-black">•</span> {obj}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-brand-dark text-white p-12 rounded-[3rem] shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Activity className="text-brand-lilac" /> Visão Geral</h2>
          <p className="text-white/80 text-lg leading-relaxed">{activity.desc}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-brand-dark"><PlayCircle className="text-brand-lilac" /> Etapas Sugeridas</h2>
          <div className="space-y-6">
            {activity.steps.map((step: string, i: number) => (
              <div key={i} className="flex items-center gap-6 p-6 bg-brand-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-brand-lilacLight text-brand-lilac flex items-center justify-center font-black">{i + 1}</div>
                <p className="font-bold text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-brand-blueLight rounded-[2rem] border border-brand-blue/10 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Cpu size={20}/> Hardware & Sensores</h3>
            <p className="text-sm text-gray-500 font-medium">GoGo Board v6 + Sensores de som/temp/umidade conforme atividade.</p>
          </div>
          <div className="p-8 bg-brand-lilacLight rounded-[2rem] border border-brand-lilac/10 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Database size={20}/> Análise Digital</h3>
            <p className="text-sm text-gray-500 font-medium">Visualização exploratória via CODAP (Common Online Data Analysis Platform).</p>
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
      case 'sensores': return <Activity size={40} />;
      case 'codap': return <Database size={40} />;
      default: return <Settings2 size={40} />;
    }
  };

  return (
    <div className="py-24 px-4 max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-5xl font-bold text-brand-dark mb-12 text-center tracking-tight">{t.tools.title}</h1>
      <p className="text-xl text-center text-gray-500 mb-20 max-w-2xl mx-auto font-medium">{t.tools.description}</p>
      
      <div className="space-y-16">
        {t.tools.items.map((tool: any, idx: number) => (
          <div key={tool.id} className="bg-brand-white rounded-[3rem] p-12 border border-gray-200 group hover:shadow-2xl transition-all">
            <div className="flex flex-col md:flex-row items-center gap-12 mb-10">
              <div className="w-24 h-24 bg-brand-lilac text-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform overflow-hidden p-4">
                {getIcon(tool.id)}
              </div>
              <h2 className="text-4xl font-bold text-brand-dark">{tool.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`p-8 ${idx % 2 === 0 ? 'bg-brand-lilacLight' : 'bg-brand-blueLight'} rounded-[2rem] border border-black/5 shadow-sm`}>
                <div className="flex items-center gap-3 mb-4 text-brand-lilac">
                  <Zap size={24} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t.tools.roles.coleta}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{tool.coleta}</p>
              </div>
              
              <div className={`p-8 ${idx % 2 === 0 ? 'bg-brand-blueLight' : 'bg-brand-lilacLight'} rounded-[2rem] border border-black/5 shadow-sm`}>
                <div className="flex items-center gap-3 mb-4 text-brand-blue">
                  <PieChart size={24} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t.tools.roles.analise}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{tool.analise}</p>
              </div>
              
              <div className={`p-8 bg-brand-white rounded-[2rem] border border-black/5 shadow-sm`}>
                <div className="flex items-center gap-3 mb-4 text-brand-lilac">
                  <Share2 size={24} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{t.tools.roles.comunicacao}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{tool.comunicacao}</p>
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
    <div className="py-24 px-4 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-5xl font-bold text-brand-dark mb-24 text-center">{t.docs.title}</h1>
      <div className="space-y-32">
        <section>
          <h2 className="text-3xl font-bold mb-12 flex items-center gap-4 text-brand-lilac"><GraduationCap /> {t.docs.teachers}</h2>
          <div className="bg-brand-white p-12 rounded-[3rem] border border-gray-200 italic text-lg text-gray-500 shadow-sm">"A transição de dados abstratos para evidências coletadas pelos próprios alunos via sensores mudou a forma como eles enxergam a ciência."</div>
        </section>
        <section>
          <h2 className="text-3xl font-bold mb-12 flex items-center gap-4 text-brand-blue"><Users /> {t.docs.students}</h2>
          <div className="bg-brand-blueLight p-10 rounded-[2.5rem] border border-brand-blue/10 text-brand-blue font-bold shadow-sm">"Ver os gráficos subirem no CODAP enquanto fazíamos barulho na sala me ajudou a entender o que é um sensor."</div>
        </section>
      </div>
    </div>
  );
};

const Team = () => {
  const { t } = useLanguage();
  const members = [
    { name: 'Charles Pimentel', role: 'Pesquisador Principal' },
    { name: 'Maria Luiza Campos', role: 'Orientadora' },
    { name: 'Giseli Lopes', role: 'Coorientadora' }
  ];
  return (
    <div className="py-24 px-4 max-w-4xl mx-auto animate-fade-in text-center">
      <h1 className="text-5xl font-bold text-brand-dark mb-24 tracking-tight">{t.team.title}</h1>
      <div className="space-y-8">
        {members.map((m) => (
          <div key={m.name} className="bg-brand-white p-10 rounded-[3rem] border border-gray-200 flex items-center gap-8 group hover:border-brand-lilac transition-all shadow-sm">
             <div className="w-20 h-20 rounded-2xl bg-brand-lilac text-white flex items-center justify-center text-3xl font-black">{m.name.charAt(0)}</div>
             <div className="text-left">
                <h3 className="text-2xl font-bold text-brand-dark">{m.name}</h3>
                <div className="text-brand-lilac font-black text-xs uppercase tracking-widest">{m.role}</div>
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
    <div className="py-24 px-4 max-w-3xl mx-auto text-center animate-fade-in">
      <div className="bg-brand-white p-20 rounded-[4rem] border border-gray-200 shadow-sm">
        <h1 className="text-5xl font-bold text-brand-dark mb-8 tracking-tight">{t.contact.title}</h1>
        <p className="text-xl text-gray-500 mb-16 font-medium">{t.contact.subtitle}</p>
        <div className="bg-brand-lilacLight p-10 rounded-[2.5rem] border border-brand-lilac/10">
          <Mail className="mx-auto mb-4 text-brand-lilac" size={32} />
          <a href="mailto:charlespimentel@ufrj.br" className="text-2xl font-black text-brand-dark hover:text-brand-lilac transition-colors">charlespimentel@ufrj.br</a>
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0% { transform: translateY(0px) rotate(3deg); } 50% { transform: translateY(-20px) rotate(0deg); } 100% { transform: translateY(0px) rotate(3deg); } }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </LanguageContext.Provider>
  );
};

export default App;
