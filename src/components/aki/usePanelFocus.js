import { useEffect, useRef } from 'react';
import { AKI_CAN_CHAT } from '../../services/akiClient.js';

// Where keyboard focus goes as the panel changes: into the dialog as it opens, back to the launcher as it closes,
// and to the box once Continue reaches the chat (the first quick answer in a browser that can't chat).
export function usePanelFocus({ open, step, quickOnly, launcherRef, panelRef, inputRef }) {
  const wasOpen = useRef(false);
  const focusInput = useRef(false);

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open, panelRef, launcherRef]);

  useEffect(() => {
    if (step !== 'chat' || !focusInput.current) return;
    focusInput.current = false;
    (AKI_CAN_CHAT ? inputRef.current : panelRef.current?.querySelector('.aki-chip'))?.focus();
  }, [step, panelRef, inputRef]);

  // A voice error or an answer can remove the focused control (the welcome step, quick answers only): keep focus in
  // the panel, where Escape still closes it.
  useEffect(() => {
    if (open && document.activeElement === document.body) panelRef.current?.focus();
  }, [open, step, quickOnly, panelRef]);

  function composeOnChat() {
    focusInput.current = true;
  }

  function focusComposerOrPanel() {
    (inputRef.current ?? panelRef.current)?.focus();
  }

  return { composeOnChat, focusComposerOrPanel };
}
