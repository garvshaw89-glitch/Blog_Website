import React from 'react';
import { SOCIAL_LINKS } from '../data/portfolioData';
import { Github, Linkedin, Instagram, Mail, ArrowUp, ExternalLink, Terminal, Shield } from 'lucide-react';

interface FooterSectionProps {
  onContactClick?: () => void;
  id?: string;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  id = 'footer-scene',
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'GitHub':
        return <Github className="w-5 h-5" />;
      case 'LinkedIn':
        return <Linkedin className="w-5 h-5" />;
      case 'Instagram':
        return <Instagram className="w-5 h-5" />;
      case 'Email':
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  return (
    <footer
      id={id}
      className="relative w-full bg-[#05070A] text-[#D7E2EA] px-4 sm:px-6 md:px-10 pt-20 pb-12 border-t border-cyan-500/20 overflow-hidden select-none"
    >
      {/* Ambient Top Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col relative z-10">
        {/* Main Closing Scene Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-14 border-b border-white/10">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 block mb-3">
              SYNTHESIS // CLOSING SCENE
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black uppercase tracking-tight text-white leading-tight">
              LET&apos;S BUILD SOMETHING INTELLIGENT.
            </h2>
            <p className="mt-4 text-slate-300 font-sans text-sm sm:text-base max-w-lg leading-relaxed">
              Available for high-impact AI systems, resilient cloud infrastructure, and modern low-latency full-stack products.
            </p>

            <div className="flex items-center gap-3 mt-4 text-xs font-mono text-cyan-300">
              <span>AI</span>
              <span>•</span>
              <span>CLOUD</span>
              <span>•</span>
              <span>FULL STACK</span>
              <span>•</span>
              <span>REALTIME</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <a
              href="mailto:garvshawinfo@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-cyan-500 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:bg-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Start A Conversation</span>
            </a>

            <button
              onClick={scrollToTop}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Return to top"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social Presence Grid */}
        <div className="py-10 border-b border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target={link.url.startsWith('mailto:') ? '_self' : '_blank'}
                rel="noopener noreferrer"
                data-cursor="external"
                className="flex items-center justify-between p-4 rounded-2xl bg-[#070D18]/80 hover:bg-[#0c1322] border border-white/10 hover:border-cyan-500/40 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                    {getIcon(link.name)}
                  </div>
                  <div>
                    <span className="font-display font-bold text-sm text-white group-hover:text-cyan-300 transition-colors block">
                      {link.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 truncate block max-w-[160px]">
                      {link.label}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Technical Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <p>© {new Date().getFullYear()} Garv Shaw. Engineered with React 19, TypeScript & Tailwind.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Production Edge Deployment</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span>OWASP Top 10 Hardened</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
