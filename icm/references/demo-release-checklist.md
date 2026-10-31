# Demo release checklist

Apply the [public demo boundary](../shared/demo-boundary.md) and [demo catalog](../shared/demo-catalog.md) to each proposed public artifact. Record results in the run artifact under the [run contract](../shared/run-contract.md#artifact-metadata). A checked box means a named reviewer inspected evidence; a successful build alone satisfies none of these checks. This checklist does not authorize publication.

## Evidence handling

- [ ] Public report identifies the public alias, sanitized evidence IDs, exact public artifact revision/hash, reviewer, date, commands run, results, and limitations. Private provenance remains separately held outside the public checkout.
- [ ] Exact private mappings, URLs, paths, revisions, notes, raw scan matches, HARs, screenshots, and full build/test/network logs are absent from public source, export, commits, reports, and logs. The report includes no private-source denylist or matched secret text.
- [ ] Each claim is labeled as verified public fact, observation, proposal, or unverified. Fictional interaction and data are explicitly labeled; source access is not treated as permission to disclose.
- [ ] Every required check that could not run is marked `NOT TESTED` with its reason. Missing leak or network evidence blocks demo publication/readiness; other authorized work may continue.

## Source and build review

- [ ] Build newly authored code in fresh isolated staging outside private source trees with sanitized environment, reviewed public dependencies only, and explicit input/output, file, dependency, and asset allowlists. No private app was executed, dependency installed, build script/hook run, or environment/config loaded to make the demo. The source and actual export manifests match the intended scope.
- [ ] All code, records, copy, styling, metadata, and media are independently authored or approved public/licensed inputs. Fictional records were invented from scratch; no private code, asset, screenshot, log, history, source map, environment file, database, media, or internal UI was imported. Expanded private disclosure has explicit scoped permission from the user or authorized content owner; architecture review alone cannot grant it.
- [ ] Public source and release allowlists exclude raw `.git` history, `.env` and imported configuration, database dumps/exports, archives, caches, `node_modules` or other raw dependency directories, coverage, private notes, raw traces/HARs, test videos/screenshots, and unreviewed temporary exports. Reviewed bundled dependency code and required licenses have provenance.
- [ ] Production demo source maps are disabled. The actual export has no `.map` files or inline `sourceMappingURL`/`sourceURL` references, and generated code/metadata carries no private path.
- [ ] Review each dependency and transitive asset for provenance and browser behavior; document the reason for any new dependency. Confirm no client-exposed environment value contains private information.
- [ ] Before any public commit or push, scan the complete new release source, public report, and **actual built artifacts** for private patterns, including filenames, comments, embedded JSON, SVG metadata, licenses, and generated files. A human reviews the same surfaces and resolves findings in private evidence. No raw matches enter the public report.
- [ ] A suspected leak blocks export. Record only its category and sanitized disposition publicly, correct it in isolated staging, rebuild, and rerun source plus artifact review.

## Browser and interaction review

- [ ] Verify the directly navigable entry has usable demo controls; verify it and the embedded entry separately. Inspect the effective CSP on both: default deny, no connections/forms/objects/frames/workers, only exact reviewed asset/script/style allowances. Confirm any `sandbox` or `frame-ancestors` claim is enforced by a response header, not meta; the embed grants only necessary sandbox tokens and never same-origin plus scripts.
- [ ] With browser developer tools, observe initial load, every control, Reset, free-text input, validation, simulated failure/recovery, and error paths. Record all request attempts, including CSP-blocked attempts. Only reviewed bundled-asset loads occur; no API, analytics, remote import/font/image, beacon, form submission, or other outbound request is attempted.
- [ ] Confirm no storage or service worker writes; no device permissions, upload, real download, parent message, popup, or navigation action. Confirm arbitrary input renders as text without HTML execution.
- [ ] Test keyboard operation, focus, narrow viewport, reduced motion, readable content without canvas, natural scroll/pin exit, visible fictional/local/no-real-action labels, and reliable Reset.
- [ ] Confirm real Aki remains discoverable and functional on the parent page, with its established consent, region, session, review-before-send voice, and accessibility behavior. The canned Aki walkthrough stays isolated, sends no provider/session request, and claims no parity.

## Public handoff

- [ ] Report the exact public artifact hash/revision, checks and commands actually run, their outcomes, reviewer findings, and `NOT TESTED` items with reasons. State what was observed; avoid guaranteed leak-free or clean-room claims.
- [ ] Architecture review records a readiness recommendation and unresolved risks. Missing mandatory evidence yields `BLOCKED`, even if the demo looks complete.
- [ ] Merge, deployment, and publication have separate applicable authorization. Passing this checklist or completing an ICM stage does not grant it.
