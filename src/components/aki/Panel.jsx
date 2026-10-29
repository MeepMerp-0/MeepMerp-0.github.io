import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { EASE_OUT } from '../../utils/motion.js';

// Mirrors the .aki-panel border-radius in global.css, so the panel keeps its corners while it opens.
const PANEL_RADIUS_PX = 18;

export function Panel({ ref, reduceMotion, health, statusLabel, onClose, children }) {
  return (
    <motion.section
      id="aki-panel"
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label="Aki, portfolio AI"
      className="aki-panel"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      initial={reduceMotion ? false : { clipPath: `inset(100% 0% 0% 100% round ${PANEL_RADIUS_PX}px)` }}
      animate={{ clipPath: `inset(0% 0% 0% 0% round ${PANEL_RADIUS_PX}px)`, transitionEnd: { clipPath: 'none' } }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.54, ease: EASE_OUT }}
    >
      <header className="aki-head">
        <div>
          <p className="aki-status-line">
            <span className="aki-dot" data-level={health} aria-hidden="true" />
            <span aria-hidden="true">{statusLabel}</span>
            <span className="sr-only" role="status">{MSG.head[health]}</span>
          </p>
        </div>
        <button type="button" className="icon-button" aria-label="Close Aki" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      {children}
    </motion.section>
  );
}
