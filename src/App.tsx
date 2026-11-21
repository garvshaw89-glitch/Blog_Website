import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { CursorProvider } from './context/CursorContext';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { AsteroidCursor } from './components/cursor/RocketCursor';
import { LuxuryIntro } from './components/intro/LuxuryIntro';
import { CommandPalette } from './components/ui/CommandPalette';
import { MilkyWayGalaxy } from './components/atmosphere/MilkyWayGalaxy';
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
import { ScrollSlideSection } from './components/ui/ScrollSlideSection';
import { PROJECTS } from './data/portfolioData';
import { ProjectItem } from './types';
import { interactionEngine } from './context/SingularityInteractionEngine';

export default function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  // Fresh initialization on every page load / refresh — kept in React memory only
  const [showIntro, setShowIntro] = useState<boolean>(true);
  // Keep normal default cursor through THINK. CREATE. DISCOVER. until entry asteroid lands & morphs into cursor
  const [isRocketCursorActive, setIsRocketCursorActive] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (
        e.key.toLowerCase() === 'r' &&
        !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())
      ) {
        interactionEngine.triggerRocketLaunch(0, -0.92);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleIntroComplete = () => {
    setIsRocketCursorActive(true);
    setShowIntro(false);

    // Preserve original destination route / section hash if someone refreshed an internal section
    if (typeof window !== 'undefined' && window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  const handleReplayIntro = () => {
    setIsRocketCursorActive(false);
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
          {showIntro && (
            <LuxuryIntro
              onComplete={handleIntroComplete}
              onRocketCursorReady={() => setIsRocketCursorActive(true)}
            />
          )}
        </AnimatePresence>

        {/* 1. Thin Animated Scroll Tracker */}
        <ScrollProgressBar />

        {/* 2. Desktop Sculpted Asteroid Cursor (cosmic reticle in intro -> asteroid on crash) */}
        <AsteroidCursor enabled={true} morphToAsteroid={isRocketCursorActive} />

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
          entered={!showIntro}
          onContactClick={handleScrollToContact}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onReplayIntro={handleReplayIntro}
        />

        {/* Ambient Dark Spatial Background Vignette (base layer) */}
        <div
          aria-hidden="true"
          className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#050608]"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 120%, rgba(14, 165, 233, 0.04), transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 40%, rgba(3, 4, 7, 0.5) 80%, rgba(3, 4, 7, 0.95) 100%)',
            }}
          />
        </div>

        {/* Interactive 3D Luminous Milky Way Galaxy Particle Field (shines live through PORTFOLIO BY GARV SHAW cutout) */}
        <MilkyWayGalaxy />

        <div className="relative z-10 flex flex-col">
          {/* 1. HERO / LANDING PAGE with Identity Core */}
          <HeroSection
            entered={!showIntro}
            onContactClick={handleScrollToContact}
            onExploreClick={handleScrollToProjects}
          />

          {/* DUAL-DIRECTION INFINITE MARQUEE */}
          <MarqueeSection />
        </div>

        {/* 2. ABOUT / IDENTITY (emerges from under MilkyWayGalaxy z-[2] into foreground z-10) */}
        <AboutSection onContactClick={handleScrollToContact} />

        {/* 3. CAPABILITIES */}
        <ScrollSlideSection>
          <CapabilitiesSection id="capabilities" />
        </ScrollSlideSection>

        {/* 4. DIGITAL DNA */}
        <ScrollSlideSection>
          <DigitalDnaSection id="digital-dna" />
        </ScrollSlideSection>

        {/* 5. FEATURED PROJECTS */}
        <ScrollSlideSection>
          <ProjectsSection id="projects" onSelectProject={handleSelectProject} />
        </ScrollSlideSection>

        {/* 6. ENGINEERING / GITHUB TELEMETRY */}
        <ScrollSlideSection>
          <GitHubSection id="github-telemetry" />
        </ScrollSlideSection>

        {/* 7. EXPERIENCE / JOURNEY */}
        <ScrollSlideSection>
          <JourneySection id="journey" />
        </ScrollSlideSection>

        {/* 8. TECHNOLOGY CONSTELLATION GRAPH */}
        <ScrollSlideSection>
          <TechnologyConstellation id="constellation" />
        </ScrollSlideSection>

        {/* 9. WRITING / THOUGHTS */}
        <ScrollSlideSection>
          <WritingSection id="writing" />
        </ScrollSlideSection>

        {/* 10. LAB / RESEARCH EXPERIMENTS */}
        <ScrollSlideSection>
          <AiLabSection id="ai-lab" />
        </ScrollSlideSection>

        {/* 11. CONTACT / DIRECT TRANSMISSION */}
        <ScrollSlideSection>
          <ContactSection id="contact" />
        </ScrollSlideSection>

        <div className="relative z-10 flex flex-col">
          {/* 12. FOOTER */}
          <FooterSection
            id="footer"
            onContactClick={handleScrollToContact}
            onReplayIntro={handleReplayIntro}
          />
        </div>

        {/* Full-Screen Project Case Study Modal */}
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseProject}
          onSelectProject={handleSelectProject}
        />
      </main>
    </CursorProvider>
  );
}
