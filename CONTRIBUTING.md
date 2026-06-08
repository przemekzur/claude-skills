# Adding a skill

A skill is a folder under `skills/` containing a `SKILL.md` and any supporting files.

## 1. Scaffold

```bash
cp -r templates/skill-template skills/my-skill
```

## 2. Fill in `SKILL.md`

Every `SKILL.md` starts with YAML frontmatter:

```yaml
---
name: my-skill                  # must match the folder name (kebab-case)
description: >-                  # the trigger — Claude reads this to decide when to load the skill.
  One or two sentences describing what the skill does AND when to use it.
  Lead with capabilities, then "Use when the user asks to …".
user-invocable: true            # optional — makes it runnable as /my-skill
argument-hint: "[arg]"          # optional — shown in the slash-command UI
---
```

Then write the instructions as plain Markdown below the frontmatter. Treat it as a focused playbook for Claude: the workflow, any rubric/criteria, the exact commands to run, and how to present results.

### Tips that make a skill good

- **The `description` is everything.** It's the only part loaded into context before the skill triggers, so it must clearly state both *what* it does and *when* to use it.
- **Keep `SKILL.md` tight.** Move long reference material into `references/*.md` and point to it; move runnable logic into `scripts/`.
- **Make scripts data-driven.** Have Claude produce a small data/JSON file, then a script render the heavy output — so results stay consistent and the skill is cheap to re-run.
- **Be explicit about tooling and prerequisites** (e.g. "requires `gh` authenticated and `node`").
- **Cross-platform:** prefer commands that work on macOS/Linux/Windows, or note the per-OS variant.

## 3. Supporting files

```
skills/my-skill/
├── SKILL.md
├── scripts/        # executable helpers (node, python, bash, pwsh…)
├── references/     # long-form docs the skill links to on demand
└── assets/         # templates, images, fixtures
```

## 4. Register it

Add a row to the table in the top-level `README.md`.

## 5. Test

Install it (`cp -r skills/my-skill ~/.claude/skills/`), restart/refresh Claude Code, and invoke `/my-skill`.
