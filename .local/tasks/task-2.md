---
title: Build game instructions screen with proper icons
---
# Game Instructions Screen

## What & Why
Build a professional multi-slide instructions/tutorial screen that appears after clicking "Enter the Maze" and before gameplay begins. The game currently has no onboarding — players are dropped directly into a 3D maze with no explanation of controls, objectives, or HUD elements. This feature teaches new players everything they need to know, matching the existing dark cinematic aesthetic. Each slide explains what the player will see and how to play, with a persistent small "Skip" button for experienced players.

## Done looks like
- Clicking "Enter the Maze" on the start screen transitions to a full-screen instructions overlay (new `"instructions"` screen state) instead of directly entering gameplay.
- The instructions are presented as 4 sequential slides with smooth crossfade/slide animations:
  - **Slide 1 — Movement & Controls**: Shows WASD key layout visually (rendered as styled key-cap shapes, not emoji), mouse icon for camera look, ESC key for pause. Clear labels for each.
  - **Slide 2 — Your Mission**: Collect all oranges scattered in the maze (orange circle icon), reach the exit portal (portal/gate icon) before the timer runs out. Simple and clear.
  - **Slide 3 — Reading Your HUD**: Visual mockup/diagram of the HUD layout showing: top-left = Level & Score, top-center = Timer (countdown), top-right = Oranges collected/total with progress bar, bottom-left = Volume, bottom-right = Pause button, minimap & compass. Each labeled with a brief description.
  - **Slide 4 — Pro Tips**: Streak multiplier (pick up items consecutively without hitting dead ends), Math Gates (walk through number rings — blue = real, purple = decoy), Time pickups (blue glowing items add seconds), Dead-end warning (screen flashes red, resets streak).
- Navigation: "Next" button advances slides, "Back" button goes to previous slide (hidden on slide 1), dot indicators show current position.
- A small "SKIP" button is always visible in the top-right corner on every slide.
- The final slide shows "Start Game" instead of "Next".
- Clicking "Skip" or "Start Game" transitions to `playing` state (initializing the level).
- All icons/symbols are rendered as styled HTML/CSS shapes (key caps, circles, rectangles with gradients) — NOT emoji characters.
- Visual style: dark background with subtle particle/glow effects, glassmorphism slide cards, Orbitron headings, Rajdhani body text, gold/amber (#d2882a) accent color, matching existing Screens.tsx aesthetic.

## Out of scope
- "Don't show again" localStorage persistence.
- Video/animated gameplay demos.
- Interactive tutorial level.
- Changes to existing HUD or gameplay mechanics.

## Tasks
1. Add `"instructions"` to the `GameScreen` type union in `gameState.ts`. Modify `startGame()` to set screen to `"instructions"` instead of `"playing"`. Add a `beginPlaying()` action that performs the actual game initialization (level config, timer, score reset) and sets screen to `"playing"`.
2. Create `Instructions.tsx` component with 4 slides. Each slide has: a heading, visual icons/diagrams rendered as styled CSS (key-cap divs for WASD, colored circles for collectibles, labeled HUD mockup layout, etc.), and concise explanatory text. Include slide state management, Next/Back/Skip/Start Game buttons, and dot indicators.
3. Add smooth slide transition animations (crossfade or horizontal slide with CSS transitions/keyframes).
4. Wire up `InstructionsScreen` in `App.tsx` — render it when `screen === "instructions"`.
5. Verify the complete flow works: Start → Instructions (navigate all 4 slides, test Back, test Skip from each slide) → Gameplay starts correctly with pointer lock, timer, and level initialization.

## Relevant files
- `artifacts/maze-game/src/game/gameState.ts:65-65`
- `artifacts/maze-game/src/game/gameState.ts:89-91`
- `artifacts/maze-game/src/game/gameState.ts:140-175`
- `artifacts/maze-game/src/game/Screens.tsx:680-835`
- `artifacts/maze-game/src/App.tsx`
- `artifacts/maze-game/src/game/theme.ts`
- `artifacts/maze-game/src/game/HUD.tsx:1-7`