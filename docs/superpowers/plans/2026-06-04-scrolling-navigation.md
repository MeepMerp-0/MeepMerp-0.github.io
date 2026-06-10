# Scrolling Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB‑SKILL: Use superpowers:subagent‑driven‑development (recommended) or superpowers:executing‑plans to implement this plan task‑by‑task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable automatic page transition from Home to About when user scrolls down past viewport bottom.

**Architecture:** Add a scroll‑listener at the root `App.jsx` that detects when the page scroll reaches the bottom and programmatically triggers React‑Router navigation to `/about`. Extract listener logic into a dedicated hook `useScrollNavigate`. Update `ScrollIndicator.jsx` to reflect navigation state.

**Tech Stack:** React, React‑Router v6, React Testing Library, Jest, CSS‑in‑JS (if used).

---

### Task 1: Create scroll‑navigation hook

**Files:**
- Create: `src/hooks/useScrollNavigate.jsx`
- Test: `src/hooks/__tests__/useScrollNavigate.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
import { renderHook, act } from '@testing-library/react';
import { useScrollNavigate } from '../useScrollNavigate';
import { MemoryRouter, useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

test('navigates to /about when scroll reaches bottom', () => {
  const navigate = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(navigate);

  const { result } = renderHook(() => useScrollNavigate(), {
    wrapper: MemoryRouter,
  });

  // Simulate scroll to bottom
  act(() => {
    window.innerHeight = 800;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1500,
      configurable: true,
    });
    window.scrollY = 800; // bottom reached
    window.dispatchEvent(new Event('scroll'));
  });

  expect(navigate).toHaveBeenCalledWith('/about');
});
```

- [ ] **Step 2: Verify test fails** (hook not defined).

- [ ] **Step 3: Implement minimal hook**

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useScrollNavigate() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      if (scrollY + innerHeight >= scrollHeight) {
        navigate('/about');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate]);
}
```

- [ ] **Step 4: Run test – expect pass**.

---

### Task 2: Integrate hook into App component

**Files:**
- Modify: `src/App.jsx`
- Test: `src/App/__tests__/AppScrollNavigation.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
import { render, act } from '@testing-library/react';
import App from '../App';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

test('App navigates to About when scrolling to bottom', () => {
  const { getByTestId } = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<div data-testid="about-page">About</div>} />
      </Routes>
    </MemoryRouter>
  );

  // Simulate full page scroll
  act(() => {
    window.innerHeight = 800;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1500,
      configurable: true,
    });
    window.scrollY = 800;
    window.dispatchEvent(new Event('scroll'));
  });

  expect(getByTestId('about-page')).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify test fails (hook not used).**

- [ ] **Step 3: Modify App.jsx**

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeView from './views/HomeView';
import AboutView from './views/AboutView';
import { useScrollNavigate } from './hooks/useScrollNavigate';

function App() {
  useScrollNavigate(); // inject scroll navigation

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/about" element={<AboutView />} />
      </Routes>
    </Router>
  );
}

export default App;
```

- [ ] **Step 4: Run test – expect pass**.

---

### Task 3: Update ScrollIndicator visual state

**Files:**
- Modify: `src/components/ScrollIndicator.jsx`
- Test: `src/components/__tests__/ScrollIndicator.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
import { render } from '@testing-library/react';
import ScrollIndicator from '../ScrollIndicator';
import { MemoryRouter } from 'react-router-dom';

test('ScrollIndicator shows progress bar reflecting scroll position', () => {
  const { getByRole } = render(
    <MemoryRouter>
      <ScrollIndicator />
    </MemoryRouter>
  );

  // initial state – top of page
  const progress = getByRole('progressbar');
  expect(progress).toHaveAttribute('value', '0');

  // Simulate scroll 50% down
  Object.defineProperty(document.documentElement, 'scrollTop', {
    value: 400,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 800,
    configurable: true,
  });
  window.dispatchEvent(new Event('scroll'));

  expect(progress).toHaveAttribute('value', '50');
});
```

- [ ] **Step 2: Verify fails (no listener).**

- [ ] **Step 3: Implement progress logic**

```jsx
import React, { useEffect, useState } from 'react';

export default function ScrollIndicator() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setProgress(Math.round(scrolled));
    };
    window.addEventListener('scroll', update);
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <progress
      role="progressbar"
      max="100"
      value={progress}
      style={{ width: '100%', height: '4px', appearance: 'none' }}
    />
  );
}
```

- [ ] **Step 4: Run test – expect pass**.

---

### Task 4: Ensure accessibility & security checks

**Files:**
- Modify: `src/components/ScrollIndicator.jsx` (add `aria-label`)

- [ ] **Step 1: Add aria‑label**

```jsx
return (
  <progress
    role="progressbar"
    aria-label="Page scroll progress"
    max="100"
    value={progress}
    style={{ width: '100%', height: '4px', appearance: 'none' }}
  />
);
```

- [ ] **Step 2: Run existing tests – ensure no regressions.**

- [ ] **Step 3: Manual security review** – verify no hard‑coded URLs, navigation uses React‑Router only.

---

### Task 5: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Write documentation updates**

```markdown
## Scroll Navigation

The app now automatically navigates from the Home view to the About view when the user scrolls to the bottom of the page.

### How it works
- `useScrollNavigate` hook listens for `scroll` events.
- When `window.scrollY + window.innerHeight >= document.documentElement.scrollHeight`, it calls `navigate('/about')`.
- `ScrollIndicator` component displays scroll progress as a progress bar.

### Testing
Run `npm test src/hooks/__tests__/useScrollNavigate.test.jsx` to verify behavior.
```

- [ ] **Step 2: Verify docs build (if applicable).**

---

## Self‑Review
1. Spec coverage – all requirements (scroll to next page, navigation, visual indicator) mapped to tasks 1‑4. Documentation added in Task 5.
2. No placeholders – every step includes concrete code or commands.
3. Type consistency – hook returns `void`; component uses `number` state; navigation path string consistent (`'/about'`).

All good.

---

## Execution Handoff
Plan saved to `docs/superpowers/plans/2026-06-04-scrolling-navigation.md`.

Two execution options:
1. **Subagent‑Driven (recommended)** – dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** – execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?