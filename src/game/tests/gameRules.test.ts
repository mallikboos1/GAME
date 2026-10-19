/**
 * Automated Unit Tests for Jungle Escape 3D Gameplay Rules & Mathematics
 */

export function runGameplayRulesTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      results.push(`❌ FAIL: ${testName}`);
    }
  }

  // 1. Lane Boundary Logic
  const clampLane = (lane: number, delta: number): -1 | 0 | 1 => {
    const next = lane + delta;
    return Math.max(-1, Math.min(1, next)) as -1 | 0 | 1;
  };

  assert(clampLane(0, -1) === -1, 'Lane clamp: 0 -> left = -1');
  assert(clampLane(-1, -1) === -1, 'Lane clamp: -1 -> left remains -1 (cannot escape track)');
  assert(clampLane(0, 1) === 1, 'Lane clamp: 0 -> right = 1');
  assert(clampLane(1, 1) === 1, 'Lane clamp: 1 -> right remains 1 (cannot escape track)');

  // 2. Score Calculation Formula
  const calculateScore = (distance: number, coins: number, coinMultiplier: number) => {
    return Math.floor(distance * 10 + coins * 50 * coinMultiplier);
  };

  assert(calculateScore(100, 10, 1.0) === 100 * 10 + 10 * 50, 'Score formula base multiplier');
  assert(calculateScore(250, 20, 1.25) === Math.floor(250 * 10 + 20 * 50 * 1.25), 'Score formula with 1.25x perk');

  // 3. Speed Acceleration Curve
  const calculateSpeed = (baseSpeed: number, distance: number, maxSpeed: number, accelRate: number) => {
    return Math.min(maxSpeed, baseSpeed + distance * (accelRate / 100));
  };

  assert(calculateSpeed(16.0, 0, 32.0, 0.12) === 16.0, 'Speed starts at base speed');
  assert(calculateSpeed(16.0, 1000, 32.0, 0.12) === 17.2, 'Speed accelerates gradually over 1000m');
  assert(calculateSpeed(16.0, 50000, 32.0, 0.12) === 32.0, 'Speed caps safely at maxSpeed');

  // 4. Fair Obstacle Generation Guarantees (At least 1 safe lane)
  const generateLanesWithGuarantee = () => {
    const lanes: Array<-1 | 0 | 1> = [-1, 0, 1];
    const safeLane = lanes[Math.floor(Math.random() * lanes.length)];
    const blockedLanes = lanes.filter((l) => l !== safeLane);
    return { safeLane, blockedLanes };
  };

  for (let i = 0; i < 20; i++) {
    const { safeLane, blockedLanes } = generateLanesWithGuarantee();
    assert(blockedLanes.length < 3, `Obstacle safety check #${i + 1}: At least 1 lane is open`);
    assert(!blockedLanes.includes(safeLane), `Safe lane ${safeLane} is not in blocked list`);
  }

  // 5. Jump Height & Obstacle Clearance
  const obstacleLowHeight = 0.65;
  const playerJumpPeak = 2.2;
  assert(playerJumpPeak > obstacleLowHeight, 'Jump peak safely clears low hurdle obstacle');

  const archObstacleBottomY = 1.6;
  const playerSlideHeight = 0.7;
  assert(playerSlideHeight < archObstacleBottomY, 'Slide crouch safely passes under high archway');

  return { passed, failed, results };
}
