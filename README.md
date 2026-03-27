# Maze Runner

A 3D first-person maze exploration game built with React, Three.js, and TypeScript.

Navigate procedurally generated mazes across six distinct terrain themes, collect gems, solve math gates, and reach the exit portal before time runs out.

## Gameplay

- **First-person exploration** with keyboard and mouse controls
- **6 unique terrain themes** — Stone Dungeon, Overgrown Hedge, Backrooms, Voxel Arena, Candy World, and Frozen Cavern — each with distinct visuals, geometry, fog, and maze generation parameters
- **Procedural maze generation** using recursive backtracker, Prim's, Kruskal's, and rooms-and-corridors algorithms
- **Collectible gems** — normal, bonus (gold), and time pickups scattered via Poisson Disk Sampling
- **Math gates** — numbered orbs along the solution path that must sum to a target value to unlock the exit portal
- **Streak multiplier** — consecutive gem pickups build a score multiplier (up to 3x)
- **Dead-end detection** — visual warning when entering a dead end, breaking the streak
- **6 progressively larger levels** (18x18 to 42x42) — played in random order, complete all six to win

## Controls

| Key | Action |
|-----|--------|
| W / A / S / D | Move forward / left / backward / right |
| Mouse | Look around |
| ESC | Pause / Resume |
| Click | Lock pointer (during gameplay) |

Desktop only — mobile devices display a redirect screen.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Rendering | Three.js via React Three Fiber |
| UI Framework | React 19 |
| State Management | Zustand |
| Build Tool | Vite |
| Language | TypeScript |
| Audio | Web Audio API (procedural) |

## Project Structure

```
src/
├── App.tsx                    # Root component, screen routing
├── main.tsx                   # Entry point
├── index.css                  # Global styles
│
├── engine/                    # Core game logic (framework-agnostic)
│   ├── gameState.ts           # Zustand store — screens, score, level config
│   ├── mazeGenerator.ts       # Maze generation algorithms + math gate placement
│   ├── pcg.ts                 # Poisson Disk Sampling for object distribution
│   ├── audioSystem.ts         # Web Audio API sound engine
│   └── levelThemes.ts         # Per-theme visual and geometry configuration
│
├── scene/                     # 3D scene components (React Three Fiber)
│   ├── GameScene.tsx           # Canvas, lighting, fog, scene orchestration
│   ├── PlayerController.tsx    # First-person camera, WASD movement, collision
│   ├── MazeWalls.tsx           # Instanced wall/floor/ceiling rendering
│   ├── Collectible.tsx         # Gem pickups with sparkle effects
│   ├── MathGate.tsx            # Floating numbered orbs
│   └── WallTorchGLTF.tsx       # GLTF torch models + pooled flame effects
│
├── ui/                        # 2D overlay components
│   ├── HUD.tsx                 # Score, timer, level info, volume control
│   ├── Compass.tsx             # Directional compass bar with exit marker
│   ├── MiniMap.tsx             # Fog-of-war mini-map with expand toggle
│   ├── Screens.tsx             # Start, game over, victory, loading screens
│   ├── Instructions.tsx        # 4-slide tutorial walkthrough
│   └── theme.ts                # UI color and style constants
│
public/
├── models/                    # GLTF torch model + PBR texture maps
├── favicon.svg
└── opengraph.jpg
```

## Architecture

### Engine Layer

The `engine/` directory contains pure logic with no rendering dependencies:

- **Maze generation** supports four algorithms with configurable extra passage rates. Each level selects an algorithm suited to its theme character.
- **Poisson Disk Sampling** prevents object clustering for torches, collectibles, and math gate decoys.
- **Game state** is managed through a single Zustand store with seven screen states (`start`, `instructions`, `loading`, `playing`, `paused`, `levelComplete`, `gameOver`, `victory`).

### Scene Layer

The `scene/` directory contains all Three.js / R3F components:

- **Instanced rendering** for walls and corner pillars minimizes draw calls.
- **Pooled flame effects** — 10 pre-mounted flame slots controlled via refs, eliminating React re-renders during gameplay.
- **Shader pre-compilation** — `gl.compile()` runs during the loading phase to prevent stutter when new materials first render.
- **Spatial grid** for O(1) wall collision lookups.
- **GLTF torch models** with PBR textures, dual-layer billboard flame sprites, fire particles, and flickering point lights with line-of-sight culling.

### UI Layer

The `ui/` directory contains all 2D HTML overlay components rendered on top of the canvas:

- **Responsive HUD** using CSS `clamp()` for scaling across viewport sizes.
- **Glassmorphism design** with gradient backgrounds, accent lines, and backdrop blur.
- **Canvas-rendered compass** with DPR scaling for crisp text on retina displays.
- **Fog-of-war mini-map** that reveals explored areas.

## Performance

- Shader pre-compilation via `gl.compile(scene, camera)` during loading screen
- Canvas renders behind the loading overlay (not hidden) so the GPU processes the full scene before gameplay begins
- Pre-mounted flame effect pool — zero component mount/unmount during gameplay
- Instanced meshes for walls and pillars
- Ref-based animation updates — no per-frame React state changes
- Proximity + line-of-sight culling for torch flame effects (max 10 active)
- Throttled mini-map redraws (200ms interval)
- Module-level texture caching
- Production build splits Three.js into separate cacheable chunks

## Development

```bash
# From the workspace root
pnpm install
pnpm --filter @workspace/maze-game run dev
```

## Build

```bash
pnpm --filter @workspace/maze-game run build
```

Output is written to `dist/` and can be served as a static site.

## License

Private project — not licensed for redistribution.
