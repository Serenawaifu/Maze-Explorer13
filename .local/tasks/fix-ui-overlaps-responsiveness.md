# Fix UI Overlaps & Device Compatibility

## What & Why
The in-game HUD elements overlap each other at various screen sizes. The screenshot shows the compass bar overlapping with the instruction text bar at the bottom. Additionally, the minimap and math sum display can overlap on the bottom-right, and the overall layout isn't optimized for small mobile screens or tablets. This task fixes all overlap issues and ensures the UI works cleanly across all device sizes.

## Done looks like
- Compass bar and instruction bar no longer overlap — they stack vertically with proper spacing
- The "EXIT: FAR/NEAR" label inside the compass canvas no longer overlaps the "N" direction label
- MiniMap and MathSumDisplay on the bottom-right no longer collide on any screen size
- Volume control doesn't overlap with touch joystick on mobile
- All screen overlays (Game Over, Level Complete, Victory) are scrollable on short viewports so content isn't cut off
- HUD panels don't overflow or overlap on narrow screens (< 400px wide)
- Touch controls properly avoid all HUD elements
- Game is playable and visually clean on mobile phones (320px+), tablets, and desktops

## Out of scope
- Redesigning the overall visual style/theme of the HUD
- Adding new HUD elements or game features
- Changing game mechanics or controls behavior
- Landscape vs portrait mode detection (keep current responsive approach)

## Tasks
1. **Fix compass/instruction bar overlap** — Increase vertical spacing between compass bar and instruction text so they never collide. The compass sits at bottom:40px and the instruction bar at bottom:16px which causes overlap. Stack them with proper gap.

2. **Fix compass EXIT label overlap** — The "EXIT: FAR" text inside the compass canvas overlaps with the "N" cardinal direction text when the exit is to the north. Add proper spacing or offset the EXIT label to avoid collision with direction labels.

3. **Fix bottom-right element stacking** — Ensure MiniMap and MathSumDisplay on the bottom-right don't overlap. Position the MathSumDisplay above the MiniMap with proper spacing, accounting for both touch and desktop layouts.

4. **Fix touch device HUD positioning** — Review and fix the hardcoded bottom:170px offset used by Volume and MiniMap on touch devices. Ensure these elements properly clear the joystick area on all screen sizes, using relative/responsive positioning instead of magic numbers where possible.

5. **Make overlay screens scrollable** — Add overflow-y:auto to Game Over, Level Complete, and Victory screen containers so content doesn't get cut off on small viewports (phones in landscape, small tablets).

6. **Improve HUD responsiveness for small screens** — Ensure HUD panels (Level, Score, Time, Oranges) don't overflow or overlap on very narrow screens (320-400px). Reduce padding/font sizes further on small viewports. Ensure the top bar flexbox wraps gracefully if needed.

7. **Test across viewport sizes** — Verify no overlaps at 320px, 375px, 768px, 1024px, and 1440px+ widths, in both portrait and landscape orientations.

## Relevant files
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/Compass.tsx`
- `artifacts/maze-game/src/game/MiniMap.tsx`
- `artifacts/maze-game/src/game/TouchControls.tsx`
- `artifacts/maze-game/src/game/Screens.tsx`
- `artifacts/maze-game/src/App.tsx`
