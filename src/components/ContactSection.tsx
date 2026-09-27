import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, Copy, Check, Mail, MessageSquare, Sparkles, Terminal } from 'lucide-react';

interface ContactSectionProps {
  id?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ id = 'contact' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('AI Systems & LLMs');
  const [message, setMessage] = useState('');

  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('garvshawinfo@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormStatus('error');
      return;
    }

    setFormStatus('sending');

    // Simulated async transmission with mailto fallback trigger
    setTimeout(() => {
      setFormStatus('success');

      // Create fallback mailto link
      const subject = encodeURIComponent(`[Inquiry] ${projectType} from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nProject Type: ${projectType}\n\nMessage:\n${message}`);
      const mailtoUrl = `mailto:garvshawinfo@gmail.com?subject=${subject}&body=${body}`;

      // Open mail client after brief visual confirmation
      window.location.href = mailtoUrl;
    }, 900);
  };

  const projectTypes = [
    'AI Systems & LLMs',
    'Cloud Architecture & DevOps',
    'Full-Stack Web Engineering',
    'Realtime Telemetry & WebSockets',
    'Other Engineering Opportunity',
  ];

  return (
    <section
      id={id}
      className="relative w-full py-24 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-3">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>08 // DIRECT TRANSMISSION</span>
          </div>
          <h2 className="hero-heading font-display font-black uppercase text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3">
            LET&apos;S BUILD SOMETHING INTELLIGENT
          </h2>
          <p className="text-slate-300 font-sans text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Have an ambitious engineering venture, AI integration, or infrastructure challenge? Send a transmission below or reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Info & Quick Copy (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#070D18]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 block mb-3">
                COMMUNICATION MATRIX
              </span>
              <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight mb-4">
                GARV SHAW
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Based in India, collaborating globally across AI engineering, scalable cloud infrastructure, and modern high-frequency web experiences.
              </p>

              {/* Direct Email Card with One-Click Copy */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 mb-6">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  DIRECT EMAIL INBOX
                </span>
                <div className="flex items-center justify-between gap-2">
                  <a
                    href="mailto:garvshawinfo@gmail.com"
                    className="font-mono text-xs sm:text-sm text-cyan-300 hover:text-cyan-200 truncate"
                  >
                    garvshawinfo@gmail.com
                  </a>
                  <button
                    onClick={handleCopyEmail}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copiedEmail && (
                  <span className="font-mono text-[10px] text-emerald-400 mt-1 block">
                    ✓ Email address copied to clipboard
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Response Time: Typically under 24 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Open for engineering consultations & full-time roles</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#090E17]/95 border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            {formStatus === 'success' ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                  MESSAGE TRANSMITTED ✓
                </h3>
                <p className="font-sans text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="text-white font-medium">{name}</span>. Your inquiry has been processed and your mail client has been opened to finalize transmission.
                </p>
                <button
                  onClick={() => {
                    setFormStatus('idle');
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-cyan-300 hover:bg-white/10 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-1.5">
                      YOUR NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Satya Nadella"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-1.5">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="satya@microsoft.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-1.5">
                    VENTURE / PROJECT TYPE
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
                  >
                    {projectTypes.map((t) => (
                      <option key={t} value={t} className="bg-[#090E17] text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-1.5">
                    TECHNICAL BRIEF / MESSAGE *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your architecture requirements, AI use case, or inquiry..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans resize-none"
                  />
                </div>

                {formStatus === 'error' && (
                  <p className="font-mono text-xs text-red-400">
                    Please ensure all required fields are filled out correctly.
                  </p>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={formStatus === 'sending'}
                  className="w-full py-3.5 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {formStatus === 'sending' ? (
                    <span>TRANSMITTING MESSAGE...</span>
                  ) : (
                    <>
                      <span>TRANSMIT MESSAGE</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
