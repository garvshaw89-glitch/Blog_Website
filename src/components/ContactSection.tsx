import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Copy, Check, ArrowUpRight, ChevronDown, RotateCcw } from 'lucide-react';
import { GlitchHeading } from './ui/GlitchHeading';

interface ContactSectionProps {
  inSheet?: boolean;
  id?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  inSheet = false,
  id = 'contact',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('AI & Machine Intelligence');
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domainMenuOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDomainMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDomainMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [domainMenuOpen]);

  const handleCopyEmail = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('garvshawinfo@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      const subject = encodeURIComponent(`[Transmission] ${projectType} from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nDomain: ${projectType}\n\nProject Scope:\n${message}`
      );
      window.location.href = `mailto:garvshawinfo@gmail.com?subject=${subject}&body=${body}`;
    }, 450);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setStatus('idle');
  };

  const domains = [
    'AI & Machine Intelligence',
    'Cloud Systems & DevOps',
    'Full-Stack Web Engineering',
    'FinTech & Quantitative Software',
    'Other Technical Venture',
  ];

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">10</span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
            DIRECT TRANSMISSION &amp; INQUIRY
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          DIRECT DISPATCH
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <GlitchHeading className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-[#F2F3F5] leading-[0.95] mb-4">
              BUILD SOMETHING
              <br />
              <span className="text-[#A7ADB5]">SIGNIFICANT.</span>
            </GlitchHeading>

            <p className="font-mono text-xs sm:text-sm tracking-[0.28em] text-sky-400 uppercase mb-6 font-medium">
              Let&apos;s Connect
            </p>

            <p className="font-sans text-[#A7ADB5] text-base sm:text-lg leading-relaxed font-light mb-8 max-w-lg [text-wrap:balance]">
              Have a technical vision, AI architecture to deploy, cloud infrastructure challenge, or digital product to build? Let&apos;s create something meaningful.
            </p>

            {/* Direct Email Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/94 border border-white/[0.09] mb-8 max-w-md shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-400 block mb-2">
                DIRECT FREQUENCY
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm sm:text-base text-[#F2F3F5] font-medium select-all truncate">
                  garvshawinfo@gmail.com
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  data-cursor="button"
                  data-cursor-label={copied ? 'COPIED' : 'COPY'}
                  className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#D5D9DF] hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Copy email to clipboard"
                  aria-label="Copy email address"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs text-[#626A73] pt-4 border-t border-white/[0.08]">
            <span>RESPONSE · &lt; 24 HOURS</span>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span>IST (UTC+5:30)</span>
          </div>
        </div>

        {/* Right Column: Transmission Form */}
        <div className="lg:col-span-6">
          <div className="p-6 sm:p-9 rounded-2xl bg-[#070A10]/94 border border-white/[0.09] shadow-[0_24px_65px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A7ADB5] block mb-2">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1018] border border-white/[0.1] text-[#F2F3F5] placeholder-[#626A73] focus:outline-none focus:border-sky-400 text-sm font-sans transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A7ADB5] block mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@organization.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1018] border border-white/[0.1] text-[#F2F3F5] placeholder-[#626A73] focus:outline-none focus:border-sky-400 text-sm font-sans transition-colors"
                />
              </div>

              {/* Custom Obsidian ARIA Dropdown (prevents OS select cursor leak) */}
              <div ref={dropdownRef} className="relative">
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A7ADB5] block mb-2">
                  PROJECT DOMAIN
                </label>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={domainMenuOpen}
                  onClick={() => setDomainMenuOpen((prev) => !prev)}
                  data-cursor="button"
                  data-cursor-label="SELECT"
                  className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-[#0B1018] border border-white/[0.1] hover:border-white/[0.2] focus:border-sky-400 text-left text-[#F2F3F5] text-sm font-sans flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <span className="truncate">{projectType}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A7ADB5] shrink-0 transition-transform duration-200 ${
                      domainMenuOpen ? 'rotate-180 text-sky-400' : ''
                    }`}
                  />
                </button>

                {domainMenuOpen && (
                  <ul
                    role="listbox"
                    aria-label="Project Domain"
                    className="absolute left-0 right-0 mt-2 z-30 rounded-xl bg-[#090E17] border border-sky-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.92)] py-1.5 overflow-hidden"
                  >
                    {domains.map((d) => {
                      const active = d === projectType;
                      return (
                        <li key={d} role="option" aria-selected={active}>
                          <button
                            type="button"
                            onClick={() => {
                              setProjectType(d);
                              setDomainMenuOpen(false);
                            }}
                            data-cursor="button"
                            className={`w-full text-left px-4 py-2.5 min-h-[42px] text-sm font-sans flex items-center justify-between transition-colors cursor-pointer ${
                              active
                                ? 'bg-sky-500/15 text-sky-300 font-medium'
                                : 'text-[#D5D9DF] hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <span>{d}</span>
                            {active && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A7ADB5] block mb-2">
                  PROJECT SCOPE &amp; OBJECTIVE
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Briefly describe what you're building, key constraints, and desired timeline..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1018] border border-white/[0.1] text-[#F2F3F5] placeholder-[#626A73] focus:outline-none focus:border-sky-400 text-sm font-sans transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  data-cursor="button"
                  data-cursor-label="SEND"
                  className="flex-1 min-h-[48px] py-3.5 rounded-xl bg-white hover:bg-sky-300 text-black font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <span>TRANSMITTING...</span>
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>DISPATCH OPENED IN CLIENT</span>
                    </>
                  ) : (
                    <>
                      <span>START A CONVERSATION</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {status === 'success' && (
                  <button
                    type="button"
                    onClick={handleReset}
                    data-cursor="button"
                    aria-label="Reset contact form"
                    className="min-h-[48px] px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[#D5D9DF] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  if (inSheet) {
    return <div className="select-none">{content}</div>;
  }

  return (
    <section
      id={id}
      className="relative w-full py-20 sm:py-26 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      {content}
    </section>
  );
};
