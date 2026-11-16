# Corporate Ladder

**Pitch:** You are an employee in a corporate tower that does not obey the floor plan it advertises, and you are fighting your way up it.

- **Genre:** Top-down action roguelike (twin-stick shooter)
- **Platforms:** Unity build for Windows (keyboard / controller) and mobile (touch twin-stick); the original web version is playable at https://soesanair.github.io/office-isaac/
- **Orientation:** Landscape
- **Controls (keyboard):** WASD move, arrow keys shoot, Space active item, Q pocket item, E interact, Tab map

## Features
- Every floor is procedurally generated from 273 room templates; doors seal while a room's hostiles are alive.
- 14 weapons, 60 passive items and 15 actives that all stack with each other, including combinations nobody planned for.
- 58 office enemies plus 42 variants and 29 Managers (bosses) — all pixel art drawn as code, with sound synthesised at runtime.

## Media (captured from the Unity build)
- **scrub.mp4** — 9.5 s, 960x540, one continuous shot (no cuts): the player fights the first Manager, The Team Lead, in a wood-floored meeting room while the Team Lead fires bursts of paper and coffee cups, sends minions in and lays red telegraph rings. You see hit flashes and the boss health bar dropping.
- **poster.jpg** — the first frame of scrub.mp4 (1280x720): the Team Lead flashing red as he takes a hit, with "Can we park that dodge?" in a speech bubble.
- **shot-1.jpg** — The Team Lead's radial burst of projectiles, with minions on the floor and a telegraph ring at the player's feet.
- **shot-2.jpg** — The first Open Office room on floor 1 (it scrolls vertically, with SYNERGY wall art). Doors are sealed and the player is fighting a group of office enemies among the desks.
- **shot-3.jpg** — A room with a window wall and a row of stacked passive items on the HUD. The player has an aura and paper projectiles are flying at two enemies.
- **shot-4.jpg** — A room with planters and desks. The player shoots into the room and an enemy explodes in a hit flash.

## Source
- Build: `office-isaac/unity/CorporateLadder/Builds/Windows/CorporateLadder.exe` (built 2026-11-12), run with `-force-d3d11`.
- The footage comes from the game's own in-engine recorder (`-autorecord`, 1920x1080, 30 fps, fixed timestep). A built-in autoplay bot (`-autoplay <seed>`) does the playing. The clip and shot-1 use `-autorecord-boss`, which fast-forwards to the first boss. shot-3 uses `-power-demo`, which grants several passive items at the start. The HUD is the normal player HUD, with no debug overlays.
- Captured 2026-11-16. Previous web-version media (loop.mp4, loop.webm, old scrub/poster/shots) were moved out of this folder.
