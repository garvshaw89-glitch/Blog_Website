import {
  ProjectItem,
  EngineeringDomain,
  ConstellationNode,
  ConstellationLink,
  EngineeringLogEntry,
  AiExperiment,
  SkillItem,
} from '../types';

import stockTradingImg from '../assets/images/stock_trading_terminal_1788685213853.jpg';
import financialDashboardImg from '../assets/images/financial_portfolio_dashboard_1788685234765.jpg';
import apiBackendImg from '../assets/images/api_backend_development_1788685793691.jpg';
import frontendDashboardImg from '../assets/images/connected_frontend_dashboard_1788685810432.jpg';
import apiDev3dScreenImg from '../assets/images/api_dev_3d_screen_1788685983207.jpg';
import apiFlow3dScreenImg from '../assets/images/api_flow_3d_screen_1788686000917.jpg';
import salaryosDashboardImg from '../assets/images/salaryos_dashboard_1788686403086.jpg';
import salaryosAnalyticsImg from '../assets/images/salaryos_analytics_1788686420582.jpg';
import salaryosCommandCenterImg from '../assets/images/salaryos_command_center_1788686685851.jpg';
import typingTestMainImg from '../assets/images/typing_test_main_1788686855877.jpg';
import typingTestHeatmapImg from '../assets/images/typing_test_heatmap_1788686875692.jpg';
import typingTestHistoryImg from '../assets/images/typing_test_history_1788686890882.jpg';
import stockmentorLearningPathImg from '../assets/images/stockmentor_learning_path_1788686981081.jpg';
import microskillArcadeDashboardImg from '../assets/images/microskill_arcade_dashboard_1788687163167.jpg';

export const MARQUEE_ITEMS = [
  {
    id: 'stockmentor',
    title: 'StockMentor',
    category: 'AI FinTech Terminal',
    badge: 'AI + Realtime',
    status: 'Live',
    image: stockTradingImg,
    tech: ['Next.js', 'WebSockets', 'Gemini AI', 'Tailwind'],
  },
  {
    id: 'arogyaseva',
    title: 'ArogyaSeva',
    category: 'Healthcare Intelligence',
    badge: 'Now Building',
    status: 'Building',
    image: apiDev3dScreenImg,
    tech: ['FastAPI', 'WebRTC', 'AI Triage', 'Cloud Run'],
  },
  {
    id: 'salaryos',
    title: 'SalaryOS',
    category: 'Compensation Suite',
    badge: 'Production',
    status: 'Live',
    image: salaryosDashboardImg,
    tech: ['Next.js', 'TypeScript', 'Analytics', 'Tailwind'],
  },
  {
    id: 'microskill',
    title: 'MicroSkill',
    category: 'Spaced Repetition Arcade',
    badge: 'EdTech',
    status: 'Live',
    image: microskillArcadeDashboardImg,
    tech: ['React', 'Algorithms', 'Cloud API', 'TypeScript'],
  },
  {
    id: 'typing-speed-check',
    title: 'Typing Test Pro',
    category: 'Performance Telemetry',
    badge: 'Utility',
    status: 'Live',
    image: typingTestMainImg,
    tech: ['Vite', 'Keystroke WPM', 'Canvas Heatmap'],
  },
  {
    id: 'stockmentor-path',
    title: 'Socratic Curriculum',
    category: 'Financial Literacy',
    badge: 'AI Engine',
    status: 'Live',
    image: stockmentorLearningPathImg,
    tech: ['Prompt Engineering', 'LangChain', 'JSON Schema'],
  },
];

// Preserved for backwards compatibility with image marquee
export const MARQUEE_IMAGES = [
  stockTradingImg,
  typingTestMainImg,
  stockmentorLearningPathImg,
  microskillArcadeDashboardImg,
  apiDev3dScreenImg,
  salaryosDashboardImg,
  apiBackendImg,
  typingTestHeatmapImg,
  apiFlow3dScreenImg,
  financialDashboardImg,
  frontendDashboardImg,
  salaryosAnalyticsImg,
  typingTestHistoryImg,
];

// 4 Interactive Engineering Profile Domains
export const ENGINEERING_DOMAINS: EngineeringDomain[] = [
  {
    id: 'ai-engineering',
    title: 'AI Engineering',
    badge: 'LLMs & Agents',
    tagline: 'Orchestrating intelligent models and reasoning pipelines',
    description:
      'Designing domain-grounded AI architectures, autonomous multi-step agents, RAG knowledge systems, and structured generative interfaces with low latency.',
    technologies: ['Gemini 3.8 Flash', 'PyTorch', 'LangChain', 'Vector Embeddings', 'RAG Pipelines', 'Function Calling'],
    capabilities: [
      'Socratic dialogue engine & prompt-chain orchestration',
      'Context-aware retrieval with semantic chunking & ranking',
      'Autonomous agent planning with tool execution verification',
      'Sub-500ms streaming LLM token delivery via WebSocket/SSE',
    ],
    relatedProjects: ['StockMentor', 'ArogyaSeva', 'AI Portfolio Lab'],
    icon: 'BrainCircuit',
  },
  {
    id: 'full-stack',
    title: 'Full-Stack Development',
    badge: 'TypeScript & Next.js',
    tagline: 'High-performance interactive web systems with zero lag',
    description:
      'Crafting resilient end-to-end applications with modern React 19 architecture, strict TypeScript schemas, state machines, and hardware-accelerated animations.',
    technologies: ['React 19', 'Next.js 15', 'TypeScript 5.8', 'Tailwind CSS v4', 'Motion 12', 'Node.js', 'Express'],
    capabilities: [
      'Component-driven atomic architectures with zero bundle bloat',
      'GPU-accelerated CSS and spring physics interactions',
      'Strict Zod runtime schema validation on all API boundaries',
      'Accessible, WCAG AA compliant interactive user interfaces',
    ],
    relatedProjects: ['SalaryOS', 'MicroSkill', 'Typing Speed Check'],
    icon: 'Layers',
  },
  {
    id: 'cloud-systems',
    title: 'Cloud Systems',
    badge: 'DevOps & Containers',
    tagline: 'Scalable cloud infrastructure and serverless deployments',
    description:
      'Building fault-tolerant containerized microservices, serverless compute pipelines, edge caching networks, and automated CI/CD deployment routines.',
    technologies: ['Google Cloud Run', 'AWS Lambda & S3', 'Docker', 'Vercel Edge', 'Cloudflare Workers', 'Terraform', 'GitHub Actions'],
    capabilities: [
      'Multi-region edge routing with sub-50ms TTFB caching',
      'Zero-downtime rolling container deployments with healthchecks',
      'Serverless event ingestion pipelines handling burst traffic',
      'Immutable environment provisioning and CI/CD automation',
    ],
    relatedProjects: ['ArogyaSeva', 'StockMentor', 'SalaryOS'],
    icon: 'Cloud',
  },
  {
    id: 'realtime-systems',
    title: 'Realtime Systems',
    badge: 'WebSockets & Telemetry',
    tagline: 'Sub-millisecond data synchronization and event streaming',
    description:
      'Engineering bidirectional event pipelines, live financial market feeds, interactive telemetry engines, and WebRTC streaming channels.',
    technologies: ['WebSockets', 'WebRTC', 'Server-Sent Events (SSE)', 'FastAPI AsyncIO', 'Redis Pub/Sub', 'Canvas API'],
    capabilities: [
      'High-frequency telemetry feeds rendered at locked 60 FPS',
      'Heartbeat connection recovery and automatic reconnection backoff',
      'Binary frame serialization for low-bandwidth environments',
      'Live peer-to-peer media negotiation and status broadcasts',
    ],
    relatedProjects: ['StockMentor', 'Typing Speed Check', 'ArogyaSeva'],
    icon: 'Activity',
  },
];

export const SKILLS: SkillItem[] = [
  {
    id: 'ai-development',
    number: '01',
    title: 'AI Engineering & LLMs',
    description:
      'Building domain-specific generative models, agentic tool-use loops, RAG context retrieval, and structured JSON generation with Gemini and PyTorch.',
    tags: ['Gemini 3.8 Flash', 'RAG Pipelines', 'Autonomous Agents', 'Vector Search', 'PyTorch', 'Prompt Engineering'],
    capabilities: ['Structured JSON schemas', 'Vector cosine retrieval', 'Streaming token generation', 'Multi-step verification'],
    relatedProjects: ['StockMentor', 'ArogyaSeva', 'AI Lab'],
  },
  {
    id: 'full-stack-architecture',
    number: '02',
    title: 'Full-Stack Architecture',
    description:
      'Developing production-grade web platforms with React 19, TypeScript, Next.js, and Tailwind CSS. Obsessed with high frame rates and modular state management.',
    tags: ['React 19', 'Next.js', 'TypeScript 5.8', 'Tailwind CSS v4', 'Motion 12', 'State Machines'],
    capabilities: ['SSR & Edge Rendering', 'Strict Type Checking', 'Accessible UI Patterns', 'Hardware Acceleration'],
    relatedProjects: ['SalaryOS', 'MicroSkill', 'Typing Speed Check'],
  },
  {
    id: 'cloud-infrastructure',
    number: '03',
    title: 'Cloud & Infrastructure',
    description:
      'Architecting resilient multi-cloud environments, container orchestration with Docker and Cloud Run, serverless backends, and automated CI/CD pipelines.',
    tags: ['Google Cloud Platform', 'AWS Lambda & S3', 'Docker', 'Cloud Run', 'CI/CD Pipelines', 'Vercel Edge'],
    capabilities: ['Containerized microservices', 'Edge DNS & CDN caching', 'Secrets lifecycle management', 'Stateless auto-scaling'],
    relatedProjects: ['ArogyaSeva', 'StockMentor', 'Portfolio System'],
  },
  {
    id: 'realtime-apis',
    number: '04',
    title: 'Realtime & API Engineering',
    description:
      'Engineering high-throughput RESTful and WebSocket microservices, real-time event streaming, binary data packets, and secure API gateways.',
    tags: ['FastAPI', 'WebSockets', 'WebRTC', 'Node.js', 'REST APIs', 'AsyncIO'],
    capabilities: ['Bi-directional streaming', 'Automatic reconnection logic', 'Rate-limiting & Token bucket', 'Sub-millisecond latency'],
    relatedProjects: ['StockMentor', 'Typing Speed Check', 'ArogyaSeva'],
  },
  {
    id: 'systems-c-python',
    number: '05',
    title: 'Systems & Core Computing',
    description:
      'Writing memory-conscious algorithms in C and high-velocity asynchronous data pipelines in Python, leveraging cache locality and socket programming.',
    tags: ['C (C11/POSIX)', 'Python (AsyncIO)', 'Memory Safety', 'Data Structures', 'Socket Networking'],
    capabilities: ['Manual pointer & memory control', 'Cache-conscious data layouts', 'Low-overhead network sockets', 'Multi-threading'],
    relatedProjects: ['Typing Speed Check', 'StockMentor'],
  },
  {
    id: 'financial-analytics',
    number: '06',
    title: 'Quantitative & FinTech Logic',
    description:
      'Analyzing order book microstructure, equity price dynamics, compensation forecasting, and mathematical valuation models in production web interfaces.',
    tags: ['Market Microstructure', 'Financial Modeling', 'Order Book Dynamics', 'Predictive Analytics'],
    capabilities: ['Interactive candlestick calculations', 'Forecasting & scenario modeling', 'Zero-lag numerical telemetry'],
    relatedProjects: ['StockMentor', 'SalaryOS'],
  },
];

export const SERVICES = SKILLS;

// Interactive Technology Constellation Graph
export const CONSTELLATION_NODES: ConstellationNode[] = [
  {
    id: 'ai-core',
    label: 'AI Systems',
    category: 'AI',
    level: 1,
    x: 50,
    y: 18,
    description: 'Foundational generative intelligence & neural modeling',
    whereUsed: 'Orchestrating agent workflows and real-time inference',
    relatedProjects: ['StockMentor', 'ArogyaSeva', 'AI Lab'],
  },
  {
    id: 'llms',
    label: 'LLM Orchestration',
    category: 'AI',
    level: 2,
    x: 28,
    y: 34,
    description: 'Prompt synthesis, structured JSON schema generation & streaming tokens',
    whereUsed: 'Socratic dialogue engine & clinical triage categorization',
    relatedProjects: ['StockMentor', 'ArogyaSeva'],
  },
  {
    id: 'agents',
    label: 'Autonomous Agents',
    category: 'AI',
    level: 2,
    x: 72,
    y: 34,
    description: 'Multi-step planning, tool invocation & verified execution',
    whereUsed: 'Workflow automation and research synthesis pipelines',
    relatedProjects: ['AI Lab', 'ArogyaSeva'],
  },
  {
    id: 'backend',
    label: 'Backend & APIs',
    category: 'Backend',
    level: 3,
    x: 50,
    y: 52,
    description: 'Asynchronous microservices, rate-limiting & WebSocket multiplexing',
    whereUsed: 'FastAPI microservices & Node.js middleware gateways',
    relatedProjects: ['StockMentor', 'SalaryOS', 'ArogyaSeva'],
  },
  {
    id: 'realtime',
    label: 'Realtime Streaming',
    category: 'Backend',
    level: 4,
    x: 24,
    y: 68,
    description: 'Persistent full-duplex WebSockets & WebRTC channels',
    whereUsed: 'Financial candlestick feeds & keystroke telemetry',
    relatedProjects: ['StockMentor', 'Typing Speed Check'],
  },
  {
    id: 'database',
    label: 'Data & State',
    category: 'Data',
    level: 4,
    x: 76,
    y: 68,
    description: 'Relational data modeling, vector stores & in-memory caching',
    whereUsed: 'User sessions, spaced repetition trees & financial records',
    relatedProjects: ['MicroSkill', 'SalaryOS', 'ArogyaSeva'],
  },
  {
    id: 'cloud',
    label: 'Cloud Infrastructure',
    category: 'Cloud',
    level: 5,
    x: 50,
    y: 84,
    description: 'Docker containerization, serverless functions & edge CDN routing',
    whereUsed: 'Google Cloud Run, AWS infrastructure & Vercel production hosting',
    relatedProjects: ['Portfolio System', 'ArogyaSeva', 'SalaryOS'],
  },
];

export const CONSTELLATION_LINKS: ConstellationLink[] = [
  { source: 'ai-core', target: 'llms' },
  { source: 'ai-core', target: 'agents' },
  { source: 'llms', target: 'backend' },
  { source: 'agents', target: 'backend' },
  { source: 'backend', target: 'realtime' },
  { source: 'backend', target: 'database' },
  { source: 'realtime', target: 'cloud' },
  { source: 'database', target: 'cloud' },
  { source: 'backend', target: 'cloud' },
];

// Comprehensive 5 Flagship Projects with Engineering Case Studies
export const PROJECTS: ProjectItem[] = [
  {
    id: 'stockmentor',
    number: '01',
    title: 'StockMentor',
    category: 'AI FinTech Terminal',
    description: 'Quantitative market terminal paired with an interactive AI Socratic market literacy learning path.',
    type: 'FinTech Platform',
    status: 'Live',
    tags: ['Gemini AI', 'Next.js', 'WebSockets', 'FinTech', 'Tailwind'],
    col1TopImage: stockTradingImg,
    col1BottomImage: stockmentorLearningPathImg,
    col2Image: financialDashboardImg,
    githubUrl: 'https://github.com/garvshaw89-glitch/StockMentor',
    liveUrl: 'https://stock-mentor-virid.vercel.app/',
    caseStudy: {
      overview:
        'StockMentor combines a high-frequency quantitative market dashboard with an intelligent Socratic dialogue engine that guides retail investors through risk-adjusted decision frameworks.',
      problem:
        'Traditional stock market tools flood newcomers with disconnected ticker noise and volatile charts without educational scaffolding or risk literacy.',
      solution:
        'Engineered a dual-engine architecture: a low-latency price telemetry interface on the left, paired with an AI-driven Socratic mentor that queries users on risk tolerance, order book spread, and portfolio diversification.',
      role: 'Sole Architect & Full-Stack Engineer — Designed the frontend terminal, WebSocket streaming pipeline, and LLM prompt-chain orchestration.',
      architectureSummary:
        'Browser Client (Next.js) ↔ WebSocket Edge Proxy ↔ Quantitative Market Data Engine + Gemini 3.8 Flash Socratic API.',
      aiComponent:
        'Gemini 3.8 Flash integrated with custom structured output schemas to generate bite-sized Socratic questions rather than generic answers.',
      backend: 'Next.js API routes with Edge runtime and WebSocket streaming hooks.',
      database: 'Serverless PostgreSQL with indexed market metrics and session progression logs.',
      cloudInfra: 'Vercel Edge Network for frontend static assets + Cloud Run microservice for market ticker feed.',
      keyFeatures: [
        'Live candlestick charts with dynamic indicator overlays (RSI, Moving Averages)',
        'Socratic AI Tutor querying user logic before simulating market orders',
        'Gamified financial literacy mastery tree with verifiable skill milestones',
        'Sub-millisecond client-side chart re-renders powered by HTML5 Canvas',
      ],
      engineeringChallenges: [
        'Preventing UI thread lock during high-frequency price feed bursts by batching React state updates using requestAnimationFrame.',
        'Enforcing structured pedagogical tone in the AI mentor using few-shot system instructions and JSON validation.',
      ],
      designDecisions: [
        'High-contrast terminal dark mode (#05070A canvas with emerald & cyan accents) to replicate Bloomberg terminal legibility.',
        'Contextual drawer allowing users to summon the mentor without leaving the active price chart.',
      ],
      result:
        'Delivered a fully responsive, zero-lag financial simulator running live at stock-mentor-virid.vercel.app with verified positive community feedback.',
    },
  },
  {
    id: 'arogyaseva',
    number: '02',
    title: 'ArogyaSeva',
    category: 'Healthcare AI Platform',
    description: 'Intelligent clinical triage system with encrypted realtime tele-consultation and edge routing.',
    type: 'Healthcare System',
    status: 'Building',
    tags: ['AI Triage', 'FastAPI', 'WebRTC', 'Cloud Run', 'PostgreSQL'],
    col1TopImage: apiDev3dScreenImg,
    col1BottomImage: apiFlow3dScreenImg,
    col2Image: apiBackendImg,
    githubUrl: 'https://github.com/garvshaw89-glitch',
    liveUrl: 'https://portfoliowebsite-7tvxld4nh-garvshaw.vercel.app/',
    caseStudy: {
      overview:
        'ArogyaSeva is a modern healthcare access platform designed to streamline patient intake, automate preliminary clinical triage with LLMs, and connect patients to doctors over low-latency WebRTC channels.',
      problem:
        'Overcrowded clinics face severe patient triage bottlenecks, resulting in delayed emergency responses and administrative burnout.',
      solution:
        'Built an AI-assisted intake engine that parses multilingual patient symptoms into structured SOAP notes (Subjective, Objective, Assessment, Plan) for attending medical staff.',
      role: 'Lead Systems Engineer — Designing the clinical triage AI agent, WebRTC signaling server, and HIPAA-conscious data schemas.',
      architectureSummary:
        'React 19 Frontend ↔ Traefik Gateway ↔ FastAPI Async Microservices ↔ Vertex AI / Gemini ↔ PostgreSQL (Encrypted at Rest).',
      aiComponent:
        'Multi-lingual clinical symptom parser utilizing Gemini 3.8 Flash to extract chief complaints, duration, and urgency scoring (Red/Amber/Green).',
      backend: 'FastAPI (Python 3.12) with AsyncIO workers and Redis pub/sub for signaling.',
      database: 'PostgreSQL with field-level AES-256 encryption for patient identifying records.',
      cloudInfra: 'Google Cloud Run with auto-scaling to zero and Cloud Armor DDoS mitigation.',
      keyFeatures: [
        'Intelligent multi-step symptom intake with urgency triage classification',
        'End-to-end encrypted WebRTC audio/video consultations with adaptive bitrate',
        'Automated clinician summary generation reducing doctor paperwork by ~65%',
        'Offline-ready PWA client for low-connectivity rural health workers',
      ],
      engineeringChallenges: [
        'Maintaining WebRTC signaling stability over unstable 3G networks using adaptive ICE trickle candidates and STUN/TURN fallback.',
        'Strict zero-trust data sanitization before forwarding prompts to the AI model to preserve medical privacy.',
      ],
      designDecisions: [
        'Calm clinical UI with deep slate and soft cyan accents, minimizing patient anxiety and maximizing legibility.',
        'High-visibility triage status badges enabling triage nurses to identify emergencies in under 2 seconds.',
      ],
      result:
        'Currently in active engineering and internal testing with prototype validation completed across clinical test scripts.',
    },
  },
  {
    id: 'salaryos',
    number: '03',
    title: 'SalaryOS',
    category: 'Financial Intelligence',
    description: 'Enterprise compensation and personal wealth modeling platform with predictive budgeting pipelines.',
    type: 'FinTech Platform',
    status: 'Live',
    tags: ['Next.js', 'TypeScript', 'Analytics', 'Tailwind', 'Budget Engine'],
    col1TopImage: salaryosDashboardImg,
    col1BottomImage: salaryosCommandCenterImg,
    col2Image: salaryosAnalyticsImg,
    githubUrl: 'https://github.com/garvshaw89-glitch/Salary-OS',
    liveUrl: 'https://salaryos-one.vercel.app/',
    caseStudy: {
      overview:
        'SalaryOS provides professionals and organizations with granular financial clarity, translating gross compensation, tax liabilities, recurring subscriptions, and savings milestones into actionable intelligence.',
      problem:
        'Most budgeting tools are either overly simplistic spreadsheets or invasive apps that sell user telemetry without predictive modeling.',
      solution:
        'Engineered an offline-capable, privacy-first compensation analytics suite that computes net cashflow projections across multiple currency jurisdictions and tax brackets.',
      role: 'Full-Stack Developer & UI Designer — Built all mathematical forecasting modules, interactive charts, and responsive layouts.',
      architectureSummary:
        'Next.js 14 App Router ↔ Client-side Web Worker calculation engine ↔ LocalStorage encrypted state cache.',
      aiComponent: 'Heuristic expense anomaly detection flagging unusual recurring fee changes.',
      backend: 'Next.js server actions with Zod validation and cryptographic session storage.',
      database: 'IndexedDB for encrypted client-side persistence + cloud sync via Supabase.',
      cloudInfra: 'Vercel Edge Network deployment with global CDN asset replication.',
      keyFeatures: [
        'Instant take-home pay calculator with federal, state, and retirement deductions',
        'Recurring subscription burn-rate radar with automated renewal alerts',
        'Target savings velocity timeline modeling Monte Carlo wealth scenarios',
        'Exportable executive PDF summary sheets for tax and salary negotiations',
      ],
      engineeringChallenges: [
        'Running multi-year compound interest and tax calculation loops on main thread without dropping frames: offloaded to dedicated Web Workers.',
        'Designing an ultra-dense executive data grid that scales seamlessly down to mobile screens.',
      ],
      designDecisions: [
        'Adopted a sleek fintech dashboard aesthetic inspired by Linear and Stripe with 1px border precision and monochrome typography.',
      ],
      result:
        'Deployed live at salaryos-one.vercel.app, empowering users to make confident financial planning decisions.',
    },
  },
  {
    id: 'microskill',
    number: '04',
    title: 'MicroSkill',
    category: 'EdTech Arcade',
    description: 'Science-backed micro-learning platform translating CS concepts into gamified coding milestones.',
    type: 'EdTech Arcade',
    status: 'Live',
    tags: ['React', 'Algorithms', 'Spaced Repetition', 'TypeScript', 'Cloud'],
    col1TopImage: apiBackendImg,
    col1BottomImage: microskillArcadeDashboardImg,
    col2Image: frontendDashboardImg,
    githubUrl: 'https://github.com/garvshaw89-glitch/MicroSkill-Version-1.0',
    liveUrl: 'https://microskillversion-10.vercel.app/',
    caseStudy: {
      overview:
        'MicroSkill breaks down complex computer science disciplines (operating systems, distributed architectures, algorithms) into 3-minute interactive arcade challenges.',
      problem:
        'Traditional engineering tutorials are long, passive, and suffer from an 80%+ drop-off rate due to cognitive fatigue.',
      solution:
        'Implemented the SuperMemo SM-2 spaced repetition algorithm paired with an in-browser interactive code simulation engine.',
      role: 'Lead Architect — Developed the spaced repetition scheduler, code validator, and gamified reward pipeline.',
      architectureSummary:
        'React SPA ↔ Micro-kernel State Machine ↔ Cloud Functions code evaluator.',
      backend: 'Serverless Node.js microservices handling challenge verification.',
      database: 'Cloud Firestore tracking user mastery trees and streaks.',
      cloudInfra: 'Global CDN distribution with instant client state hydration.',
      keyFeatures: [
        'SM-2 algorithmic spaced repetition review queue',
        'In-browser syntax-highlighted code editor with instant verification',
        'Visual skill tree progression unlocking advanced systems concepts',
        'Zero-latency offline lesson completion syncing on reconnect',
      ],
      engineeringChallenges: [
        'Safe sandboxed client-side evaluation of user code snippets without memory leakage or arbitrary code execution.',
      ],
      designDecisions: [
        'Vibrant arcade aesthetic with cybernetic achievement badges and retro-futuristic audio-visual rewards.',
      ],
      result:
        'Live at microskillversion-10.vercel.app, helping learners master core computing concepts through continuous micro-practice.',
    },
  },
  {
    id: 'typing-speed-check',
    number: '05',
    title: 'Typing Test Pro',
    category: 'Performance Utility',
    description: 'Real-time keystroke velocity engine calculating live WPM, accuracy heatmaps, and error diagnostics.',
    type: 'Performance Utility',
    status: 'Live',
    tags: ['JavaScript', 'Vite', 'Keystroke WPM', 'Canvas Heatmap', 'Zero-Lag'],
    col1TopImage: typingTestMainImg,
    col1BottomImage: typingTestHistoryImg,
    col2Image: typingTestHeatmapImg,
    githubUrl: 'https://github.com/garvshaw89-glitch/Typing-Speed-Checker-',
    liveUrl: 'https://typing-speed-testing-kappa.vercel.app/',
    caseStudy: {
      overview:
        'A high-precision keystroke analytics laboratory that computes raw WPM, net WPM, keystroke standard deviation, and finger-by-finger error distribution in real time.',
      problem:
        'Most typing tests suffer from event loop lag on fast typists (>120 WPM), causing dropped keypresses and inaccurate cadence metrics.',
      solution:
        'Engineered an event-driven keystroke buffer that timestamps keydown events with microsecond precision using performance.now().',
      role: 'Performance Engineer — Built the zero-lag keystroke engine and dynamic keyboard heatmap visualization.',
      architectureSummary:
        'Vite + Vanilla JS Core ↔ High-resolution DOM event loop ↔ Canvas telemetry renderer.',
      backend: 'Client-side zero-server execution for absolute data privacy and zero network latency.',
      database: 'LocalStorage telemetry history with statistical standard deviation curves.',
      cloudInfra: 'Vercel Edge static hosting with immutable cache headers.',
      keyFeatures: [
        'Microsecond-accurate WPM / CPM velocity calculator',
        'Live interactive keyboard heatmap pinpointing inaccurate finger reaches',
        'Dynamic error classification (omissions, transpositions, insertions)',
        'Historical graph plotting speed improvement trends over time',
      ],
      engineeringChallenges: [
        'Eliminating layout thrashing during 150+ WPM typing bursts: used detached DOM fragments and Canvas drawing passes.',
      ],
      designDecisions: [
        'Minimalist, distraction-free monochrome interface that subtly shifts to glowing cyan upon reaching personal best speeds.',
      ],
      result:
        'Live at typing-speed-testing-kappa.vercel.app, widely used for benchmark typing tests.',
    },
  },
];

// Engineering Log Entries
export const ENGINEERING_LOGS: EngineeringLogEntry[] = [
  {
    id: 'log-01',
    date: '27 SEP 2026',
    category: 'Realtime Architecture',
    title: 'ArogyaSeva Realtime Healthcare Infrastructure',
    summary:
      'Architected WebRTC signaling and bidirectional WebSocket fallback for telemedicine consultations over low-bandwidth cellular networks.',
    technologies: ['FastAPI', 'WebRTC', 'WebSockets', 'Cloud Run'],
    relatedProject: 'ArogyaSeva',
    details: [
      'Implemented trickle ICE candidate exchange to cut connection handshake latency by 42%.',
      'Configured automatic Opus audio codec fallback when packet loss exceeds 8%.',
      'Containerized signaling microservice using Alpine Docker images under 65MB.',
    ],
  },
  {
    id: 'log-02',
    date: '24 SEP 2026',
    category: 'AI Systems',
    title: 'Multi-Step Autonomous Agent Workflow & Tool Calling',
    summary:
      'Engineered an autonomous research agent utilizing Gemini 3.8 Flash with structured schema function calling and verification passes.',
    technologies: ['Gemini 3.8 Flash', 'Python', 'JSON Schema', 'LangChain'],
    relatedProject: 'AI Lab',
    details: [
      'Built a deterministic state machine for Plan → Tool Call → Syntax Check → Execution.',
      'Reduced hallucination rate to near-zero by enforcing ground truth citation constraints in the prompt context.',
    ],
  },
  {
    id: 'log-03',
    date: '21 SEP 2026',
    category: 'Interactive 3D & UI',
    title: 'Holographic Mouse-Tracking & Spatial Depth in Motion 12',
    summary:
      'Developed gyroscopic 3D perspective transform matrix with spring damping physics to create realistic tactile UI cards without WebGL overhead.',
    technologies: ['React 19', 'Motion 12', 'CSS 3D Transforms', 'TypeScript'],
    relatedProject: 'Portfolio System',
    details: [
      'Mapped normalized mouse coordinates [-1, 1] to rotateX and rotateY angles clamped at ±12 degrees.',
      'Applied multi-plane translateZ layering to give distinct optical depth to text, badges, and tech reticles.',
    ],
  },
  {
    id: 'log-04',
    date: '15 SEP 2026',
    category: 'FinTech Telemetry',
    title: 'StockMentor Candlestick Optimization at 60 FPS',
    summary:
      'Optimized client-side financial chart rendering pipeline to eliminate garbage collection pauses during rapid WebSocket ticker updates.',
    technologies: ['Next.js', 'Canvas API', 'WebSockets', 'Tailwind'],
    relatedProject: 'StockMentor',
    details: [
      'Replaced heavy SVG charts with an offscreen Canvas double-buffer pattern.',
      'Batched 100+ ticker events per second into single 16.6ms requestAnimationFrame render ticks.',
    ],
  },
];

// AI Lab Experiments
export const AI_EXPERIMENTS: AiExperiment[] = [
  {
    id: 'ai-assistant',
    title: 'AI Portfolio Assistant',
    badge: 'Live Gemini Model',
    status: 'Interactive',
    whatItDoes:
      'Answers technical questions about Garv Shaw’s architecture, projects, cloud deployments, and AI methodology.',
    howItWorks:
      'Grounds user prompts against a verified portfolio knowledge graph, then queries Gemini 3.8 Flash with low-temperature precision.',
    technology: ['Gemini 3.8 Flash', 'Node.js Express Proxy', 'Prompt Grounding', 'Rate-Limiting'],
  },
  {
    id: 'rag-sim',
    title: 'RAG & Semantic Retrieval Simulator',
    badge: 'Interactive Demo',
    status: 'Interactive',
    whatItDoes:
      'Simulates vector chunking, cosine similarity scoring, and context injection into an LLM generation pipeline.',
    howItWorks:
      'Computes vector cosine similarity between your query and portfolio knowledge chunks in real-time, displaying the ranked matches.',
    technology: ['Vector Embeddings', 'Cosine Similarity', 'Chunking Strategy', 'Context Windows'],
  },
  {
    id: 'agent-workflow',
    title: 'Autonomous Multi-Step Agent Execution',
    badge: 'Workflow Trace',
    status: 'Interactive',
    whatItDoes:
      'Visualizes an AI agent decomposing a high-level engineering goal into discrete tool executions and self-correction cycles.',
    howItWorks:
      'Step-by-step interactive runner showing Intent → Plan Generation → Tool Invocation → Code Validation → Output.',
    technology: ['Autonomous State Machines', 'Function Calling', 'Deterministic Verification'],
  },
];

export const ABOUT_3D_ASSETS = {
  moon: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png',
  object3D: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png',
  lego: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png',
  group3D: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png',
};

export const HERO_PORTRAIT =
  'https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png';

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/garvshaw89-glitch', label: 'github.com/garvshaw89-glitch' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/garv-shaw-08a33237b', label: 'linkedin.com/in/garv-shaw' },
  { name: 'Instagram', url: 'https://instagram.com/garvshaw', label: '@garvshaw' },
  { name: 'Email', url: 'mailto:garvshawinfo@gmail.com', label: 'garvshawinfo@gmail.com' },
];
