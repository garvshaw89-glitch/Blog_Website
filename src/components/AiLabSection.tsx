import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Database,
  Bot,
  RotateCcw,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { GlitchHeading } from './ui/GlitchHeading';

interface AiLabSectionProps {
  inSheet?: boolean;
  id?: string;
}

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

  const [ragQuery, setRagQuery] = useState('How does Garv handle high-frequency trading updates?');
  const [ragSimilarityScore, setRagSimilarityScore] = useState<number | null>(null);
  const [isSimulatingRag, setIsSimulatingRag] = useState(false);
  const [matchedChunk, setMatchedChunk] = useState<string | null>(null);

  const [agentStep, setAgentStep] = useState(0);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const suggestedPrompts = [
    'What projects use AI and how are they architected?',
    'Tell me about ArogyaSeva and its realtime triage agent.',
    'What cloud & DevOps technologies does Garv use?',
    'How does StockMentor achieve sub-millisecond chart feeds?',
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
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I am operating in offline knowledge mode. Garv Shaw specializes in AI & Cloud Engineering (Gemini 3.8 Flash, PyTorch, LangChain, Next.js, and Cloud Run). Explore the featured projects above to inspect live deployments.",
          model: 'embedded-knowledge-base',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunRagSimulation = () => {
    setIsSimulatingRag(true);
    setRagSimilarityScore(null);
    setMatchedChunk(null);

    const t = window.setTimeout(() => {
      setRagSimilarityScore(0.942);
      setMatchedChunk(
        'Matched Knowledge Chunk #42 [StockMentor Ticker Engine]: Batched WebSocket payloads rendered via requestAnimationFrame using HTML5 Canvas double-buffering to eliminate garbage collection latency at 60 FPS.'
      );
      setIsSimulatingRag(false);
    }, 520);
    timersRef.current.push(t);
  };

  const handleRunAgentWorkflow = () => {
    setIsRunningAgent(true);
    setAgentStep(1);

    const t1 = window.setTimeout(() => setAgentStep(2), 550);
    const t2 = window.setTimeout(() => setAgentStep(3), 1100);
    const t3 = window.setTimeout(() => {
      setAgentStep(4);
      setIsRunningAgent(false);
    }, 1650);
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
          Interact with live AI endpoints, inspect vector similarity retrieval, and step through autonomous agent execution traces.
        </p>
      </div>

      {/* Unified Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('assistant')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'rag'
              ? 'bg-white text-black font-semibold shadow-[0_0_16px_rgba(255,255,255,0.22)]'
              : 'bg-white/[0.04] text-[#A7ADB5] hover:text-white hover:bg-white/[0.08] border border-white/[0.09]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>RAG &amp; Semantic Retrieval</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#070A10]/92 border border-white/[0.09] p-5 sm:p-7 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
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
              aria-label="Send prompt"
              className="p-2.5 rounded-xl bg-white text-black hover:bg-sky-300 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: RAG Simulator */}
      {activeTab === 'rag' && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#070A10]/92 border border-white/[0.09] p-6 sm:p-8 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
          <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#F2F3F5] uppercase mb-2">
            RAG Vector Retrieval Simulator
          </h3>
          <p className="font-sans text-xs sm:text-sm text-[#A7ADB5] leading-relaxed mb-6 font-light">
            Simulates how queries are converted into high-dimensional embeddings and ranked against indexed codebase chunks via cosine similarity.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-2">
                SAMPLE QUERY VECTOR
              </label>
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="w-full bg-[#0B1018] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F2F3F5] focus:outline-none focus:border-sky-400 font-sans"
              />
            </div>

            <button
              type="button"
              onClick={handleRunRagSimulation}
              disabled={isSimulatingRag}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-mono font-semibold text-xs uppercase tracking-wider hover:bg-sky-300 transition-colors cursor-pointer"
            >
              {isSimulatingRag ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Vector Distance...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Execute Cosine Similarity Search</span>
                </>
              )}
            </button>
          </div>

          {ragSimilarityScore !== null && matchedChunk && (
            <div className="p-5 rounded-xl bg-[#0B1018] border border-sky-400/25 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-sky-400 uppercase tracking-wider font-semibold">
                  Cosine Similarity Score
                </span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {ragSimilarityScore} · TOP MATCH
                </span>
              </div>
              <p className="font-mono text-xs text-[#E2E6EC] leading-relaxed bg-[#05070B] p-3.5 rounded-lg border border-white/[0.08]">
                {matchedChunk}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#A7ADB5]">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Context window hydrated with verified facts · Ready for inference</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Autonomous Agent Trace */}
      {activeTab === 'agent' && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#070A10]/92 border border-white/[0.09] p-6 sm:p-8 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
            <div>
              <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#F2F3F5] uppercase">
                Multi-Step Agent Workflow Trace
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#A7ADB5] mt-1 font-light">
                State machine execution: Goal Formulation → Planning → Tool Invocation → Output Validation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunAgentWorkflow}
              disabled={isRunningAgent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black font-mono font-semibold text-xs uppercase tracking-wider hover:bg-sky-300 transition-colors cursor-pointer shrink-0 w-fit"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Run Agent Trace</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                step: 1,
                title: 'STEP 01 · INTENT DECOMPOSITION',
                desc: 'User Objective: Analyze ArogyaSeva WebRTC packet latency and propose optimization.',
                accent: 'text-sky-400',
              },
              {
                step: 2,
                title: 'STEP 02 · TOOL CALL · inspect_webrtc_signaling()',
                desc: 'Querying STUN/TURN latency matrix. Result: 68ms roundtrip via Frankfurt edge proxy.',
                accent: 'text-indigo-300',
              },
              {
                step: 3,
                title: 'STEP 03 · HEURISTIC VALIDATION & PROPOSAL',
                desc: 'Recommendation: Implement trickle ICE candidates to eliminate blocking roundtrips.',
                accent: 'text-violet-300',
              },
              {
                step: 4,
                title: 'STEP 04 · VERIFICATION AUDIT',
                desc: 'Deterministic audit check passed. Changes logged in Engineering Log.',
                accent: 'text-emerald-400',
              },
            ].map((item) => {
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
                      {done ? 'COMPLETED' : item.step === 1 ? 'IDLE' : 'WAITING'}
                    </span>
                  </div>
                  <p className="font-mono text-xs">{item.desc}</p>
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
