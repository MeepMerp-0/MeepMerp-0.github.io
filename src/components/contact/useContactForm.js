import { useRef, useState } from 'react';
import { LIMITS, findInvalidFields, isRateLimited } from './contactRules.js';

const EMPTY_VALUES = { name: '', email: '', purpose: '', message: '', website: '' };
const NOTHING_INVALID = { name: false, email: false, purpose: false, message: false };

// Form state and the send flow. `submit` gets the trimmed fields and resolves true once the message is delivered.
export function useContactForm(submit) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [invalid, setInvalid] = useState(NOTHING_INVALID);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentTimes = useRef([]);

  // Props for one input. Editing a field clears its flag; the honeypot has no flag, so it gets no aria-invalid.
  const field = (name) => ({
    name,
    value: values[name],
    onChange: (event) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [name]: value }));
      setInvalid((current) => (current[name] ? { ...current, [name]: false } : current));
    },
    'aria-invalid': invalid[name],
  });

  const reset = () => {
    setValues(EMPTY_VALUES);
    setInvalid(NOTHING_INVALID);
    setFailed(false);
    setSent(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Only a bot fills the hidden website field: drop its message without a word.
    if (values.website.trim() !== '') return;

    const nextInvalid = findInvalidFields(values);
    setInvalid(nextInvalid);
    if (Object.values(nextInvalid).some(Boolean)) return;

    if (isRateLimited(sentTimes.current, Date.now())) {
      setFailed(true);
      return;
    }

    setLoading(true);
    setFailed(false);
    const trimmed = {
      name: values.name.trim(),
      email: values.email.trim(),
      purpose: values.purpose.trim(),
      message: values.message.trim(),
    };
    // maxLength only limits what the visitor types or pastes, so a script or an autofill extension can set a
    // longer name. Such a message is not sent. Its refusal is awaited like a send so that 'Sending…' still renders
    // first: without the await, React batches loading on and off into a single render.
    const delivered = await (trimmed.name.length > LIMITS.name ? false : submit(trimmed));
    setLoading(false);
    if (!delivered) {
      setFailed(true);
      return;
    }
    sentTimes.current = [...sentTimes.current, Date.now()];
    // Keep the success message visible until the visitor explicitly resets.
    // The previous 2-second timer hid confirmation before it could be read.
    setSent(true);
  };

  return {
    values,
    field,
    hasInvalidFields: Object.values(invalid).some(Boolean),
    sent,
    loading,
    failed,
    handleSubmit,
    reset,
  };
}
