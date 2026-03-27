# Distinct Terrain Map Types

## What & Why
Each level's terrain should be a fundamentally different map experience — not just a color swap. Each terrain gets a unique visual style (walls, floors, ceilings, lighting) AND a unique maze layout character (corridor width feel, density, branching patterns). Inspired by the Sketchfab reference mazes: grass hedge, backrooms, voxel, squid game, bubblegum candy, and classic stone dungeon.

## Done looks like
- **Level 1 — Stone Dungeon**: Rough stone block walls with mortar, cobblestone floor, dark timber ceiling. Warm torch-lit amber atmosphere. Recursive-backtracker algorithm producing long winding corridors.
- **Level 2 — Overgrown Hedge**: Green leafy wall texture with vine details, dirt/grass floor, bright sky-blue ceiling (outdoor feel). Natural daylight. Prim's algorithm creating organic branching paths with many short spurs, like a garden hedge maze.
- **Level 3 — Backrooms**: Yellowish wallpaper panels with water stains, tan carpet floor, drop-ceiling with fluorescent panel pattern. Eerie yellowish fluorescent lighting, unsettling fog. Recursive-backtracker with high extra passages (15%+) creating repetitive, disorienting corridors that all look alike.
- **Level 4 — Voxel Arena**: Clean flat-colored blocky walls with visible grid lines, smooth tiled floor with grid pattern, flat bright ceiling. Bold saturated colors, crisp lighting. Kruskal's algorithm creating highly branching, grid-like layout.
- **Level 5 — Candy World**: Pastel pink/purple striped walls with sprinkle-like dots, checkered candy floor, wafer-textured ceiling. Warm playful pink-tinted lighting. Kruskal's with moderate extra passages for a fun, explorable layout.

Each terrain should feel like a different place to BE, not just a different color of the same dungeon.

## Out of scope
- Downloading or embedding actual 3D models from Sketchfab
- Adding a terrain selection screen (terrains still map to levels for now, can be decoupled later)
- Adding skyboxes or environment maps
- Changing wall geometry shape (still box-based instanced meshes)

## Tasks
1. **Rewrite wall texture generators in levelThemes.ts** — Replace the 5 brick functions with visually distinct procedural canvas-texture generators: rough stone blocks, leafy hedge panels, wallpaper with stains, clean voxel grid blocks, candy stripes with sprinkles.
2. **Rewrite floor tile generators** — Replace the 5 floor tile functions with distinct patterns: cobblestone, dirt/grass patches, carpet tile, smooth grid tile, candy checkerboard.
3. **Add per-theme ceiling texture generators** — Extend the LevelTheme interface with a ceiling texture function and update MazeCeiling to use it. Each theme gets a unique ceiling: dark timber planks, open sky gradient, fluorescent drop-ceiling panels, flat bright grid, wafer/cookie pattern.
4. **Update theme color palettes, lighting, and fog** — Adjust all color values, fog near/far distances, ambient/directional intensities in the LEVEL_THEMES array. The hedge level should feel bright and outdoors; backrooms should feel flat and eerie; candy should feel warm and playful.
5. **Tune maze generation per terrain** — Adjust the algorithm choice and extra-passage percentage in BASE_LEVELS to give each terrain its own layout character: long corridors for dungeon, organic branching for hedge, repetitive loops for backrooms, high branching for voxel, moderate exploration for candy.
6. **Update theme and level names** — Rename themes in LEVEL_THEMES and algorithmLabels in BASE_LEVELS in gameState.ts to match the new terrain identities.

## Relevant files
- `artifacts/maze-game/src/game/levelThemes.ts`
- `artifacts/maze-game/src/game/MazeWalls.tsx:18-92,165-266`
- `artifacts/maze-game/src/game/gameState.ts:20-55`
- `artifacts/maze-game/src/game/GameScene.tsx`
