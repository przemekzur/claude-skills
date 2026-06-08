# claude-skills

A personal collection of [Claude Code](https://claude.com/claude-code) **skills** — self-contained, reusable capabilities that Claude can invoke on demand.

Each skill lives in its own folder under [`skills/`](./skills) with a `SKILL.md` (instructions + metadata) and any supporting `scripts/`, `references/`, or `assets/`.

## Skills

| Skill | What it does |
|-------|--------------|
| [`portfolio-review`](./skills/portfolio-review) | Reviews every repo on a GitHub account for product **potential** and **monetization**, scores each on 5 metrics, and generates an interactive HTML site (with charts) plus a Markdown report. |

## Installing a skill

Skills are picked up from `~/.claude/skills/` (user-level) or `<project>/.claude/skills/` (project-level). To install one from this repo:

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
├── CONTRIBUTING.md          # how to add a new skill
├── skills/
│   ├── _template/           # copy this to start a new skill
│   │   └── SKILL.md
│   └── portfolio-review/
│       ├── SKILL.md
│       └── scripts/
│           └── render.mjs
```

## Adding your own skill

See [CONTRIBUTING.md](./CONTRIBUTING.md). The short version: copy `skills/_template/` to `skills/<your-skill>/`, fill in the `SKILL.md` frontmatter (`name`, `description`), and write the instructions.

## License

[MIT](./LICENSE) — use, modify, and share freely.
