import React from 'react';
import { motion } from 'motion/react';
import { MARQUEE_ITEMS } from '../data/portfolioData';
import { ArrowUpRight } from 'lucide-react';

interface MarqueeSectionProps {
  id?: string;
}

export const MarqueeSection: React.FC<MarqueeSectionProps> = ({ id = 'marquee-gallery' }) => {
  // Split items into 2 rows
  const half = Math.ceil(MARQUEE_ITEMS.length / 2);
  const row1Items = MARQUEE_ITEMS.slice(0, half);
  const row2Items = MARQUEE_ITEMS.slice(half);

  const scrollToProjects = () => {
    const el = document.getElementById('projects');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const renderProjectCard = (item: typeof MARQUEE_ITEMS[0], key: string) => (
    <div
      key={key}
      onClick={scrollToProjects}
      data-cursor="project"
      className="shrink-0 w-[300px] sm:w-[380px] md:w-[440px] h-[200px] sm:h-[240px] md:h-[260px] rounded-3xl overflow-hidden bg-[#070D18]/90 border border-white/10 group relative hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] transition-all duration-300 cursor-pointer flex flex-col justify-end p-5"
    >
      {/* Background Image Preview */}
      <img
        src={item.image}
        alt={`${item.title} preview`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-40 group-hover:opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/70 to-transparent z-0" />

      {/* Card Content Overlay */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] uppercase px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {item.badge}
          </span>
          <span
            className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
              item.status === 'Building'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}
          >
            ● {item.status}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h4 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
            {item.title}
          </h4>
          <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>

        <p className="font-sans text-xs text-slate-300 mb-3 line-clamp-1">
          {item.category}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {item.tech.map((t) => (
            <span
              key={t}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-slate-300 border border-white/10"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section
      id={id}
      className="relative w-full bg-transparent pt-16 sm:pt-24 pb-12 overflow-hidden select-none"
    >
      {/* Side Vignettes for cinematic fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#05070A] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#05070A] to-transparent z-10" />

      <div className="flex flex-col gap-4 w-full">
        {/* Row 1: Left */}
        <div className="w-full overflow-hidden">
          <div className="animate-marquee-left flex">
            <div className="flex gap-4 pr-4 shrink-0">
              {row1Items.map((item, idx) => renderProjectCard(item, `r1-a-${idx}`))}
            </div>
            <div className="flex gap-4 pr-4 shrink-0" aria-hidden="true">
              {row1Items.map((item, idx) => renderProjectCard(item, `r1-b-${idx}`))}
            </div>
          </div>
        </div>

        {/* Row 2: Right */}
        <div className="w-full overflow-hidden">
          <div className="animate-marquee-right flex">
            <div className="flex gap-4 pr-4 shrink-0">
              {row2Items.map((item, idx) => renderProjectCard(item, `r2-a-${idx}`))}
            </div>
            <div className="flex gap-4 pr-4 shrink-0" aria-hidden="true">
              {row2Items.map((item, idx) => renderProjectCard(item, `r2-b-${idx}`))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
