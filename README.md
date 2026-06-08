# claude-skills

A personal collection of [Claude Code](https://claude.com/claude-code) **skills** — self-contained, reusable capabilities that Claude can invoke on demand.

Each skill lives in its own folder under [`skills/`](./skills) with a `SKILL.md` (instructions + metadata) and any supporting `scripts/`, `references/`, or `assets/`.

## Skills

| Skill | What it does |
|-------|--------------|
| [`portfolio-review`](./skills/portfolio-review) | Reviews every repo on a GitHub account for product **potential** and **monetization**, scores each on 5 metrics, and generates an interactive HTML site (with charts) plus a Markdown report. |

## Installing a skill

### With the `skills` CLI (recommended)

This repo follows the [`skills`](https://github.com/vercel-labs/skills) monorepo layout (`skills/<name>/SKILL.md`), so you can install a single skill from it directly:

```bash
# install one skill from this multi-skill repo
npx skills add przemekzur/claude-skills --skill portfolio-review

# target Claude Code specifically
npx skills add przemekzur/claude-skills --skill portfolio-review -a claude-code

# install every skill in the repo
npx skills add przemekzur/claude-skills --all
```

**Single-skill vs multi-skill repos.** A command like `npx skills add owner/repo` (no `--skill`) works when the repo *is* one skill, with `SKILL.md` at its root. This repo holds **multiple** skills under `skills/<name>/`, so you pass `--skill <name>` to pick one (or `--all` for everything). The `skills` CLI walks `skills/<name>/SKILL.md` one level deep — which is why the [repo layout](#repo-structure) keeps the new-skill template under `templates/`, not `skills/`.

> **Known issue:** `npx skills update` on a single skill from a multi-skill repo currently re-downloads the whole repo before extracting the one skill ([vercel-labs/skills#1015](https://github.com/vercel-labs/skills/issues/1015)). It's a bandwidth/cosmetic quirk — `add` and the installed skill work correctly.

### Manually

Skills are also picked up from `~/.claude/skills/` (user-level) or `<project>/.claude/skills/` (project-level). To install one by hand:

**Option A — copy**
```bash
# user-level (available in every project)
cp -r skills/portfolio-review ~/.claude/skills/
```
```powershell
# Windows / PowerShell
Copy-Item -Recurse skills/portfolio-review $HOME/.claude/skills/
```

**Option B — symlink** (so `git pull` keeps it current)
```bash
ln -s "$(pwd)/skills/portfolio-review" ~/.claude/skills/portfolio-review
```
```powershell
New-Item -ItemType SymbolicLink -Path $HOME/.claude/skills/portfolio-review -Target (Resolve-Path skills/portfolio-review)
```

**Option C — clone the whole collection into place**
```bash
git clone https://github.com/przemekzur/claude-skills ~/.claude/skills-repo
ln -s ~/.claude/skills-repo/skills/* ~/.claude/skills/
```

Once installed, invoke a skill in Claude Code with `/<skill-name>` (e.g. `/portfolio-review`), or just describe the task — Claude auto-loads a skill when your request matches its `description`.

## Repo structure

```
claude-skills/
├── README.md
├── LICENSE
├── CONTRIBUTING.md              # how to add a new skill
├── templates/
│   └── skill-template/          # copy this to start a new skill (kept OUT of skills/
│       └── SKILL.md             #   so the installer never treats it as a real skill)
└── skills/                      # everything here is an installable skill
    └── portfolio-review/
        ├── SKILL.md
        └── scripts/
            └── render.mjs
```

> Note: the `skills` CLI walks `skills/<name>/SKILL.md` one level deep — so anything placed directly under `skills/` is treated as an installable skill. The new-skill template lives under `templates/` for exactly this reason.

## Adding your own skill

See [CONTRIBUTING.md](./CONTRIBUTING.md). The short version: copy `templates/skill-template/` to `skills/<your-skill>/`, fill in the `SKILL.md` frontmatter (`name`, `description`), and write the instructions.

## License

[MIT](./LICENSE) — use, modify, and share freely.
