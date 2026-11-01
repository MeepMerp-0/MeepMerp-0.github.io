# Fictional portfolio demo catalog

The [public demo boundary](demo-boundary.md) governs every item here. These are proposed visitor-facing illustrations, not implemented features or evidence of a source product. Each item needs an exact spec, source/export manifest, and verification before release.

## Source aliases

| Public alias | Allowed public treatment |
| --- | --- |
| `payroll-web` | Fictional payroll and attendance illustration. |
| `payroll-mobile` | Fictional mobile check-in illustration. |
| `innercircle` | Existing public high-level summary and abstract scene; only clearly independent fictional concepts may supplement it. |
| `futurohub` | Fictional client website illustration. |
| `aki-portfolio` | Existing public project and real assistant; preserve robot/runtime, with scoped chat-panel styling only when authorized. |

These aliases identify scope only. They do not encode or authorize disclosure of private locations, revisions, source files, or product behavior.

## Payroll and attendance

**Web concept (`payroll-web`).** Let visitors filter an invented staff roster, adjust synthetic attendance and a synthetic rate, and see simple illustrative totals and an in-page payslip. Provide Reset and bounded presets. Label totals as non-statutory examples; do not imply tax, labor, benefit, or payroll compliance. No real employee data, payroll processing, export, or download.

**Mobile concept (`payroll-mobile`).** Show an in-memory check-in/check-out state and a fictional location selector. A selected location is a simulation, not a GPS reading. No camera, face/biometric check, device permission, employee authentication, attendance submission, or background synchronization. Reset returns the fictional session to its initial state.

## INNERCIRCLE

The existing public high-level summary is the disclosure ceiling. Default to that summary and an abstract scene. A clearly labeled **generic fictional operations concept** is permissible only when its independence from INNERCIRCLE is unambiguous. Invent every role, record, status, and event; do not reproduce or imply a real interface, workflow, approval rule, architecture, access pattern, audit implementation, or production feature. Omit a concept when that distinction cannot be maintained. Do not add screenshots, metrics, internal terminology, or outcome claims.

## FuturoHub

Build a fictional client website illustration with navigable sections and local form validation. Use invented copy and branding-neutral assets; no client media, client copy, analytics, lead submission, contact backend, or other network call. The form may show validation and a simulated local confirmation only; its submit control must never send data or navigate away. Reset clears the local example state.

## Aki

Keep Aki as the existing public project and the real discoverable assistant. **Do not create a canned walkthrough, simulated voice flow, duplicate widget, or replacement mock.** Preserve the robot's assets, appearance, animations, and launcher. When the task includes the portfolio redesign, only scoped chat-panel presentation, responsive geometry, existing theme binding, and minimal presentation markup may change. Preserve copy, semantics, event wiring, conversation behavior, services/Worker/configuration, providers, consent/privacy/session/region/storage, and editable voice transcription before explicit send. A demo-only request does not independently authorize chat styling. Existing controlled test mocks remain verification facilities.

## Presentation

- Every concept visibly says **fictional data**, **local interaction**, and **no real action** near its controls and output. A project claim must stay within the public proof record; a demo screenshot or success state is not proof of a real-world outcome.
- The confirmed Work order is **Aki → INNERCIRCLE → Timekeeping, Payroll & Attendance → FuturoHub**. The specific fictional demo interactions above remain proposals, not claims about private products or completed features.
- Use inspectable HTML/CSS/JavaScript examples, with no generated example images. The main portfolio Work stage requires real Three.js on capable devices and native page-scroll pin/scrub/pause/reverse/release into About, plus keyboard chapters/skip and readable DOM fallbacks. This does not require a new renderer inside every demo or a canned Aki illustration.
- Prefer independently authored bundled assets and no unnecessary demo dependency. The separately authorized Three.js Work integration must not relax demo network isolation or change Aki-related dependency behavior. Scope each permitted demo as a self-contained module with local in-memory state and Reset, then verify direct and embedded entries under the [boundary](demo-boundary.md#runtime-isolation).
- Verify the included presentation at **320, 360, 390, 768, 820, 1024, and 1440px in light and dark themes**, with reduced motion, resize/orientation, keyboard/touch, and useful rendering-failure alternatives. A static in-conversation example is not production acceptance evidence.
