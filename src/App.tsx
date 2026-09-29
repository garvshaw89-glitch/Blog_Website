import React, { useState } from 'react';
import { CursorProvider } from './context/CursorContext';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CustomCursor } from './components/ui/CustomCursor';
import { LuxuryIntro } from './components/intro';
import { LivingMatterBackground } from './components/matter/LivingMatterBackground';
import { ProfileCinematicOverlay } from './components/matter/ProfileCinematicOverlay';
import { CommandPalette } from './components/ui/CommandPalette';
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
import { ContactSection } from './components/ContactSection';
import { FooterSection } from './components/FooterSection';
import { ProjectModal } from './components/ProjectModal';
import { PROJECTS } from './data/portfolioData';
import { ProjectItem } from './types';

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('intro') === 'true') return true;
    if (urlParams.get('intro') === 'false') return false;
    return sessionStorage.getItem('intro_seen') !== 'true';
  });
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
      {/* 0. Futuristic Luxury 3D Technology Portal Opening Sequence */}
      {showIntro && <LuxuryIntro onComplete={() => setShowIntro(false)} />}

      <main
        id="garv-shaw-portfolio"
        className="relative w-full bg-[#050505] text-[#F5F5F0] overflow-x-clip min-h-screen selection:bg-cyan-400 selection:text-black"
      >
        {/* 1. Thin Animated Scroll Tracker */}
        <ScrollProgressBar />

        {/* 2. Desktop High-End Custom Cursor with Multi-State Labels */}
        <CustomCursor />

        {/* 3. Global Command Palette (Cmd + K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenProjectModal={handleOpenProjectById}
          onReplayIntro={() => setShowIntro(true)}
        />

        {/* 4. Section Navigation Timeline HUD */}
        <SectionProgressHUD />

        {/* 5. Easter Egg Toast */}
        <EasterEggToast />

        {/* 6. Transforming Floating Navbar */}
        <Navbar
          onContactClick={handleScrollToContact}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onReplayIntro={() => setShowIntro(true)}
        />

        {/* 7. High-End Living Digital Matter Particle World (Watery Flow, Cursor Repulsion, 3D Globe, Asteroid Rock & Ripples) */}
        <LivingMatterBackground />

        {/* 8. Particle Rocket Launch & Profile Reveal Overlay */}
        <ProfileCinematicOverlay />

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

          {/* 10. CONTACT / DIRECT TRANSMISSION */}
          <ContactSection id="contact" />

          {/* 11. FOOTER */}
          <FooterSection id="footer" onContactClick={handleScrollToContact} />
        </div>

        {/* Full-Screen Project Case Study Modal */}
        <ProjectModal project={selectedProject} onClose={handleCloseProject} />
      </main>
    </CursorProvider>
  );
}
