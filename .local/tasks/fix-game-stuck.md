# Fix Game Getting Stuck During Play

## What & Why
The maze game freezes or gets stuck during gameplay due to several interrelated bugs: stale refs across game restarts, timers that stop ticking during screen transitions, collision edge cases that trap the player inside walls, lore overlay blocking input without auto-dismiss, and the pointer lock loss on tab-switch leaving the player unable to look around.

## Done looks like
- Player can complete all 5 levels without the game freezing, stalling, or becoming unresponsive
- Game restarts cleanly after game-over or victory without leftover state from previous runs
- Player never gets permanently stuck inside walls or corners
- Lore overlay auto-dismisses after a timeout so the player is never trapped by it
- Frame-freeze and collapse timers always tick down to zero reliably
- Pointer lock re-engages automatically when the player clicks back into the game after losing focus
- Boss fight completes and transitions to next level/victory without stalling
- screenShake always decays to zero (never leaves the camera perpetually shaking)

## Out of scope
- Adding new game features or levels
- Redesigning the HUD or visual style
- Performance optimization beyond what's needed for the bug fixes
- Mobile touch controls (already implemented)

## Tasks
1. **Fix stale refs across game restarts** — Reset `collapseStartedRef`, `bossRoaredRef`, and `prevScreenRef` when `runId` changes so that replaying after boss fights or game-over doesn't leave stale flags from the previous run.

2. **Fix frameFreezeTimer blocking input permanently** — Add a safety clamp so frameFreezeTimer cannot exceed a maximum value (e.g., 0.5s), and ensure tickBossTimers runs even during non-playing screens to drain any residual timer values when transitioning back to playing.

3. **Fix collapseTimer === 0 false-trigger** — The useEffect checking `collapseTimer === 0` can trigger on initial mount because the initial value resets. Guard it with an additional condition (e.g., `collapseTimer` must have transitioned from a positive value) to prevent premature level transitions.

4. **Fix collision detection trapping player in walls** — Add a maximum penetration depth check and a fallback that teleports the player to the last safe position if they end up fully inside a wall (distSq < 0.0001 case). Store the last known safe position each frame.

5. **Add lore overlay auto-dismiss timeout** — If the lore overlay is open for more than 8 seconds after full text reveal, auto-dismiss it so the player is never permanently stuck reading lore while enemies attack.

6. **Fix pointer lock re-engagement** — After the player loses pointer lock (tab switch, Esc press), ensure clicking the canvas re-requests pointer lock without requiring the game to be in a specific state, so the player can always resume looking around.

7. **Add screenShake decay safety** — Ensure screenShake always decays to zero by adding a minimum decay rate, preventing the camera from shaking indefinitely if the decay calculation produces very small values that never reach zero.

8. **Fix HUD timer continuing after game-over** — Clear the HUD timer interval when the screen transitions away from "playing" mid-interval to prevent the timer from ticking the player into a second game-over state after they've already died.

## Relevant files
- `artifacts/maze-game/src/game/gameState.ts:148-260,367-376,413-471`
- `artifacts/maze-game/src/game/GameScene.tsx:325-332,452-478,648-668`
- `artifacts/maze-game/src/game/PlayerController.tsx:103-140,226-230`
- `artifacts/maze-game/src/game/HUD.tsx:332-342`
- `artifacts/maze-game/src/game/LoreOverlay.tsx:6-46`
