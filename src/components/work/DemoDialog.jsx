import { useEffect, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';

// A native modal dialog around a sandboxed iframe. The demo pages carry their own strict CSP; the sandbox grants
// scripts only (opaque origin: no storage, forms, popups, top navigation or parent access). The iframe exists only
// while the dialog is open, so a closed demo costs nothing and reopening starts fresh.
export function DemoDialog({ demo, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (demo && !dialog.open) dialog.showModal();
    if (!demo && dialog.open) dialog.close();
  }, [demo]);

  return (
    <dialog ref={ref} className="demo-dialog" aria-labelledby="demo-title" onClose={onClose}
      onClick={(event) => { if (event.target === ref.current) ref.current.close(); }}>
      {demo && (
        <div className="demo-frame">
          <header className="demo-head">
            <div>
              <p className="demo-labels"><span>Fictional</span><span>Local only</span><span>No real action</span></p>
              <h2 id="demo-title">{demo.title}</h2>
              <p className="demo-note">{demo.note}</p>
            </div>
            <div className="demo-tools">
              <a className="project-link" href={demo.src} target="_blank" rel="noopener noreferrer" aria-label="Open the demo on its own page (opens in a new tab)">
                Standalone <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <button type="button" className="icon-button" aria-label="Close demo" onClick={() => ref.current.close()}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </header>
          <iframe className="demo-iframe" src={demo.src} title={demo.title} sandbox="allow-scripts"
            referrerPolicy="no-referrer" loading="lazy" />
        </div>
      )}
    </dialog>
  );
}
