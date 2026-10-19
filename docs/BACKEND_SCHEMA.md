# Optional Backend & Cloud Architecture Schema
## Jungle Escape 3D

While the MVP executes with zero-dependency local persistence for complete offline play, this document specifies the production architecture for an optional future online backend (e.g., Cloud SQL PostgreSQL or Firebase Firestore) for cloud save synchronization, global anti-cheat leaderboards, and cross-device player identity.

---

### 1. Database Schema (PostgreSQL / Relational)

#### 1.1 `players` Table
Stores primary player account and identity:
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_coins INTEGER DEFAULT 0 CHECK (total_coins >= 0),
    selected_character VARCHAR(64) DEFAULT 'lara',
    is_banned BOOLEAN DEFAULT FALSE
);
```

#### 1.2 `player_upgrades` Table
Stores power-up upgrade levels:
```sql
CREATE TABLE player_upgrades (
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    upgrade_id VARCHAR(64) NOT NULL, -- 'magnet_duration', 'shield_duration', 'boost_duration'
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, upgrade_id)
);
```

#### 1.3 `runs` Table
Immutable historical audit log of completed runs:
```sql
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    distance_meters INTEGER NOT NULL,
    coins_collected INTEGER NOT NULL,
    score BIGINT NOT NULL,
    duration_seconds NUMERIC(8, 2) NOT NULL,
    max_speed NUMERIC(5, 2) NOT NULL,
    client_version VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_runs_score ON runs (score DESC);
CREATE INDEX idx_runs_player ON runs (player_id);
```

#### 1.4 `leaderboard_entries` (Materialized View or Redis Sorted Set)
```sql
CREATE TABLE leaderboard_global (
    rank SERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    username VARCHAR(32) NOT NULL,
    high_score BIGINT NOT NULL,
    max_distance INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. REST API Specification

#### `POST /api/v1/runs/submit`
Submits a completed run for server validation and leaderboard ingestion.
- **Request Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Body:**
```json
{
  "distanceMeters": 1420,
  "coinsCollected": 95,
  "score": 18950,
  "durationSeconds": 68.4,
  "characterId": "lara",
  "clientHash": "sha256_checksum_payload"
}
```
- **Server Validation Checks:**
  1. Average Speed check: `distanceMeters / durationSeconds <= MAX_ALLOWED_SPEED (35.0 m/s)`.
  2. Coin Density check: `coinsCollected / distanceMeters <= MAX_COINS_PER_METER (0.25)`.
  3. Score Consistency: `score == (distanceMeters * 10) + (coinsCollected * 50)`.
  4. If validation fails, run is flagged for review; user is prevented from poisoning public leaderboards.

#### `GET /api/v1/leaderboard`
Fetches top 50 players worldwide plus the requesting user's relative ranking:
- **Response:**
```json
{
  "topPlayers": [
    { "rank": 1, "username": "JungleKing99", "score": 182400, "distance": 12450 },
    { "rank": 2, "username": "RelicHunter", "score": 154200, "distance": 10890 }
  ],
  "currentUserRank": { "rank": 142, "score": 24900, "distance": 1890 }
}
```

---

### 3. Security Guidelines
- Never store client secrets or unhashed passwords in client bundles.
- Always sign run submission payloads with HMAC or session nonce to deter automated replay attacks.
- Enforce strict rate-limiting on run submissions (maximum 1 submission every 15 seconds per account).
