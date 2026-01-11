
export type Language = 'pt' | 'en';

export interface TranslationContent {
  nav: {
    home: string;
    about: string;
    activities: string;
    tools: string;
    docs: string;
    team: string;
    contact: string;
  };
  home: {
    heroTitle: string;
    heroSub: string;
    cta: string;
    coreMessage: string;
  };
  about: {
    title: string;
    description: string;
    focusTitle: string;
    focusDesc: string;
    bloomTitle: string;
    bloomDesc: string;
    realTimeTitle: string;
    realTimeDesc: string;
  };
  activities: {
    title: string;
    subtitle: string;
    targetAge: string;
    duration: string;
    level: string;
    knowMore: string;
  };
  tools: {
    title: string;
    description: string;
  };
  docs: {
    title: string;
    teachers: string;
    students: string;
    videos: string;
  };
  team: {
    title: string;
  };
  contact: {
    title: string;
    subtitle: string;
  };
}
