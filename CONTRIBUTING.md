# Contributing

> Contribution and collaboration guidelines for the OpenEvents project.

This repository is developed collaboratively by the author and AI-assisted development tools. The goal is to keep every change focused, reviewable, reproducible, and understandable to anyone reading the history.

---

## Before You Start

Before starting any task, read:

1. [`README.md`](README.md) — project overview, architecture, and setup instructions.
2. [`docs/architecture.md`](docs/architecture.md) — extended pipeline and component design.
3. [`docs/api-contract.md`](docs/api-contract.md) — REST API endpoint specifications.
4. [`docs/data-contract.md`](docs/data-contract.md) — unified event schema definition.

Then inspect any relevant documentation under `docs/`.

---

## Branching Strategy

The repository uses a two-tier branching model:

- **`main`**: Stable integration branch. Never commit directly to `main`.
- **`feature/<name>`** or **`<author>/<topic>`**: All development work. Use descriptive identifiers that reflect the scope of the change (e.g. `feature/deduplication-threshold`, `pranav/scraper-fallback`).
- **`fix/<name>`**: Isolated bug fixes targeted at a specific component.
- **`docs/<name>`**: Documentation-only changes.

Start every task from the latest `origin/main`:

```bash
git fetch origin
git switch -c feature/<your-topic> origin/main
```

---

## Pull Requests

- Every non-trivial branch must have a pull request against `main`. Do not merge work directly.
- Open the PR as soon as the branch has a reviewable vertical slice. Small, focused PRs are strongly preferred over large batches of unrelated changes.
- Each PR must:
  - Pass the automated test suite (`python -m unittest discover -s backend/tests`).
  - Include a clear description of what changed and why.
  - Reference any relevant issue or design decision.
- Keep each PR focused on one outcome. Follow-up PRs are expected when a change exposes new work.

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Use the component name in the scope where applicable:

| Prefix | When to use |
|--------|-------------|
| `feat(scraper):` | A new scraper, collector, or data source integration |
| `feat(processor):` | Changes to normalization, deduplication, or scoring logic |
| `feat(api):` | New or modified FastAPI endpoints |
| `feat(frontend):` | New UI components, pages, or interactions |
| `fix(...)` | A targeted bug fix in the named component |
| `docs(...)` | Documentation changes only |
| `test(...)` | Adding or correcting tests |
| `refactor(...)` | Code restructuring with no behavior change |
| `chore(...)` | Dependency updates, configuration, and maintenance |

Example:

```
feat(processor): raise deduplication threshold to 0.87 for venue matching

Jaro-Winkler similarity at 0.85 produced false-positive merges for
venues sharing a locality prefix (e.g. "Jubilee Hills Amphitheatre"
vs "Jubilee Hills Lawn"). Threshold raised to 0.87 after evaluation
against hyderabad_merged_events.json sample set.
```

---

## Code Standards

### Python (Backend)

- Follow [PEP 8](https://peps.python.org/pep-0008/) throughout.
- All public classes and functions must have docstrings.
- Use `python-dotenv` for environment variable access; never hardcode credentials.
- New pipeline stages must include corresponding unit tests in `backend/tests/`.
- Run the test suite before opening a PR:

```bash
# Windows PowerShell
$env:PYTHONPATH="backend"; python -m unittest discover -s backend/tests

# Linux / macOS
PYTHONPATH=backend python -m unittest discover -s backend/tests
```

### JavaScript / React (Frontend)

- Use modern functional components with hooks throughout.
- Keep components focused: one responsibility per file.
- Animation and transition logic must use the `motion` library, not ad-hoc CSS transitions.
- Three.js scene management belongs in `CityWebGLScene.jsx`; do not inline WebGL code in page components.
- API calls must go through `src/lib/api.ts`; do not call `fetch` directly from components.

### General

- Ensure your editor respects the formatting rules in [`.editorconfig`](.editorconfig).
- Do not commit `.env` files, secrets, or local database files (`*.db`).
- The `.env.example` file must stay up to date whenever a new environment variable is introduced.

---

## Working with AI Tools

- Store useful prompts, agent contexts, and workflow notes in the [`.ai/`](.ai/) directory so they can be reused.
- The [`.cursorrules`](.cursorrules) file keeps AI coding assistants aligned with the project architecture. Update it when significant design decisions are made.
- All AI-generated code must be reviewed, tested, and understood by the author before merging. Generated code is not exempt from the standards above.

---

## Project Contact

Maintained by [Pranav Singh Patil](https://github.com/pranavsinghpatil).
For questions, open an issue or reach out via the repository discussion board.