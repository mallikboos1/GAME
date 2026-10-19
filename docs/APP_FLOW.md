# Application Flow & State Transition Document
## Jungle Escape 3D

### 1. High-Level Flow Diagram
```
                     +---------------------------+
                     |        Application        |
                     |          Launch           |
                     +-------------+-------------+
                                   |
                                   v
                     +---------------------------+
                     |    Assets & Save Init     |
                     |       (State: LOADING)    |
                     +-------------+-------------+
                                   |
                                   v
                     +---------------------------+
                     |         Main Menu         | <---------------------------+
                     |     (State: MAIN_MENU)    |                             |
                     +-------------+-------------+                             |
                       |       |         |                                     |
             [Select Char]  [Shop]   [Settings]                                |
                       |       |         |                                     |
                       v       v         v                                     |
                   (Modals Over Main Menu)                                     |
                               |                                               |
                          [Tap "PLAY"]                                         |
                               |                                               |
                               v                                               |
                     +---------------------------+                             |
                     |      3-2-1 Countdown      |                             |
                     |     (State: COUNTDOWN)    |                             |
                     +-------------+-------------+                             |
                                   |                                           |
                                   v                                           |
                     +---------------------------+                             |
        +----------> |      Active Running       |                             |
        |            |      (State: PLAYING)     |                             |
        |            +-------+-----------+-------+                             |
        |                    |           |                                     |
    [Resume]         [Tap Pause]     [Fatal Collision]                         |
        |                    |           |                                     |
        |                    v           v                                     |
  +-----------+     +-------------+ +-------------+                            |
  |  Playing  |     | Pause Modal | |  Game Over  |                            |
  +-----------+     |  (PAUSED)   | | (GAME_OVER) |                            |
                    +------+------+ +------+------+                            |
                           |               |                                   |
                +----------+----------+    +-----------------+                 |
                |          |          |                      |                 |
            [Resume]   [Restart]  [Quit Menu]            [Play Again]      [Main Menu]
                |          |          |                      |                 |
                +          v          v                      v                 |
             (Back)   (New Run)   (To Menu)              (New Run)             |
                           |          |                      |                 |
                           +----------)----------------------+                 |
                                      +----------------------------------------+
```

---

### 2. State Transition Rules & Safeguards

#### 2.1 State: `LOADING`
- **Entry:** App initialization. Reads local save profile from `localStorage` / `PlayerPrefs`.
- **Allowed Actions:** Pre-warms Three.js shaders and creates Web Audio synthesizer context on first user interaction.
- **Next States:** `MAIN_MENU`.

#### 2.2 State: `MAIN_MENU`
- **Entry:** Displays selected 3D character idle/run preview on ancient jungle altar.
- **Allowed Transitions:**
  - `-> COUNTDOWN / PLAYING`: Triggered by "RUN NOW / PLAY" button.
  - Open Character Selection Modal: View Lara, Leo, Ryu; unlock with coins.
  - Open Upgrade Shop Modal: Upgrade Magnet, Shield, Speed Boost duration.
  - Open Settings Modal: Mute audio, calibrate volume & swipe sensitivity.
  - Open Architecture & Docs Modal: View PRD, TRD, App Flow, and Unity code.

#### 2.3 State: `COUNTDOWN`
- **Duration:** 1.5 seconds (3, 2, 1, GO!).
- **Allowed Transitions:** `-> PLAYING`. Player controls are armed at "GO!".

#### 2.4 State: `PLAYING`
- **Active Loops:**
  - Player forward kinematic velocity applied continuously.
  - Swipe gestures and keyboard inputs actively shift lanes, trigger jumps, and slide.
  - Collision detection against obstacles active (unless under Jaguar Boost).
  - Coins collected and added to run session coins counter.
  - Power-up countdown timers decrementing.
- **Allowed Transitions:**
  - `-> PAUSED`: Triggered by Pause button on HUD or pressing `Escape` / `Space`.
  - `-> GAME_OVER`: Triggered when player hits an obstacle without an active Shield.

#### 2.5 State: `PAUSED`
- **Behavior:**
  - Time scale set to `0.0` (all movement, particle updates, and power-up timers freeze).
  - Web Audio synthesized loops pause.
- **Buttons Available:**
  - **Resume:** Restores running with 1-second unpause buffer.
  - **Restart:** Resets track, player, and starts fresh run immediately.
  - **Main Menu:** Saves accumulated coins and exits back to menu.

#### 2.6 State: `GAME_OVER`
- **Behavior:**
  - Player enters stumble/fall animation; camera gently settles.
  - Collision checks permanently disabled to prevent multiple death events.
  - Current run stats computed: `Total Score`, `Distance Traveled`, `Coins Earned`.
  - If `Total Score > High Score`: High score updated and victory flare displayed.
  - Persistent coins updated: `totalCoins += runCoins`.
  - State serialized immediately to persistent storage.
- **Buttons Available:**
  - **Retry / Run Again:** Restarts track without visiting menu.
  - **Main Menu:** Returns to primary menu.

---

### 3. Invalid Transitions & Error Handling
- Attempting to pause while in `GAME_OVER` or `MAIN_MENU` is strictly ignored.
- Consecutive rapid swipe inputs are queued safely without skipping lanes or breaking animations.
- Corrupted save data is caught with a try/catch fallback to standard default values without crashing the game.
