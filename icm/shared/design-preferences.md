# Portfolio design preferences

## Confirmed direction

The user selected **option D: Premium Cinematic** after reviewing four visual examples. This supersedes the earlier minimal editorial preference. The direction uses deep warm charcoal, warm ivory type, restrained gold, glass/chrome/black sculpture, and cinematic lighting. Selected sections should use scroll-driven 3D; one or more pinned sections should change the scene during scrolling. This is a target for the rework, not a description of the current site. No example image asset is committed here; the option-D description records the selection. Preserve existing accessibility and reduced-motion behavior under [model routing](model-routing.md#primary-implementation-workhorse).

## Aki preservation

**Do not remove Aki.** Preserve a discoverable, functional launcher and chat during the rework. Preserve voice transcription as editable text for the visitor to review and explicitly send. Keep existing consent, privacy notice, session, and region behavior, plus keyboard access, focus behavior, screen-reader access, and mobile usability. Visual restyling is allowed only with functional parity. For detailed Aki security, provider, privacy, and verification authority, follow [model routing](model-routing.md#architecture-security-and-final-authority) and [Aki proof limits](proof-register.md#aki).

## Proposed defaults

These are design proposals, not user-confirmed requirements: place a focused cinematic moment in the hero and selected work showcase; offer a lightweight natural-scroll alternative on mobile; progressively enhance the experience; and keep readable DOM content and navigation independent of a 3D canvas. Avoid a scroll trap. Evaluate these against accessibility, content legibility, device capability, and actual measurements before approval.

## Decisions for specification

Set the exact section/scene placement, pinned sequence and exit, responsive behavior, fallback and reduced-motion behavior, asset provenance and optimization, rendering library if any, performance budgets, loading and failure states, and observable acceptance criteria. Do not add GSAP, Three.js, assets, or another dependency merely because the visual direction mentions 3D. Check the [existing site map](repo-map.md#existing-design-and-constants) and resolve architecture through the assigned authority.
