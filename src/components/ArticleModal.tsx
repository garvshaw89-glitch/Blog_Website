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

          {/* Reader Body (Scrollable with custom scrollbar, narrow 680px readable column) */}
          <div
            onScroll={handleScroll}
            className="overflow-y-auto px-6 sm:px-12 md:px-16 py-8 sm:py-12 selection:bg-[#7EA7FF]/25 selection:text-white"
          >
            <div className="max-w-[700px] mx-auto space-y-10">
              {/* Header Metadata (Section 21: CATEGORY, TITLE, Short intro, DATE / READING TIME) */}
              <div className="border-b border-white/[0.08] pb-8">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#A7ADB5] mb-4 tracking-wider uppercase">
                  <span className="text-[#7EA7FF] font-semibold">
                    {article.category}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="flex items-center gap-1 text-[#A7ADB5]">
                    <Clock className="w-3.5 h-3.5 text-[#626A73]" />
                    {article.readTime}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="flex items-center gap-1 text-[#626A73]">
                    <Calendar className="w-3.5 h-3.5 text-[#626A73]" />
                    {article.date}
                  </span>
                </div>

                <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F2F3F5] leading-[1.08] mb-6">
                  {article.title}
                </h1>

                <div className="flex items-center gap-3 text-xs font-mono text-[#626A73]">
                  <span className="text-[#A7ADB5]">GARV SHAW</span>
                  <span>/</span>
                  <span>ARCHITECTURAL JOURNAL</span>
                </div>
              </div>

              {/* Introduction Lead */}
              <div className="text-base sm:text-lg text-[#F2F3F5] font-sans font-normal leading-relaxed border-l-2 border-[#7EA7FF] pl-5 py-1 text-neutral-200">
                {article.content.introduction}
              </div>

              {/* Core Sections */}
              <div className="space-y-10 font-sans text-[#A7ADB5] leading-relaxed font-light text-base">
                {article.content.sections.map((section, idx) => (
                  <div key={idx} className="space-y-4">
                    <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#F2F3F5] tracking-tight pt-4 border-t border-white/[0.06]">
                      {section.heading}
                    </h2>

                    {section.body.map((p, pIdx) => (
                      <p key={pIdx} className="leading-relaxed text-[#A7ADB5]">
                        {p}
                      </p>
                    ))}

                    {section.codeSnippet && (
                      <div className="my-5 rounded-lg overflow-hidden bg-[#050608] border border-white/[0.08] font-mono text-xs">
                        <div className="px-4 py-2.5 bg-[#11151A] border-b border-white/[0.06] text-[10px] text-[#A7ADB5] uppercase tracking-widest flex items-center justify-between">
                          <span>{section.codeSnippet.language}</span>
                          <span className="text-[#7EA7FF]">SYSTEM SPECIFICATION</span>
                        </div>
                        <pre className="p-4 text-[#F2F3F5] overflow-x-auto text-[11px] leading-relaxed">
                          <code>{section.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {section.callout && (
                      <div className="my-4 p-4 rounded-lg bg-[#11151A] border border-white/[0.08] text-sm text-[#F2F3F5] italic font-sans leading-relaxed">
                        "{section.callout}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conclusion */}
              <div className="pt-8 border-t border-white/[0.08]">
                <h3 className="font-editorial text-lg font-bold uppercase tracking-tight text-[#F2F3F5] mb-3">
                  SYNTHESIS
                </h3>
                <p className="font-sans text-sm sm:text-base text-[#A7ADB5] font-light leading-relaxed">
                  {article.content.conclusion}
                </p>
              </div>

              {/* Article Footer Tags */}
              <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#626A73]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[#A7ADB5]">TOPICS:</span>
                  {article.tags.map((tag, idx) => (
                    <React.Fragment key={tag}>
                      {idx > 0 && <span>·</span>}
                      <span className="text-[#A7ADB5]">{tag}</span>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#7EA7FF] hover:text-white transition-colors cursor-pointer"
                >
                  ← RETURN TO JOURNAL
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
