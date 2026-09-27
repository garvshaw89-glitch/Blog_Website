import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Loader2,
  Terminal,
  Database,
  ArrowRight,
  Bot,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { AI_EXPERIMENTS } from '../data/portfolioData';

interface AiLabSectionProps {
  id?: string;
}

export const AiLabSection: React.FC<AiLabSectionProps> = ({ id = 'ai-lab' }) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'rag' | 'agent'>('assistant');

  // AI Assistant State
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: "Greetings. I am Garv Shaw's AI Assistant. Ask me anything about Garv's AI engineering, cloud architectures, StockMentor, ArogyaSeva, or technical methodology.",
      model: 'gemini-3.8-flash',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // RAG Simulator State
  const [ragQuery, setRagQuery] = useState('How does Garv handle high-frequency trading updates?');
  const [ragSimilarityScore, setRagSimilarityScore] = useState<number | null>(null);
  const [isSimulatingRag, setIsSimulatingRag] = useState(false);
  const [matchedChunk, setMatchedChunk] = useState<string | null>(null);

  // Agent Simulator State
  const [agentStep, setAgentStep] = useState(0);
  const [isRunningAgent, setIsRunningAgent] = useState(false);

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
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query.trim() }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please wait a minute before sending another prompt.');
        }
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
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while generating response.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I am operating in fallback mode. Garv Shaw specializes in AI & Cloud Engineering (Gemini 3.8 Flash, PyTorch, LangChain, Next.js, and Cloud Run). Explore the projects section below to inspect the source code and live deployments.",
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

    setTimeout(() => {
      setRagSimilarityScore(0.942);
      setMatchedChunk(
        'Matched Knowledge Chunk #42 [StockMentor Ticker Engine]: Batched WebSocket payloads rendered via requestAnimationFrame using HTML5 Canvas double-buffering to eliminate garbage collection latency at 60 FPS.'
      );
      setIsSimulatingRag(false);
    }, 600);
  };

  const handleRunAgentWorkflow = () => {
    setIsRunningAgent(true);
    setAgentStep(1);

    setTimeout(() => setAgentStep(2), 700);
    setTimeout(() => setAgentStep(3), 1400);
    setTimeout(() => {
      setAgentStep(4);
      setIsRunningAgent(false);
    }, 2100);
  };

  return (
    <section
      id={id}
      className="relative w-full py-24 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>05 // INTERACTIVE LABORATORY</span>
          </div>
          <h2 className="hero-heading font-display font-black uppercase text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3">
            AI ENGINEERING LAB
          </h2>
          <p className="text-slate-300 font-sans text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Test live AI models, inspect vector RAG similarity search, and simulate autonomous agent execution loops.
          </p>
        </div>

        {/* Experiment Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'assistant'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Ask Garv&apos;s AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'rag'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>RAG & Semantic Retrieval</span>
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'agent'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Autonomous Agent Trace</span>
          </button>
        </div>

        {/* Tab 1: AI Portfolio Assistant */}
        {activeTab === 'assistant' && (
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#070D18]/95 border border-cyan-500/30 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-xs text-slate-400 ml-2">
                  garv-ai-assistant // model: gemini-3.8-flash
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="mb-4">
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block mb-2">
                SUGGESTED TECHNICAL INQUIRIES:
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(p)}
                    className="text-left font-sans text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 mb-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-cyan-500 text-black font-medium ml-12 rounded-tr-sm'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <p className="font-sans whitespace-pre-wrap">{m.text}</p>
                    {m.model && (
                      <span className="block mt-2 font-mono text-[9px] uppercase tracking-wider opacity-60">
                        ENGINE: {m.model}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-3 bg-white/5 rounded-xl border border-white/10 w-fit">
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
              className="flex items-center gap-2 pt-2 border-t border-white/10"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about Garv's engineering architecture, models, or projects..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: RAG Simulator */}
        {activeTab === 'rag' && (
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#070D18]/95 border border-cyan-500/30 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase mb-2">
              RAG Vector Retrieval Simulator
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Simulates how user queries are converted into high-dimensional embeddings and compared against indexed chunks of Garv&apos;s codebases using cosine similarity.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-2">
                  Sample Query Vector
                </label>
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <button
                onClick={handleRunRagSimulation}
                disabled={isSimulatingRag}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs uppercase hover:bg-cyan-400 transition-colors cursor-pointer"
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
              <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan-400 font-bold uppercase">
                    Cosine Similarity Score
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {ragSimilarityScore} (Top Match)
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-200 leading-relaxed bg-black/50 p-3 rounded-lg border border-white/10">
                  {matchedChunk}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Context window hydrated with verified facts • Ready for LLM inference</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Autonomous Agent Trace */}
        {activeTab === 'agent' && (
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#070D18]/95 border border-cyan-500/30 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase">
                  Multi-Step Agent Workflow Trace
                </h3>
                <p className="font-sans text-xs sm:text-sm text-slate-300 mt-1">
                  Step-by-step state machine execution: Goal Formulation → Planning → Tool Invocation → Output Validation.
                </p>
              </div>
              <button
                onClick={handleRunAgentWorkflow}
                disabled={isRunningAgent}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs uppercase hover:bg-cyan-400 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Run Agent Trace</span>
              </button>
            </div>

            <div className="space-y-3 mt-6">
              {/* Step 1: Goal */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  agentStep >= 1
                    ? 'bg-cyan-950/20 border-cyan-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold uppercase text-cyan-400">
                    STEP 1: INTENT DECOMPOSITION
                  </span>
                  <span className="font-mono text-[10px]">
                    {agentStep >= 1 ? 'COMPLETED' : 'IDLE'}
                  </span>
                </div>
                <p className="font-mono text-xs">
                  User Objective: Analyze ArogyaSeva WebRTC packet latency and propose optimization.
                </p>
              </div>

              {/* Step 2: Tool Execution */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  agentStep >= 2
                    ? 'bg-cyan-950/20 border-cyan-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold uppercase text-sky-400">
                    STEP 2: TOOL CALL // inspect_webrtc_signaling()
                  </span>
                  <span className="font-mono text-[10px]">
                    {agentStep >= 2 ? 'COMPLETED' : 'WAITING'}
                  </span>
                </div>
                <p className="font-mono text-xs">
                  Querying STUN/TURN latency matrix. Result: 68ms roundtrip via Frankfurt edge proxy.
                </p>
              </div>

              {/* Step 3: Synthesis */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  agentStep >= 3
                    ? 'bg-cyan-950/20 border-cyan-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold uppercase text-purple-400">
                    STEP 3: HEURISTIC VALIDATION & PROPOSAL
                  </span>
                  <span className="font-mono text-[10px]">
                    {agentStep >= 3 ? 'COMPLETED' : 'WAITING'}
                  </span>
                </div>
                <p className="font-mono text-xs">
                  Recommendation: Implement trickle ICE candidates to eliminate blocking roundtrips.
                </p>
              </div>

              {/* Step 4: Verification */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  agentStep >= 4
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold uppercase text-emerald-400">
                    STEP 4: VERIFICATION AUDIT
                  </span>
                  <span className="font-mono text-[10px]">
                    {agentStep >= 4 ? 'PASSED (0 ERRORS)' : 'WAITING'}
                  </span>
                </div>
                <p className="font-mono text-xs">
                  Deterministic audit check passed. Changes logged in Engineering Log.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
