# Overview

This project is a pnpm workspace monorepo designed for building a robust and scalable application ecosystem. It features a high-performance Express API server, a 3D first-person maze game, and shared libraries for database interactions, API specifications, and code generation. The project aims to provide an engaging game experience while demonstrating a well-architected TypeScript monorepo.

# User Preferences

I prefer iterative development and expect the agent to ask before making major changes.

# System Architecture

The project is structured as a pnpm monorepo with TypeScript, using `composite: true` for efficient cross-package type-checking.

**UI/UX Decisions:**
The `maze-game` is a desktop-only, first-person 3D experience.
- **Visuals:** Features 6 distinct terrain themes (e.g., Stone Dungeon, Overgrown Hedge) each with unique wall geometry, textures, lighting, fog effects, and maze generation algorithms.
- **HUD:** A polished, responsive glassmorphism HUD displays Level, Score, Time countdown, and Oranges count. Includes a gap-style crosshair, volume control, pause button, and compass bar.
- **Pause System:** A comprehensive pause overlay with Resume and Exit options, triggered by the Pause button or ESC key.
- **Instructions Screen:** A 4-slide tutorial (`Instructions.tsx`) guides the player through movement, objectives, HUD interpretation, and pro tips before gameplay.
- **Screens:** Cinematic start, game over, level complete, and victory screens utilize responsive design with `clamp()` for spacing and sizing.
- **UI Components:** Reusable components like `GameButton` (with variants and animations) and `StatCard` (glassmorphism, animations) are used throughout the UI.
- **MiniMap:** A bottom-right minimap with fog of war, expandable on click.

**Technical Implementations:**
- **API Server (`artifacts/api-server`):** An Express 5 server integrated with `@workspace/api-zod` for validation and `@workspace/db` for persistence, bundled with esbuild.
- **Maze Game (`artifacts/maze-game`):** A frontend React, Vite, Three.js (via React Three Fiber) game using Zustand for state management.
    - **Game Logic:** Seven screen states manage the game flow. Levels are generated using Randomized Depth-First Search with low extra passage rates, increasing in size across 6 levels. Features randomized level and start/exit position selection, collectible "oranges," and a procedural Web Audio API sound engine.
    - **Flow Theory Mechanics:** Implements dead-end detection, a streak multiplier for pickups, and variable ratio reinforcement via bonus items.
    - **Path-Sum Math Gates:** Mandatory math gates along the solution path require players to collect a target sum to unlock the exit portal. Decoy gates exist off-path. Active from Level 2.
    - **Player Controller:** First-person pointer-lock camera, WASD movement, independent-axis collision, flashlight, footstep audio, screen shake, and dust particles.
    - **PCG (Procedural Content Generation):** Uses Poisson Disk Sampling for anti-clump placement of torches, collectibles, and math gate decoys.
    - **Collision System:** Robust collision detection with `PLAYER_RADIUS=0.6`, multi-pass resolution, corner pillar collision boxes, and a spatial grid for O(1) wall lookups.
    - **Wall Geometry:** Exact `CELL_SIZE` segments, with corner pillars to prevent z-fighting, and a player lantern for dynamic lighting.
    - **Loading Screen:** A dedicated loading state with forced shader pre-compilation (`gl.compile`) and an 8-second safety timeout.
    - **Performance:** Achieved through `getState()` for high-frequency reads, texture caching, proximity-based light culling, optimized mini-map redraws, pre-allocated THREE.js objects, spatial grids, Zustand update throttling, pooled flame effects, ref-based collection tracking, batched Zustand updates, and audio pre-initialization.
    - **GLTF Dungeon Torch Models:** Detailed GLTF models with PBR textures and full flame systems (sprites, particles, flickering lights). Features cinematic flame ignition and wall-aware line-of-sight activation.
    - **Bundle Optimization:** Production builds use manual chunks to optimize loading of core libraries like `three` and `@react-three/fiber`.

**System Design Choices:**
- **Monorepo:** pnpm workspaces for shared libraries and consistent tooling.
- **TypeScript:** Ensures type safety across all packages.
- **Database:** PostgreSQL with Drizzle ORM.
- **API Code Generation:** Orval generates React Query hooks and Zod schemas from an OpenAPI specification.

# External Dependencies

- **Node.js**: Version 24
- **pnpm**: Package manager
- **TypeScript**: Version 5.9
- **Express**: Version 5
- **PostgreSQL**: Database
- **Drizzle ORM**: For database interactions
- **Zod**: Validation library
- **drizzle-zod**: Zod integration for Drizzle
- **Orval**: OpenAPI code generator
- **esbuild**: Bundler
- **React**: UI library
- **Vite**: Frontend build tool
- **Three.js**: 3D graphics library
- **@react-three/fiber**: React renderer for Three.js
- **Zustand**: State management library
- **CORS**: Express middleware
- **pg**: PostgreSQL client