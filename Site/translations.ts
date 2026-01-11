
import { TranslationContent } from './types';

export const translations: Record<'pt' | 'en', TranslationContent> = {
  pt: {
    nav: {
      home: 'Início',
      about: 'Sobre',
      activities: 'Atividades',
      tools: 'Ferramentas',
      docs: 'Depoimentos',
      team: 'Equipe',
      contact: 'Contato'
    },
    home: {
      tag: 'Iniciativa GRECO - UFRJ',
      heroTitle: 'GoGoData',
      heroSub: 'Letramento de dados em tempo real para transformar a educação.',
      cta: 'Ver Atividades',
      coreMessage: 'Entendemos os dados como um meio potente de comunicação, interpretação e criação. Nossa missão é capacitar estudantes a lerem o mundo através de evidências concretas.',
      activeLearningTitle: 'Aprendizagem Ativa com Dados',
      activeLearningDesc: 'Investigação constante via hardware aberto, conectando estudantes aos anos finais do Ensino Fundamental com a realidade científica digital.',
      features: {
        age: '13-14 Anos',
        bloom: 'Bloom Digital',
        board: 'GoGo Board',
        sensors: 'Sensores Reais',
        interpretation: 'Interpretação',
        communication: 'Comunicação'
      }
    },
    about: {
      title: 'Sobre o Projeto',
      description: 'O GoGoData é uma iniciativa desenvolvida pelo GRECO UFRJ, com apoio do TLTL da Columbia University e do TLIC da Chiang Mai University. Focamos na implementação de práticas de letramento de dados em contextos escolares.',
      focusTitle: 'Foco Educacional',
      focusDesc: 'Nosso foco está no desenvolvimento do pensamento crítico e científico através de dados reais e sensores, permitindo decisões informadas.',
      bloomTitle: 'Taxonomia Digital de Bloom',
      bloomDesc: 'Utilizamos uma progressão que guia o estudante desde a compreensão básica até a análise complexa e criação baseada em evidências.',
      realTimeTitle: 'Dados em Tempo Real',
      realTimeDesc: 'Trabalhar com sensores e dados ao vivo torna a aprendizagem investigativa tangível e relevante para o contexto escolar.'
    },
    activities: {
      title: 'Atividades',
      subtitle: 'Desenvolvidas exclusivamente para estudantes de 13 e 14 anos (Ensino Fundamental).',
      targetAge: '13-14 anos',
      durationLabel: 'Duração',
      levelLabel: 'Foco Cognitivo',
      knowMore: 'Ver Detalhes',
      objectivesTitle: 'Objetivos',
      overviewTitle: 'Visão Geral',
      stepsTitle: 'Etapas',
      hardwareTitle: 'Hardware & Sensores',
      hardwareDesc: 'GoGo Board v6 + Sensores de som/temp/umidade conforme atividade.',
      analysisTitle: 'Análise Digital',
      analysisDesc: 'Visualização exploratória via CODAP (Common Online Data Analysis Platform).',
      items: [
        {
          id: 'data-detectives',
          title: 'Detetives de Dados',
          desc: 'Investigação de níveis de som no ambiente escolar utilizando sensores em tempo real.',
          duration: '2 aulas (50 min cada)',
          level: 'Analisar e Interpretar',
          objectives: ['Compreender coleta de dados', 'Analisar conjuntos ambientais', 'Formular conclusões empíricas'],
          steps: ['Calibração de sensores de som', 'Coleta em espaços variados', 'Discussão de hipóteses']
        },
        {
          id: 'sound-mapping',
          title: 'Mapeamento Sonoro',
          desc: 'Coleta de níveis sonoros em diferentes locais e análise comparativa no CODAP.',
          duration: '2 aulas (50 min cada)',
          level: 'Analisar e Comunicar',
          objectives: ['Relacionar espaços a valores', 'Calcular médias e comparar conjuntos', 'Comunicar via gráficos'],
          steps: ['Mapeamento por locais fixos', 'Organização no CODAP', 'Apresentação de evidências']
        },
        {
          id: 'temp-patterns',
          title: 'Padrões de Temperatura',
          desc: 'Monitoramento longitudinal com GoGo Board para identificar variações térmicas diárias.',
          duration: '3 aulas (50 min cada)',
          level: 'Analisar e Avaliar',
          objectives: ['Coletar dados longitudinais', 'Identificar padrões temporais', 'Relacionar variáveis ambientais'],
          steps: ['Instalação de sensores fixos', 'Monitoramento semanal', 'Análise de tendências']
        },
        {
          id: 'env-monitoring',
          title: 'Monitoramento Ambiental',
          desc: 'Uso de múltiplos sensores para avaliar umidade e luz, criando explicações baseadas em dados.',
          duration: '3 aulas (50 min cada)',
          level: 'Avaliar e Criar',
          objectives: ['Compreender hardware de sensores', 'Analisar dados em tempo real', 'Criar representações digitais'],
          steps: ['Configuração da GoGo Board', 'Coleta multidimensional', 'Criação de dashboard no CODAP']
        }
      ]
    },
    tools: {
      title: 'Ferramentas',
      description: 'Tecnologias focadas em hardware aberto e análise exploratória digital.',
      roles: {
        coleta: 'Coleta de dados em tempo real',
        analise: 'Análise de dados',
        comunicacao: 'Comunicação e interpretação'
      },
      items: [
        {
          id: 'gogoboard',
          name: 'GoGo Board',
          coleta: 'Hardware de baixo custo que permite a conexão simultânea de diversos sensores para monitoramento contínuo.',
          analise: 'Processamento imediato de sinais analógicos em informações digitais para visualização dinâmica.',
          comunicacao: 'Facilitata a interação direta do estudante com o ambiente físico através de uma interface eletrônica compreensível.'
        },
        {
          id: 'sensores',
          name: 'Sensores',
          coleta: 'Captura precisa de fenômenos físicos (luz, som, temperatura, umidade) transformando-os em fluxos de dados.',
          analise: 'Fornecem a base quantitativa necessária para a identificação de padrões e variações no ambiente escolar.',
          comunicacao: 'Traduzem variações ambientais invisíveis em representações numéricas prontas para a análise crítica.'
        },
        {
          id: 'codap',
          name: 'CODAP',
          coleta: 'Plataforma que recebe e organiza fluxos de dados importados dinamicamente para exploração imediata.',
          analise: 'Ambiente visual de arrastar e soltar para criação de gráficos, tabelas e exploração de correlações estatísticas.',
          comunicacao: 'Permite que estudantes construam visualizações poderosas para justificar suas conclusões e partilhar descobertas.'
        }
      ]
    },
    docs: {
      title: 'Depoimentos',
      teachers: 'Vozes dos Professores',
      students: 'Vozes dos Estudantes',
      teacherQuote: '"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."',
      studentQuote: '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."',
      videos: 'Vídeos'
    },
    team: {
      title: 'Nossa Equipe',
      roles: {
        pi: 'Pesquisador Principal',
        advisor: 'Orientadora',
        coadvisor: 'Coorientadora'
      }
    },
    contact: {
      title: 'Contato',
      subtitle: 'Entre em contato conosco via e-mail.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      activities: 'Activities',
      tools: 'Tools',
      docs: 'Testimonials',
      team: 'Team',
      contact: 'Contact'
    },
    home: {
      tag: 'GRECO - UFRJ Initiative',
      heroTitle: 'GoGoData',
      heroSub: 'Real-time data literacy to transform education.',
      cta: 'View Activities',
      coreMessage: 'We see data as a powerful medium for communication, interpretation, and creation. Our mission is to empower students to read the world through evidence.',
      activeLearningTitle: 'Active Learning with Data',
      activeLearningDesc: 'Constant investigation via open hardware, connecting students in the final years of Middle School with digital scientific reality.',
      features: {
        age: '13-14 Years',
        bloom: 'Digital Bloom',
        board: 'GoGo Board',
        sensors: 'Real Sensors',
        interpretation: 'Interpretation',
        communication: 'Communication'
      }
    },
    about: {
      title: 'About the Project',
      description: 'GoGoData is an initiative developed by GRECO UFRJ, with support from Columbia University (TLTL) and Chiang Mai University (TLIC). We focus on implementing data literacy practices in school contexts.',
      focusTitle: 'Educational Focus',
      focusDesc: 'Developing critical and scientific thinking through real data and sensors, enabling informed decisions.',
      bloomTitle: 'Bloom\'s Digital Taxonomy',
      bloomDesc: 'A progression guiding students from basic understanding to complex analysis and evidence-based creation.',
      realTimeTitle: 'Real-Time Data',
      realTimeDesc: 'Working with live data and sensors makes investigative learning tangible and relevant to the school context.'
    },
    activities: {
      title: 'Activities',
      subtitle: 'Developed exclusively for students aged 13 and 14 (Middle School).',
      targetAge: '13-14 years',
      durationLabel: 'Duration',
      levelLabel: 'Cognitive Focus',
      knowMore: 'Details',
      objectivesTitle: 'Objectives',
      overviewTitle: 'Overview',
      stepsTitle: 'Steps',
      hardwareTitle: 'Hardware & Sensors',
      hardwareDesc: 'GoGo Board v6 + Sensors (sound/temp/humidity) as per activity.',
      analysisTitle: 'Digital Analysis',
      analysisDesc: 'Exploratory visualization via CODAP (Common Online Data Analysis Platform).',
      items: [
        {
          id: 'data-detectives',
          title: 'Data Detectives',
          desc: 'Investigating sound levels in the school environment using real-time sensors.',
          duration: '2 classes (50 min each)',
          level: 'Analyze and Interpret',
          objectives: ['Understand data collection', 'Analyze environmental datasets', 'Formulate empirical conclusions'],
          steps: ['Sensor calibration', 'Multi-space collection', 'Hypothesis discussion']
        },
        {
          id: 'sound-mapping',
          title: 'Sound Mapping',
          desc: 'Collecting sound levels in different locations and comparative analysis in CODAP.',
          duration: '2 classes (50 min each)',
          level: 'Analyze and Communicate',
          objectives: ['Relate spaces to values', 'Compare datasets', 'Communicate via graphs'],
          steps: ['Fixed point mapping', 'CODAP organization', 'Evidence presentation']
        },
        {
          id: 'temp-patterns',
          title: 'Temperature Patterns',
          desc: 'Longitudinal monitoring with GoGo Board to identify daily thermal variations.',
          duration: '3 classes (50 min each)',
          level: 'Analyze and Evaluate',
          objectives: ['Collect longitudinal data', 'Identify temporal patterns', 'Relate environmental variables'],
          steps: ['Fixed sensor installation', 'Weekly monitoring', 'Trend analysis']
        },
        {
          id: 'env-monitoring',
          title: 'Environmental Monitoring',
          desc: 'Using multiple sensors for humidity and light, creating data-driven explanations.',
          duration: '3 classes (50 min each)',
          level: 'Evaluate and Create',
          objectives: ['Understand sensor hardware', 'Analyze real-time data', 'Create digital representations'],
          steps: ['GoGo Board setup', 'Multidimensional collection', 'CODAP dashboard creation']
        }
      ]
    },
    tools: {
      title: 'Tools',
      description: 'Open hardware and exploratory digital analysis tools.',
      roles: {
        coleta: 'Real-time data collection',
        analise: 'Data analysis',
        comunicacao: 'Communication and interpretation'
      },
      items: [
        {
          id: 'gogoboard',
          name: 'GoGo Board',
          coleta: 'Low-cost hardware allowing simultaneous connection of various sensors for continuous monitoring.',
          analise: 'Immediate processing of analog signals into digital info for dynamic visualization.',
          comunicacao: 'Facilitates direct student interaction with physical environment through a clear interface.'
        },
        {
          id: 'sensores',
          name: 'Sensors',
          coleta: 'Precise capture of physical phenomena (light, sound, temp, humidity) into data streams.',
          analise: 'Provides quantitative basis for identifying patterns and variations in school environment.',
          comunicacao: 'Translates invisible variations into numerical representations for critical analysis.'
        },
        {
          id: 'codap',
          name: 'CODAP',
          coleta: 'Platform for dynamically importing and organizing data streams for immediate exploration.',
          analise: 'Visual drag-and-drop environment for graphs, tables, and statistical correlations.',
          comunicacao: 'Allows students to build powerful visualizations to justify conclusions and share findings.'
        }
      ]
    },
    docs: {
      title: 'Testimonials',
      teachers: 'Teacher Voices',
      students: 'Student Voices',
      teacherQuote: '"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."',
      studentQuote: '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."',
      videos: 'Videos'
    },
    team: {
      title: 'Our Team',
      roles: {
        pi: 'Principal Researcher',
        advisor: 'Advisor',
        coadvisor: 'Co-advisor'
      }
    },
    contact: {
      title: 'Contact',
      subtitle: 'Get in touch with us via email.'
    }
  }
};
