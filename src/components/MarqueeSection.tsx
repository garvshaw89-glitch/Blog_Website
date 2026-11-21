import React from 'react';
import { MARQUEE_ITEMS } from '../data/portfolioData';
import { ArrowUpRight } from 'lucide-react';

interface MarqueeSectionProps {
  id?: string;
}

export const MarqueeSection: React.FC<MarqueeSectionProps> = ({ id = 'marquee-gallery' }) => {
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
      className="shrink-0 w-[290px] sm:w-[360px] md:w-[410px] h-[195px] sm:h-[225px] rounded-2xl overflow-hidden bg-[#070A10]/92 border border-white/[0.09] group relative hover:border-sky-400/50 transition-colors duration-300 cursor-pointer flex flex-col justify-end p-5 shadow-[0_18px_45px_rgba(0,0,0,0.75)]"
    >
      {/* Background Image Preview */}
      <img
        src={item.image}
        alt={`${item.title} preview`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-35 group-hover:opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/75 to-transparent z-0" />

      {/* Card Content Overlay */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/[0.08] font-mono text-[10px] uppercase tracking-[0.18em]">
          <span className="text-sky-300">{item.badge}</span>
          <span className={item.status === 'Building' ? 'text-amber-300' : 'text-emerald-300'}>
            {item.status}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h4 className="font-editorial font-bold text-lg sm:text-xl text-[#F2F3F5] uppercase tracking-tight group-hover:text-sky-300 transition-colors">
            {item.title}
          </h4>
          <ArrowUpRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
        </div>

        <p className="font-sans text-xs text-[#A7ADB5] mb-3 line-clamp-1 font-light">
          {item.category}
        </p>

        <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] text-[#626A73]">
          {item.tech.map((t, idx) => (
            <React.Fragment key={t}>
              {idx > 0 && <span aria-hidden="true" className="text-white/20">·</span>}
              <span className="text-[#D5D9DF]">{t}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section
      id={id}
      className="relative w-full bg-transparent pt-12 sm:pt-18 pb-10 overflow-hidden select-none"
    >
      {/* Side Vignettes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050608] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050608] to-transparent z-10" />

      <div className="flex flex-col gap-4 w-full">
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
