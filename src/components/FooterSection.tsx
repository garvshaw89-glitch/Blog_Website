import React from 'react';
import { Github, Linkedin, Instagram, Mail, ArrowUp, Sparkles } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/portfolioData';

interface FooterSectionProps {
  onContactClick?: () => void;
  onReplayIntro?: () => void;
  id?: string;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ id = 'footer', onReplayIntro }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'GitHub':
        return <Github className="w-3.5 h-3.5" />;
      case 'LinkedIn':
        return <Linkedin className="w-3.5 h-3.5" />;
      case 'Instagram':
        return <Instagram className="w-3.5 h-3.5" />;
      case 'Email':
      default:
        return <Mail className="w-3.5 h-3.5" />;
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      id={id}
      className="relative w-full border-t border-white/[0.08] bg-[#050608]/95 text-[#F2F3F5] py-14 px-4 sm:px-6 md:px-12 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col justify-between gap-10">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/[0.08]">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src="/assets/aistudio/image_e833bace.png"
              alt="Garv Shaw GS Crest"
              loading="lazy"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-amber-200/25 bg-black shrink-0 shadow-[0_0_24px_rgba(217,179,112,0.14)]"
            />
            <div>
              <h3 className="font-editorial text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-1.5">
                GARV SHAW
              </h3>
              <p className="font-mono text-xs text-[#626A73] uppercase tracking-[0.2em]">
                AI × CLOUD × SOFTWARE × DIGITAL PRODUCTS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                data-cursor-label={link.name}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] text-xs font-mono text-[#D5D9DF] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {getIcon(link.name)}
                <span>{link.name}</span>
              </a>
            ))}

            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                data-cursor="button"
                data-cursor-label="PORTAL"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] text-xs font-mono text-[#D5D9DF] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Replay Entrance Portal"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">PORTAL</span>
              </button>
            )}

            <button
              type="button"
              onClick={scrollToTop}
              data-cursor="button"
              data-cursor-label="TOP"
              className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] text-[#D5D9DF] hover:text-white transition-colors cursor-pointer shrink-0"
              title="Return to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Metas Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-[#626A73]">
          <div>© {currentYear} GARV SHAW. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-3">
            <span>REACT 19 &amp; THREE.JS</span>
            <span aria-hidden="true">·</span>
            <span>ENGINEERED FOR PRODUCTION</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
