/**
 * Jungle Escape 3D - Core Three.js Game Engine
 * Manages game loop, physics, camera kinematics, track streaming, and collision detection.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CharacterDef, GameState, PowerUpState, PowerUpType, RunSummary } from '../../types/game';
import { SoundEffects } from '../audio/SoundEffects';
import {
  buildCharacterModel,
  buildCoin,
  buildObstacle,
  buildPowerUp,
  buildTrackSegment,
  CharacterModelInstance,
  ObstacleType,
  TrackSegmentInstance,
} from './ProceduralAssets';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: { distance: number; score: number; coins: number; speed: number }) => void;
  onPowerUpsUpdate: (powerUps: PowerUpState[]) => void;
  onGameOver: (summary: RunSummary) => void;
  onStateChange: (state: GameState) => void;
  onCountdownUpdate?: (num: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private torchFillLight!: THREE.PointLight;

  // Game Loop
  private animFrameId: number | null = null;
  private countdownTimeoutIds: number[] = [];
  private clock: THREE.Clock = new THREE.Clock();
  private gameState: GameState = 'LOADING';

  // Player State
  private activeCharDef: CharacterDef;
  private playerInstance!: CharacterModelInstance;
  private playerLane: -1 | 0 | 1 = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private targetX: number = 0;

  // Jump & Slide
  private isJumping: boolean = false;
  private jumpVelocity: number = 0;
  private readonly gravity: number = 24.0;
  private readonly jumpForce: number = 8.5;

  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private readonly slideDuration: number = 0.75;

  // Speed & Difficulty
  private baseSpeed: number = 16.0;
  private currentSpeed: number = 16.0;
  private readonly maxSpeed: number = 32.0;
  private readonly acceleration: number = 0.12;

  // Metrics & React HUD Deduplication
  private runDistance: number = 0;
  private runCoins: number = 0;
  private runScore: number = 0;
  private bestScore: number = 0;
  private bestDistance: number = 0;
  private lastReportedStats = { distance: -1, score: -1, coins: -1, speed: -1 };

  // Power-Ups
  private activePowerUps: Map<PowerUpType, { remaining: number; max: number }> = new Map();
  private powerUpSyncAccumulator: number = 0;
  private invulnerableTimer: number = 0;

  // Track & Segments
  private readonly segmentLength: number = 24.0;
  private readonly totalSegments: number = 8;
  private segments: TrackSegmentInstance[] = [];
  private furthestZ: number = 0;

  // Audio & Settings
  private swipeSensitivity: number = 1.0;
  private upgradeLevels: { [key: string]: number } = { magnet: 1, shield: 1, boost: 1, coinMultiplier: 1 };

  constructor(
    container: HTMLElement,
    charDef: CharacterDef,
    callbacks: GameEngineCallbacks,
    saveData: {
      highScore: number;
      bestDistance: number;
      upgrades: { magnet: number; shield: number; boost: number; coinMultiplier: number };
    }
  ) {
    this.container = container;
    this.activeCharDef = charDef;
    this.callbacks = callbacks;
    this.bestScore = saveData.highScore;
    this.bestDistance = saveData.bestDistance;
    this.upgradeLevels = saveData.upgrades;

    this.initThree();
    this.initTrack();
    this.initPlayer();

    // Pre-compile shaders once to eliminate first-frame hitching
    this.renderer.compile(this.scene, this.camera);

    this.setGameState('MAIN_MENU');
    this.startLoop();
  }

  private initThree() {
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth || 800, this.container.clientHeight || 600);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e2015);
    this.scene.fog = new THREE.FogExp2(0x0e2015, 0.012);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.dirLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    this.dirLight.position.set(12, 24, -10);
    this.dirLight.castShadow = !isHeadless;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    this.dirLight.shadow.camera.left = -12;
    this.dirLight.shadow.camera.right = 12;
    this.dirLight.shadow.camera.top = 18;
    this.dirLight.shadow.camera.bottom = -18;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x14321c, 0.75);
    this.scene.add(this.hemiLight);

    // Single warm torch fill light that follows the player smoothly
    this.torchFillLight = new THREE.PointLight(0xff8811, 2.2, 18, 1.2);
    this.torchFillLight.position.set(0, 3.0, 2.0);
    this.scene.add(this.torchFillLight);

    const aspect = (this.container.clientWidth || 800) / (this.container.clientHeight || 600);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.2, 250);
    this.camera.position.set(0, 3.8, -5.8);
    this.camera.lookAt(0, 1.4, 6.0);

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private clearSegmentDynamicItems(seg: TrackSegmentInstance) {
    for (const obs of seg.obstacles) {
      seg.group.remove(obs.group);
    }
    for (const c of seg.coins) {
      seg.group.remove(c.group);
    }
    if (seg.powerUp) {
      seg.group.remove(seg.powerUp.group);
    }
    seg.obstacles = [];
    seg.coins = [];
    seg.powerUp = null;
  }

  private initTrack() {
    this.furthestZ = 0;

    // Create the 8 pooled track segments once; on subsequent resets, reuse them cleanly
    if (this.segments.length === 0) {
      for (let i = 0; i < this.totalSegments; i++) {
        const seg = buildTrackSegment(i, this.segmentLength);
        this.scene.add(seg.group);
        this.segments.push(seg);
      }
    }

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      this.clearSegmentDynamicItems(seg);
      seg.segmentZ = this.furthestZ;
      seg.group.position.z = this.furthestZ;

      if (i >= 2) {
        this.populateSegment(seg, i);
      }

      this.furthestZ += this.segmentLength;
    }
  }

  private populateSegment(seg: TrackSegmentInstance, segIndex: number) {
    const pattern = Math.random();
    const lanes: Array<-1 | 0 | 1> = [-1, 0, 1];
    let safePickupLane: -1 | 0 | 1 = 0;

    if (pattern < 0.45) {
      const obsType: ObstacleType = Math.random() > 0.5 ? 'HURDLE_LOW' : 'ARCH_HIGH';
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const obs = buildObstacle(obsType, lane, 0);
      seg.group.add(obs.group);
      seg.obstacles.push(obs);

      const openLanes = lanes.filter((l) => l !== lane);
      const coinLane = openLanes[0];
      safePickupLane = openLanes[openLanes.length - 1];
      for (let c = -6; c <= 6; c += 3) {
        const coin = buildCoin(coinLane, 0.7, c);
        seg.group.add(coin.group);
        seg.coins.push(coin);
      }
    } else if (pattern < 0.8) {
      const obsType: ObstacleType = Math.random() > 0.5 ? 'TOTEM_LANE' : 'BOULDER_LANE';
      const blockedLane = lanes[Math.floor(Math.random() * lanes.length)];
      const obs = buildObstacle(obsType, blockedLane, 0);
      seg.group.add(obs.group);
      seg.obstacles.push(obs);

      const safeLanes = lanes.filter((l) => l !== blockedLane);
      const chosenLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
      safePickupLane = chosenLane;
      for (let c = -6; c <= 6; c += 3) {
        const coin = buildCoin(chosenLane, 0.7, c);
        seg.group.add(coin.group);
        seg.coins.push(coin);
      }
    } else {
      const safeLane = lanes[Math.floor(Math.random() * lanes.length)];
      safePickupLane = safeLane;
      const blockedLanes = lanes.filter((l) => l !== safeLane);
      blockedLanes.forEach((bLane) => {
        const obs = buildObstacle('TOTEM_LANE', bLane, 0);
        seg.group.add(obs.group);
        seg.obstacles.push(obs);
      });

      for (let c = -6; c <= 6; c += 3) {
        const coin = buildCoin(safeLane, 0.7, c);
        seg.group.add(coin.group);
        seg.coins.push(coin);
      }
    }

    if (segIndex % 4 === 2) {
      const pTypes: PowerUpType[] = ['SHIELD', 'MAGNET', 'SPEED_BOOST'];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pUp = buildPowerUp(pType, safePickupLane, 9.0);
      seg.group.add(pUp.group);
      seg.powerUp = pUp;
    }
  }

  private initPlayer() {
    this.playerInstance = buildCharacterModel(this.activeCharDef);
    this.scene.add(this.playerInstance.group);
    this.resetPlayerPosition();
  }

  private resetPlayerPosition() {
    this.playerLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.targetX = 0;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.currentSpeed = this.baseSpeed;
    this.runDistance = 0;
    this.runCoins = 0;
    this.runScore = 0;
    this.activePowerUps.clear();
    this.invulnerableTimer = 0;

    if (this.playerInstance) {
      this.playerInstance.group.position.set(0, 0, 0);
      this.playerInstance.group.rotation.y = 0;
      this.playerInstance.setShieldActive(false);
    }

    if (this.camera) {
      this.camera.position.set(0, 3.8, -5.8);
      this.camera.lookAt(0, 1.4, 6.0);
    }

    if (this.dirLight) {
      this.dirLight.position.set(12, 24, -10);
      this.dirLight.target.position.set(0, 0, 10);
      this.dirLight.target.updateMatrixWorld();
    }

    if (this.torchFillLight) {
      this.torchFillLight.position.set(0, 3.0, 2.0);
    }

    this.syncPowerUps();
    this.reportStatsIfChanged(true);
  }

  private reportStatsIfChanged(force: boolean = false) {
    const roundedSpeed = Math.round(this.currentSpeed);
    if (
      force ||
      this.runDistance !== this.lastReportedStats.distance ||
      this.runScore !== this.lastReportedStats.score ||
      this.runCoins !== this.lastReportedStats.coins ||
      roundedSpeed !== this.lastReportedStats.speed
    ) {
      this.lastReportedStats = {
        distance: this.runDistance,
        score: this.runScore,
        coins: this.runCoins,
        speed: roundedSpeed,
      };
      this.callbacks.onStatsUpdate(this.lastReportedStats);
    }
  }

  // -------------------------------------------------------------
  // Public Controls & Input Actions
  // -------------------------------------------------------------
  public moveLeft() {
    if (this.gameState !== 'PLAYING') return;
    if (this.playerLane > -1) {
      this.playerLane = (this.playerLane - 1) as -1 | 0 | 1;
      this.targetX = this.playerLane * 2.5;
    }
  }

  public moveRight() {
    if (this.gameState !== 'PLAYING') return;
    if (this.playerLane < 1) {
      this.playerLane = (this.playerLane + 1) as -1 | 0 | 1;
      this.targetX = this.playerLane * 2.5;
    }
  }

  public jump() {
    if (this.gameState !== 'PLAYING') return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpForce;
      this.isSliding = false;
      SoundEffects.playJump();
    }
  }

  public slide() {
    if (this.gameState !== 'PLAYING') return;
    if (this.isJumping) {
      this.jumpVelocity = -14.0;
    }
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    SoundEffects.playSlide();
  }

  public setCharacter(charDef: CharacterDef) {
    this.activeCharDef = charDef;
    if (this.playerInstance) {
      this.scene.remove(this.playerInstance.group);
      this.playerInstance.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      this.playerInstance = buildCharacterModel(this.activeCharDef);
      this.scene.add(this.playerInstance.group);
      this.resetPlayerPosition();
    }
  }

  public setUpgrades(upgrades: { magnet: number; shield: number; boost: number; coinMultiplier: number }) {
    this.upgradeLevels = upgrades;
  }

  public setBestRecords(highScore: number, bestDistance: number) {
    this.bestScore = highScore;
    this.bestDistance = bestDistance;
  }

  public setSensitivity(val: number) {
    this.swipeSensitivity = val;
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public recoverPlayerToSafeLane(safeLane: -1 | 0 | 1 = 0) {
    this.playerLane = safeLane;
    this.targetX = safeLane * 2.5;
    this.playerX = this.targetX;
    this.playerY = 0;
    if (Number.isNaN(this.playerZ) || !Number.isFinite(this.playerZ)) {
      this.playerZ = 0;
    }
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.isSliding = false;
    this.invulnerableTimer = 2.0;
    if (this.playerInstance) {
      this.playerInstance.group.position.set(this.playerX, this.playerY, this.playerZ);
    }
  }

  private clearCountdownTimer() {
    for (const id of this.countdownTimeoutIds) {
      window.clearTimeout(id);
    }
    this.countdownTimeoutIds = [];
  }

  public startRun() {
    this.clearCountdownTimer();
    this.resetPlayerPosition();
    this.initTrack();
    this.callbacks.onCountdownUpdate?.(3);
    this.setGameState('COUNTDOWN');
    SoundEffects.startJungleAmbient();

    const t1 = window.setTimeout(() => {
      if (this.gameState === 'COUNTDOWN') {
        this.callbacks.onCountdownUpdate?.(2);
      }
    }, 500);

    const t2 = window.setTimeout(() => {
      if (this.gameState === 'COUNTDOWN') {
        this.callbacks.onCountdownUpdate?.(1);
      }
    }, 1000);

    const t3 = window.setTimeout(() => {
      this.countdownTimeoutIds = [];
      if (this.gameState === 'COUNTDOWN') {
        this.clock.getDelta(); // flush delta before starting movement
        this.setGameState('PLAYING');
      }
    }, 1500);

    this.countdownTimeoutIds.push(t1, t2, t3);
  }

  public pauseGame() {
    if (this.gameState === 'PLAYING') {
      this.setGameState('PAUSED');
      SoundEffects.stopJungleAmbient();
    }
  }

  public resumeGame() {
    if (this.gameState === 'PAUSED') {
      this.clock.getDelta(); // flush delta so player doesn't jump forward on unpause
      this.setGameState('PLAYING');
      SoundEffects.startJungleAmbient();
    }
  }

  public restartGame() {
    this.startRun();
  }

  public returnToMainMenu() {
    this.clearCountdownTimer();
    this.setGameState('MAIN_MENU');
    this.resetPlayerPosition();
    this.initTrack();
    SoundEffects.stopJungleAmbient();
  }

  private setGameState(newState: GameState) {
    this.gameState = newState;
    this.callbacks.onStateChange(newState);
  }

  // -------------------------------------------------------------
  // Power-Up Activations
  // -------------------------------------------------------------
  private activatePowerUp(type: PowerUpType) {
    SoundEffects.playPowerUp();
    let duration = 10;

    if (type === 'SHIELD') {
      const bonus = this.activeCharDef.shieldBonusSec || 0;
      duration = 12 + (this.upgradeLevels.shield - 1) * 3 + bonus;
      this.playerInstance.setShieldActive(true);
    } else if (type === 'MAGNET') {
      duration = 10 + (this.upgradeLevels.magnet - 1) * 2.5;
    } else if (type === 'SPEED_BOOST') {
      duration = 8 + (this.upgradeLevels.boost - 1) * 2;
    }

    this.activePowerUps.set(type, { remaining: duration, max: duration });
    this.syncPowerUps();
  }

  private syncPowerUps() {
    const list: PowerUpState[] = [];
    this.activePowerUps.forEach((val, type) => {
      list.push({ type, remainingTime: Math.max(0, val.remaining), maxDuration: val.max });
    });
    this.callbacks.onPowerUpsUpdate(list);
  }

  // -------------------------------------------------------------
  // Main Game Animation Loop
  // -------------------------------------------------------------
  private startLoop() {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const rawDelta = this.clock.getDelta();
      const dt = Math.min(rawDelta, 0.05);
      const time = this.clock.getElapsedTime();

      this.update(dt, time);
      this.render();
    };
    loop();
  }

  private update(dt: number, time: number) {
    if (this.gameState === 'MAIN_MENU') {
      if (this.playerInstance) {
        this.playerInstance.group.rotation.y = time * 0.8;
        this.playerInstance.animateRun(time, 0.2, false, false);
      }
      return;
    }

    if (this.gameState !== 'PLAYING') {
      return;
    }

    // 1. Calculate Active Speed & Multipliers
    let speedMult = 1.0;
    if (this.activePowerUps.has('SPEED_BOOST')) {
      speedMult = 1.45;
    }
    this.currentSpeed =
      Math.min(
        this.maxSpeed,
        this.baseSpeed * this.activeCharDef.speedMultiplier + this.runDistance * (this.acceleration / 100)
      ) * speedMult;

    // 2. Advance Forward in Z
    const forwardStep = this.currentSpeed * dt;
    this.playerZ += forwardStep;
    this.runDistance = Math.floor(this.playerZ);

    // 3. Lateral Lane Lerp Damping
    this.playerX = THREE.MathUtils.damp(this.playerX, this.targetX, 16.0, dt);

    // 4. Vertical Jump Physics
    if (this.isJumping) {
      this.playerY += this.jumpVelocity * dt;
      this.jumpVelocity -= this.gravity * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    }

    // 5. Slide Crouch Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 6. Grace Period Timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // 7. Power-Up Timers (throttled to 10Hz for zero React re-render lag)
    if (this.activePowerUps.size > 0) {
      let expiredAny = false;
      this.activePowerUps.forEach((data, type) => {
        data.remaining -= dt;
        if (data.remaining <= 0) {
          this.activePowerUps.delete(type);
          expiredAny = true;
          if (type === 'SHIELD') {
            this.playerInstance.setShieldActive(false);
          }
        }
      });
      this.powerUpSyncAccumulator += dt;
      if (expiredAny || this.powerUpSyncAccumulator >= 0.1) {
        this.powerUpSyncAccumulator = 0;
        this.syncPowerUps();
      }
    }

    // 8. Update Character Model Position & Running Pose
    this.playerInstance.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerInstance.group.rotation.y = 0;
    const speedRatio = this.currentSpeed / this.baseSpeed;
    this.playerInstance.animateRun(time, speedRatio, this.isJumping, this.isSliding);

    // 9. Camera Follow Rig
    const camTargetX = THREE.MathUtils.damp(this.camera.position.x, this.playerX * 0.75, 8.0, dt);
    const camTargetY = 3.6 + Math.min(this.playerY * 0.4, 1.2);
    const camTargetZ = this.playerZ - 5.8;

    this.camera.position.set(camTargetX, camTargetY, camTargetZ);
    this.camera.lookAt(this.playerX * 0.4, 1.4, this.playerZ + 6.0);

    // Light tracking
    this.dirLight.position.set(this.playerX + 12, 24, this.playerZ - 10);
    this.dirLight.target.position.set(this.playerX, 0, this.playerZ + 10);
    this.dirLight.target.updateMatrixWorld();

    this.torchFillLight.position.set(this.playerX, 3.0, this.playerZ + 3.0);

    // 10. Endless Track Recycling
    this.updateTrackRecycling();

    // 11. Coin & Power-Up Collisions + Magnet Pull
    this.updateCoinsAndPickups(dt, time);

    // 12. Obstacle Collisions
    this.updateObstacleCollisions();

    // 13. Score Calculation
    const coinBonus = this.activeCharDef.coinMultiplier * (1 + (this.upgradeLevels.coinMultiplier - 1) * 0.25);
    this.runScore = Math.floor(this.runDistance * 10 + this.runCoins * 50 * coinBonus);

    // 14. Report Metrics to UI only when values change
    this.reportStatsIfChanged(false);
  }

  private updateTrackRecycling() {
    for (const seg of this.segments) {
      if (this.playerZ - seg.segmentZ > this.segmentLength + 10) {
        this.clearSegmentDynamicItems(seg);

        seg.segmentZ = this.furthestZ;
        seg.group.position.z = this.furthestZ;
        this.furthestZ += this.segmentLength;

        this.populateSegment(seg, Math.floor(this.furthestZ / this.segmentLength));
      }
    }
  }

  private updateCoinsAndPickups(dt: number, time: number) {
    const isMagnetActive = this.activePowerUps.has('MAGNET');
    const magnetRadius = 12.0;

    for (const seg of this.segments) {
      for (const coin of seg.coins) {
        if (coin.collected) continue;
        coin.update(time);

        const worldZ = seg.segmentZ + coin.z;
        const distZ = Math.abs(worldZ - this.playerZ);
        const distX = Math.abs(coin.group.position.x - this.playerX);
        const distY = Math.abs(coin.baseY - this.playerY);

        // Magnetic Attraction (updates X, Y, and Z visual coordinates)
        if (isMagnetActive && distZ < magnetRadius && distX < 6.0) {
          const dirX = this.playerX - coin.group.position.x;
          const dirY = this.playerY + 0.8 - coin.group.position.y;
          const dirZ = this.playerZ - worldZ;
          coin.group.position.x += dirX * 14.0 * dt;
          coin.group.position.y += dirY * 14.0 * dt;
          coin.z += dirZ * 14.0 * dt;
          coin.group.position.z = coin.z;
        }

        const updatedWorldZ = seg.segmentZ + coin.z;
        if (
          Math.abs(updatedWorldZ - this.playerZ) < 1.35 &&
          Math.abs(coin.group.position.x - this.playerX) < 1.15 &&
          distY < 1.6
        ) {
          coin.collected = true;
          seg.group.remove(coin.group);
          this.runCoins += 1;
          SoundEffects.playCoin();
        }
      }

      if (seg.powerUp && !seg.powerUp.collected) {
        seg.powerUp.update(time);
        const worldZ = seg.segmentZ + seg.powerUp.z;
        const distZ = Math.abs(worldZ - this.playerZ);
        const distX = Math.abs(seg.powerUp.group.position.x - this.playerX);

        if (distZ < 1.4 && distX < 1.2 && this.playerY < 2.0) {
          seg.powerUp.collected = true;
          seg.group.remove(seg.powerUp.group);
          this.activatePowerUp(seg.powerUp.type);
        }
      }
    }
  }

  private updateObstacleCollisions() {
    if (this.activePowerUps.has('SPEED_BOOST') || this.invulnerableTimer > 0) {
      return;
    }

    for (const seg of this.segments) {
      for (const obs of seg.obstacles) {
        if (obs.passed) continue;

        const worldZ = seg.segmentZ + obs.group.position.z;
        const deltaZ = worldZ - this.playerZ;

        if (deltaZ < -1.5) {
          obs.passed = true;
          continue;
        }

        if (Math.abs(deltaZ) < 1.05) {
          const obsX = obs.lane * 2.5;
          const lateralDist = Math.abs(this.playerX - obsX);

          if (lateralDist < 1.05) {
            let collisionHit = false;

            if (obs.type === 'HURDLE_LOW') {
              if (this.playerY < 0.65) {
                collisionHit = true;
              }
            } else if (obs.type === 'ARCH_HIGH') {
              if (!this.isSliding || this.playerY > 0.85) {
                collisionHit = true;
              }
            } else {
              collisionHit = true;
            }

            if (collisionHit) {
              obs.passed = true;
              this.handlePlayerCollision();
              return;
            }
          }
        }
      }
    }
  }

  private handlePlayerCollision() {
    if (this.activePowerUps.has('SHIELD')) {
      this.activePowerUps.delete('SHIELD');
      this.playerInstance.setShieldActive(false);
      this.invulnerableTimer = 1.2;
      this.syncPowerUps();
      SoundEffects.playShieldBreak();
      return;
    }

    SoundEffects.playCrash();
    SoundEffects.stopJungleAmbient();
    this.setGameState('GAME_OVER');

    const isNewHighScore = this.runScore > this.bestScore;
    const isNewBestDistance = this.runDistance > this.bestDistance;

    if (isNewHighScore) this.bestScore = this.runScore;
    if (isNewBestDistance) this.bestDistance = this.runDistance;

    const summary: RunSummary = {
      score: this.runScore,
      distance: this.runDistance,
      coins: this.runCoins,
      isNewHighScore,
      isNewBestDistance,
    };

    this.callbacks.onGameOver(summary);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.clearCountdownTimer();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    SoundEffects.stopJungleAmbient();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
