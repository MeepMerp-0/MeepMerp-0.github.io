import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function TypingIndicator() {
  const words = [
    '// Jason Selerio',
    '// Full-Stack Developer',
    '// Software Developer',
    '// Software Engineer',
    '// Web Developer',
    '// Mobile Developer',
    '// Programmer',
    '// Penetration Tester'
  ];

  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCommonPrefix = (a, b) => {
    let i = 0;

    while (
      i < a.length &&
      i < b.length &&
      a[i] === b[i]
    ) {
      i++;
    }

    return a.slice(0, i);
  };

  useEffect(() => {
    const currentWord = words[index];
    const nextIndex = (index + 1) % words.length;
    const nextWord = words[nextIndex];

    const commonPrefix = getCommonPrefix(
      currentWord,
      nextWord
    );

    let timeout;

    if (isDeleting) {
      if (text.length > commonPrefix.length) {
        timeout = setTimeout(() => {
          setText(prev => prev.slice(0, -1));
        }, 50);
      } else {
        timeout = setTimeout(() => {
          setIndex(nextIndex);
          setIsDeleting(false);
        }, 200);
      }
    } else {
      if (text.length < currentWord.length) {
        timeout = setTimeout(() => {
          setText(
            currentWord.substring(
              0,
              text.length + 1
            )
          );
        }, 100);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 1500);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, index]);

  return (
    <motion.div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(12px, 1vw, 14px)',
        color: 'var(--muted)',
        marginBottom: '8px',
        height: '1.2em',
        opacity: 0.8
      }}
    >
      {text}
    </motion.div>
  );
}