import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, Copy, Check, Mail, MessageSquare, Terminal, ArrowUpRight } from 'lucide-react';

interface ContactSectionProps {
  id?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ id = 'contact' }) => {
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
    }, 700);
  };

  const domains = [
    'AI & Machine Intelligence',
    'Cloud Systems & DevOps',
    'Full-Stack Web Engineering',
    'FinTech & Quantitative Software',
    'Other Technical Venture',
  ];

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">10 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              DIRECT TRANSMISSION & INQUIRY
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">ENCRYPTED DISPATCH</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Cinematic Headline & Details */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-[0.95] mb-4">
                BUILD SOMETHING
                <br />
                <span className="text-neutral-500">SIGNIFICANT.</span>
              </h2>

              <p className="font-mono text-xs sm:text-sm tracking-[0.32em] text-[#5B8CFF] uppercase mb-8 font-medium">
                Let&apos;s Connect
              </p>

              <p className="font-sans text-neutral-300 text-base sm:text-lg leading-relaxed font-light mb-10 max-w-lg">
                Have a technical vision, AI architecture to deploy, cloud infrastructure challenge, or digital product to build? Let&apos;s create something meaningful.
              </p>

              {/* Direct email card */}
              <div className="p-6 rounded-2xl bg-[#08090B]/90 border border-white/10 mb-8 max-w-md">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 block mb-2">
                  DIRECT FREQUENCY
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm sm:text-base text-white font-medium select-all">
                    garvshawinfo@gmail.com
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    data-cursor="button"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy email to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs text-neutral-400 pt-4 border-t border-white/10">
              <span>RESPONSE TIME: &lt; 24 HOURS</span>
              <span>TIMEZONE: IST (UTC+5:30)</span>
            </div>
          </div>

          {/* Right Column: High-End Transmission Form */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl bg-[#08090B]/90 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-2">
                    YOUR NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-400 text-sm font-sans transition-colors"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@organization.com"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-400 text-sm font-sans transition-colors"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-2">
                    PROJECT DOMAIN
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-white/10 text-white focus:outline-none focus:border-cyan-400 text-sm font-sans cursor-pointer transition-colors"
                  >
                    {domains.map((d) => (
                      <option key={d} value={d} className="bg-neutral-950 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-2">
                    PROJECT SCOPE & OBJECTIVE
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly describe what you're building, key constraints, and desired timeline..."
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-400 text-sm font-sans transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  data-cursor="button"
                  data-cursor-label="SEND"
                  className="w-full py-4 rounded-full bg-white hover:bg-cyan-300 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.15)] disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <span>TRANSMITTING...</span>
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
    </section>
  );
};
