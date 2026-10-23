import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, BookOpen, Clock, Search, X, Tag } from 'lucide-react';
import { ArticleModal, ArticleData } from './ArticleModal';

// Helper to calculate reading time based on word count (approx 200 WPM)
export const calculateReadingTimeMinutes = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const getArticleEstimatedTime = (article: ArticleData): { totalMin: number; sectionTimes: { heading: string; minutes: number }[] } => {
  let allText = article.title + ' ' + article.excerpt + ' ' + article.content.introduction + ' ' + article.content.conclusion;
  const sectionTimes = article.content.sections.map((sec) => {
    const secText = sec.heading + ' ' + sec.body.join(' ') + (sec.callout ? ' ' + sec.callout : '') + (sec.codeSnippet ? ' ' + sec.codeSnippet.code : '');
    allText += ' ' + secText;
    return {
      heading: sec.heading,
      minutes: calculateReadingTimeMinutes(secText),
    };
  });
  return {
    totalMin: calculateReadingTimeMinutes(allText),
    sectionTimes,
  };
};

const ARTICLES: ArticleData[] = [
  {
    id: 'art-01',
    number: '01',
    title: 'The Future of Autonomous LLM Agents & Deterministic Tool Use',
    category: 'ARTIFICIAL INTELLIGENCE',
    readTime: '6 MIN READ',
    date: 'SEPTEMBER 2026',
    excerpt:
      'Why prompt engineering is giving way to state machine architectures, structured JSON function calling, and verified grounding loops.',
    tags: ['Gemini AI', 'Autonomous Agents', 'Prompt Chaining'],
    content: {
      introduction:
        'As foundational models transition from text predictors to autonomous system actuators, raw conversational prompting is no longer sufficient. Production-grade agency requires strict state machine constraints, deterministic tool validation, and verifiable grounding loops.',
      sections: [
        {
          heading: '1. The Illusion of Zero-Shot General Agency',
          body: [
            'Early autonomous agent frameworks relied heavily on open-ended ReAct (Reasoning + Acting) loops. While impressive in unconstrained benchmarks, in production environments with live databases and financial transactions, unbounded agency inevitably leads to context drift, hallucinated parameters, and runaway API latency.',
            'Deterministic tool-use replaces unpredictable free-form chain-of-thought with finite state transitions. Each agent action must conform to an enforceable JSON Schema with compile-time type validation before any backend execution is permitted.',
          ],
          callout:
            'A production AI agent is fundamentally a state machine where transitions are proposed by probabilistic models and verified by deterministic schemas.',
        },
        {
          heading: '2. Schema-Enforced Function Calling Architecture',
          body: [
            'Modern SDKs like @google/genai allow engineers to bind strict type definitions directly to the model request headers. This guarantees that parameters passed to internal services conform to domain boundaries.',
          ],
          codeSnippet: {
            language: 'typescript',
            code: `// Deterministic Tool Declaration Pattern\nexport const databaseQueryTool = {\n  name: 'queryTelemetry',\n  description: 'Query encrypted database metrics by date range',\n  parameters: {\n    type: 'OBJECT',\n    properties: {\n      metricId: { type: 'STRING' },\n      timeRangeSeconds: { type: 'INTEGER', minimum: 60, maximum: 86400 }\n    },\n    required: ['metricId', 'timeRangeSeconds']\n  }\n};`,
          },
        },
        {
          heading: '3. Grounding Loops and Real-Time Verification',
          body: [
            'When agents interact with live environments, feedback loops must be closed immediately. Any schema violation or execution fault is reinjected into the model with precise error signals, enabling self-healing recovery within 1-2 turn iterations.',
          ],
        },
      ],
      conclusion:
        'The future of artificial intelligence software lies not in making models larger, but in architecting deterministic boundaries that make probabilistic reasoning safe, transparent, and resilient.',
    },
  },
  {
    id: 'art-02',
    number: '02',
    title: 'Architecting Sub-50ms Realtime WebSocket Pipelines at Scale',
    category: 'CLOUD & REALTIME',
    readTime: '8 MIN READ',
    date: 'AUGUST 2026',
    excerpt:
      'Lessons learned synchronizing high-frequency candlestick price telemetry without overloading the browser UI render loop.',
    tags: ['WebSockets', 'AsyncIO', 'Performance'],
    content: {
      introduction:
        'Processing real-time financial telemetry across distributed clients requires minimizing garbage collection pressure, avoiding DOM thrashing, and batching state updates in lockstep with the display refresh rate.',
      sections: [
        {
          heading: '1. The Bottleneck: Unbounded React State Updates',
          body: [
            'In trading applications like StockMentor, tick streams can exceed 1,000 updates per second per ticker. If each incoming WebSocket packet immediately triggers a React setState, the Virtual DOM reconciler collapses into perpetual render starvation, causing frame drops and input lag.',
            'The solution is a decoupled Ring Buffer architecture: incoming binary packets are parsed directly into Float64Array circular buffers on a dedicated Web Worker thread, and the main thread only reads the current head index during requestAnimationFrame.',
          ],
        },
        {
          heading: '2. Zero-Copy Typed Array Synchronization',
          body: [
            'By using SharedArrayBuffer and atomic pointers, telemetry can be synchronized between background ingestion workers and canvas render loops with zero serialization overhead.',
          ],
          codeSnippet: {
            language: 'typescript',
            code: `// High-Frequency Tick Buffer Consumption\nfunction renderFrame(timestamp: number) {\n  const latestTicks = tickRingBuffer.drainBatch();\n  if (latestTicks.length > 0) {\n    priceCanvasRenderer.updateSeries(latestTicks);\n  }\n  requestAnimationFrame(renderFrame);\n}`,
          },
          callout:
            'Never bind raw network socket events directly to React state. Decouple network ingestion rate from display refresh rate using a frame-aligned ring buffer.',
        },
      ],
      conclusion:
        'Sub-50ms responsiveness is not achieved through raw network bandwidth, but through memory layout discipline and disciplined scheduling on the client runtime.',
    },
  },
  {
    id: 'art-03',
    number: '03',
    title: 'Building Zero-Lag WebGL & Hardware-Accelerated Frontends',
    category: 'SOFTWARE ENGINEERING',
    readTime: '5 MIN READ',
    date: 'JULY 2026',
    excerpt:
      'Techniques for offloading physics, raycasting, and particle simulation directly to GPU shaders while keeping DOM structures lightweight.',
    tags: ['Three.js', 'React 19', 'Performance Optimization'],
    content: {
      introduction:
        'Modern luxury websites frequently incorporate 3D backgrounds and particle physics, yet many suffer from severe CPU bottlenecks. By structuring WebGL scenes with typed attribute buffers and spatial hashing, we achieve sustained 60-120 FPS across both desktop and mobile devices.',
      sections: [
        {
          heading: '1. Eliminating Per-Particle React Components',
          body: [
            'A common architectural anti-pattern in 3D web applications is creating separate React component nodes for individual particles or geometries. React reconciliation overhead quickly overwhelms the JavaScript thread at 1,000+ entities.',
            'Instead, 6,000+ particles must be consolidated into a single THREE.Points instance with interleaved Float32Array position and color attributes, updated through direct pointer manipulation inside requestAnimationFrame.',
          ],
          callout:
            'One BufferGeometry, one Material, zero React rerenders inside the animation loop. That is the golden rule of production WebGL.',
        },
        {
          heading: '2. O(N) Spatial Partitioning for Particle Physics',
          body: [
            'Simulating particle-particle repulsion or cursor wakes naively requires O(N^2) pairwise distance checks. With 6,000 particles, that is 36 million calculations per frame.',
            'By implementing a flat integer 3D spatial hash grid, particle lookup is reduced to O(N), checking only the 27 neighboring cells for an instantaneous 50x performance leap.',
          ],
        },
      ],
      conclusion:
        'When visual effects and browser render pipelines are designed with hardware awareness, 3D graphics enhance the luxury experience without compromising page responsiveness.',
    },
  },
  {
    id: 'art-04',
    number: '04',
    title: 'Technology × Finance: Engineering Transparent Compensation Engines',
    category: 'FINTECH & PRODUCTS',
    readTime: '7 MIN READ',
    date: 'JUNE 2026',
    excerpt:
      'Deconstructing the mathematics behind gross-to-net tax projection, recurring burn-rate forecasting, and personal capital allocation.',
    tags: ['FinTech', 'Data Modeling', 'SalaryOS'],
    content: {
      introduction:
        'Compensation architecture in modern software engineering is increasingly multifaceted—spanning base salaries, performance bonuses, equity vesting schedules, and multi-tier tax regimes. SalaryOS was built to provide deterministic financial clarity.',
      sections: [
        {
          heading: '1. Deterministic Gross-to-Net Calculations',
          body: [
            'Traditional payroll estimators rely on static lookup tables that fail to account for dynamic marginal tax brackets, state-specific surcharges, and pre-tax retirement deductions. We designed a declarative tax bracket evaluator that calculates marginal liability across progressive tiers with mathematical precision.',
          ],
        },
        {
          heading: '2. Real-Time Runway and Burn-Rate Modeling',
          body: [
            'Visualizing personal liquidity requires continuous cash-flow simulation. By modeling fixed vs discretionary expenses as recurring temporal cash flows, developers and founders can forecast accurate financial runway under varying macroeconomic assumptions.',
          ],
          callout:
            'Financial transparency empowers better technical and career decisions. Engineering mathematical rigor into personal wealth planning replaces speculation with verifiable data.',
        },
      ],
      conclusion:
        'Building software at the intersection of quantitative finance and human productivity demands absolute computational correctness and human-centric UI simplicity.',
    },
  },
];

interface WritingSectionProps {
  id?: string;
}

export const WritingSection: React.FC<WritingSectionProps> = ({ id = 'writing' }) => {
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Extract all distinct technical topics/tags
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    ARTICLES.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, []);

  // Filter articles by search query (title, topic, tag, category, excerpt) and optional active topic tag
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ARTICLES.filter((article) => {
      // Topic tag filter
      if (activeTopic && !article.tags.includes(activeTopic)) {
        return false;
      }

      // If no text query, article matches
      if (!q) return true;

      // Match against title, category, tags, and excerpt
      const matchesTitle = article.title.toLowerCase().includes(q);
      const matchesCategory = article.category.toLowerCase().includes(q);
      const matchesTags = article.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesExcerpt = article.excerpt.toLowerCase().includes(q);

      return matchesTitle || matchesCategory || matchesTags || matchesExcerpt;
    });
  }, [searchQuery, activeTopic]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveTopic(null);
  };

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">06 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              THINKING & ENGINEERING ESSAYS
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">PUBLICATIONS</span>
        </div>

        {/* Section Headline */}
        <div className="max-w-2xl mb-12">
          <h2 className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white mb-4">
            WRITING.
          </h2>
          <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
            Reflections on system architecture, generative AI patterns, cloud infrastructure trade-offs, and digital product design.
          </p>
        </div>

        {/* Search & Topic Filter Bar */}
        <div className="mb-10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-xl group">
              <div className="relative flex items-center bg-[#0B0E12]/80 backdrop-blur-md rounded-lg border border-white/[0.1] focus-within:border-cyan-400/50 focus-within:ring-1 focus-within:ring-cyan-400/20 transition-all duration-300 shadow-inner">
                <Search className="w-4 h-4 text-neutral-500 group-focus-within:text-cyan-400 ml-3.5 shrink-0 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter articles by title or technical topic..."
                  aria-label="Filter articles by title or technical topic"
                  className="w-full bg-transparent text-white placeholder:text-neutral-500 font-sans text-sm px-3 py-2.5 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="mr-3 p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Counter & Clear all */}
            <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs">
              <span className="text-neutral-400">
                Showing <span className="text-white font-medium">{filteredArticles.length}</span> of {ARTICLES.length}
              </span>
              {(searchQuery || activeTopic) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Technical Topic Pills for Instant Filtering */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-cyan-400" />
              Topics:
            </span>
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide transition-all ${
                activeTopic === null
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/[0.03] text-neutral-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-neutral-200'
              }`}
            >
              All
            </button>
            {allTopics.map((topic) => {
              const isActive = activeTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveTopic(isActive ? null : topic)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-white/[0.03] text-neutral-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-neutral-200'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editorial Articles List */}
        {filteredArticles.length > 0 ? (
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="popLayout">
              {filteredArticles.map((article) => (
                <motion.article
                  key={article.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelectedArticle(article)}
                  data-cursor="link"
                  data-cursor-label="READ"
                  className="group relative cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-xl bg-[#0B0E12]/50 hover:bg-[#11151A] border border-white/[0.06] hover:border-white/[0.16] hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                >
                  {/* Thin Left Accent Line on Hover */}
                  <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-[#7EA7FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r" />

                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3 font-mono text-[11px] text-[#626A73] mb-3 tracking-wider uppercase">
                      <span className="text-[#FF9D38] font-bold">{article.number}</span>
                      <span>/</span>
                      <span className="text-[#7EA7FF] font-medium">{article.category}</span>
                      <span>/</span>
                      <span>{article.readTime}</span>
                      <span>/</span>
                      <span>{article.date}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-[#F2F3F5] tracking-tight group-hover:text-white transition-colors leading-[1.12]">
                        {article.title}
                      </h3>
                      {(() => {
                        const { totalMin, sectionTimes } = getArticleEstimatedTime(article);
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-sm group-hover:border-cyan-400/40 transition-colors whitespace-nowrap self-center"
                            title={`Estimated reading breakdown: ${sectionTimes.map((s, i) => `Part ${i + 1} (${s.minutes}m)`).join(', ')}`}
                          >
                            <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>~{totalMin}m read</span>
                            <span className="text-cyan-500/60 font-light">·</span>
                            <span className="text-[10px] text-cyan-300/80">{sectionTimes.length} parts</span>
                          </span>
                        );
                      })()}
                    </div>

                    <p className="mt-3.5 font-sans text-[#A7ADB5] text-sm sm:text-base font-light leading-relaxed">
                      {article.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-4 font-mono text-[11px] text-[#626A73]">
                      {article.tags.map((tag, idx) => (
                        <React.Fragment key={tag}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTopic(activeTopic === tag ? null : tag);
                            }}
                            className={`transition-colors hover:text-cyan-400 ${
                              activeTopic === tag ? 'text-cyan-400 font-bold underline' : ''
                            }`}
                          >
                            {tag}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#626A73] group-hover:text-[#F2F3F5] transition-colors">
                      READ ESSAY
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#626A73] group-hover:text-[#7EA7FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#0B0E12]/40 border border-white/[0.08] my-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-white mb-2">
              No matching publications found
            </h3>
            <p className="font-sans text-neutral-400 text-sm max-w-md mb-6 leading-relaxed">
              We couldn't find any articles matching &ldquo;
              <span className="text-cyan-300 font-mono">{searchQuery || activeTopic}</span>
              &rdquo;. Try searching for topics like Architecture, Generative AI, or Performance.
            </p>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Reader Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </section>
  );
};
