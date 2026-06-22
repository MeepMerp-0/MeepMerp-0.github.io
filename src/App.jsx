// App.jsx
import { useRef, useState, useEffect } from 'react';

import AmbientBg from './components/AmbientBg';
import HudFrame from './components/HudFrame';
import FloatingNav from './components/FloatingNav';

import HeroView from './views/HeroView';
import AboutView from './views/AboutView';
import ProjectsView from './views/ProjectsView';
import ContactView from './views/ContactView';

import { useScrollNavigation } from './hooks/useScrollNavigation';

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  const pageRefs = {
    home: homeRef,
    about: aboutRef,
    projects: projectsRef,
    contact: contactRef,
  };

  const [pageKeys, setPageKeys] = useState({
    home: 0, about: 0, projects: 0, contact: 0,
  });

  const { activeSection, navVisible, scrollTo } = useScrollNavigation(pageRefs, setPageKeys);

  // CSS-only opacity fade — no Framer Motion, no will-change, no stacking context
  const pageStyle = (section) => ({
    position: 'absolute',
    inset: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    opacity: activeSection === section ? 1 : 0,
    transition: 'opacity 0.18s ease',
    pointerEvents: activeSection === section ? 'auto' : 'none',
    zIndex: activeSection === section ? 10 : 1,
  });

  return (
    <div
      id="outer-scroll"
      style={{
        width: '100dvw',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* position:fixed — must have zero transformed/will-changed ancestors */}
      <AmbientBg theme={theme} />
      <HudFrame />

      <FloatingNav
        visible={navVisible}
        activeSection={activeSection}
        onNav={scrollTo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* HeroView: full viewport, outside the inset content container */}
      <div ref={homeRef} style={pageStyle('home')}>
        <HeroView
          key={`home-${pageKeys.home}`}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Content viewport — overflow:clip instead of overflow:hidden.
          clip = same visual clipping but does NOT create a containing block,
          so position:fixed children (AmbientBg, HudFrame) escape correctly. */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 40,
          right: 40,
          bottom: 40,
          overflow: 'clip',
          zIndex: 5,
        }}
      >
        <div ref={aboutRef} style={pageStyle('about')}>
          <AboutView key={`about-${pageKeys.about}`} />
        </div>

        <div ref={projectsRef} style={pageStyle('projects')}>
          <ProjectsView key={`projects-${pageKeys.projects}`} />
        </div>

        <div ref={contactRef} style={pageStyle('contact')}>
          <ContactView key={`contact-${pageKeys.contact}`} />
        </div>
      </div>
    </div>
  );
}