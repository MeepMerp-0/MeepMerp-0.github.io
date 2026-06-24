import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileDown } from 'lucide-react';
import { PERSONAL } from '../data/portfolioData.js';

export default function DownloadResumeButton({ delay }) {
  const [hov, setHov] = useState(false);
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    // check if /resume-file-name.pdf exists in public folder
    fetch('/jason_selerio.pdf', { method: 'HEAD', cache: 'no-cache' })
      .then(r => {
        const isPDF = r.ok && r.headers.get('content-type')?.includes('pdf');
        setUseLocal(isPDF);
      })
      .catch(() => setUseLocal(false));
  }, []);

  const handleClick = () => {
    const url = useLocal ? '/jason_selerio.pdf' : PERSONAL.resumeUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{ display: 'inline-flex' }}
    >
      <button
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          border: '1px solid var(--accent-border)',
          borderRadius: 9,
          background: hov ? 'var(--accent-bg-hover)' : 'var(--item-bg)',
          color: 'var(--cyan)',
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'border-color 0.3s, background 0.3s',
        }}
      >
        <FileDown size={18} strokeWidth={1.5} />
        Download Resume
      </button>
    </motion.span>
  );
}