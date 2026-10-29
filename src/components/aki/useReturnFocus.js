import { useEffect, useRef } from 'react';

// The box and mic are disabled while Aki answers, which drops focus; give it back to the one the visitor used.
// After a voice turn that is the mic, so phones don't pop the keyboard (the box if a wait still disables the mic).
export function useReturnFocus({ requesting, inputRef, micRef }) {
  const control = useRef(null);

  useEffect(() => {
    if (requesting || !control.current) return;
    const mic = control.current === micRef.current && !micRef.current.disabled;
    control.current = null;
    (mic ? micRef.current : inputRef.current)?.focus();
  }, [requesting, inputRef, micRef]);

  // Enter in the box, or a click on Send or the mic (which take focus): the visitor was composing; remember where.
  function rememberComposer() {
    control.current = inputRef.current?.form?.contains(document.activeElement) ? document.activeElement : null;
  }

  return { rememberComposer };
}
