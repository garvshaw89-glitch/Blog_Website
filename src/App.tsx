import React, { useState } from 'react';
import { CursorProvider } from './context/CursorContext';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CustomCursor } from './components/ui/CustomCursor';
import { InteractiveBackgroundIllusion } from './components/InteractiveBackgroundIllusion';
import { CommandPalette } from './components/ui/CommandPalette';
import { SectionProgressHUD } from './components/ui/SectionProgressHUD';
import { EasterEggToast } from './components/ui/EasterEggToast';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MarqueeSection } from './components/MarqueeSection';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { TechnologyConstellation } from './components/TechnologyConstellation';
import { ProjectsSection } from './components/ProjectsSection';
import { InteractiveArchitecture } from './components/InteractiveArchitecture';
import { AiLabSection } from './components/AiLabSection';
import { EngineeringLogSection } from './components/EngineeringLogSection';
import { NowBuildingSection } from './components/NowBuildingSection';
import { GitHubSection } from './components/GitHubSection';
import { ContactSection } from './components/ContactSection';
import { FooterSection } from './components/FooterSection';
import { ProjectModal } from './components/ProjectModal';
import { PROJECTS } from './data/portfolioData';
import { ProjectItem } from './types';

export default function App() {
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
      <main
        id="garv-shaw-portfolio"
        className="relative w-full bg-[#05070A] text-[#D7E2EA] overflow-x-clip min-h-screen selection:bg-cyan-500 selection:text-black"
      >
        {/* 1. Thin Animated Cyan Scroll Tracker */}
        <ScrollProgressBar />

        {/* 2. Desktop Custom Cursor */}
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

        {/* 6. Floating Navigation Header */}
        <Navbar
          onContactClick={handleScrollToContact}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Atmospheric Ambient Glow & Digital Illusion Canvas (Layered Parallax, Warping Grid, Light Field) */}
        <InteractiveBackgroundIllusion />

        <div className="relative z-10 flex flex-col">
          {/* 00 // HERO EXPERIENCE */}
          <HeroSection
            onContactClick={handleScrollToContact}
            onExploreClick={handleScrollToProjects}
          />

          {/* DUAL-DIRECTION INFINITE MARQUEE */}
          <MarqueeSection />

          {/* 01 // ABOUT & ENGINEERING PROFILE */}
          <AboutSection onContactClick={handleScrollToContact} />

          {/* 02 // ENGINEERING MAP & SKILLS MATRIX */}
          <ServicesSection id="skills" />

          {/* 03 // TECHNOLOGY CONSTELLATION GRAPH */}
          <TechnologyConstellation id="constellation" />

          {/* 04 // SELECTED WORK & STICKY PROJECT CARDS */}
          <ProjectsSection onSelectProject={handleSelectProject} />

          {/* 05 // SYSTEM ARCHITECTURE & DATA FLOW */}
          <InteractiveArchitecture id="architecture" />

          {/* 06 // AI ENGINEERING LAB & ASSISTANT */}
          <AiLabSection id="ai-lab" />

          {/* 07 // ENGINEERING BUILD LOG */}
          <EngineeringLogSection id="build-log" />

          {/* NOW BUILDING & SYSTEM TELEMETRY */}
          <NowBuildingSection id="telemetry-status" />

          {/* GITHUB REPOSITORIES & OPEN SOURCE TELEMETRY */}
          <GitHubSection id="github-telemetry" />

          {/* 08 // DIRECT TRANSMISSION / CONTACT */}
          <ContactSection id="contact" />

          {/* CLOSING SCENE & FOOTER */}
          <FooterSection id="footer-scene" onContactClick={handleScrollToContact} />
        </div>

        {/* Deep Engineering Case Study Modal */}
        <ProjectModal project={selectedProject} onClose={handleCloseProject} />
      </main>
    </CursorProvider>
  );
}
