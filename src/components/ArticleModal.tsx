import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar, Tag, ArrowLeft, Share2, Check, BookOpen } from 'lucide-react';

export interface ArticleData {
  id: string;
  number: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: {
    introduction: string;
    sections: Array<{
      heading: string;
      body: string[];
      codeSnippet?: {
        language: string;
        code: string;
      };
      callout?: string;
    }>;
    conclusion: string;
  };
}

interface ArticleModalProps {
  article: ArticleData | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!article) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [article, onClose]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const total = scrollHeight - clientHeight;
    if (total > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollTop / total) * 100)));
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!article) return null;

  return (
    <AnimatePresence>
      <div
        id="article-reader-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto"
      >
        {/* Top Reading Progress Line */}
        <div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 z-50 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        <motion.div
          id="article-reader-content"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#08090C] border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden text-[#E2E8F0] my-auto"
        >
          {/* Reader Top Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0C10]/95 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={onClose}
              data-cursor="button"
              className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO ARTICLES</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                data-cursor="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                title="Copy Link to Article"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">COPIED</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>SHARE</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                data-cursor="button"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close Essay (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader Body (Scrollable with custom scrollbar) */}
          <div
            onScroll={handleScroll}
            className="overflow-y-auto px-6 sm:px-12 md:px-16 py-8 sm:py-12 space-y-10 selection:bg-cyan-500/30 selection:text-white"
          >
            {/* Header Metadata */}
            <div className="border-b border-white/10 pb-8">
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-neutral-400 mb-4">
                <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-semibold">
                  {article.category}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-neutral-300">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.date}
                </span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase text-white tracking-tight leading-[1.08] mb-6">
                {article.title}
              </h1>

              <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300">
                  GS
                </div>
                <span>BY GARV SHAW // ARCHITECTURAL NOTES</span>
              </div>
            </div>

            {/* Introduction Lead */}
            <div className="text-base sm:text-lg text-neutral-200 font-sans font-normal leading-relaxed border-l-2 border-cyan-400 pl-4 py-1 italic bg-cyan-950/10 rounded-r-xl">
              {article.content.introduction}
            </div>

            {/* Core Sections */}
            <div className="space-y-10 font-sans text-neutral-300 leading-relaxed font-light text-sm sm:text-base">
              {article.content.sections.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <h2 className="font-editorial text-xl sm:text-2xl font-bold uppercase text-white tracking-tight pt-4 border-t border-white/5">
                    {section.heading}
                  </h2>

                  {section.body.map((p, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {section.codeSnippet && (
                    <div className="my-4 rounded-xl overflow-hidden bg-black/80 border border-white/10 font-mono text-xs">
                      <div className="px-4 py-2 bg-neutral-900 border-b border-white/5 text-[10px] text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                        <span>{section.codeSnippet.language}</span>
                        <span className="text-cyan-400">SYSTEM IMPLEMENTATION</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-cyan-200/90 leading-relaxed">
                        <code>{section.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {section.callout && (
                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-indigo-500/30 text-xs sm:text-sm font-mono text-indigo-200">
                      <span className="text-cyan-400 font-bold block mb-1">KEY ARCHITECTURAL TAKEAWAY:</span>
                      {section.callout}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Conclusion */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <h3 className="font-editorial text-lg font-bold uppercase text-white tracking-wider">
                CONCLUSION & FORWARD TRAJECTORY
              </h3>
              <p className="font-sans text-sm text-neutral-300 leading-relaxed font-light">
                {article.content.conclusion}
              </p>
            </div>

            {/* Tags footer */}
            <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-white/10">
              <span className="font-mono text-xs text-neutral-500 flex items-center gap-1 mr-2">
                <Tag className="w-3.5 h-3.5" /> TOPICS:
              </span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono text-[11px]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                data-cursor="button"
                className="px-5 py-2 rounded-full bg-white hover:bg-cyan-300 text-black font-mono text-xs font-semibold tracking-wider transition-colors cursor-pointer"
              >
                CLOSE ESSAY
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-cursor="button"
                className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs tracking-wider transition-colors cursor-pointer"
              >
                DISCUSS WITH AUTHOR ↗
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
