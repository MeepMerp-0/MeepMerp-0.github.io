import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';

import AmbientBg from './components/AmbientBg';
import HudFrame from './components/HudFrame';
import FloatingNav from './components/FloatingNav';

import HeroView from './views/HeroView';
import AboutView from './views/AboutView';
import ProjectsView from './views/ProjectsView';
import ContactView from './views/ContactView';

import { useScrollController } from './controllers/useScrollController';

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
    home: 0,
    about: 0,
    projects: 0,
    contact: 0,
  });

  const {
    activeSection,
    navVisible,
    scrollTo,
  } = useScrollController(
    pageRefs,
    setPageKeys
  );

  const pageStyle = (section) => ({
    position: 'absolute',
    inset: 0,

    overflowY: 'auto',
    overflowX: 'hidden',

    scrollbarWidth: 'none',
    msOverflowStyle: 'none',

    WebkitOverflowScrolling: 'touch',

    pointerEvents:
      activeSection === section
        ? 'auto'
        : 'none',

    zIndex:
      activeSection === section
        ? 10
        : 1,
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
      <AmbientBg />
      <HudFrame />

      <FloatingNav
        visible={navVisible}
        activeSection={activeSection}
        onNav={scrollTo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <motion.div
        ref={homeRef}
        animate={{
          opacity:
            activeSection === 'home'
              ? 1
              : 0,
        }}
        transition={{ duration: 0.18 }}
        style={pageStyle('home')}
      >
        <HeroView
          key={`home-${pageKeys.home}`}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </motion.div>

      {/* CONTENT VIEWPORT */}
      <div
        style={{
          position: 'absolute',

          top: 56,       // push below top HUD line
          left: 40,
          right: 40,
          bottom: 40,

          overflow: 'hidden',
          zIndex: 5,
        }}
      >

        <motion.div
          ref={aboutRef}
          animate={{
            opacity:
              activeSection === 'about'
                ? 1
                : 0,
          }}
          transition={{ duration: 0.18 }}
          style={pageStyle('about')}
        >
          <AboutView
            key={`about-${pageKeys.about}`}
          />
        </motion.div>

        <motion.div
          ref={projectsRef}
          animate={{
            opacity:
              activeSection === 'projects'
                ? 1
                : 0,
          }}
          transition={{ duration: 0.18 }}
          style={pageStyle('projects')}
        >
          <ProjectsView
            key={`projects-${pageKeys.projects}`}
          />
        </motion.div>

        <motion.div
          ref={contactRef}
          animate={{
            opacity:
              activeSection === 'contact'
                ? 1
                : 0,
          }}
          transition={{ duration: 0.18 }}
          style={pageStyle('contact')}
        >
          <ContactView
            key={`contact-${pageKeys.contact}`}
          />
        </motion.div>

      </div>
    </div>
  );
}