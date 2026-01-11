
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
    tag: string;
    heroTitle: string;
    heroSub: string;
    cta: string;
    coreMessage: string;
    activeLearningTitle: string;
    activeLearningDesc: string;
    features: {
      age: string;
      bloom: string;
      board: string;
      sensors: string;
      interpretation: string;
      communication: string;
    };
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
    durationLabel: string;
    levelLabel: string;
    knowMore: string;
    objectivesTitle: string;
    overviewTitle: string;
    stepsTitle: string;
    hardwareTitle: string;
    hardwareDesc: string;
    analysisTitle: string;
    analysisDesc: string;
    items: Array<{
      id: string;
      title: string;
      desc: string;
      duration: string;
      level: string;
      objectives: string[];
      steps: string[];
    }>;
  };
  tools: {
    title: string;
    description: string;
    roles: {
      coleta: string;
      analise: string;
      comunicacao: string;
    };
    items: Array<{
      id: string;
      name: string;
      coleta: string;
      analise: string;
      comunicacao: string;
    }>;
  };
  docs: {
    title: string;
    teachers: string;
    students: string;
    teacherQuote: string;
    studentQuote: string;
    videos: string;
  };
  team: {
    title: string;
    roles: Record<string, string>;
  };
  contact: {
    title: string;
    subtitle: string;
  };
}
