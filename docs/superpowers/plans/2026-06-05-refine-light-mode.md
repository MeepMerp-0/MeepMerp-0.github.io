# Refine Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the portfolio's Light Mode for eye comfort, readability, and a premium "soft glass" aesthetic while maintaining the futuristic feel.

**Architecture:** Update CSS variables in `global.css` to use a warmer, more balanced palette. Refactor components to replace "neon glow" effects with "soft layered shadows" when in Light Mode. Ensure WCAG accessibility compliance for text contrast.

**Tech Stack:** React, CSS Variables, Lucide Icons, Framer Motion.

---

### Task 1: Palette & Global Style Refinement

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Update `[data-theme='light']` tokens**
Replace the current cool-gray palette with the "Soft Stone" palette.

```css
[data-theme='light'] {
  --bg: #f9fafb;      /* Soft off-white */
  --bg2: #ffffff;     /* Pure white surfaces */
  --bg3: #f3f4f6;     /* Muted surfaces */
  --text: #111827;    /* Slate 900 for text */
  --muted: #4b5563;   /* Slate 600 for muted text */
  --cyan: #0891b2;    /* Darkened Cyan */
  --blue: #1d4ed8;    /* Deep Blue */
  --azure: #0369a1;
  --electric: #2563eb;
  --soft: #3b82f6;

  --card-bg: rgba(255, 255, 255, 0.85);
  --nav-bg: rgba(255, 255, 255, 0.94);
  --bubble-bg: rgba(255, 255, 255, 0.9);
  --item-bg: rgba(255, 255, 255, 0.75);
  --border: rgba(17, 24, 39, 0.06);
  --border-subtle: rgba(17, 24, 39, 0.03);
  --shadow: rgba(0, 0, 0, 0.06);
  --glow-1: rgba(8, 145, 178, 0.03); /* Drastically reduced glow */
  --glow-2: rgba(30, 64, 175, 0.03);
  --glow-3: rgba(37, 99, 235, 0.02);
  --dot-grid: rgba(17, 24, 39, 0.04);
  --selection: rgba(8, 145, 178, 0.12);
  --nav-active-bg: rgba(8, 145, 178, 0.08);
  --nav-hover-bg: rgba(8, 145, 178, 0.04);
  --nav-border: rgba(8, 145, 178, 0.15);
}
```

- [ ] **Step 2: Adjust typography weights for Light Mode**
Add font-weight overrides to ensure legibility.

```css
[data-theme='light'] body {
  font-weight: 450; /* Slightly heavier than default for legibility */
}

[data-theme='light'] h1, 
[data-theme='light'] h2, 
[data-theme='light'] h3 {
  font-weight: 700;
  letter-spacing: -0.01em;
}
```

---

### Task 2: Ambient Background & HUD Polish

**Files:**
- Modify: `src/components/AmbientBg.jsx`
- Modify: `src/components/HudFrame.jsx`

- [ ] **Step 1: Reduce glow opacity in `AmbientBg.jsx`**
Update the dot grid and orbs to be even more subtle in Light Mode.

- [ ] **Step 2: Solidify `HudFrame.jsx` lines**
In Light Mode, the corner brackets and lines should be slightly darker to remain visible.

---

### Task 3: Surface Layering & Shadow Refinement

**Files:**
- Modify: `src/views/HeroView.jsx`
- Modify: `src/views/ProjectsView.jsx`
- Modify: `src/views/ContactView.jsx`

- [ ] **Step 1: Update Hero Card Shadow**
Replace the heavy glow shadow with a soft layered shadow.

- [ ] **Step 2: Refine Project Cards**
Update `ProjectCard` to use `var(--shadow)` for depth instead of glow accents. Ensure the "scanline" effect is very faint in light mode.

- [ ] **Step 3: Refine Contact Cards**
Ensure the `ContactCard` borders are visible but neutral.

---

### Task 4: Interactive Element Contrast

**Files:**
- Modify: `src/components/FloatingNav.jsx`
- Modify: `src/components/ServiceBubble.jsx`

- [ ] **Step 1: Solidify Navigation Icons/Buttons**
Ensure the theme toggle and nav buttons have distinct "Active" states without relying on glow.

- [ ] **Step 2: Darken Service Bubbles**
Ensure bubbles have a slightly more defined border in Light Mode to separate them from the light background.

---

### Task 5: Accessibility & Final Polish

- [ ] **Step 1: Check contrast ratios**
Verify text-on-surface contrast using a tool or manual check against WCAG AA.
- [ ] **Step 2: Verify "Soft White Glass" feel**
Ensure `backdrop-filter` is balanced with the higher background opacity.

---

### Task 6: Final Review

- [ ] **Step 1: Visual comparison**
Check Dark vs Light for aesthetic consistency.
