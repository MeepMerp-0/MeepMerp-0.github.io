# Fictional portfolio demo catalog

The [public demo boundary](demo-boundary.md) governs every item here. These are proposed visitor-facing illustrations, not implemented features or evidence of a source product. Each item needs an exact spec, source/export manifest, and verification before release.

## Source aliases

| Public alias | Allowed public treatment |
| --- | --- |
| `payroll-web` | Fictional payroll and attendance illustration. |
| `payroll-mobile` | Fictional mobile check-in illustration. |
| `innercircle` | Generic operations concept within the existing high-level public summary. |
| `futurohub` | Fictional client website illustration. |
| `aki-portfolio` | Canned walkthrough distinct from the live parent-page Aki. |

These aliases identify scope only. They do not encode or authorize disclosure of private locations, revisions, source files, or product behavior.

## Payroll and attendance

**Web concept (`payroll-web`).** Let visitors filter an invented staff roster, adjust synthetic attendance and a synthetic rate, and see simple illustrative totals and an in-page payslip. Provide Reset and bounded presets. Label totals as non-statutory examples; do not imply tax, labor, benefit, or payroll compliance. No real employee data, payroll processing, export, or download.

**Mobile concept (`payroll-mobile`).** Show an in-memory check-in/check-out state and a fictional location selector. A selected location is a simulation, not a GPS reading. No camera, face/biometric check, device permission, employee authentication, attendance submission, or background synchronization. Reset returns the fictional session to its initial state.

## INNERCIRCLE

The existing public high-level summary is the disclosure ceiling. A clearly labeled **generic fictional operations concept** may let a visitor filter fictional items, change a sample status, perform a sample approval, and inspect a local event log. Invent all roles, records, statuses, and event text. Do not reproduce or imply a real interface, workflow, approval rule, architecture, access pattern, audit implementation, or production feature. Do not add screenshots, metrics, internal terminology, or outcome claims.

## FuturoHub

Build a fictional client website illustration with navigable sections and local form validation. Use invented copy and branding-neutral assets; no client media, client copy, analytics, lead submission, contact backend, or other network call. The form may show validation and a simulated local confirmation only; its submit control must never send data or navigate away. Reset clears the local example state.

## Aki

Provide a labeled walkthrough using canned responses to already public FAQ topics, a sample editable transcript that the visitor can review before a simulated send, and a simulated failure/recovery state. Use a separate local adapter that makes no provider, session, voice, or other network call and claims no functional parity. Keep the real parent-page Aki launcher and chat discoverable and functional; do not alter its existing consent, region, session, or voice behavior to support this illustration.

## Presentation

- Every concept visibly says **fictional data**, **local interaction**, and **no real action** near its controls and output. A project claim must stay within the public proof record; a demo screenshot or success state is not proof of a real-world outcome.
- Use inspectable HTML/CSS/JavaScript examples. Premium Cinematic styling may frame selected scenes with 3D and scroll pinning, provided the content remains readable without canvas, works with keyboard and narrow screens, respects reduced motion, and does not trap scrolling.
- Prefer independently authored bundled assets and no new runtime dependency. Scope each demo as a self-contained module with local in-memory state and Reset, then verify both direct and embedded entries under the [boundary](demo-boundary.md#runtime-isolation).
