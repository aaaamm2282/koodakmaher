# Third-party skills

These skills were copied unmodified (except where noted) from public repositories at the request of the project owner, so that Claude Code sessions in this repository can use them. Each folder keeps its upstream LICENSE (and NOTICE where there is one). Most are MIT; `impeccable` and `frontend-design` are Apache-2.0 and `unslop` is CC BY 4.0 (see the notes).

Before installing, each SKILL.md and reference file was checked for hidden Unicode (zero-width and bidi control characters), instructions aimed at the agent (ignore/override, hide from the user, send data out) and piped shell installs, and every bundled script was read for network and process calls. Nothing harmful was found. Harmless hits from the 2026-11-19 batch: a zero-width joiner inside an emoji test string (`break-ui/CATALOG.md`), zero-width spaces that keep nested code fences apart (`improve-animations/PLAN-TEMPLATE.md`), the Arabic end-of-verse sign discussed as text (`unslop/references/rtl.md`), and "ignore previous instructions" quoted as an example of text to distrust (emil skills).

| Skill folder(s) | Source | Commit | License |
|---|---|---|---|
| animate, animate-expo, animation-performance, animation-vocabulary, apple-design, ask-emil, ask-sonner, break-ui, choreograph, emil-design-eng, find-animation-opportunities, gestures, improve-animations, learn-taste, mobile-native, pick-ui-library, prototype, remove-animations, review-animations, write-swift | https://github.com/emilkowalski/skills | 64eb3de | MIT |
| ui-ux-pro-max (without `scripts/tests`) | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | 2de1134 | MIT |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills | 1a2c79d | MIT (per README) |
| brandkit, image-to-code | https://github.com/Leonxlnx/imagegen-skills | beb16b0 | MIT |
| extract-design | https://github.com/Manavarya09/design-extract | 84c3c59 | MIT |
| seo-audit, ai-seo, schema, site-architecture, content-strategy, copywriting, copy-editing, cro, analytics (without `evals/`) | https://github.com/coreyhaines31/marketingskills | 1f83744 | MIT |
| seo-local, seo-geo, seo-schema, seo-content, seo-page, seo-images, seo-technical, seo-sitemap, seo-maps, seo-plan, seo-content-brief, seo-cluster | https://github.com/AgriciDaniel/claude-seo | 468ed5b | MIT |
| `.claude/vendor/claude-seo/skills/seo/references/` (reference files only, see notes) | https://github.com/AgriciDaniel/claude-seo | 468ed5b | MIT |
| impeccable | https://github.com/pbakaus/impeccable | b49177d | Apache-2.0 (LICENSE and NOTICE.md in the folder) |
| frontend-design | https://github.com/anthropics/skills | e4bb5d9 | Apache-2.0 (LICENSE.txt in the folder) |
| baseline-ui, fixing-accessibility, fixing-motion-performance, fixing-metadata, improve-ui, create-design-md | https://github.com/ibelick/ui-skills | 347d318 | MIT |
| unslop | https://github.com/heydamir/unslop, by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)) | 620163e | CC BY 4.0 |
| unslopovich | https://github.com/erkamyaman/unslopovich | 5c071bb | MIT |
| no-ui-slop, ui-states, build-ui, design-md | https://github.com/uxkin/agent | c942569 | MIT |
| accessibility, best-practices, core-web-vitals, performance, web-quality-audit | https://github.com/addyosmani/web-quality-skills | afa8da9 | MIT |
| ui-ux, ui-ux-active, ui-ux-chart, ui-ux-date, ui-ux-dialog, ui-ux-form, ui-ux-passive, ui-ux-table, ui-ux-tabs | https://github.com/lohbrandt/ui-ux-behaves | 9446603 | MIT |
| laws-of-ux, laws-of-ux-checklist, laws-of-ux-review | https://github.com/keysjoao/laws-of-ux-skills | 66f5e56 | MIT |
| color-system, layout-grid, readable-measure, responsive-design, spacing-system, typography-scale, visual-hierarchy, illustration-style, platform-conventions, animation-principles, error-handling-ux, feedback-patterns, form-design, interfaces-that-feel, loading-states, micro-interaction-spec, navigation-patterns, critique-affordance, critique-brand-consistency, critique-color, critique-composition, critique-information-density, critique-typography, critique-visual-hierarchy, localization-design, motion-system, design-token, icon-system, heuristic-evaluation | https://github.com/Owl-Listener/designer-skills | 9a6930c | MIT |
| parsiux (see notes) | https://github.com/mmdverse/parsiux | e39ba89 | MIT |

## Notes for this project

- **ui-ux-pro-max**: its search script is local Python with no dependencies. From the repository root run
  `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system` (the SKILL.md examples assume `CLAUDE_PLUGIN_ROOT`, which is unset for project skills). Add `--rtl` for style/product searches: this site is Persian and right-to-left.
- **web-design-guidelines** fetches the latest rules from `raw.githubusercontent.com` each time it runs.
- **extract-design** runs `npx designlang <url>`, a third-party npm package that crawls a live site; review before running.
- **brandkit** and **image-to-code** are written for an image-generation tool. Without one, only their written rules apply (hero minimalism, no nested boxes, no micro-UI clutter, anti-AI-slop).
- **claude-seo skills** were installed without the plugin's Python scripts, hooks and subagents (the scripts need a 20+ package virtualenv including Google Ads and WeasyPrint, and the hooks would run on every tool call). Where a skill says `"${CLAUDE_PLUGIN_ROOT}/scripts/claude-seo" run <script>.py`, do that step by hand instead (Playwright for rendering, Lighthouse for speed, the site's JSON-LD in `src/layouts/Base.astro`). Where it says `${CLAUDE_PLUGIN_ROOT}/skills/seo/references/<file>.md`, read `.claude/vendor/claude-seo/skills/seo/references/<file>.md`. The `/seo` orchestrator skill itself was left out because it dispatches to those missing subagents.
- **seo-audit** from marketingskills was chosen over claude-seo's skill of the same name (two skills cannot share a name). It covers technical, on-page and local SEO and has local-SEO reference files.
- **Statistics inside the SEO skills** (ranking-factor percentages, study results) are the upstream authors' claims about search in general. Never copy them onto this site; the brief forbids unconfirmed numbers.
- **Local SEO in Iran:** the skills assume Google, Bing, Yelp and Apple Maps. For this site the matching local platforms are Google Business Profile, Neshan and Balad (see `docs/local-profiles.md`).
- **impeccable**: the reference files work on their own. `scripts/impeccable` downloads the author's prebuilt engine from https://github.com/pbakaus/impeccable/releases the first time it runs (checked against `engine-checksums.txt`); `scripts/live-browser*.js` is injected into a local page and talks only to `localhost`. Neither runs unless asked.
- **unslop** is CC BY 4.0: keep the credit to Damir Sokolovsky and the link to the repository when sharing it. Its scripts make a local snapshot of a page (`snapshot.mjs`) or a video with ffmpeg (`story.mjs`); they contact only the page being captured. `references/rtl.md` covers right-to-left layouts.
- **unslopovich**: `scripts/detect.js` is a local static scanner with no network or process calls.
- **parsiux** is a Persian/RTL toolkit. The folder holds what `parsiux init --ai claude` writes (`templates/SKILL.md`), plus a frontmatter block (name and description) added here so Claude Code lists it. The `parsiux` command itself is not in this repository: install it with `npm install -g parsiux` or build it from source (Node 20+). In Claude Code cloud sessions do not run `npx playwright install`: Chromium is already installed there.
- **transitions.dev** (https://github.com/Jakubantalik/transitions.dev, commit 738de6d) was used during the 2026-11-19 redesign but is **not** copied here: its licence allows using the recipes in your own site but not publishing the collection, and this repository is public. Install it from that repository when needed.
- **Skills left out on purpose (2026-11-19):**
  - Owl-Listener research, design-ops, strategy, toolkit and test-planning skills (team process, not page design); its separate law and effect skills (covered by `laws-of-ux`); `content-strategy` (name already taken); `ux-writing` (the site copy stays as approved); dark mode, charts, chat UI, gestures, onboarding, search and state-machine skills (none of these exist on this site); `accessibility-audit` (covered by `accessibility` and `fixing-accessibility`).
  - ibelick `component-canvas`, `create-canvas`, `device-frames` and `ui-skills-root` (tooling for their own app and CLI).
  - plugin87/ux-ui-agent-skills: every skill calls the kit's own scripts, rules and hooks (`scripts/gate.mjs`, `.claude/rules/…`), which are not here.
  - oil-ui: its update check contacts the author's server and asks about a purchase record; its other guidance is already covered by `impeccable` and `ui-ux-pro-max`.
  - superdesign (needs the Superdesign cloud canvas), uxkin `uxkin-research` (needs the UXKIN service), `ios-screens`, `ui-from-screenshot`.
  - vercel-labs React and React Native skills (this site is Astro), `writing-guidelines` (prose, not UI).
  - nextlevelbuilder `brand`, `design`, `design-system`, `ui-styling`, `banner-design`, `slides` (logo and brand generation, shadcn, slide decks).
  - addyosmani `seo` (the SEO skills above already cover it).
- The account also has the UI/UX plugins `vectorlab-ux-skills`, `design-skills`, `design` and `21st` enabled; they are not copied here.
- The site's own content rules in `docs/content-brief.md` always win over any skill's suggestions (for example: no invented stats, no stock photos of children).
