# Technical Requirements Document (TRD)
## Jungle Escape 3D — Architecture & Specifications

### 1. System Architecture
The application is structured using a decoupled Component-Service architecture with clear domain isolation:
- **Core Engine & Game Loop:** Coordinates state transitions (`Loading`, `MainMenu`, `Countdown`, `Playing`, `Paused`, `GameOver`).
- **Player Controller & Kinematics:** Computes forward velocity, lateral lane interpolation, parabolic jump trajectories, crouch-slide states, and collision envelopes.
- **Track & World Manager:** Handles procedural segment spawning, object recycling, obstacle placement logic, and biome scenery.
- **Collectible & Economy Engine:** Calculates coin proximity, magnetic attraction vectors, score accumulation, and currency transactions.
- **Power-Up System:** Manages active status effects, remaining timers, visual auras, and stat overrides.
- **Persistence Layer (`SaveManager`):** Safely serializes player profile, unlocked explorers, upgrade tiers, and settings to `localStorage` (Web) / `PlayerPrefs` (Unity).
- **Audio Synthesizer Engine:** Web Audio API sound generator in browser / `AudioSource` pooling in Unity.

---

### 2. Game Loop and Frame Update
- **Target Frame Rate:** 60 FPS (16.6ms budget per frame).
- **Update Frequency:**
  - `Update(deltaTime)`: Kinematic integration, input sampling, camera tracking, and visual particle animations.
  - Frame-rate independent delta time scaling (`dt = Math.min(rawDelta, 0.05)` to avoid teleportation on frame drops).
  - Pausing zeroes out gameplay delta time without suspending UI rendering.

---

### 3. Player Movement System
- **Lanes:**
  - Lane -1 (Left): `x = -2.5m`
  - Lane 0 (Center): `x = 0.0m`
  - Lane 1 (Right): `x = +2.5m`
- **Lateral Interpolation:** Smooth critically-damped spring / exponential lerp (`x = lerp(x, targetX, 15 * dt)`).
- **Speed Curve:**
  - `InitialSpeed = 16.0 m/s`
  - `MaxSpeed = 32.0 m/s`
  - `Acceleration = 0.15 m/s²` (scales over distance traveled).
- **Jump Mechanics:**
  - `JumpHeight = 2.4 m`
  - `JumpDuration = 0.75 s`
  - Computed via vertical velocity: `vY = JumpVelocity - Gravity * t`.
- **Slide Mechanics:**
  - `SlideDuration = 0.8 s`
  - Player bounding box height scales to `0.5x` during slide, allowing passage under high obstacles.
  - Can cancel jump with slide (fast drop mechanic) to quickly duck under sudden hazards.

---

### 4. Camera System
- **Projection:** Perspective Camera (`FOV: 65°`).
- **Offset relative to player:**
  - Position: `(0, 3.8, -5.8)` relative to player center.
  - Look Target: `(0, 1.4, +6.0)` ahead of player for optimal forward visibility.
- **Camera Damping:**
  - Lateral (X): Damped follow with slight lag (`lambda = 8.0`) to give sense of lateral speed.
  - Vertical (Y): Filtered damping during jumps so camera doesn't violently jerk upward.
  - Pitch & Tilt: Subtle dynamic bank during lane changes (`±1.5°`).

---

### 5. Track Generation & Object Pooling
- **Track Segment Dimensions:** Length `24.0m`, Width `8.0m`.
- **Active Segments:** 8 segments maintained at all times (~192m draw distance).
- **Recycling Logic:**
  - When player passes `segment.z + 24.0m`, segment is recycled to the front (`furthestZ + 24.0m`).
  - Obstacles, coins, and decorations on the recycled segment are re-seeded using pseudo-random difficulty tables.
- **Object Pool Manager:**
  - Track tiles, obstacles, coins, and particle meshes are pooled. Zero memory allocations during active runs.

---

### 6. Obstacle Spawning & Fairness Guarantees
- **Spawn Rules:**
  - Guarantee at least 1 open/clear path at all times (never spawn full 3-lane impassable blocks).
  - Enforce minimum distance between consecutive obstacles: `minGap = speed * 1.0s` to allow player reaction time.
- **Obstacle Classes:**
  1. `ObstacleLow` (Fallen mossy log / spiked barrier): Collider height `0.8m`. Player must Jump.
  2. `ObstacleHigh` (Ancient stone lintel / ruin arch): Collider bottom `1.2m`, top `3.0m`. Player must Slide.
  3. `ObstacleLane` (Stone deity statue / broken column): Occupies 1 or 2 lanes, full height. Player must Change Lane.
  4. `ObstacleGap` (Broken stone bridge): Chasm spanning across track. Player must Jump over or pick safe bridge plank.

---

### 7. Coin Collection & Magnetic Physics
- **Coins Arrangement:** Formations of 5–10 coins in straight lines, gentle sine waves, or parabolic jump arches.
- **Collection Detection:**
  - Normal radius: `1.2m` collision sphere around player.
  - Magnet radius: `12.0m`. Coins accelerate towards player position with exponential pull (`v = dir * 28.0 m/s`).
- **Sound & Animation:** Collected coin plays golden sparkle burst and high-pitch resonant chime (`A5 -> C#6 -> E6`).

---

### 8. Power-Up Specifications
| Power-Up | Duration | Effect | Visual Feedback |
|---|---|---|---|
| **Golden Shield** | 12s | Negates 1 obstacle collision | Pulsing golden energy sphere around character |
| **Coin Magnet** | 10s | Pulls all coins within 12m | Glowing blue horseshoe magnet icon + trail |
| **Jaguar Boost** | 8s | +40% speed, complete invincibility | Green streak aura, blazing speed particles |

---

### 9. State Machine
```
[Loading] -> [MainMenu] <-------------------------+
                 |                                |
                 v                                |
            [Countdown]                           |
                 |                                |
                 v                                |
             [Playing] <=======> [Paused]         |
                 |                                |
                 v                                |
            [GameOver] ---------------------------+
```

---

### 10. Persistence Schema (`SaveData`)
```json
{
  "version": 1,
  "highScore": 14500,
  "bestDistance": 1280,
  "totalCoins": 320,
  "selectedCharacterId": "lara",
  "unlockedCharacters": ["lara"],
  "upgrades": {
    "magnetDuration": 1,
    "shieldDuration": 1,
    "boostDuration": 1,
    "coinMultiplier": 1
  },
  "settings": {
    "musicVolume": 0.8,
    "sfxVolume": 0.9,
    "swipeSensitivity": 1.0,
    "audioMuted": false
  }
}
```

---

### 11. Performance Optimization
- Instanced rendering for repetitive jungle foliage and stone wall pillars.
- Texture atlas for all UI icons and obstacle trims.
- Zero allocation in `render()` / `update()` methods using pre-allocated module vectors (`_tempVec3`, `_tempBox3`).
- Audio nodes created via a single persistent `AudioContext` with zero latency buffer caching.
