# Third-party design skills

These skills were copied unmodified (except where noted) from public repositories at the request of the project owner, so that Claude Code sessions in this repository can use them. All are MIT-licensed; each folder keeps its upstream LICENSE where the repository provides one.

| Skill folder(s) | Source | Commit | License |
|---|---|---|---|
| animate, animate-expo, animation-performance, animation-vocabulary, apple-design, ask-sonner, break-ui, choreograph, emil-design-eng, find-animation-opportunities, improve-animations, mobile-native, pick-ui-library, prototype, remove-animations, review-animations, write-swift | https://github.com/emilkowalski/skills | c8a7962 | MIT |
| ui-ux-pro-max (without `scripts/tests`) | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | ccce51c | MIT |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills | 1a2c79d | MIT (per README) |
| brandkit, image-to-code | https://github.com/Leonxlnx/imagegen-skills | beb16b0 | MIT |
| extract-design | https://github.com/Manavarya09/design-extract | 84c3c59 | MIT |

## Notes for this project

- **ui-ux-pro-max**: its search script is local Python with no dependencies. From the repository root run
  `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system` (the SKILL.md examples assume `CLAUDE_PLUGIN_ROOT`, which is unset for project skills). Add `--rtl` for style/product searches: this site is Persian and right-to-left.
- **web-design-guidelines** fetches the latest rules from `raw.githubusercontent.com` each time it runs.
- **extract-design** runs `npx designlang <url>`, a third-party npm package that crawls a live site; review before running.
- **brandkit** and **image-to-code** are written for an image-generation tool. Without one, only their written rules apply (hero minimalism, no nested boxes, no micro-UI clutter, anti-AI-slop).
- The site's own content rules in `docs/content-brief.md` always win over any skill's suggestions (for example: no invented stats, no stock photos of children).
