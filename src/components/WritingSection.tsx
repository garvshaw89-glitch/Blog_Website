import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BookOpen, Clock, Tag } from 'lucide-react';

interface ArticleItem {
  id: string;
  number: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  tags: string[];
}

const ARTICLES: ArticleItem[] = [
  {
    id: 'art-01',
    number: '01',
    title: 'The Future of Autonomous LLM Agents & Deterministic Tool Use',
    category: 'ARTIFICIAL INTELLIGENCE',
    readTime: '6 MIN READ',
    excerpt:
      'Why prompt engineering is giving way to state machine architectures, structured JSON function calling, and verified grounding loops.',
    tags: ['Gemini AI', 'Autonomous Agents', 'Prompt Chaining'],
  },
  {
    id: 'art-02',
    number: '02',
    title: 'Architecting Sub-50ms Realtime WebSocket Pipelines at Scale',
    category: 'CLOUD & REALTIME',
    readTime: '8 MIN READ',
    excerpt:
      'Lessons learned synchronizing high-frequency candlestick price telemetry without overloading the browser UI render loop.',
    tags: ['WebSockets', 'AsyncIO', 'Performance'],
  },
  {
    id: 'art-03',
    number: '03',
    title: 'Building Zero-Lag WebGL & Hardware-Accelerated Frontends',
    category: 'SOFTWARE ENGINEERING',
    readTime: '5 MIN READ',
    excerpt:
      'Techniques for offloading physics, raycasting, and particle simulation directly to GPU shaders while keeping DOM structures lightweight.',
    tags: ['Three.js', 'React 19', 'Performance Optimization'],
  },
  {
    id: 'art-04',
    number: '04',
    title: 'Technology × Finance: Engineering Transparent Compensation Engines',
    category: 'FINTECH & PRODUCTS',
    readTime: '7 MIN READ',
    excerpt:
      'Deconstructing the mathematics behind gross-to-net tax projection, recurring burn-rate forecasting, and personal capital allocation.',
    tags: ['FinTech', 'Data Modeling', 'SalaryOS'],
  },
];

interface WritingSectionProps {
  id?: string;
}

export const WritingSection: React.FC<WritingSectionProps> = ({ id = 'writing' }) => {
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
        <div className="max-w-2xl mb-16">
          <h2 className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white mb-4">
            WRITING.
          </h2>
          <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
            Reflections on system architecture, generative AI patterns, cloud infrastructure trade-offs, and digital product design.
          </p>
        </div>

        {/* Editorial Articles List */}
        <div className="divide-y divide-white/10 border-b border-white/10">
          {ARTICLES.map((article) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              data-cursor="link"
              data-cursor-label="READ"
              className="group py-8 sm:py-12 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:pl-3"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 font-mono text-xs text-neutral-400 mb-2">
                  <span className="text-cyan-400 font-bold">{article.number}</span>
                  <span>•</span>
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold uppercase text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  {article.title}
                </h3>

                <p className="mt-3 font-sans text-neutral-400 text-sm sm:text-base font-light leading-relaxed">
                  {article.excerpt}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-[10px] text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
                  READ ESSAY
                </span>
                <ArrowUpRight className="w-5 h-5 text-neutral-500 group-hover:text-cyan-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
