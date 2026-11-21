import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Database,
  Bot,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Braces,
} from 'lucide-react';
import { GlitchHeading } from './ui/GlitchHeading';
import {
  PROJECTS,
  ENGINEERING_LOGS,
  SKILLS,
  ENGINEERING_DOMAINS,
} from '../data/portfolioData';

interface AiLabSectionProps {
  inSheet?: boolean;
  id?: string;
}

interface CorpusChunk {
  id: string;
  source: string;
  title: string;
  text: string;
  tokens: string[];
}

interface RagMatch {
  chunk: CorpusChunk;
  score: number;
  matchedTerms: string[];
}

interface AgentScenario {
  id: string;
  label: string;
  steps: Array<{
    step: number;
    title: string;
    desc: string;
    accent: string;
    payload: Record<string, unknown>;
  }>;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'does', 'do', 'how', 'what', 'why', 'where', 'this', 'that',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length > 1 && !STOP_WORDS.has(tok));
}

const AGENT_SCENARIOS: AgentScenario[] = [
  {
    id: 'arogyaseva-webrtc',
    label: 'ArogyaSeva WebRTC Latency',
    steps: [
      {
        step: 1,
        title: 'STEP 01 · INTENT DECOMPOSITION',
        desc: 'User Objective: Analyze ArogyaSeva WebRTC packet latency and propose edge optimization.',
        accent: 'text-sky-400',
        payload: { goal: 'reduce_signaling_rtt', service: 'arogyaseva-signaling', target_p95_ms: 40 },
      },
      {
        step: 2,
        title: 'STEP 02 · TOOL CALL · inspect_webrtc_signaling()',
        desc: 'Querying STUN/TURN latency matrix across cellular regions.',
        accent: 'text-indigo-300',
        payload: { tool: 'inspect_webrtc_signaling', region: 'ap-south-1', turn_rtt_ms: 68, blocking_ice: true },
      },
      {
        step: 3,
        title: 'STEP 03 · HEURISTIC PROPOSAL',
        desc: 'Enable trickle ICE candidates + Opus DTX voice fallback above 8% packet loss.',
        accent: 'text-violet-300',
        payload: { patch: 'enable_trickle_ice', projected_handshake_delta: '-42%', audio_codec: 'opus/48000' },
      },
      {
        step: 4,
        title: 'STEP 04 · VERIFICATION AUDIT',
        desc: 'Deterministic verification passed; telemetry schema validated via Zod.',
        accent: 'text-emerald-400',
        payload: { status: 'VERIFIED', handshake_p95_ms: 39, regression_checks: '4/4 passed' },
      },
    ],
  },
  {
    id: 'stockmentor-canvas',
    label: 'StockMentor Ticker Pipeline',
    steps: [
      {
        step: 1,
        title: 'STEP 01 · INTENT DECOMPOSITION',
        desc: 'Isolate React re-render drops during 120+ WebSocket ticker bursts/sec.',
        accent: 'text-sky-400',
        payload: { goal: 'eliminate_frame_drops', module: 'stockmentor-terminal', budget_ms: 16.6 },
      },
      {
        step: 2,
        title: 'STEP 02 · TOOL CALL · profile_tick_pipeline()',
        desc: 'Measuring main-thread state reconciliations per tick frame.',
        accent: 'text-indigo-300',
        payload: { tool: 'profile_tick_pipeline', events_per_sec: 140, react_commits_per_sec: 140, frame_time_ms: 29.4 },
      },
      {
        step: 3,
        title: 'STEP 03 · BUFFER OPTIMIZATION',
        desc: 'Batch incoming frames in a ring buffer synced to requestAnimationFrame + Canvas double-buffer.',
        accent: 'text-violet-300',
        payload: { pattern: 'raf_ring_buffer', max_draw_hz: 60, gc_pause_reduction: '88%' },
      },
      {
        step: 4,
        title: 'STEP 04 · VERIFICATION AUDIT',
        desc: 'Locked 60 FPS frame pacing confirmed under synthetic burst replay.',
        accent: 'text-emerald-400',
        payload: { status: 'VERIFIED', median_frame_ms: 8.2, dropped_frames: 0 },
      },
    ],
  },
  {
    id: 'salaryos-worker',
    label: 'SalaryOS Worker Math',
    steps: [
      {
        step: 1,
        title: 'STEP 01 · INTENT DECOMPOSITION',
        desc: 'Keep slider interactions zero-lag while computing Monte Carlo wealth trajectories.',
        accent: 'text-sky-400',
        payload: { goal: 'offload_forecast_compute', module: 'salaryos-engine', iterations: 10000 },
      },
      {
        step: 2,
        title: 'STEP 02 · TOOL CALL · measure_sync_forecast()',
        desc: 'Benchmarking compound tax & inflation solver synchronously on UI thread.',
        accent: 'text-indigo-300',
        payload: { tool: 'measure_sync_forecast', horizon_years: 30, blocking_ms: 142 },
      },
      {
        step: 3,
        title: 'STEP 03 · WORKER ISOLATION',
        desc: 'Moved projection kernel into dedicated Web Worker with transferable Float64Array.',
        accent: 'text-violet-300',
        payload: { worker: 'compensation.worker.ts', transfer: 'Float64Array', main_thread_ms: 1.4 },
      },
      {
        step: 4,
        title: 'STEP 04 · VERIFICATION AUDIT',
        desc: 'Deterministic precision verified against baseline reference tests.',
        accent: 'text-emerald-400',
        payload: { status: 'VERIFIED', delta_error: 0, input_latency_ms: 2.1 },
      },
    ],
  },
];

export const AiLabSection: React.FC<AiLabSectionProps> = ({
  inSheet = false,
  id = 'ai-lab',
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'rag' | 'agent'>('assistant');

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: "Hello. Ask me about Garv Shaw's AI engineering, cloud architectures, StockMentor, ArogyaSeva, or technical methodology.",
      model: 'gemini-3.8-flash',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [ragQuery, setRagQuery] = useState('How does StockMentor handle high-frequency WebSocket trading updates?');
  const [ragResults, setRagResults] = useState<RagMatch[] | null>(null);
  const [isSimulatingRag, setIsSimulatingRag] = useState(false);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(AGENT_SCENARIOS[0].id);
  const [agentStep, setAgentStep] = useState(1);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Build real portfolio knowledge corpus & IDF index for client-side cosine similarity
  const { corpus, idfMap } = useMemo(() => {
    const items: CorpusChunk[] = [];

    PROJECTS.forEach((p) => {
      const text = [
        p.title,
        p.category,
        p.description,
        p.tags.join(' '),
        p.caseStudy?.architectureSummary || '',
        p.caseStudy?.solution || '',
        ...(p.caseStudy?.engineeringChallenges || []),
      ].join(' ');
      items.push({
        id: `project-${p.id}`,
        source: `PROJECT · ${p.title.toUpperCase()}`,
        title: `${p.title} — ${p.category}`,
        text: `${p.caseStudy?.architectureSummary || p.description} ${p.caseStudy?.engineeringChallenges?.[0] || ''}`.trim(),
        tokens: tokenize(text),
      });
    });

    ENGINEERING_LOGS.forEach((log) => {
      const text = `${log.title} ${log.category} ${log.summary} ${log.technologies.join(' ')} ${log.details.join(' ')}`;
      items.push({
        id: log.id,
        source: `LOG · ${log.relatedProject.toUpperCase()}`,
        title: log.title,
        text: `${log.summary} ${log.details[0] || ''}`.trim(),
        tokens: tokenize(text),
      });
    });

    SKILLS.forEach((sk) => {
      const text = `${sk.title} ${sk.description} ${sk.tags.join(' ')} ${sk.capabilities.join(' ')}`;
      items.push({
        id: `skill-${sk.id}`,
        source: 'CAPABILITY SPEC',
        title: sk.title,
        text: sk.description,
        tokens: tokenize(text),
      });
    });

    ENGINEERING_DOMAINS.forEach((dom) => {
      const text = `${dom.title} ${dom.tagline} ${dom.description} ${dom.technologies.join(' ')}`;
      items.push({
        id: `domain-${dom.id}`,
        source: 'DOMAIN ARCHITECTURE',
        title: dom.title,
        text: `${dom.tagline}. ${dom.description}`,
        tokens: tokenize(text),
      });
    });

    const df = new Map<string, number>();
    items.forEach((doc) => {
      const unique = new Set(doc.tokens);
      unique.forEach((term) => df.set(term, (df.get(term) || 0) + 1));
    });

    const N = items.length;
    const idf = new Map<string, number>();
    df.forEach((count, term) => {
      idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
    });

    return { corpus: items, idfMap: idf };
  }, []);

  const executeCosineSearch = (queryStr: string): RagMatch[] => {
    const qTokens = tokenize(queryStr);
    if (qTokens.length === 0) return [];

    const qTf = new Map<string, number>();
    qTokens.forEach((t) => qTf.set(t, (qTf.get(t) || 0) + 1));

    const qVec = new Map<string, number>();
    let qNormSq = 0;
    qTf.forEach((tf, term) => {
      const w = tf * (idfMap.get(term) || 1);
      qVec.set(term, w);
      qNormSq += w * w;
    });
    const qNorm = Math.sqrt(qNormSq) || 1;

    const scored: RagMatch[] = corpus.map((doc) => {
      const dTf = new Map<string, number>();
      doc.tokens.forEach((t) => dTf.set(t, (dTf.get(t) || 0) + 1));

      let dot = 0;
      let dNormSq = 0;
      const matchedTerms: string[] = [];

      dTf.forEach((tf, term) => {
        const w = tf * (idfMap.get(term) || 1);
        dNormSq += w * w;
        const qW = qVec.get(term);
        if (qW) {
          dot += w * qW;
          matchedTerms.push(term);
        }
      });

      const dNorm = Math.sqrt(dNormSq) || 1;
      const rawCos = dot / (qNorm * dNorm);
      // Slight lexical coverage boost so multi-term overlap ranks above single common term hits
      const coverage = matchedTerms.length / Math.max(1, qVec.size);
      const combined = Math.min(0.999, rawCos * 0.8 + coverage * 0.2);

      return {
        chunk: doc,
        score: Number(combined.toFixed(3)),
        matchedTerms,
      };
    });

    return scored
      .filter((r) => r.score > 0.02)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const suggestedPrompts = [
    'What projects use AI and how are they architected?',
    'Tell me about ArogyaSeva and its realtime triage agent.',
    'What cloud & DevOps technologies does Garv use?',
    'How does StockMentor achieve sub-millisecond chart feeds?',
  ];

  const ragSampleQueries = [
    'StockMentor WebSocket requestAnimationFrame Canvas ticker updates',
    'ArogyaSeva FastAPI WebRTC trickle ICE latency triage',
    'SalaryOS Web Worker Monte Carlo tax forecast',
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, text: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query.trim() }),
      });

      if (!response.ok) {
        throw new Error('Unable to complete request with AI backend.');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'Response generated from Garv Shaw engineering knowledge base.',
          model: data.model || 'gemini-3.8-flash',
        },
      ]);
    } catch {
      const localMatches = executeCosineSearch(query);
      const topContext = localMatches[0]
        ? `Closest verified context (${localMatches[0].chunk.title}): ${localMatches[0].chunk.text}`
        : 'Garv Shaw specializes in AI & Cloud Engineering (Gemini 3.8 Flash, PyTorch, LangChain, Next.js, and Cloud Run).';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: topContext,
          model: 'tf-idf-local-retrieval',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunRagSimulation = (customQuery?: string) => {
    const targetQuery = customQuery ?? ragQuery;
    if (customQuery !== undefined) setRagQuery(customQuery);
    setIsSimulatingRag(true);
    setRagResults(null);

    const t = window.setTimeout(() => {
      setRagResults(executeCosineSearch(targetQuery));
      setIsSimulatingRag(false);
    }, 180);
    timersRef.current.push(t);
  };

  const activeScenario =
    AGENT_SCENARIOS.find((s) => s.id === selectedScenarioId) || AGENT_SCENARIOS[0];

  const handleRunAgentWorkflow = (scenarioId?: string) => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (scenarioId) setSelectedScenarioId(scenarioId);
    setIsRunningAgent(true);
    setAgentStep(1);

    const t1 = window.setTimeout(() => setAgentStep(2), 380);
    const t2 = window.setTimeout(() => setAgentStep(3), 780);
    const t3 = window.setTimeout(() => {
      setAgentStep(4);
      setIsRunningAgent(false);
    }, 1180);
    timersRef.current.push(t1, t2, t3);
  };

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">09</span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
            INTERACTIVE LABORATORY · APPLIED MODELS
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          AI ENGINEERING LAB
        </span>
      </div>

      {/* Editorial Heading */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <GlitchHeading className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-3.5">
          AI ENGINEERING LAB.
        </GlitchHeading>
        <p className="font-sans text-[#A7ADB5] text-sm sm:text-base leading-relaxed font-light [text-wrap:balance]">
          Interact with portfolio AI endpoints, inspect live TF-IDF cosine vector ranking over indexed architecture docs, and step through multi-step agent traces.
        </p>
      </div>

      {/* Unified Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('assistant')}
          data-cursor="button"
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'assistant'
              ? 'bg-white text-black font-semibold shadow-[0_0_16px_rgba(255,255,255,0.22)]'
              : 'bg-white/[0.04] text-[#A7ADB5] hover:text-white hover:bg-white/[0.08] border border-white/[0.09]'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Portfolio Assistant</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('rag');
            if (!ragResults) setRagResults(executeCosineSearch(ragQuery));
          }}
          data-cursor="button"
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'rag'
              ? 'bg-white text-black font-semibold shadow-[0_0_16px_rgba(255,255,255,0.22)]'
              : 'bg-white/[0.04] text-[#A7ADB5] hover:text-white hover:bg-white/[0.08] border border-white/[0.09]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>RAG Vector Search ({corpus.length} Docs)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          data-cursor="button"
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'agent'
              ? 'bg-white text-black font-semibold shadow-[0_0_16px_rgba(255,255,255,0.22)]'
              : 'bg-white/[0.04] text-[#A7ADB5] hover:text-white hover:bg-white/[0.08] border border-white/[0.09]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Autonomous Agent Trace</span>
        </button>
      </div>

      {/* Tab 1: AI Portfolio Assistant */}
      {activeTab === 'assistant' && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#070A10]/94 border border-white/[0.09] p-5 sm:p-7 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
          {/* Clean Metadata Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4 font-mono text-[11px]">
            <span className="text-[#A7ADB5] uppercase tracking-[0.18em]">
              KNOWLEDGE ASSISTANT · GEMINI 3.8 FLASH
            </span>
            <span className="text-sky-400 uppercase tracking-widest">READY</span>
          </div>

          {/* Suggested Prompt Chips */}
          <div className="mb-4">
            <span className="font-mono text-[10px] text-[#626A73] uppercase tracking-[0.2em] block mb-2">
              SUGGESTED INQUIRIES
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(p)}
                  data-cursor="button"
                  className="text-left font-sans text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sky-300 hover:border-sky-400/50 hover:bg-sky-500/10 transition-colors cursor-pointer"
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-2 mb-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                )}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-sky-400 text-black font-medium ml-12 rounded-tr-sm'
                      : 'bg-white/[0.04] border border-white/[0.08] text-[#E2E6EC] rounded-tl-sm'
                  }`}
                >
                  <p className="font-sans whitespace-pre-wrap">{m.text}</p>
                  {m.model && (
                    <span className="block mt-1.5 font-mono text-[9px] uppercase tracking-wider opacity-60">
                      ENGINE · {m.model}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono p-3 bg-white/[0.04] rounded-xl border border-white/[0.08] w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing engineering context...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2 pt-3 border-t border-white/[0.08]"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about engineering architecture, models, or projects..."
              className="flex-1 bg-[#0B1018] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F2F3F5] placeholder-[#626A73] focus:outline-none focus:border-sky-400 font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              data-cursor="button"
              aria-label="Send prompt"
              className="p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-white text-black hover:bg-sky-300 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Live TF-IDF Cosine Similarity RAG Retrieval Engine */}
      {activeTab === 'rag' && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#070A10]/94 border border-white/[0.09] p-6 sm:p-8 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#F2F3F5] uppercase">
              TF-IDF Cosine Retrieval Engine
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-sky-400">
              {corpus.length} INDEXED CHUNKS
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-[#A7ADB5] leading-relaxed mb-5 font-light">
            Computes live TF-IDF vectors and cosine similarity scores in-browser across Garv&apos;s indexed project architectures, logs, and technical specs.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-1.5">
              {ragSampleQueries.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleRunRagSimulation(sample)}
                  data-cursor="button"
                  className="font-mono text-[10px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/10 border border-white/[0.08] hover:border-sky-400/40 text-sky-300 transition-colors cursor-pointer text-left"
                >
                  {sample}
                </button>
              ))}
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-2">
                QUERY VECTOR INPUT
              </label>
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunRagSimulation();
                }}
                placeholder="Type keywords (e.g., WebRTC latency, PostgreSQL AES-256, SM-2)..."
                className="w-full bg-[#0B1018] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F2F3F5] focus:outline-none focus:border-sky-400 font-sans"
              />
            </div>

            <button
              type="button"
              onClick={() => handleRunRagSimulation()}
              disabled={isSimulatingRag || !ragQuery.trim()}
              data-cursor="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-white text-black font-mono font-semibold text-xs uppercase tracking-wider hover:bg-sky-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isSimulatingRag ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Cosine Vectors...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Rank Top-3 Vector Matches</span>
                </>
              )}
            </button>
          </div>

          {ragResults && (
            <div className="space-y-3">
              {ragResults.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0B1018] border border-white/[0.08] font-mono text-xs text-[#A7ADB5]">
                  No corpus terms overlapped your query. Try terms like WebSockets, FastAPI, PostgreSQL, Gemini, or React.
                </div>
              ) : (
                ragResults.map((match, rank) => (
                  <div
                    key={match.chunk.id}
                    className={`p-4 sm:p-5 rounded-xl bg-[#0B1018] border space-y-2.5 ${
                      rank === 0 ? 'border-sky-400/35' : 'border-white/[0.08]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <span className="text-sky-400 uppercase tracking-wider font-semibold">
                        #{rank + 1} · {match.chunk.source}
                      </span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        cosθ = {match.score.toFixed(3)}
                      </span>
                    </div>
                    <h4 className="font-editorial text-base font-bold text-white uppercase tracking-tight">
                      {match.chunk.title}
                    </h4>
                    <p className="font-mono text-xs text-[#E2E6EC] leading-relaxed bg-[#05070B] p-3 rounded-lg border border-white/[0.06]">
                      {match.chunk.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#A7ADB5]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Matched tokens:</span>
                      {match.matchedTerms.slice(0, 5).map((term) => (
                        <span
                          key={term}
                          className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-400/20 text-sky-300"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Autonomous Agent Trace */}
      {activeTab === 'agent' && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#070A10]/94 border border-white/[0.09] p-6 sm:p-8 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/[0.08]">
            <div>
              <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#F2F3F5] uppercase">
                Multi-Step Agent Workflow Trace
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#A7ADB5] mt-1 font-light">
                State machine execution with structured JSON tool calls &amp; deterministic verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRunAgentWorkflow()}
              disabled={isRunningAgent}
              data-cursor="button"
              className="flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] rounded-lg bg-white text-black font-mono font-semibold text-xs uppercase tracking-wider hover:bg-sky-300 disabled:opacity-45 transition-colors cursor-pointer shrink-0 w-fit"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Run Trace</span>
            </button>
          </div>

          {/* Scenario Selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {AGENT_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleRunAgentWorkflow(sc.id)}
                data-cursor="button"
                className={`px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                  activeScenario.id === sc.id
                    ? 'bg-sky-400/15 border border-sky-400/50 text-sky-300 font-semibold'
                    : 'bg-white/[0.03] border border-white/[0.08] text-[#A7ADB5] hover:text-white'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {activeScenario.steps.map((item) => {
              const done = agentStep >= item.step;
              return (
                <div
                  key={item.step}
                  className={`p-4 rounded-xl border transition-colors ${
                    done
                      ? 'bg-[#0B111C] border-sky-400/35 text-[#F2F3F5]'
                      : 'bg-white/[0.03] border-white/[0.08] text-[#626A73]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-xs font-semibold uppercase ${item.accent}`}>
                      {item.title}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider">
                      {done ? 'COMPLETED' : 'QUEUED'}
                    </span>
                  </div>
                  <p className="font-mono text-xs mb-2.5">{item.desc}</p>
                  {done && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#05070B] border border-white/[0.06] font-mono text-[11px] text-cyan-300/90 overflow-x-auto">
                      <Braces className="w-3.5 h-3.5 text-[#626A73] shrink-0" />
                      <code className="whitespace-nowrap">
                        {JSON.stringify(item.payload)}
                      </code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (inSheet) {
    return <div className="select-none">{content}</div>;
  }

  return (
    <section
      id={id}
      className="relative w-full py-20 sm:py-26 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      {content}
    </section>
  );
};
