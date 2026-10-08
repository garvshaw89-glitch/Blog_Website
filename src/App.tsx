import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { CursorProvider } from './context/CursorContext';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CustomCursor } from './components/ui/CustomCursor';
import { LuxuryIntro } from './components/intro/LuxuryIntro';
import { CommandPalette } from './components/ui/CommandPalette';
import { MotionParticleWorld } from './components/atmosphere/MotionParticleWorld';
import { SectionProgressHUD } from './components/ui/SectionProgressHUD';
import { EasterEggToast } from './components/ui/EasterEggToast';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MarqueeSection } from './components/MarqueeSection';
import { AboutSection } from './components/AboutSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { DigitalDnaSection } from './components/DigitalDnaSection';
import { ProjectsSection } from './components/ProjectsSection';
import { GitHubSection } from './components/GitHubSection';
import { JourneySection } from './components/JourneySection';
import { TechnologyConstellation } from './components/TechnologyConstellation';
import { WritingSection } from './components/WritingSection';
import { AiLabSection } from './components/AiLabSection';
import { ContactSection } from './components/ContactSection';
import { FooterSection } from './components/FooterSection';
import { ProjectModal } from './components/ProjectModal';
import { PROJECTS } from './data/portfolioData';
import { ProjectItem } from './types';

export default function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean>(false);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('garv_journal_intro_completed', 'true');
    } catch {
      // Ignore
    }
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  const handleScrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToProjects = () => {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectProject = (project: ProjectItem) => {
    setSelectedProject(project);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
  };

  const handleOpenProjectById = (projectId: string) => {
    const proj = PROJECTS.find((p) => p.id === projectId);
    if (proj) setSelectedProject(proj);
  };

  return (
    <CursorProvider>
      <main
        id="garv-shaw-portfolio"
        className="relative w-full bg-[#050505] text-[#F5F5F0] overflow-x-clip min-h-screen selection:bg-cyan-400 selection:text-black"
      >
        {/* 0. Futuristic Luxury Opening Experience Portal */}
        <AnimatePresence>
          {showIntro && <LuxuryIntro onComplete={handleIntroComplete} />}
        </AnimatePresence>

        {/* 1. Thin Animated Scroll Tracker */}
        <ScrollProgressBar />

        {/* 2. Desktop High-End Custom Cursor with Multi-State Labels */}
        <CustomCursor />

        {/* 3. Global Command Palette (Cmd + K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenProjectModal={handleOpenProjectById}
        />

        {/* 4. Section Navigation Timeline HUD */}
        <SectionProgressHUD />

        {/* 5. Easter Egg Toast */}
        <EasterEggToast />

        {/* 6. Transforming Floating Navbar */}
        <Navbar
          onContactClick={handleScrollToContact}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onReplayIntro={handleReplayIntro}
        />

        {/* High-End Motion Particle World (Living Digital Matter) */}
        <MotionParticleWorld />

        {/* Ambient Dark Spatial Background Vignette */}
        <div
          aria-hidden="true"
          className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#050608]/85"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.05), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 120%, rgba(14, 165, 233, 0.02), transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 45%, rgba(5, 6, 8, 0.5) 85%, rgba(5, 6, 8, 0.95) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col">
          {/* 1. HERO / LANDING PAGE with Identity Core */}
          <HeroSection
            onContactClick={handleScrollToContact}
            onExploreClick={handleScrollToProjects}
          />

          {/* DUAL-DIRECTION INFINITE MARQUEE */}
          <MarqueeSection />

          {/* 2. ABOUT / IDENTITY */}
          <AboutSection onContactClick={handleScrollToContact} />

          {/* 3. CAPABILITIES (Interactive Editorial Typography) */}
          <CapabilitiesSection id="capabilities" />

          {/* 4. DIGITAL DNA (Systemic Network Graph) */}
          <DigitalDnaSection id="digital-dna" />

          {/* 5. FEATURED PROJECTS (Large Immersive Case Studies) */}
          <ProjectsSection onSelectProject={handleSelectProject} />

          {/* 6. ENGINEERING / GITHUB TELEMETRY */}
          <GitHubSection id="github-telemetry" />

          {/* 7. EXPERIENCE / JOURNEY (Chronological Timeline) */}
          <JourneySection id="journey" />

          {/* 8. TECHNOLOGY CONSTELLATION GRAPH */}
          <TechnologyConstellation id="constellation" />

          {/* 9. WRITING / THOUGHTS */}
          <WritingSection id="writing" />

          {/* 10. LAB / RESEARCH EXPERIMENTS */}
          <AiLabSection id="ai-lab" />

          {/* 11. CONTACT / DIRECT TRANSMISSION */}
          <ContactSection id="contact" />

          {/* 11. FOOTER */}
          <FooterSection
            id="footer"
            onContactClick={handleScrollToContact}
            onReplayIntro={handleReplayIntro}
          />
        </div>

        {/* Full-Screen Project Case Study Modal */}
        <ProjectModal project={selectedProject} onClose={handleCloseProject} />
      </main>
    </CursorProvider>
  );
}
