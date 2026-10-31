# Public demo boundary

This policy governs any proposed interactive portfolio demo derived from knowledge of private work. It applies to planning, authoring, staging, browser behavior, verification, and export. A demo is a new public illustration, not a copy or a claim that the source product works as shown. It does not itself authorize publication.

## Scope and authority

- The portfolio is the sole public destination. Treat all other project source repositories for this run as private, including their code, assets, history, issue material, build output, and internal notes. Reviewed public dependencies remain eligible under the build allowlist.
- Use only the public aliases `payroll-web`, `payroll-mobile`, `innercircle`, `futurohub`, and `aki-portfolio` in this checkout. Do not put exact private mappings, repository URLs, filesystem paths, revisions, internal names, or a private-source denylist in public files, commits, build artifacts, scan output, reports, or logs.
- Authority to read a source does not grant authority to disclose it. The user supplies exact mappings separately in a private channel; keep that provenance and inspection notes outside the public checkout and its build/export paths. Do not reconstruct missing mappings from context.
- Architecture review may approve technical choices within this boundary; it cannot authorize expanded disclosure. Copying or disclosing private material beyond the current public ceiling requires explicit, scoped permission from the user or an authorized content owner, never inferred from repository read access. This run's default remains newly authored fictional demos. A stage review or successful check does not grant merge, deployment, or publication permission.

## Public and private evidence

- Public plans and reports may record an alias, sanitized evidence ID, public code revision, check command, outcome, and limitations. Keep private source paths/revisions, raw scans, browser archives/HARs, network logs, screenshots, and full build/test output in a separate private evidence store.
- A sanitized evidence ID must be opaque: it must not encode a private path, revision, customer, endpoint, credential, or internal term. Do not paste excerpts from private evidence into a public issue, PR, artifact, prompt, or console transcript.
- Claims about the public portfolio require public evidence. Label an invented interaction as a concept; never use a private observation alone as proof of a current public feature or outcome.

## Source inspection

- Start from approved public behavior and the existing public portfolio record. Inspect private source only when a specific unresolved implementation or claim question requires it, and then inspect the smallest selected files needed for that question.
- Do not execute private applications, install their dependencies, run their build scripts or hooks, or load their environment or configuration to create a demo. Do not run broad private-repository scans or inspect `.env` files, keys, secrets, customer records, production data, or internal UI to copy it. Bounded read-only inspection is neither an import nor a build dependency.
- Do not bring private files into the public working tree, staging tree, editor context for public code, or automated code generation input.
- Keep any necessary inspection notes private. Public handoffs record only the alias, sanitized evidence ID, decision, and whether further disclosure approval is needed.

## Independent authoring and synthetic data

- Default to a new, self-contained fictional demo authored from approved public behavior. Do not clone and redact a private application or import its code, components, assets, screenshots, logs, history, source maps, environment files, databases, or media.
- Invent fictional people, organizations, locations, records, and values from scratch. Masking, scrambling, or lightly changing real records is not synthetic data. Review names, numbers, metadata, examples, and accessibility text for accidental source carryover.
- Use HTML examples and inspectable public code for design work; do not use generated images as examples. Any later asset must have documented public, independently created, or licensed provenance before it enters the source/export allowlist.

## Build and export boundary

- Author and build newly written code in fresh isolated staging outside private source trees. Use a sanitized environment, reviewed public dependencies only, and explicit allowlists for inputs, output files, dependencies, and assets. Do not point build tools, aliases, copy rules, or package scripts at private roots.
- Maintain a file-and-asset manifest for the public source and exported result. Exclude raw `.git` history, `.env` and imported configuration, database dumps/exports, archives, caches, `node_modules` or other raw dependency directories, coverage, private notes, raw traces/HARs, test videos/screenshots, and unreviewed temporary exports from public source and release allowlists. Reviewed bundled dependency code and required licenses may be included. Review every added dependency and transitive asset for origin and browser behavior. Prefer a standalone demo with no new dependency.
- Disable production demo source maps. Reject `.map` files and inline `sourceMappingURL` or `sourceURL` references in the release, and review for any private path carried by generated code or metadata.
- Everything delivered to a browser is public, including minified bundles, CSS, SVG, embedded JSON, comments, licenses, file names, source maps, and debug output. `.gitignore`, minification, or a hidden UI state is not a disclosure control. Client-exposed Vite environment values are part of the bundle.
- Before any public commit or push, scan the complete new release source, public report, and actual built artifacts against private patterns, then perform human review of names, strings, comments, assets, metadata, licenses, and generated files. A public PR or commit discloses its contents even before deployment. Keep raw matches and scan output private; report only category, disposition, and sanitized evidence ID publicly.
- If a leak is suspected, block export and release readiness. Report the category without echoing the matched secret or private text, remove the source of exposure in isolated staging, rebuild, and repeat source plus artifact review.

## Runtime isolation

- Demo actions must use local, in-memory state with a visible Reset control. Use controlled presets for fields resembling personal information. Escape arbitrary text on display; do not inject runtime HTML. Do not persist state in cookies, `localStorage`, `sessionStorage`, IndexedDB, Cache Storage, or service workers.
- A demo must make no live API, production endpoint, analytics, remote font/image/import, `fetch`, XHR, WebSocket, EventSource, beacon, form submission, messaging, or other network request. Reviewed bundled assets are the only expected browser loads. No camera, microphone, GPS, biometric or other device permission, upload, or real download action.
- Provide a directly navigable standalone entry with the demo controls usable there. If embedding is needed, use an iframe with the minimal sandbox tokens: `allow-scripts` only when scripting is required; never combine `allow-scripts` and `allow-same-origin`. Do not grant popups, top navigation, downloads, forms, or parent messaging. An iframe sandbox is not a network firewall.
- Apply a restrictive CSP to the demo's **direct entry as well as its embed**: default deny, `connect-src 'none'`, `form-action 'none'`, and `object-src`, `frame-src`, and `worker-src` set to `'none'`; allow scripts, styles, images, and fonts only from exact reviewed bundled sources needed by the demo. Prefer response headers where the host supports them; verify the delivered policy. A meta CSP can cover supported fetch directives on a direct entry but cannot enforce `sandbox` or `frame-ancestors`. Do not claim either without an effective response header. Do not apply a page-wide CSP that disables the live Aki widget.
- Test the actual direct URL and embedded URL. A blocked request attempt still violates the no-network rule; CSP blocking alone is not proof of compliant behavior.

## Claims and Aki

- Display a visible badge or adjacent label on each demo stating that data is fictional, interaction is local, and no real action occurs. Put the distinction near controls and results, not only in legal copy. Show calculations as illustrative, not statutory or production results.
- Preserve the real, discoverable Aki launcher and chat on the parent portfolio, including its existing consent, region, session, review-before-send voice flow, and accessibility behavior. A separate Aki demo adapter may use canned public FAQ responses, an editable sample transcript, and a simulated failure. Label it a walkthrough; it must make no provider/session request or imply parity with the live assistant.
- The existing high-level public INNERCIRCLE summary is its disclosure ceiling. A generic concept may illustrate fictional operations, but must not imply that its interface, workflow, business rule, architecture, or outcome exists in the private product.
- Premium Cinematic remains the selected visual direction for the portfolio. Any demo presentation must preserve readable DOM content, keyboard access, narrow-screen use, reduced-motion behavior, and natural scrolling independent of a 3D canvas or pinned scene.

## Release decision

- Record source and build allowlist review, private-pattern scan outcome, human review, dependency/asset provenance, direct-entry and embedded isolation, browser request attempts, storage/permission/message behavior, keyboard/narrow-screen/reduced-motion behavior, Reset, labels, and Aki separation. The release checklist defines the evidence slots.
- Mark unrun checks `NOT TESTED` with a reason. A missing leak or network check blocks publication and readiness for the demo, while independent authorized work may continue. Do not claim a guarantee of leak freedom or clean-room provenance from passing checks.
- Final architecture review decides whether the evidence supports a release recommendation. Merge, deployment, and publication remain separate authorized actions. This document revision implements no demos.

## Technical references

- [MDN iframe sandbox reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe): sandbox tokens and the risk of combining script and same-origin permissions.
- [MDN CSP `connect-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src) and [MDN CSP `form-action`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action): connection and form destinations require separate policy controls.
- [MDN CSP `sandbox`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox): the CSP sandbox directive is unavailable in a meta policy.
- [Vite environment and mode guide](https://vite.dev/guide/env-and-mode): client-exposed environment values are bundled into client code.
