---
name: skill-template
description: >-
  Replace this. Describe what the skill does and WHEN to use it, e.g.
  "Generate X from Y. Use when the user asks to …". This text is the trigger
  Claude uses to decide whether to load the skill, so make it specific.
user-invocable: true
argument-hint: "[optional-arg]"
---

# Skill Name

One-line summary of what this skill produces.

## Workflow

### 1. Gather inputs
Describe what to collect and the exact commands to run.

### 2. Do the work
Step-by-step instructions. Include any rubric, criteria, or scoring model.

### 3. Produce output
How to present results. Prefer: have Claude write a small data file, then run a
bundled script in `scripts/` to render the final artifact, so output is
consistent and the skill is cheap to re-run.

## Notes
- List prerequisites (required CLIs, auth, runtimes).
- Note any cross-platform caveats.
- Keep this file tight; move long reference material into `references/`.
