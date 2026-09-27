import React from 'react';
import { motion } from 'motion/react';
import { Magnet } from './Magnet';
import { ContactButton } from './ContactButton';
import { HERO_PORTRAIT } from '../data/portfolioData';

interface HeroSectionProps {
  onContactClick?: () => void;
  onExploreClick?: () => void;
  id?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onContactClick,
  id = 'hero-section',
}) => {
  const handleNavClick = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    if (target === 'contact') {
      if (onContactClick) {
        onContactClick();
        return;
      }
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'About', target: 'about' },
    { label: 'Skills', target: 'skills' },
    { label: 'Projects', target: 'projects' },
    { label: 'Contact', target: 'contact' },
  ];

  return (
    <section
      id={id}
      data-cursor-theme="cyan"
      className="relative w-full h-screen min-h-[660px] flex flex-col justify-between bg-transparent overflow-hidden select-none"
    >
      {/* Ambient background light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[680px] h-[550px] sm:h-[680px] bg-gradient-to-br from-cyan-500/10 via-indigo-600/10 to-transparent rounded-full blur-[110px] pointer-events-none" />

      {/* Top Navigation */}
      <motion.nav
        id="main-navbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8 z-30 select-none"
      >
        {navLinks.map((item) => (
          <a
            key={item.target}
            id={`nav-link-${item.target}`}
            href={`#${item.target}`}
            data-magnetic="true"
            data-cursor="link"
            data-cursor-label="NAV"
            onClick={(e) => handleNavClick(e, item.target)}
            className="text-[#D7E2EA] font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem] hover:text-cyan-400 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-200 cursor-pointer"
          >
            {item.label}
          </a>
        ))}
      </motion.nav>

      {/* Main Heading Behind Cartoon Character */}
      <div className="w-full overflow-hidden text-center z-10 px-2 sm:px-4">
        <motion.h1
          id="hero-main-heading"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap w-full text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw] mt-6 sm:mt-4 md:-mt-5 cursor-default select-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
        >
          Hi, i&apos;m garv
        </motion.h1>
      </div>

      {/* Big Cartoon Character Element Centered with Magnetic Interaction */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 pointer-events-none sm:pointer-events-auto">
        <Magnet
          id="hero-portrait-magnet"
          padding={160}
          strength={3}
          activeTransition="transform 0.3s ease-out"
          inactiveTransition="transform 0.6s ease-in-out"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-[300px] sm:w-[420px] md:w-[500px] lg:w-[580px] xl:w-[650px] flex items-end justify-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full flex justify-center"
            >
              <img
                id="hero-portrait-img"
                src={HERO_PORTRAIT}
                alt="Garv Shaw - AI & Cloud Developer"
                className="w-full h-auto object-contain pointer-events-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] filter contrast-105 hover:contrast-110 transition-all duration-300"
                loading="eager"
              />
            </motion.div>
          </motion.div>
        </Magnet>
      </div>

      {/* Bottom Row: Left Description + Right Contact Button */}
      <div className="w-full flex justify-between items-end pb-7 sm:pb-8 md:pb-10 px-6 md:px-10 z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[#D7E2EA] font-light uppercase tracking-wide leading-snug max-w-[160px] sm:max-w-[220px] md:max-w-[280px] backdrop-blur-[2px]"
          style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)' }}
        >
          an ai &amp; cloud developer crafting intelligent solutions and scalable digital experiences
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <ContactButton id="hero-contact-btn" onClick={onContactClick} />
        </motion.div>
      </div>
    </section>
  );
};
