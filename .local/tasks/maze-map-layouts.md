# Multi-Shape Maze Maps with Multiplayer Support

## What & Why
The game currently uses only rectangular grid mazes generated via a single DFS algorithm. This task adds 5 distinct map shapes for solo play (matching different level themes) plus a circular multiplayer arena layout with multiple spawn points. The approach uses a lightweight **mask-based system** on top of the existing rectangular grid — no new grid topologies needed. This keeps the game size minimal by reusing the existing `MazeCell`, `MazeData`, wall rendering, and entity placement systems. A boolean mask determines which cells are "active," and the DFS generator simply skips masked-out cells.

## Done looks like

### Solo Map Shapes (1 per level theme)
Each level uses a different map shape, tied to its theme:
- **Level 1 (Stone Dungeon)**: Classic **rectangle** (current behavior, no change)
- **Level 2 (Mossy Catacombs)**: **Diamond/rhombus** shape — grid cells masked to form a rotated square within the grid
- **Level 3 (Lava Caves)**: **Oval/ellipse** shape — cells masked to an elliptical boundary, creating organic cave-like perimeter
- **Level 4 (Frozen Crypts)**: **Cross/plus** shape — two intersecting rectangular corridors forming a plus sign, creating distinct quadrant dead-ends
- **Level 5 (Shadow Realm boss)**: **Circular** shape — cells masked to a circle, with the boss arena at the center and the exit at the edge

### Map Shape Rendering
- The minimap correctly renders only active (unmasked) cells — masked cells show as void/black
- 3D walls render only for active cells — no floating walls in masked-out areas
- Floor and ceiling tiles only placed for active cells
- Entity placement (gems, enemies, traps, power-ups, lore) only uses active cells
- Start position is placed at a valid edge cell of the shape, exit at the opposite edge

### Multiplayer Arena Layout (New Game Mode)
- New **"Multiplayer Race"** mode accessible from the start screen
- Uses a **circular maze** with **4 entry points** at cardinal edges (north, south, east, west) — matching the reference image showing numbered spawn points 1-4
- Single shared exit at the center of the circle
- Race-to-center: first to reach the center wins
- Each player has a distinct color marker on the minimap
- Split into 2 sub-modes:
  - **Solo Race**: Player races against the clock with the circular layout
  - **Local Hot-Seat**: Players take turns, competing for best time on the same maze
- Lightweight: no networking/WebSocket — keeps game size minimal
- The circular arena reuses the same mask system as the solo circular map

### Size Budget
- No new dependencies (no Socket.IO, no Redis)
- Mask functions are pure math (< 20 lines each)
- Map shapes add ~200 lines total to the generator
- Multiplayer mode adds ~300 lines for the mode screen, timer tracking, and turn-based logic
- Total addition: ~500 lines of game code

## Out of scope
- Real-time online multiplayer (WebSocket/server networking)
- Hexagonal or triangular cell grids (different wall counts per cell)
- True polar/theta maze generation (concentric ring cells)
- Star or pentagonal shapes (too complex for 3D wall rendering without topology changes)
- Map editor or custom mask drawing
- Split-screen simultaneous local play

## Tasks
1. **Add mask system to maze generator** — Extend `generateMaze()` to accept an optional `mask: boolean[][]` parameter. Masked-out cells are never visited by the DFS algorithm and never added to walls/entity positions. Add mask generator functions for each shape: `rectangleMask`, `diamondMask`, `ellipseMask`, `crossMask`, `circleMask`. Each takes grid width/height and returns a 2D boolean array. Update `getWallSegments`, `getCollectiblePositions`, `getEnemyPaths`, `getTrapPositions`, `getPowerUpPositions`, `getFogZonePositions`, and `getLorePositions` to skip masked-out cells. Add smart start/end position selection that finds valid edge cells for each shape.

2. **Assign map shapes to levels** — Update `BASE_LEVELS` config to include a `mapShape` field. Wire each level to its shape mask. Update `GameScene` to pass the appropriate mask when calling `generateMaze`. Ensure the level theme name reflects the shape (e.g., "Mossy Catacombs — Diamond").

3. **Update 3D rendering for masked cells** — Modify `MazeWalls.tsx` floor/ceiling generation to skip masked cells (no floor tiles in void areas). Ensure instanced wall meshes only include walls for active cells. Add a subtle edge boundary visual (dark fog or void plane) at the mask boundary so players see the shape perimeter clearly.

4. **Update minimap for shaped mazes** — Modify the minimap renderer to only draw active cells and show masked areas as dark void. The player arrow, POI markers, and fog-of-war all respect the mask boundary. The minimap should visually communicate the maze shape (diamond, oval, cross, circle).

5. **Add multiplayer race mode** — Create a new game mode with a circular maze, 4 spawn points at cardinal edges, and exit at center. Add mode selection UI on the start screen (Solo Adventure / Race Mode). Implement hot-seat turn system: each player enters their name, plays the same maze, times are compared. Show a results/ranking screen after all players finish. Reuse all existing game systems (health, gems optional for race, timer, compass points to center).

6. **Testing and balance** — Verify all 5 shape types generate solvable mazes at every level size. Confirm entity placement stays within active cells. Test minimap rendering for each shape. Verify race mode turn flow works correctly. Performance check that masked mazes don't add overhead.

## Relevant files
- `artifacts/maze-game/src/game/mazeGenerator.ts`
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/MazeWalls.tsx`
- `artifacts/maze-game/src/game/GameScene.tsx`
- `artifacts/maze-game/src/game/MiniMap.tsx`
- `artifacts/maze-game/src/game/Compass.tsx`
- `artifacts/maze-game/src/game/Screens.tsx`
- `artifacts/maze-game/src/game/levelThemes.ts`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/scoreSystem.ts`
