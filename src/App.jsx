import { MotionConfig } from 'motion/react';
import { Aki } from './components/aki/Aki.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { ReadingProgress } from './components/ReadingProgress.jsx';
import { useInitialHashScroll } from './hooks/useInitialHashScroll.js';
import { useTheme } from './hooks/useTheme.js';
import { About } from './sections/About.jsx';
import { Contact } from './sections/Contact.jsx';
import { Hero } from './sections/Hero.jsx';
import { Process } from './sections/Process.jsx';
import { Work } from './sections/Work.jsx';

export function App() {
  const { theme, toggleTheme } = useTheme();
  useInitialHashScroll();

  return (
    <MotionConfig reducedMotion="user">
      <ReadingProgress />
      <a className="skip-link" href="#content">Skip to content</a>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main id="content">
        <Hero />
        <Work />
        <About />
        <Process />
        <Contact />
      </main>
      <Footer />
      <Aki />
    </MotionConfig>
  );
}
