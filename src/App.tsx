import React, { useState } from 'react';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CustomCursor } from './components/ui/CustomCursor';
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

      {/* Atmospheric Ambient Glow Backdrops */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[-5%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[45%] h-[45%] bg-indigo-900/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-950/20 rounded-full blur-[150px]" />
      </div>

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
  );
}
