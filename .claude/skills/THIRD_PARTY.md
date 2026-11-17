# Third-party skills

These skills were copied unmodified (except where noted) from public repositories at the request of the project owner, so that Claude Code sessions in this repository can use them. All are MIT-licensed; each folder keeps its upstream LICENSE where the repository provides one.

Before installing, each SKILL.md and reference file was checked for hidden Unicode (zero-width and bidi control characters), instructions aimed at the agent (ignore/override, hide from the user, send data out) and piped shell installs. None were found.

| Skill folder(s) | Source | Commit | License |
|---|---|---|---|
| animate, animate-expo, animation-performance, animation-vocabulary, apple-design, ask-sonner, break-ui, choreograph, emil-design-eng, find-animation-opportunities, improve-animations, mobile-native, pick-ui-library, prototype, remove-animations, review-animations, write-swift | https://github.com/emilkowalski/skills | c8a7962 | MIT |
| ui-ux-pro-max (without `scripts/tests`) | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | ccce51c | MIT |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills | 1a2c79d | MIT (per README) |
| brandkit, image-to-code | https://github.com/Leonxlnx/imagegen-skills | beb16b0 | MIT |
| extract-design | https://github.com/Manavarya09/design-extract | 84c3c59 | MIT |
| seo-audit, ai-seo, schema, site-architecture, content-strategy, copywriting, copy-editing, cro, analytics (without `evals/`) | https://github.com/coreyhaines31/marketingskills | 1f83744 | MIT |
| seo-local, seo-geo, seo-schema, seo-content, seo-page, seo-images, seo-technical, seo-sitemap, seo-maps, seo-plan, seo-content-brief, seo-cluster | https://github.com/AgriciDaniel/claude-seo | 468ed5b | MIT |
| `.claude/vendor/claude-seo/skills/seo/references/` (reference files only, see notes) | https://github.com/AgriciDaniel/claude-seo | 468ed5b | MIT |

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
- The site's own content rules in `docs/content-brief.md` always win over any skill's suggestions (for example: no invented stats, no stock photos of children).
