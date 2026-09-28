import React from 'react';
import { Github, Linkedin, Instagram, Mail, ArrowUp } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/portfolioData';

interface FooterSectionProps {
  onContactClick?: () => void;
  id?: string;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ id = 'footer' }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'GitHub':
        return <Github className="w-4 h-4" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4" />;
      case 'Instagram':
        return <Instagram className="w-4 h-4" />;
      case 'Email':
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      id={id}
      className="relative w-full border-t border-white/10 bg-[#050505] text-[#F5F5F0] py-16 px-4 sm:px-6 md:px-12 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col justify-between gap-12">
        {/* Top Row: Brand & Summary */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/10">
          <div>
            <h3 className="font-editorial text-3xl sm:text-4xl font-bold uppercase tracking-tight text-white mb-2">
              GARV SHAW
            </h3>
            <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
              AI × CLOUD × SOFTWARE × DIGITAL PRODUCTS
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                data-cursor-label={link.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                {getIcon(link.name)}
                <span>{link.name}</span>
              </a>
            ))}

            <button
              type="button"
              onClick={scrollToTop}
              data-cursor="button"
              data-cursor-label="TOP"
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer ml-2"
              title="Return to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Metas Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <div>© {currentYear} GARV SHAW. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-4">
            <span>BUILT WITH REACT 19 &amp; THREE.JS</span>
            <span>•</span>
            <span>ENGINEERED FOR PRODUCTION</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
