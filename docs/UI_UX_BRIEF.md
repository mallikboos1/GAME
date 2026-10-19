# UI/UX Design Brief & Style Constitution
## Jungle Escape 3D

### 1. Visual Style & Theme
- **Theme:** Ancient Temple Ruins & Overgrown Jungle Canopy.
- **Aesthetic:** High-contrast arcade adventurer feel. Deep jungle emerald greens, weathered Aztec gold, ancient mossy gray stone, and vibrant ember torches.
- **Atmospheric Depth:** Horizon jungle fog (`#102217`), atmospheric sun shafts filtering through the trees, firefly particle embers, and warm torch specular highlights on stone pillars.

---

### 2. Color Palette
| Token | Hex Value | Semantic Usage |
|---|---|---|
| **Jungle Deep** | `#0b1d13` | Deep background, horizon fog, base canvas tone |
| **Ancient Gold** | `#eab308` | Primary CTA, coin icons, rank badges, score highlights |
| **Temple Amber** | `#f97316` | Torches, warnings, critical obstacle markers, fire |
| **Moss Stone** | `#1e293b` | Stone cards, slate panels, dialogue containers |
| **Emerald Vibrant** | `#10b981` | Speed Boost aura, success notifications, resume buttons |
| **Mystic Cyan** | `#06b6d4` | Coin Magnet indicator, shield glow, tech borders |
| **Crimson Hazard** | `#ef4444` | Health danger, fatal collisions, reset confirmations |
| **Parchment White** | `#f8fafc` | Primary typography, headers, metric values |

---

### 3. Typography
- **Primary Header Font:** Bold display sans-serif (tracking-wider, uppercase, drop-shadowed for cinematic arcade impact).
- **HUD Numbers:** High-legibility monospaced numerals (`font-mono`) to prevent layout jitter as score increments rapidly at 60 FPS.
- **Body & Labels:** Clean geometric sans-serif (`font-sans`), font-weight 500–700.

---

### 4. Layout Specifications

#### 4.1 In-Game HUD (Zero Viewport Occlusion)
- **Top Left:** Distance Meter (`1,420 m`) with green running icon.
- **Top Center:** Live Score (`042,980`) in bold golden typography.
- **Top Right:** Coins Collected (`⚡ 124`) + Pause Button (`⏸`).
- **Mid-Screen Flanks:** Completely clear of obstructions to provide unhindered lane visibility.
- **Bottom Center:** Active Power-Up Timers. Sleek horizontal progress bars that deplete smoothly in real-time.

#### 4.2 Main Menu
- **Centerpiece:** Interactive 3D hero podium rendering the active explorer in real-time with rotational drag.
- **Top Bar:** Current Coin Vault (`1,850 🪙`) and All-Time Best (`48,320 pts`).
- **Center Action:** Prominent **"RUN NOW"** golden action button.
- **Bottom Bar:** Quick action icons: Character Selection (`👤`), Upgrades Shop (`🛒`), Settings (`⚙️`), Game Manual / Docs (`📜`).

#### 4.3 Game Over Modal
- **Headline:** Dramatic "EXPEDITION FAILED" or "ANCIENT TRAP SPRUNG".
- **Score Card:**
  - Distance: `842 m`
  - Gold Recovered: `+86 🪙`
  - Total Run Score: `12,480`
  - *New Best Record!* (Trophy badge with particle confetti if record achieved).
- **Actions:** High-visibility **"RETRY"** button and secondary **"MAIN MENU"** button.

---

### 5. Touch Target & Accessibility Guidelines
- Minimum touch target: `48px x 48px` with at least 8px spacing between adjacent touch elements.
- Swipe gesture deadzone: `30px` minimum travel to trigger lane shift or jump/slide, avoiding accidental triggers.
- High contrast ratio: All text meets WCAG AA standards against translucent dark-tinted stone modal backdrops (`rgba(11, 29, 19, 0.92)`).
