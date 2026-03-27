# Add Professional Engineering Practices

## What & Why
The project is rated "Intermediate" due to missing engineering practices that professional-grade projects have: no linting configuration, no architecture documentation, no tests, a minimal README, and no contribution guidelines. Adding these will bring the project closer to a professional/senior level.

## Done looks like
- ESLint is configured across the monorepo with sensible rules for TypeScript and React, and the codebase passes linting
- An ARCHITECTURE.md document clearly explains the system design, how packages relate, data flow, and key decisions
- The README.md is comprehensive with project description, setup instructions, tech stack, and project structure overview
- Basic unit tests exist for core game logic (maze generation, game state, level themes) using Vitest
- A CONTRIBUTING.md file explains how to set up the dev environment, code style expectations, and PR workflow
- A root `lint` script and a root `test` script are available in package.json

## Out of scope
- CI/CD pipeline setup (Replit handles deployment)
- End-to-end or integration tests (only unit tests for core logic)
- Full test coverage — just enough to demonstrate testing practices on the most important modules

## Tasks
1. **ESLint setup** — Add a shared ESLint flat config at the monorepo root with TypeScript and React plugins. Add `lint` scripts to root and each package. Fix any auto-fixable lint errors across the codebase.

2. **Architecture documentation** — Write an ARCHITECTURE.md at the repo root covering system overview, package dependency graph, data flow (API ↔ DB ↔ frontend), maze game architecture (generation → rendering → state → controls), and key design decisions.

3. **Comprehensive README** — Rewrite README.md with project description, features list, tech stack, project structure diagram, getting started / setup instructions, available scripts, and architecture overview link.

4. **Unit tests for core game logic** — Set up Vitest in the maze-game package. Write tests for maze generation (grid creation, passage carving, start/end placement), level theme configurations, and game state transitions (level progression, scoring, timer).

5. **Contribution guidelines** — Write a CONTRIBUTING.md covering development setup, code style (link to ESLint config), branch/PR conventions, and how to add new levels or features.

## Relevant files
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `artifacts/maze-game/src/game/mazeGenerator.ts`
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/levelThemes.ts`
- `artifacts/maze-game/package.json`
- `artifacts/api-server/package.json`
- `README.md`
- `replit.md`
