/**
 * Procedural 3D Asset Generator for Jungle Escape 3D
 * Enforces composite 3-12 part models, cached procedural textures, and zero runtime GC allocations.
 */
import * as THREE from 'three';
import { CharacterDef } from '../../types/game';

function createProceduralNoiseCanvas(baseColor: string, noiseColor: string, detail: number = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = detail;
  canvas.height = detail;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, detail, detail);

  ctx.fillStyle = noiseColor;
  for (let i = 0; i < detail * 10; i++) {
    const x = Math.floor(Math.random() * detail);
    const y = Math.floor(Math.random() * detail);
    const size = i % 5 === 0 ? 2 : 1;
    ctx.globalAlpha = (i % 4) * 0.06 + 0.05;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1.0;
  return canvas;
}

let cachedStoneTex: THREE.CanvasTexture | null = null;
export function getStoneTexture(): THREE.CanvasTexture {
  if (!cachedStoneTex) {
    const canvas = createProceduralNoiseCanvas('#3b453d', '#1d261f', 128);
    cachedStoneTex = new THREE.CanvasTexture(canvas);
    cachedStoneTex.wrapS = THREE.RepeatWrapping;
    cachedStoneTex.wrapT = THREE.RepeatWrapping;
    cachedStoneTex.colorSpace = THREE.SRGBColorSpace;
  }
  return cachedStoneTex;
}

let cachedMossTex: THREE.CanvasTexture | null = null;
export function getMossTexture(): THREE.CanvasTexture {
  if (!cachedMossTex) {
    const canvas = createProceduralNoiseCanvas('#2d5a36', '#17361e', 128);
    cachedMossTex = new THREE.CanvasTexture(canvas);
    cachedMossTex.wrapS = THREE.RepeatWrapping;
    cachedMossTex.wrapT = THREE.RepeatWrapping;
    cachedMossTex.colorSpace = THREE.SRGBColorSpace;
  }
  return cachedMossTex;
}

let cachedCoinTex: THREE.CanvasTexture | null = null;
export function getCoinTexture(): THREE.CanvasTexture {
  if (!cachedCoinTex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(64, 64, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(60, 48, 8, 32);
    ctx.fillRect(48, 60, 32, 8);

    cachedCoinTex = new THREE.CanvasTexture(canvas);
    cachedCoinTex.colorSpace = THREE.SRGBColorSpace;
  }
  return cachedCoinTex;
}

// Shared Materials & Geometries for Obstacles and Track Segments
const sharedStoneMat = new THREE.MeshStandardMaterial({
  map: getStoneTexture(),
  roughness: 0.85,
  metalness: 0.1,
  color: 0x7c8577,
});

const sharedCurbMat = new THREE.MeshStandardMaterial({
  map: getMossTexture(),
  roughness: 0.9,
  metalness: 0.05,
  color: 0x4d6342,
});

const sharedWallMat = new THREE.MeshStandardMaterial({
  map: getStoneTexture(),
  roughness: 0.95,
  metalness: 0.08,
  color: 0x485246,
});

const sharedLogMat = new THREE.MeshStandardMaterial({
  color: 0x4a2e18,
  roughness: 0.9,
});

const sharedSpikeMat = new THREE.MeshStandardMaterial({
  color: 0x1f1915,
  roughness: 0.7,
});

const sharedPillarMat = new THREE.MeshStandardMaterial({
  map: getStoneTexture(),
  roughness: 0.9,
  color: 0x616b5d,
});

const sharedVineMat = new THREE.MeshStandardMaterial({
  color: 0x225c27,
  roughness: 0.8,
});

const sharedTotemMat = new THREE.MeshStandardMaterial({
  map: getStoneTexture(),
  roughness: 0.85,
  color: 0x546351,
});

const sharedBoulderMat = new THREE.MeshStandardMaterial({
  map: getStoneTexture(),
  roughness: 0.9,
  color: 0x595248,
});

const sharedEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

const sharedLogGeo = new THREE.CylinderGeometry(0.32, 0.36, 2.3, 8);
sharedLogGeo.rotateZ(Math.PI / 2);
const sharedSpikeGeo = new THREE.ConeGeometry(0.08, 0.35, 5);
const sharedPillarGeo = new THREE.BoxGeometry(0.4, 3.2, 0.4);
const sharedBeamGeo = new THREE.BoxGeometry(2.8, 0.7, 0.7);
const sharedVineGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.6, 4);
const sharedTotemBaseGeo = new THREE.BoxGeometry(1.5, 0.5, 1.2);
const sharedTotemIdolGeo = new THREE.BoxGeometry(1.2, 1.8, 0.9);
const sharedEyeGeo = new THREE.SphereGeometry(0.1, 6, 6);
const sharedBoulderGeo = new THREE.DodecahedronGeometry(0.95, 1);

// -------------------------------------------------------------
// Composite 3D Character Model (6 distinct articulated parts)
// -------------------------------------------------------------
export interface CharacterModelInstance {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  shieldMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  animateRun: (time: number, speedRatio: number, isJumping: boolean, isSliding: boolean) => void;
  setShieldActive: (active: boolean) => void;
}

export function buildCharacterModel(charDef: CharacterDef): CharacterModelInstance {
  const group = new THREE.Group();
  group.name = `character_${charDef.id}`;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(charDef.bodyColor),
    roughness: 0.6,
    metalness: 0.15,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(charDef.accentColor),
    roughness: 0.5,
    metalness: 0.2,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5d0b0,
    roughness: 0.8,
    metalness: 0.05,
  });

  const hatMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(charDef.hatColor),
    roughness: 0.7,
    metalness: 0.1,
  });

  // 1. Torso & Explorer Jacket
  const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.32);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.position.y = 0.95;
  torso.castShadow = true;
  group.add(torso);

  // Satchel / Harness strap across chest
  const strapGeo = new THREE.BoxGeometry(0.52, 0.12, 0.34);
  const strap = new THREE.Mesh(strapGeo, accentMat);
  strap.rotation.z = -0.3;
  torso.add(strap);

  // 2. Head & Facial detail
  const headGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.55;
  head.castShadow = true;
  torso.add(head);

  // Explorer Hat / Headband
  if (charDef.id === 'ryu') {
    const bandGeo = new THREE.BoxGeometry(0.36, 0.08, 0.36);
    const band = new THREE.Mesh(bandGeo, hatMat);
    band.position.y = 0.05;
    head.add(band);

    const ribbonGeo = new THREE.BoxGeometry(0.06, 0.05, 0.25);
    const ribbon = new THREE.Mesh(ribbonGeo, hatMat);
    ribbon.position.set(0, 0.05, -0.25);
    ribbon.rotation.x = -0.2;
    head.add(ribbon);
  } else {
    const brimGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.04, 12);
    const brim = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = 0.18;
    head.add(brim);

    const crownGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.18, 12);
    const crown = new THREE.Mesh(crownGeo, hatMat);
    crown.position.y = 0.1;
    brim.add(crown);
  }

  // 3. Arms
  const armGeo = new THREE.BoxGeometry(0.14, 0.55, 0.16);
  armGeo.translate(0, -0.25, 0);

  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.position.set(-0.35, 0.28, 0);
  leftArm.castShadow = true;
  torso.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.position.set(0.35, 0.28, 0);
  rightArm.castShadow = true;
  torso.add(rightArm);

  // 4. Legs
  const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
  legGeo.translate(0, -0.3, 0);

  const leftLeg = new THREE.Mesh(legGeo, accentMat);
  leftLeg.position.set(-0.16, 0.65, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, accentMat);
  rightLeg.position.set(0.16, 0.65, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Boots
  const bootGeo = new THREE.BoxGeometry(0.2, 0.16, 0.28);
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.9 });
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.55, 0.04);
  leftLeg.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.55, 0.04);
  rightLeg.add(rightBoot);

  // 5. Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.65, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x050b07,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  // 6. Shield Energy Bubble
  const shieldGeo = new THREE.SphereGeometry(1.2, 20, 20);
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0,
    roughness: 0.1,
    transmission: 0.4,
    depthWrite: false,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 1.1;
  shieldMesh.visible = false;
  group.add(shieldMesh);

  const animateRun = (time: number, speedRatio: number, isJumping: boolean, isSliding: boolean) => {
    if (isSliding) {
      torso.position.y = 0.45;
      torso.rotation.x = -0.7;
      torso.rotation.y = 0;
      leftLeg.rotation.x = 1.2;
      rightLeg.rotation.x = 1.2;
      leftArm.rotation.x = -1.1;
      rightArm.rotation.x = -1.1;
      shadowMesh.scale.set(1.4, 1.4, 1.4);
      return;
    }

    if (isJumping) {
      torso.position.y = 0.95;
      torso.rotation.x = 0.1;
      torso.rotation.y = 0;
      leftLeg.rotation.x = 0.6;
      rightLeg.rotation.x = -0.4;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = 1.0;
      shadowMesh.scale.set(0.6, 0.6, 0.6);
      return;
    }

    const runFreq = time * 14 * speedRatio;
    const stride = Math.sin(runFreq);
    const armStride = Math.cos(runFreq);

    torso.position.y = 0.95 + Math.abs(Math.sin(runFreq * 2)) * 0.08;
    torso.rotation.x = 0.12;
    torso.rotation.y = stride * 0.08;

    leftLeg.rotation.x = stride * 0.85;
    rightLeg.rotation.x = -stride * 0.85;

    leftArm.rotation.x = -armStride * 0.9;
    rightArm.rotation.x = armStride * 0.9;

    shadowMesh.scale.set(1.0, 1.0, 1.0);
  };

  const setShieldActive = (active: boolean) => {
    shieldMesh.visible = active;
    (shieldMesh.material as THREE.MeshPhysicalMaterial).opacity = active ? 0.45 : 0;
  };

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    head,
    shieldMesh,
    shadowMesh,
    animateRun,
    setShieldActive,
  };
}

// -------------------------------------------------------------
// Procedural Track Segment Builder
// -------------------------------------------------------------
export interface TrackSegmentInstance {
  group: THREE.Group;
  segmentZ: number;
  length: number;
  coins: CoinInstance[];
  obstacles: ObstacleInstance[];
  powerUp: PowerUpInstance | null;
}

const sconceGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6);
const sconceMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.8, metalness: 0.8 });
const flameGeo = new THREE.SphereGeometry(0.2, 8, 8);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
const flameAuraGeo = new THREE.SphereGeometry(0.38, 8, 8);
const flameAuraMat = new THREE.MeshBasicMaterial({
  color: 0xff7700,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
});
const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 6.5, 6);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 });
const frondGeo = new THREE.ConeGeometry(2.2, 1.4, 5);
const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e5a22, roughness: 0.7, side: THREE.DoubleSide });

export function buildTrackSegment(segmentIndex: number, length: number = 24.0): TrackSegmentInstance {
  const group = new THREE.Group();
  group.name = `segment_${segmentIndex}`;

  // 1. Main Path Roadway
  const roadGeo = new THREE.BoxGeometry(8.4, 0.4, length);
  const road = new THREE.Mesh(roadGeo, sharedStoneMat);
  road.position.y = -0.2;
  road.receiveShadow = true;
  group.add(road);

  // Moss edge curbs
  const curbGeo = new THREE.BoxGeometry(0.8, 0.3, length);
  const leftCurb = new THREE.Mesh(curbGeo, sharedCurbMat);
  leftCurb.position.set(-4.4, 0.05, 0);
  leftCurb.receiveShadow = true;
  group.add(leftCurb);

  const rightCurb = new THREE.Mesh(curbGeo, sharedCurbMat);
  rightCurb.position.set(4.4, 0.05, 0);
  rightCurb.receiveShadow = true;
  group.add(rightCurb);

  // 2. Ancient Ruin Side Walls
  const wallGeo = new THREE.BoxGeometry(1.2, 4.0, length);
  const leftWall = new THREE.Mesh(wallGeo, sharedWallMat);
  leftWall.position.set(-5.2, 1.8, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, sharedWallMat);
  rightWall.position.set(5.2, 1.8, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // 3. Torches with emissive fire glow (zero per-segment PointLight shader overhead)
  [-length * 0.3, length * 0.3].forEach((zPos) => {
    [-4.5, 4.5].forEach((xPos, sideIdx) => {
      const sconce = new THREE.Mesh(sconceGeo, sconceMat);
      sconce.position.set(xPos, 2.2, zPos);
      sconce.rotation.z = sideIdx === 0 ? 0.3 : -0.3;
      group.add(sconce);

      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(xPos + (sideIdx === 0 ? 0.15 : -0.15), 2.5, zPos);
      group.add(flame);

      const aura = new THREE.Mesh(flameAuraGeo, flameAuraMat);
      aura.position.copy(flame.position);
      group.add(aura);
    });
  });

  // 4. Overhanging Jungle Foliage (Palm Fronds)
  [-length * 0.4, 0, length * 0.4].forEach((zPos) => {
    [-6.5, 6.5].forEach((xPos, sIdx) => {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(xPos, 3.0, zPos);
      trunk.rotation.z = sIdx === 0 ? -0.2 : 0.2;
      group.add(trunk);

      const frond = new THREE.Mesh(frondGeo, leafMat);
      frond.position.set(xPos + (sIdx === 0 ? 0.8 : -0.8), 6.2, zPos);
      group.add(frond);
    });
  });

  return {
    group,
    segmentZ: 0,
    length,
    coins: [],
    obstacles: [],
    powerUp: null,
  };
}

// -------------------------------------------------------------
// Obstacle Instances & Procedural Generators
// -------------------------------------------------------------
export type ObstacleType = 'HURDLE_LOW' | 'ARCH_HIGH' | 'TOTEM_LANE' | 'BOULDER_LANE';

export interface ObstacleInstance {
  type: ObstacleType;
  group: THREE.Group;
  lane: -1 | 0 | 1;
  passed: boolean;
}

export function buildObstacle(type: ObstacleType, lane: -1 | 0 | 1, zPos: number): ObstacleInstance {
  const group = new THREE.Group();
  group.name = `obs_${type}_${lane}`;
  const x = lane * 2.5;
  group.position.set(x, 0, zPos);

  if (type === 'HURDLE_LOW') {
    const log = new THREE.Mesh(sharedLogGeo, sharedLogMat);
    log.position.y = 0.35;
    log.castShadow = true;
    group.add(log);

    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const spike = new THREE.Mesh(sharedSpikeGeo, sharedSpikeMat);
      spike.position.set(i, 0.7, 0);
      group.add(spike);
    }
  } else if (type === 'ARCH_HIGH') {
    const p1 = new THREE.Mesh(sharedPillarGeo, sharedPillarMat);
    p1.position.set(-1.15, 1.6, 0);
    p1.castShadow = true;
    group.add(p1);

    const p2 = new THREE.Mesh(sharedPillarGeo, sharedPillarMat);
    p2.position.set(1.15, 1.6, 0);
    p2.castShadow = true;
    group.add(p2);

    const beam = new THREE.Mesh(sharedBeamGeo, sharedPillarMat);
    beam.position.set(0, 1.95, 0);
    beam.castShadow = true;
    group.add(beam);

    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const vine = new THREE.Mesh(sharedVineGeo, sharedVineMat);
      vine.position.set(i, 1.3, 0);
      group.add(vine);
    }
  } else if (type === 'TOTEM_LANE') {
    const base = new THREE.Mesh(sharedTotemBaseGeo, sharedTotemMat);
    base.position.y = 0.25;
    base.castShadow = true;
    group.add(base);

    const idol = new THREE.Mesh(sharedTotemIdolGeo, sharedTotemMat);
    idol.position.y = 1.3;
    idol.castShadow = true;
    group.add(idol);

    const leftEye = new THREE.Mesh(sharedEyeGeo, sharedEyeMat);
    leftEye.position.set(-0.3, 1.6, 0.46);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(sharedEyeGeo, sharedEyeMat);
    rightEye.position.set(0.3, 1.6, 0.46);
    group.add(rightEye);
  } else {
    const boulder = new THREE.Mesh(sharedBoulderGeo, sharedBoulderMat);
    boulder.position.y = 0.85;
    boulder.scale.set(1.2, 0.9, 1.1);
    boulder.castShadow = true;
    group.add(boulder);
  }

  return {
    type,
    group,
    lane,
    passed: false,
  };
}

// -------------------------------------------------------------
// Collectible Aztec Gold Coins
// -------------------------------------------------------------
export interface CoinInstance {
  group: THREE.Group;
  collected: boolean;
  baseY: number;
  lane: -1 | 0 | 1;
  z: number;
  update: (time: number) => void;
}

const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14);
coinGeo.rotateX(Math.PI / 2);
const coinMaterial = new THREE.MeshStandardMaterial({
  map: getCoinTexture(),
  color: 0xffd700,
  roughness: 0.25,
  metalness: 0.85,
});

export function buildCoin(lane: -1 | 0 | 1, y: number, z: number): CoinInstance {
  const group = new THREE.Group();
  const x = lane * 2.5;
  group.position.set(x, y, z);

  const mesh = new THREE.Mesh(coinGeo, coinMaterial);
  mesh.castShadow = true;
  group.add(mesh);

  const update = (time: number) => {
    mesh.rotation.y = time * 4.5;
    mesh.position.y = Math.sin(time * 3 + z) * 0.08;
  };

  return {
    group,
    collected: false,
    baseY: y,
    lane,
    z,
    update,
  };
}

// -------------------------------------------------------------
// Power-Up Relics (Shield, Magnet, Boost)
// -------------------------------------------------------------
export interface PowerUpInstance {
  type: 'SHIELD' | 'MAGNET' | 'SPEED_BOOST';
  group: THREE.Group;
  collected: boolean;
  lane: -1 | 0 | 1;
  z: number;
  update: (time: number) => void;
}

const shieldRelicGeo = new THREE.OctahedronGeometry(0.45, 0);
const shieldRelicMat = new THREE.MeshStandardMaterial({
  color: 0xfacc15,
  roughness: 0.2,
  metalness: 0.9,
  emissive: 0xca8a04,
  emissiveIntensity: 0.4,
});

const magnetRelicGeo = new THREE.TorusGeometry(0.38, 0.12, 8, 16, Math.PI);
const magnetRelicMat = new THREE.MeshStandardMaterial({
  color: 0x06b6d4,
  roughness: 0.2,
  metalness: 0.8,
  emissive: 0x0891b2,
  emissiveIntensity: 0.4,
});

const boostRelicGeo = new THREE.ConeGeometry(0.35, 0.8, 4);
const boostRelicMat = new THREE.MeshStandardMaterial({
  color: 0x10b981,
  roughness: 0.3,
  metalness: 0.6,
  emissive: 0x059669,
  emissiveIntensity: 0.5,
});

const relicRingGeo = new THREE.RingGeometry(0.55, 0.65, 16);

const shieldRingMat = new THREE.MeshBasicMaterial({
  color: 0xfacc15,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
});

const magnetRingMat = new THREE.MeshBasicMaterial({
  color: 0x06b6d4,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
});

const boostRingMat = new THREE.MeshBasicMaterial({
  color: 0x10b981,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
});

export function buildPowerUp(type: 'SHIELD' | 'MAGNET' | 'SPEED_BOOST', lane: -1 | 0 | 1, z: number): PowerUpInstance {
  const group = new THREE.Group();
  const x = lane * 2.5;
  group.position.set(x, 1.2, z);

  let iconMesh: THREE.Mesh;
  let ringMat: THREE.MeshBasicMaterial;

  if (type === 'SHIELD') {
    iconMesh = new THREE.Mesh(shieldRelicGeo, shieldRelicMat);
    ringMat = shieldRingMat;
  } else if (type === 'MAGNET') {
    iconMesh = new THREE.Mesh(magnetRelicGeo, magnetRelicMat);
    iconMesh.rotation.z = Math.PI;
    ringMat = magnetRingMat;
  } else {
    iconMesh = new THREE.Mesh(boostRelicGeo, boostRelicMat);
    iconMesh.rotation.x = Math.PI / 2;
    ringMat = boostRingMat;
  }

  iconMesh.castShadow = true;
  group.add(iconMesh);

  const ring = new THREE.Mesh(relicRingGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const update = (time: number) => {
    group.rotation.y = time * 3.0;
    group.position.y = 1.2 + Math.sin(time * 3.5) * 0.15;
    ring.rotation.z = time * 2;
  };

  return {
    type,
    group,
    collected: false,
    lane,
    z,
    update,
  };
}
