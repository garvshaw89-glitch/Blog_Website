import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ArrowUpRight } from 'lucide-react';
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
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('garvshawinfo@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
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
    }, 600);
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
            <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] mb-8 max-w-md shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-400 block mb-2">
                DIRECT FREQUENCY
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm sm:text-base text-[#F2F3F5] font-medium select-all">
                  garvshawinfo@gmail.com
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  data-cursor="button"
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#D5D9DF] hover:text-white transition-colors cursor-pointer"
                  title="Copy email to clipboard"
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
          <div className="p-6 sm:p-9 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_24px_65px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]">
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

              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A7ADB5] block mb-2">
                  PROJECT DOMAIN
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1018] border border-white/[0.1] text-[#F2F3F5] focus:outline-none focus:border-sky-400 text-sm font-sans cursor-pointer transition-colors"
                >
                  {domains.map((d) => (
                    <option key={d} value={d} className="bg-[#070A10] text-white">
                      {d}
                    </option>
                  ))}
                </select>
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

              <button
                type="submit"
                disabled={status === 'sending'}
                data-cursor="button"
                data-cursor-label="SEND"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-sky-300 text-black font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
