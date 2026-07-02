import { useState, useRef } from 'react';

const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRequired(value) {
  return value && value.trim().length > 0;
}

function checkRateLimit(submissionTimes) {
  const now = Date.now();
  const recentSubmissions = submissionTimes.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  );
  return {
    allowed: recentSubmissions.length < MAX_SUBMISSIONS_PER_WINDOW,
    remainingTime: recentSubmissions.length > 0
      ? RATE_LIMIT_WINDOW - (now - recentSubmissions[0])
      : 0,
  };
}

export function useContactForm(submitFn) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    purpose: '',
    message: '',
    website: '',
  });

  const [focused, setFocused] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAsterisk, setShowAsterisk] = useState({
    name: false,
    email: false,
    purpose: false,
    message: false,
  });
  const [emailValid, setEmailValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const submissionTimesRef = useRef([]);

  const handleChange = (field) => (value) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (field === 'email') {
      setShowAsterisk((prev) => ({ ...prev, email: false }));
      if (!validateEmail(value)) {
        setEmailValid(false);
      }
    } else if (showAsterisk[field]) {
      setShowAsterisk((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleFocus = (field) => () => setFocused(field);
  const handleBlur = () => {
    setFocused(null);
    const isValid = validateEmail(values.email);
    setEmailValid(isValid);
    if (values.email) setEmailTouched(true);
  };

  const reset = () => {
    setValues({
      name: '',
      email: '',
      purpose: '',
      message: '',
      website: '',
    });
    setShowAsterisk({
      name: false,
      email: false,
      purpose: false,
      message: false,
    });
    setEmailValid(false);
    setEmailTouched(false);
    setError(null);
    setSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (values.website.trim() !== '') {
      return; // Bot detection
    }

    const isMessageTooLong = values.message.trim().length > MAX_MESSAGE_LENGTH;
    const isValid =
      validateRequired(values.name) &&
      validateEmail(values.email) &&
      validateRequired(values.purpose) &&
      validateRequired(values.message) &&
      !isMessageTooLong;

    setShowAsterisk({
      name: !validateRequired(values.name),
      email: !validateEmail(values.email),
      purpose: !validateRequired(values.purpose),
      message: !validateRequired(values.message) || isMessageTooLong,
    });

    if (!isValid) {
      return;
    }

    // Client-side rate limiting
    const { allowed, remainingTime } = checkRateLimit(submissionTimesRef.current);
    if (!allowed) {
      const seconds = Math.ceil(remainingTime / 1000);
      setError(`Too many submissions. Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before trying again.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitFn({
        name: values.name.trim(),
        email: values.email.trim(),
        purpose: values.purpose.trim(),
        message: values.message.trim(),
      });

      if (result.success) {
        // Record successful submission for rate limiting
        submissionTimesRef.current = [...submissionTimesRef.current, Date.now()];

        setSent(true);
        setTimeout(() => {
          setSent(false);
          setValues({
            name: '',
            email: '',
            purpose: '',
            message: '',
            website: '',
          });
          setShowAsterisk({
            name: false,
            email: false,
            purpose: false,
            message: false,
          });
          setEmailValid(false);
          setEmailTouched(false);
        }, 2000);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    values,
    focused,
    sent,
    loading,
    error,
    showAsterisk,
    emailValid,
    emailTouched,
    handleChange,
    handleFocus,
    handleBlur,
    handleSubmit,
    reset,
    MAX_MESSAGE_LENGTH,
  };
}