---
name: portfolio-review
description: Review all of a user's GitHub repositories for product potential and monetization, then generate a polished HTML site (with charts) plus a Markdown report. Each project is scored on 5 metrics, ranked, tiered, and given a verdict, concrete improvements, and missing features. Use when the user asks to review/analyse/rate their GitHub projects, assess monetization or business potential of repos, or wants a portfolio report with graphs.
user-invocable: true
argument-hint: "[github-username] (defaults to the authenticated gh user)"
---

# Portfolio Review

Analyse every repository for a GitHub account and produce two deliverables:

1. **`portfolio-review.html`** — interactive dark-themed site with Chart.js graphs (opportunity scatter, ranked-potential bars, top-6 radar, language doughnut, commit distribution), a sortable/filterable scoring table, and a verdict card per project.
2. **`PORTFOLIO_REVIEW.md`** — the same data in portable Markdown.

Both are rendered from one JSON data file by the bundled script, so the charts and the Markdown always agree.

## Workflow

### 1. List repositories
```bash
gh repo list <username> --limit 200 --json name,description,url,primaryLanguage,isPrivate,stargazerCount,forkCount,pushedAt,diskUsage,createdAt,latestRelease,licenseInfo
```
Omit `<username>` to use the authenticated user. Note the total count.

### 2. Gather evidence per repo
You cannot judge potential from metadata alone — read what each project *does*.
- **READMEs** (the key signal). Decode with: `gh api "repos/<owner>/<repo>/readme" -q '.content' | base64 -d`. Batch several in one shell call; cap each at ~60 lines.
- **Commit count** (a maturity signal): from the `Link` header of `gh api "repos/<owner>/<repo>/commits?per_page=1" -i` (parse `page=N>; rel="last"`), falling back to `gh api ".../commits?per_page=100" -q 'length'`.
- **Releases** (already in step 1's `latestRelease`), and for empty repos the API returns a 409/404 — treat as "concept only" (0 commits).
- Skip deep-reading tiny/legacy/dormant repos; sample them and bucket as Archive.

### 3. Score each repo (0-10 per sub-metric)
Be an honest analyst, not a cheerleader. Anchor to the rubric:

| Metric | 2 | 5 | 8 |
|---|---|---|---|
| **M** Maturity | scaffold / few commits | working app, single env | shipped, releases, deep features |
| **K** Market | tiny/novelty | real niche | large, proven willingness-to-pay |
| **R** Monetization readiness | no path to charge | clear path, not wired | billing/auth/multi-tenant already wired |
| **D** Differentiation/moat | trivial to copy | some edge | hardware/data/network moat |
| **X** Execution risk *(lower=better)* | safe | normal | legal/credibility/competitive danger |

Calibration cues: **Stripe/billing already wired → R 8.** **Empty repo → M 0.** **localStorage-only, no auth → R caps ~6.** **Crowded category (notes, landing pages, todo) → D ≤4.** **Gambling/crypto/medical/"guaranteed returns" → X ≥8.** Hardware you've shipped before → D 7.

For each project also write: a one-line `tag` (what it is), `biz` (one-line monetization context, used in the $ table), `verdict` (one sharp sentence), 2-3 `improve` bullets (concrete next actions toward revenue), and a `missing` list (features needed before charging).

### 4. Write the data file
Create `portfolio-data.json`:
```json
{
  "generatedAt": "YYYY-MM-DD",
  "username": "<user>",
  "repoCount": 37,
  "tldr": "2-3 sentence honest read: which 2-3 projects are closest to revenue, and the single biggest portfolio-wide blocker.",
  "projects": [
    {
      "name": "Repo", "group": "Active|Concept|Archive", "lang": "TypeScript",
      "commits": 149, "release": "v1.2.0",
      "tag": "what it is in one line",
      "biz": "one-line monetization context",
      "verdict": "one sharp sentence",
      "improve": ["…", "…"], "missing": ["…", "…"],
      "M": 7, "K": 6, "R": 8, "D": 4, "X": 4
    }
  ]
}
```
Do **not** put `potential`, `monetization`, or `tier` in the file — the renderer computes them so scores stay consistent.

### 5. Render
```bash
node "<skill-dir>/scripts/render.mjs" portfolio-data.json <outDir>
```
Default `<outDir>` to a `portfolio-review/` folder in the working directory. The script writes `portfolio-review.html` + `PORTFOLIO_REVIEW.md` and prints a summary. Offer to open the HTML (`Start-Process` on Windows).

## Scoring model (computed by the renderer)
- **Potential** = Market×0.30 + Maturity×0.25 + Moat×0.20 + Monetization×0.15 + (10−Risk)×0.10, ×10.
- **Monetization** = Monetization×0.45 + Market×0.30 + Maturity×0.25, ×10.
- Tiers: **A — Push** ≥70 · **B — Develop** 58-69 · **C — Niche/Hold** 45-57 · **D — Park/Harvest** <45.

## Re-running
This is cheap to re-run after the user ships changes: re-fetch only the changed repos, edit their entries in `portfolio-data.json`, and re-run the renderer. Keep `portfolio-data.json` so future runs are incremental.

## Notes
- Requires `gh` (authenticated) and `node`. If `gh` isn't authenticated, ask the user to run `! gh auth login`.
- Scores are directional judgement calls — say so. The value is the prioritisation and the per-project verdict, not false precision.
- Keep verdicts blunt and specific to the repo's actual README; avoid generic startup advice.
