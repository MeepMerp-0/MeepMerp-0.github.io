import { useEffect, useRef, useState } from 'react';

// Opening the menu focuses its first link; Escape closes it and returns focus to the menu button.
export function useMobileMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const navRef = useRef(null);
  useEffect(() => {
    if (open) navRef.current?.querySelector('a')?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  const toggle = () => setOpen((isOpen) => !isOpen);
  const close = () => setOpen(false);
  return { open, toggle, close, buttonRef, navRef };
}
