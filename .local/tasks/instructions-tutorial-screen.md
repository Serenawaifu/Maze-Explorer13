# Game Instructions / Tutorial Screen

## What & Why
Add a professional multi-step instructions screen that appears after clicking "Enter the Maze" but before gameplay begins. This teaches new players the controls, objectives, HUD elements, and special mechanics — similar to how polished games onboard players. Includes a small but always-visible "Skip" button so experienced players can jump straight in.

## Done looks like
- After clicking "Enter the Maze", a full-screen instructions overlay appears (not the game yet).
- Instructions are presented as a series of slides/pages the player advances through with a "Next" button.
- Each slide covers one topic with clear icons/visuals and concise text:
  - **Slide 1 — Controls:** WASD movement, mouse look, ESC to pause. Show keyboard/mouse icon layout.
  - **Slide 2 — Objective:** Collect all oranges, reach the portal exit before time runs out. Show orange icon and portal icon.
  - **Slide 3 — HUD Guide:** Annotated diagram explaining what each HUD panel shows (Level, Score, Timer, Oranges counter, Minimap, Compass, Pause button).
  - **Slide 4 — Special Mechanics:** Streak multiplier (consecutive pickups without dead ends), Math Gates (on-path vs decoy), Time pickups, Dead-end warning.
- A small "Skip" button is always visible in the bottom-right or top-right corner on every slide.
- The final slide has a "Start Game" button instead of "Next".
- Clicking "Skip" or "Start Game" transitions to gameplay (the `playing` state).
- Visual style matches the existing game aesthetic (dark theme, Orbitron/Rajdhani fonts, glassmorphism panels, gold/amber accent colors).
- Slide transitions have smooth fade/slide animations.
- A dot indicator at the bottom shows which slide the player is on.

## Out of scope
- "Don't show again" / localStorage persistence (can be added later).
- Video/animated demos of gameplay.
- Separate tutorial level or interactive walkthrough.

## Tasks
1. Add `"instructions"` screen state to `gameState.ts`. Modify `startGame()` to transition to `"instructions"` instead of `"playing"`. Add `skipInstructions()` action that sets screen to `"playing"` and initializes the game.
2. Create `InstructionsScreen` component in a new file `artifacts/maze-game/src/game/Instructions.tsx` with 4 slides, each containing an icon/visual section and text explanation. Include slide navigation (Next, Back, Skip, Start Game), dot indicator, and smooth transitions.
3. Render `InstructionsScreen` in `App.tsx` when screen === "instructions".
4. Style to match the existing game aesthetic — dark background, glassmorphism cards, Orbitron headings, Rajdhani body text, gold accents, fade/slide animations between slides.
5. Test the full flow: Start screen → Instructions (all 4 slides) → Gameplay. Verify Skip works from any slide. Verify Back navigation works. Verify pointer lock is requested on entering gameplay.

## Relevant files
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/Screens.tsx`
- `artifacts/maze-game/src/App.tsx`
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/theme.ts`
- `artifacts/maze-game/src/game/PlayerController.tsx`
