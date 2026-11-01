import { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import { DemoDialog } from '../components/work/DemoDialog.jsx';
import { Emblem } from '../components/work/Emblem.jsx';
import { ProjectPanel } from '../components/work/ProjectPanel.jsx';
import { SceneCanvas } from '../components/work/SceneCanvas.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { WORK_SCENES } from '../data/workScenes.js';
import { useWorkMode, useWorkProgress } from '../hooks/useWorkProgress.js';
import { twoDigits } from '../utils/format.js';

const COUNT = WORK_SCENES.length;

// Work is one of three layouts with the same content and actions:
// - pinned: the stage sticks under the header while the page scrolls through a tall track; scroll position drives
//   the Three.js scene and which project panel shows. After the last chapter the stage scrolls away into About.
// - strip: articles flow normally under a short sticky 3D band that follows the article being read.
// - static (reduced motion or a short screen): articles flow with still emblems and no canvas.
export function Work({ theme }) {
  const reduceMotion = useReducedMotion();
  const mode = useWorkMode(reduceMotion);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const articleRefs = useRef([]);
  const [demo, setDemo] = useState(null);
  const { active, setActive, store, chapterTop } = useWorkProgress({ mode, count: COUNT, trackRef, stageRef, articleRefs });

  const goToChapter = (index) => {
    setActive(index);
    const top = chapterTop(index);
    if (top !== null) window.scrollTo({ top, behavior: 'smooth' });
  };

  const openDemo = (project) => setDemo(project.demo);

  const intro = (
    <div className="shell work-head">
      <SectionIntro titleId="work-title" number="01" eyebrow="SELECTED WORK" title="Four projects, in depth."
        subtitle="An AI assistant, current company work, a business system across web and mobile, and client web delivery." />
      <a className="work-skip" href="#about">Skip the project scenes <ArrowDown size={15} aria-hidden="true" /></a>
    </div>
  );

  if (mode === 'pinned') {
    return (
      <section className="work-section" id="work" aria-labelledby="work-title" data-mode="pinned">
        {intro}
        <div className="work-track" ref={trackRef} style={{ '--chapters': COUNT }}>
          <div className="work-stage" ref={stageRef}>
            <SceneCanvas store={store} theme={theme} compact={false} fallbackId={WORK_SCENES[active].id} />
            <div className="work-stage-inner shell">
              <div className="work-panels">
                {WORK_SCENES.map((project, index) => (
                  <ProjectPanel key={project.id} project={project} index={index} total={COUNT} onDemo={openDemo}
                    className={index === active ? 'project-panel is-active' : 'project-panel'} hidden={index !== active} />
                ))}
              </div>
              <nav className="work-chapters" aria-label="Project chapters">
                <ol>
                  {WORK_SCENES.map((project, index) => (
                    <li key={project.id}>
                      <button type="button" aria-current={index === active ? 'step' : undefined}
                        aria-controls={`project-${project.id}`} onClick={() => goToChapter(index)}>
                        <span>{twoDigits(index + 1)}</span> {project.chapter}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <p className="sr-only" aria-live="polite">{`Project ${active + 1} of ${COUNT}: ${WORK_SCENES[active].title}`}</p>
          </div>
        </div>
        <DemoDialog demo={demo} onClose={() => setDemo(null)} />
      </section>
    );
  }

  return (
    <section className="work-section" id="work" aria-labelledby="work-title" data-mode={mode}>
      {intro}
      <div className="work-flow shell" ref={trackRef}>
        {mode === 'strip' && (
          <div className="work-strip" ref={stageRef}>
            <SceneCanvas store={store} theme={theme} compact fallbackId={WORK_SCENES[active].id} />
            <p className="work-strip-label" aria-hidden="true">{twoDigits(active + 1)} · {WORK_SCENES[active].chapter}</p>
          </div>
        )}
        {WORK_SCENES.map((project, index) => (
          <ProjectPanel key={project.id} project={project} index={index} total={COUNT} onDemo={openDemo}
            className="project-article" panelRef={(el) => { articleRefs.current[index] = el; }}>
            {mode === 'static' && <div className="project-emblem"><Emblem id={project.id} /></div>}
          </ProjectPanel>
        ))}
      </div>
      <DemoDialog demo={demo} onClose={() => setDemo(null)} />
    </section>
  );
}
