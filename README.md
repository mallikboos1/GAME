# Jungle Escape 3D — Endless Runner

[![Playable WebGL](https://img.shields.io/badge/Status-Playable_Now-success.svg)]()
[![Unity 6 Compatible](https://img.shields.io/badge/Unity_6-Ready-blue.svg)]()
[![Platform](https://img.shields.io/badge/Platforms-WebGL%20%7C%20Android%20%7C%20Windows-green.svg)]()

**Jungle Escape 3D** is an action-packed 3D endless runner set inside ancient jungle temple ruins. Sprint through mossy stone corridors, dodge carved deity totems, leap over spiked fallen logs, slide under massive stone archways, and collect ancient gold relics while evading deadly jungle traps!

---

## 🎮 How to Play

### In-Browser Instant WebGL Version
The game is already running live in this application! Simply click **"RUN NOW"** on the main menu to begin sprinting.

#### Desktop Keyboard Controls:
| Action | Key Bindings |
|---|---|
| **Move Left** | `A` or `Left Arrow` |
| **Move Right** | `D` or `Right Arrow` |
| **Jump** | `W` or `Up Arrow` or `Space` |
| **Slide / Duck** | `S` or `Down Arrow` |
| **Pause / Resume** | `Escape` or `P` or Pause Button |

#### Mobile Touch & Swipe Controls:
- **Swipe Left / Right:** Switch between Left, Center, and Right lanes.
- **Swipe Up:** Jump into the air over low obstacles.
- **Swipe Down:** Crouch-slide under high ruins. Can also be swiped mid-jump to fast-drop back to the ground.
- **On-Screen Touch Buttons:** Available in the HUD and Pause modal.

---

## 🌟 Key Features

1. **Procedural Endless Ruins:**
   - Seamlessly generates ancient stone pathways, rope bridge chasms, mossy stone walls, illuminated fire torches, and tropical foliage.
   - Dynamic day/evening jungle lighting with warm torch reflections and atmospheric horizon fog.

2. **Multi-Hazard System:**
   - **Low Fallen Logs / Spikes:** Must be leapt over via Jump.
   - **High Stone Ruin Beams:** Must be ducked beneath via Slide.
   - **Lane Blockers (Totems & Boulders):** Must be dodged by moving into clear lanes.
   - **Chasm Gaps:** High-stakes jumps over collapsed ancient stone bridges.

3. **Power-Ups with Real-Time Timers:**
   - 🛡️ **Golden Shield:** Grants an energy aura that absorbs 1 fatal collision.
   - 🧲 **Coin Magnet:** Automatically pulls all nearby gold coins toward you in a 12m sphere.
   - ⚡ **Jaguar Speed Boost:** Turbo-charges forward speed and grants temporary invincibility.

4. **Character Roster:**
   - **Lara the Explorer:** Balanced adventurer with +10% coin collection bonus.
   - **Leo the Tracker:** Agile jungle scout with extended Shield durability.
   - **Ryu the Shadow Scout:** Swift ninja with accelerated Speed Boost recovery.

5. **Progression & Upgrade Shop:**
   - Spend gathered gold coins to upgrade Magnet duration, Shield duration, and Speed Boost timers up to Level 5.
   - All high scores, distance records, coin balances, and upgrades persist in local storage.

6. **Web Audio Synthesizer:**
   - 100% procedural sound effects and jungle tribal percussion without external MP3/WAV dependencies!

---

## 📁 Project Structure

```
├── docs/                        # Complete Engineering Documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── TRD.md                   # Technical Requirements Document
│   ├── APP_FLOW.md              # State Machine & Navigation Flow
│   ├── UI_UX_BRIEF.md           # Visual Constitution & Style Guide
│   ├── BACKEND_SCHEMA.md        # Optional Cloud SQL & REST API Design
│   └── IMPLEMENTATION_PLAN.md   # Milestone Checklist & Progress
│
├── Assets/Scripts/              # Complete Unity 6 C# Scripts
│   ├── Core/                    # GameManager.cs, GameState.cs
│   ├── Player/                  # PlayerController.cs, PlayerInputHandler.cs, PlayerCollision.cs
│   ├── World/                   # TrackManager.cs, TrackSegment.cs, ObstacleSpawner.cs
│   ├── Collectibles/            # Coin.cs, CoinManager.cs
│   ├── Gameplay/                # ScoreManager.cs, DifficultyManager.cs
│   ├── PowerUps/                # PowerUpManager.cs, ShieldPowerUp.cs, etc.
│   ├── Camera/                  # CameraFollow.cs
│   ├── UI/                      # MainMenuUI.cs, GameHUD.cs, PauseMenuUI.cs, GameOverUI.cs
│   ├── Data/                    # SaveManager.cs, SaveData.cs
│   ├── Audio/                   # AudioManager.cs
│   └── Optimization/            # ObjectPoolManager.cs
│
└── src/                         # Playable WebGL Three.js Application
    ├── components/              # React UI overlays, HUD, Shop, Menus
    ├── game/                    # Three.js 3D Runner Engine, Audio Synthesizer
    ├── types/                   # Game state, save schemas, power-ups
    ├── App.tsx                  # Root Game Canvas & Interface Manager
    └── main.tsx                 # Entry Point
```

---

## 📱 Exporting to Android via Unity 6

1. Open **Unity Hub** and install **Unity 6 (6000.0.x)** with **Android Build Support** (including Android SDK & NDK tools).
2. Create a new 3D project.
3. Copy the `/Assets` folder from this repository into your Unity project's root.
4. Go to **File -> Build Profiles -> Android**.
5. In **Player Settings**:
   - Company Name: `JungleStudio`
   - Product Name: `Jungle Escape 3D`
   - Package Name: `com.junglestudio.jungleescape3d`
   - Target API Level: Android 14 (API 34) or Automatic Highest.
   - Screen Orientation: Landscape or Portrait (configured to Landscape by default).
6. Click **Build and Run** with your Android device connected via USB with Developer Mode enabled.

---

## 🛠️ Verification & Testing
- Automated gameplay logic tests are bundled in `src/game/tests/gameRules.test.ts`.
- Runs cleanly at 60 FPS in Chrome, Firefox, Edge, and mobile Safari.
