import * as THREE from 'three';
import { FaceName, Move, ColorTheme } from '../types/cube';
import { THEMES } from '../utils/stats';

export interface DragEventDetail {
  clientX: number;
  clientY: number;
}

export type MoveCallback = (move: Move, isSolved: boolean) => void;

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  intersectedCubie: THREE.Mesh | null;
  hitNormal: THREE.Vector3 | null;
  hitPoint: THREE.Vector3 | null;
  handled: boolean;
  isBackgroundDrag: boolean;
  pointerId: number;
}

export class RubikEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cubeGroup: THREE.Group;
  private cubies: THREE.Mesh[] = [];

  // Theme & Appearance
  private theme: ColorTheme = THEMES.classic;
  private showFaceLabels: boolean = false;
  private moveSpeedMs: number = 170;

  // Materials & Textures
  private materialsCache: Map<string, THREE.Material[]> = new Map();
  private coreMaterial: THREE.MeshStandardMaterial;

  // Animation & Move Queue
  private moveQueue: Move[] = [];
  private isAnimating: boolean = false;
  private animationProgress: number = 0;
  private currentRotatingMove: Move | null = null;
  private activePivot: THREE.Group | null = null;
  private rotatingCubies: THREE.Mesh[] = [];
  private targetRotationAngle: number = 0;
  private animationDuration: number = 0.17; // seconds
  private lastFrameTime: number = performance.now();

  // Orbit / Camera state (Free 3D Trackball - Zero Gimbal Lock, Zero Limits)
  private viewDistance: number = 9.4;
  private targetDistance: number = 9.4;
  private cameraOrientation = new THREE.Quaternion();
  private targetOrientation = new THREE.Quaternion();
  private shadowMesh: THREE.Mesh | null = null;

  private isDraggingView: boolean = false;
  private activeTouch: TouchState | null = null;
  private secondTouch: { id: number; x: number; y: number } | null = null;
  private initialPinchDist: number = 0;
  private initialPinchRadius: number = 9.4;

  // Raycaster
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();

  // Callbacks
  public onMoveFinished: MoveCallback | null = null;
  public onFirstMoveStart: (() => void) | null = null;
  public onMoveStep: ((move: Move, remaining: number) => void) | null = null;
  public onQueueEmpty: (() => void) | null = null;
  public isProgrammatic: boolean = false;

  // Interaction mode toggle: 'slice' or 'orbit'
  public interactionMode: 'slice' | 'orbit' = 'slice';
  public sensitivityMultiplier: number = 1.0;

  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 480;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.resetCameraView();
    this.cameraOrientation.copy(this.targetOrientation);
    this.updateCameraPosition();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();
    this.createContactShadow();

    // 5. Materials
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.theme.colors.core),
      roughness: 0.8,
      metalness: 0.1,
    });

    // 6. Cube Structure
    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);
    this.buildCube();

    // 7. Event Listeners
    this.bindEvents();

    // 8. Render loop
    this.lastFrameTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting() {
    // Ambient light - pure neutral white, higher intensity for bright vibrant colors
    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    this.scene.add(ambient);

    // Key directional light - crisp bright top-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(6, 12, 8);
    this.scene.add(keyLight);

    // Secondary fill light from opposite angle - neutral pure white
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.65);
    fillLight.position.set(-6, -7, -6);
    this.scene.add(fillLight);

    // Rim light from bottom-left for edge depth
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
    rimLight.position.set(-8, 5, -6);
    this.scene.add(rimLight);
  }

  private createContactShadow() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(5.6, 5.6);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.shadowMesh);
  }

  /**
   * Generates a canvas texture with a rounded-rectangle sticker tile.
   * Features distinct rounded corners and vibrant glossy highlights.
   */
  private createStickerTexture(colorHex: string, label: string = ''): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Plastic base border (clean dark seam between cubies)
    ctx.fillStyle = this.theme.colors.border;
    ctx.fillRect(0, 0, size, size);

    // Rounded sticker tile with noticeably rounded corners as requested
    const pad = 24;
    const radius = 64; // Beautiful rounded squircle corners
    const w = size - pad * 2;
    const h = size - pad * 2;

    ctx.beginPath();
    ctx.roundRect(pad, pad, w, h, radius);
    ctx.fillStyle = colorHex;
    ctx.fill();

    // Vibrant, clean semi-gloss shine (no heavy dark mud at bottom!)
    const gradient = ctx.createLinearGradient(pad, pad, pad, pad + h);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
    gradient.addColorStop(0.22, 'rgba(255, 255, 255, 0.10)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.04)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w, h, radius);
    ctx.fill();

    // Subtle edge highlight for clean 3D realism
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Optional center face label (U, D, L, R, F, B)
    if (this.showFaceLabels && label) {
      ctx.fillStyle =
        colorHex === '#FFFFFF' || colorHex.toLowerCase() === '#f8fafc' || colorHex.toLowerCase().includes('ffd')
          ? 'rgba(0,0,0,0.6)'
          : 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 140px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, size / 2, size / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private getCubieMaterials(x: number, y: number, z: number): THREE.Material[] {
    // 0: +X (R), 1: -X (L), 2: +Y (U), 3: -Y (D), 4: +Z (F), 5: -Z (B)
    const materials: THREE.Material[] = [];

    const createMat = (isSticker: boolean, colorHex: string, label: string) => {
      if (!isSticker) {
        return this.coreMaterial;
      }
      const texture = this.createStickerTexture(colorHex, label);
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.22,
        metalness: 0.02,
      });
    };

    // +X (Right)
    const isCenterR = x === 1 && y === 0 && z === 0;
    materials.push(createMat(x === 1, this.theme.colors.R, isCenterR ? 'R' : ''));

    // -X (Left)
    const isCenterL = x === -1 && y === 0 && z === 0;
    materials.push(createMat(x === -1, this.theme.colors.L, isCenterL ? 'L' : ''));

    // +Y (Up)
    const isCenterU = x === 0 && y === 1 && z === 0;
    materials.push(createMat(y === 1, this.theme.colors.U, isCenterU ? 'U' : ''));

    // -Y (Down)
    const isCenterD = x === 0 && y === -1 && z === 0;
    materials.push(createMat(y === -1, this.theme.colors.D, isCenterD ? 'D' : ''));

    // +Z (Front)
    const isCenterF = x === 0 && y === 0 && z === 1;
    materials.push(createMat(z === 1, this.theme.colors.F, isCenterF ? 'F' : ''));

    // -Z (Back)
    const isCenterB = x === 0 && y === 0 && z === -1;
    materials.push(createMat(z === -1, this.theme.colors.B, isCenterB ? 'B' : ''));

    return materials;
  }

  private buildCube() {
    // Clear any previous cubies
    while (this.cubies.length > 0) {
      const c = this.cubies.pop()!;
      this.cubeGroup.remove(c);
      c.geometry.dispose();
    }

    const cubieSize = 0.96;
    const spacing = 1.0;
    const geometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip internal hidden core (0,0,0)
          if (x === 0 && y === 0 && z === 0) continue;

          const materials = this.getCubieMaterials(x, y, z);
          const cubie = new THREE.Mesh(geometry, materials);
          cubie.position.set(x * spacing, y * spacing, z * spacing);
          cubie.userData = {
            initialPos: new THREE.Vector3(x, y, z),
            currentGrid: new THREE.Vector3(x, y, z),
          };

          this.cubies.push(cubie);
          this.cubeGroup.add(cubie);
        }
      }
    }
  }

  public setTheme(theme: ColorTheme, showLabels?: boolean) {
    this.theme = theme;
    if (showLabels !== undefined) this.showFaceLabels = showLabels;
    this.coreMaterial.color.set(this.theme.colors.core);
    this.buildCube();
  }

  public setMoveSpeed(ms: number) {
    this.moveSpeedMs = Math.max(80, Math.min(500, ms));
    this.animationDuration = this.moveSpeedMs / 1000;
  }

  public setShowFaceLabels(show: boolean) {
    this.showFaceLabels = show;
    this.buildCube();
  }

  // --- Rotations & Moves Execution ---

  public executeMove(move: Move, instant: boolean = false) {
    if (instant) {
      this.applyMoveInstant(move);
      return;
    }

    this.moveQueue.push(move);
    if (!this.isAnimating) {
      this.processNextMove();
    }
  }

  private processNextMove() {
    if (this.moveQueue.length === 0) {
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;
    const move = this.moveQueue.shift()!;
    this.currentRotatingMove = move;
    this.animationProgress = 0;

    // Notify first move start if timer is idle (only for real slice turns, not whole cube rotation, and not programmatic)
    if (!move.isWholeCube && this.onFirstMoveStart && !this.isProgrammatic) {
      this.onFirstMoveStart();
    }

    // Determine target slice cubies and rotation axis
    const { axis, layer, angle } = this.getMoveParams(move);
    this.targetRotationAngle = angle;

    // Create temporary pivot group
    this.activePivot = new THREE.Group();
    this.scene.add(this.activePivot);
    this.rotatingCubies = [];

    // Find all cubies in this slice layer (or all cubies if layer === 999)
    for (const cubie of this.cubies) {
      const grid = this.getCubieGridPosition(cubie);
      let inSlice = false;
      if (layer === 999) inSlice = true;
      else if (axis === 'x' && Math.round(grid.x) === layer) inSlice = true;
      else if (axis === 'y' && Math.round(grid.y) === layer) inSlice = true;
      else if (axis === 'z' && Math.round(grid.z) === layer) inSlice = true;

      if (inSlice) {
        this.activePivot.attach(cubie);
        this.rotatingCubies.push(cubie);
      }
    }
  }

  public getMoveParams(move: Move): { axis: 'x' | 'y' | 'z'; layer: number; angle: number } {
    if (move.isWholeCube) {
      const wholeAxis = move.wholeAxis || (move.face === 'R' ? 'x' : move.face === 'U' ? 'y' : 'z');
      const baseAngle = -Math.PI / 2;
      let multiplier = 1;
      if (move.direction === -1) multiplier = -1;
      else if (move.direction === 2) multiplier = 2;
      return { axis: wholeAxis, layer: 999, angle: baseAngle * multiplier };
    }

    let axis: 'x' | 'y' | 'z' = 'y';
    let layer = 0;
    let baseAngle = -Math.PI / 2; // standard clockwise for Right-Hand rule orientation

    switch (move.face) {
      case 'R':
        axis = 'x';
        layer = 1;
        baseAngle = -Math.PI / 2;
        break;
      case 'L':
        axis = 'x';
        layer = -1;
        baseAngle = Math.PI / 2;
        break;
      case 'U':
        axis = 'y';
        layer = 1;
        baseAngle = -Math.PI / 2;
        break;
      case 'D':
        axis = 'y';
        layer = -1;
        baseAngle = Math.PI / 2;
        break;
      case 'F':
        axis = 'z';
        layer = 1;
        baseAngle = -Math.PI / 2;
        break;
      case 'B':
        axis = 'z';
        layer = -1;
        baseAngle = Math.PI / 2;
        break;
    }

    let multiplier = 1;
    if (move.direction === -1) multiplier = -1;
    else if (move.direction === 2) multiplier = 2;

    return { axis, layer, angle: baseAngle * multiplier };
  }

  public rotateCubeWhole(axis: 'x' | 'y' | 'z', dir: 1 | -1 | 2, instant: boolean = false) {
    const faceMap: Record<'x' | 'y' | 'z', FaceName> = { x: 'R', y: 'U', z: 'F' };
    const suffix = dir === 2 ? '2' : dir === -1 ? "'" : '';
    const notation = `${axis}${suffix}`;
    const move: Move = {
      face: faceMap[axis],
      direction: dir,
      notation,
      isWholeCube: true,
      wholeAxis: axis,
    };
    this.executeMove(move, instant);
  }

  private applyMoveInstant(move: Move) {
    const { axis, layer, angle } = this.getMoveParams(move);
    const pivot = new THREE.Group();
    this.scene.add(pivot);

    for (const cubie of this.cubies) {
      const grid = this.getCubieGridPosition(cubie);
      let inSlice = false;
      if (layer === 999) inSlice = true;
      else if (axis === 'x' && Math.round(grid.x) === layer) inSlice = true;
      else if (axis === 'y' && Math.round(grid.y) === layer) inSlice = true;
      else if (axis === 'z' && Math.round(grid.z) === layer) inSlice = true;

      if (inSlice) {
        pivot.attach(cubie);
      }
    }

    if (axis === 'x') pivot.rotation.x = angle;
    else if (axis === 'y') pivot.rotation.y = angle;
    else if (axis === 'z') pivot.rotation.z = angle;

    pivot.updateMatrixWorld(true);

    const children = [...pivot.children];
    for (const child of children) {
      this.cubeGroup.attach(child);
      this.snapCubie(child as THREE.Mesh);
    }

    this.scene.remove(pivot);
  }

  private snapCubie(cubie: THREE.Mesh) {
    // Snap position to exact integer coordinates
    cubie.position.x = Math.round(cubie.position.x);
    cubie.position.y = Math.round(cubie.position.y);
    cubie.position.z = Math.round(cubie.position.z);

    // Snap Euler rotation to exact multiples of PI/2
    const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
    const halfPi = Math.PI / 2;
    euler.x = Math.round(euler.x / halfPi) * halfPi;
    euler.y = Math.round(euler.y / halfPi) * halfPi;
    euler.z = Math.round(euler.z / halfPi) * halfPi;
    cubie.quaternion.setFromEuler(euler);
    cubie.updateMatrixWorld(true);
  }

  private finishCurrentRotation() {
    if (!this.activePivot || !this.currentRotatingMove) return;

    // Apply exact final rotation
    const { axis } = this.getMoveParams(this.currentRotatingMove);
    if (axis === 'x') this.activePivot.rotation.x = this.targetRotationAngle;
    else if (axis === 'y') this.activePivot.rotation.y = this.targetRotationAngle;
    else if (axis === 'z') this.activePivot.rotation.z = this.targetRotationAngle;

    this.activePivot.updateMatrixWorld(true);

    // Reattach cubies to cubeGroup and snap
    for (const cubie of this.rotatingCubies) {
      this.cubeGroup.attach(cubie);
      this.snapCubie(cubie);
    }

    this.scene.remove(this.activePivot);
    this.activePivot = null;
    this.rotatingCubies = [];

    const finishedMove = this.currentRotatingMove;
    this.currentRotatingMove = null;
    this.isAnimating = false;

    // Check if cube is solved
    const solved = this.checkIsSolved();

    if (this.onMoveFinished) {
      this.onMoveFinished(finishedMove, solved);
    }

    if (this.onMoveStep) {
      this.onMoveStep(finishedMove, this.moveQueue.length);
    }

    // Process next queued move if any
    if (this.moveQueue.length > 0) {
      this.processNextMove();
    } else if (this.onQueueEmpty) {
      this.onQueueEmpty();
    }
  }

  public getCubieGridPosition(cubie: THREE.Mesh): THREE.Vector3 {
    const worldPos = new THREE.Vector3();
    cubie.getWorldPosition(worldPos);
    return new THREE.Vector3(
      Math.round(worldPos.x),
      Math.round(worldPos.y),
      Math.round(worldPos.z)
    );
  }

  /**
   * Check if all 9 stickers on every face have identical colors.
   */
  public checkIsSolved(): boolean {
    const faces: { dir: THREE.Vector3; name: FaceName; matIndex: number }[] = [
      { dir: new THREE.Vector3(1, 0, 0), name: 'R', matIndex: 0 },
      { dir: new THREE.Vector3(-1, 0, 0), name: 'L', matIndex: 1 },
      { dir: new THREE.Vector3(0, 1, 0), name: 'U', matIndex: 2 },
      { dir: new THREE.Vector3(0, -1, 0), name: 'D', matIndex: 3 },
      { dir: new THREE.Vector3(0, 0, 1), name: 'F', matIndex: 4 },
      { dir: new THREE.Vector3(0, 0, -1), name: 'B', matIndex: 5 },
    ];

    for (const face of faces) {
      let faceMaterialIdx: number | null = null;
      let count = 0;

      for (const cubie of this.cubies) {
        const grid = this.getCubieGridPosition(cubie);

        // Check if this cubie is on this face
        const onFace =
          (face.dir.x !== 0 && Math.round(grid.x) === face.dir.x) ||
          (face.dir.y !== 0 && Math.round(grid.y) === face.dir.y) ||
          (face.dir.z !== 0 && Math.round(grid.z) === face.dir.z);

        if (!onFace) continue;
        count++;

        // Convert world face direction to cubie's local orientation
        const localDir = face.dir.clone().applyQuaternion(cubie.quaternion.clone().invert());

        // Find which cubie material index corresponds to this local direction
        let matIdx = 0;
        if (Math.round(localDir.x) === 1) matIdx = 0;
        else if (Math.round(localDir.x) === -1) matIdx = 1;
        else if (Math.round(localDir.y) === 1) matIdx = 2;
        else if (Math.round(localDir.y) === -1) matIdx = 3;
        else if (Math.round(localDir.z) === 1) matIdx = 4;
        else if (Math.round(localDir.z) === -1) matIdx = 5;

        if (faceMaterialIdx === null) {
          faceMaterialIdx = matIdx;
        } else if (faceMaterialIdx !== matIdx) {
          return false; // Mismatched sticker on this face!
        }
      }

      if (count !== 9) return false;
    }

    return true;
  }

  /**
   * Reads 3D cube stickers and constructs the exact 54-char Kociemba facelet string
   * formatted as U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9.
   */
  public getFaceletString(): string | null {
    // Centers define the reference color for each face
    const centerNormals: { face: FaceName; pos: [number, number, number] }[] = [
      { face: 'U', pos: [0, 1, 0] },
      { face: 'D', pos: [0, -1, 0] },
      { face: 'L', pos: [-1, 0, 0] },
      { face: 'R', pos: [1, 0, 0] },
      { face: 'F', pos: [0, 0, 1] },
      { face: 'B', pos: [0, 0, -1] },
    ];

    const getStickerMat = (x: number, y: number, z: number, normal: THREE.Vector3): number | null => {
      for (const cubie of this.cubies) {
        const grid = this.getCubieGridPosition(cubie);
        if (grid.x === x && grid.y === y && grid.z === z) {
          const localDir = normal.clone().applyQuaternion(cubie.quaternion.clone().invert());
          let matIdx = 0;
          if (Math.round(localDir.x) === 1) matIdx = 0; // R
          else if (Math.round(localDir.x) === -1) matIdx = 1; // L
          else if (Math.round(localDir.y) === 1) matIdx = 2; // U
          else if (Math.round(localDir.y) === -1) matIdx = 3; // D
          else if (Math.round(localDir.z) === 1) matIdx = 4; // F
          else if (Math.round(localDir.z) === -1) matIdx = 5; // B
          return matIdx;
        }
      }
      return null;
    };

    // Map each face to its center material index
    const matToFace = new Map<number, FaceName>();
    for (const cn of centerNormals) {
      const normal = new THREE.Vector3(...cn.pos);
      const mat = getStickerMat(cn.pos[0], cn.pos[1], cn.pos[2], normal);
      if (mat === null) return null;
      matToFace.set(mat, cn.face);
    }

    // Standard Kociemba 54 facelet coordinates: U, R, F, D, L, B
    const faceGroups: { face: FaceName; normal: THREE.Vector3; coords: [number, number, number][] }[] = [
      {
        face: 'U',
        normal: new THREE.Vector3(0, 1, 0),
        coords: [
          [-1, 1, -1], [0, 1, -1], [1, 1, -1],
          [-1, 1, 0],  [0, 1, 0],  [1, 1, 0],
          [-1, 1, 1],  [0, 1, 1],  [1, 1, 1],
        ],
      },
      {
        face: 'R',
        normal: new THREE.Vector3(1, 0, 0),
        coords: [
          [1, 1, 1],  [1, 1, 0],  [1, 1, -1],
          [1, 0, 1],  [1, 0, 0],  [1, 0, -1],
          [1, -1, 1], [1, -1, 0], [1, -1, -1],
        ],
      },
      {
        face: 'F',
        normal: new THREE.Vector3(0, 0, 1),
        coords: [
          [-1, 1, 1],  [0, 1, 1],  [1, 1, 1],
          [-1, 0, 1],  [0, 0, 1],  [1, 0, 1],
          [-1, -1, 1], [0, -1, 1], [1, -1, 1],
        ],
      },
      {
        face: 'D',
        normal: new THREE.Vector3(0, -1, 0),
        coords: [
          [-1, -1, 1],  [0, -1, 1],  [1, -1, 1],
          [-1, -1, 0],  [0, -1, 0],  [1, -1, 0],
          [-1, -1, -1], [0, -1, -1], [1, -1, -1],
        ],
      },
      {
        face: 'L',
        normal: new THREE.Vector3(-1, 0, 0),
        coords: [
          [-1, 1, -1],  [-1, 1, 0],  [-1, 1, 1],
          [-1, 0, -1],  [-1, 0, 0],  [-1, 0, 1],
          [-1, -1, -1], [-1, -1, 0], [-1, -1, 1],
        ],
      },
      {
        face: 'B',
        normal: new THREE.Vector3(0, 0, -1),
        coords: [
          [1, 1, -1],  [0, 1, -1],  [-1, 1, -1],
          [1, 0, -1],  [0, 0, -1],  [-1, 0, -1],
          [1, -1, -1], [0, -1, -1], [-1, -1, -1],
        ],
      },
    ];

    let result = '';
    for (const group of faceGroups) {
      for (const [x, y, z] of group.coords) {
        const mat = getStickerMat(x, y, z, group.normal);
        if (mat === null) return null;
        const faceChar = matToFace.get(mat);
        if (!faceChar) return null;
        result += faceChar;
      }
    }

    return result;
  }

  public clearQueue() {
    this.moveQueue = [];
  }

  public getQueueLength(): number {
    return this.moveQueue.length + (this.isAnimating ? 1 : 0);
  }

  public resetToSolved() {
    this.moveQueue = [];
    this.isAnimating = false;
    if (this.activePivot) {
      this.scene.remove(this.activePivot);
      this.activePivot = null;
    }
    this.buildCube();
  }

  // --- View Orbit & Gestures (Smart 3-Face Perspective Snapping) ---

  /**
   * Snaps the camera view to an optimal 3-face perspective (isometric/trimetric),
   * ensuring that 3 faces (Top/Bottom + 2 adjacent sides) are always clearly visible,
   * never settling on a single flat face.
   */
  public snapToMultiFaceView() {
    const camDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.targetOrientation).normalize();

    // Elevation (pitch): Maintain clear top or bottom face visibility (~30 degrees)
    const pitch = Math.asin(Math.max(-1, Math.min(1, camDir.y)));
    const targetPitch = pitch >= 0 ? 0.52 : -0.52;

    // Azimuth (yaw): Snap to 45°, 135°, 225°, or 315° where two side faces are equally visible
    const azimuth = Math.atan2(camDir.x, camDir.z);
    const base = Math.PI / 4;
    const step = Math.PI / 2;
    const targetAzimuth = Math.round((azimuth - base) / step) * step + base;

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAzimuth);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -targetPitch);
    this.targetOrientation.copy(qYaw).multiply(qPitch).normalize();
  }

  public resetCameraView(yellowOnTop: boolean = false) {
    this.targetDistance = 9.4;
    const targetPitch = yellowOnTop ? -0.52 : 0.52;
    const targetAzimuth = Math.PI / 4; // 45°: Top, Front, Right clearly visible

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAzimuth);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -targetPitch);
    this.targetOrientation.copy(qYaw).multiply(qPitch).normalize();
  }

  public flipCubeUpsideDown() {
    const camDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.targetOrientation).normalize();
    const pitch = Math.asin(Math.max(-1, Math.min(1, camDir.y)));
    const targetPitch = pitch >= 0 ? -0.52 : 0.52;

    const azimuth = Math.atan2(camDir.x, camDir.z);
    const base = Math.PI / 4;
    const step = Math.PI / 2;
    const targetAzimuth = Math.round((azimuth - base) / step) * step + base;

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAzimuth);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -targetPitch);
    this.targetOrientation.copy(qYaw).multiply(qPitch).normalize();
  }

  public rotateViewBy(deltaX: number, deltaY: number) {
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraOrientation);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.cameraOrientation);
    const rotY = new THREE.Quaternion().setFromAxisAngle(camUp, deltaX);
    const rotX = new THREE.Quaternion().setFromAxisAngle(camRight, deltaY);
    this.targetOrientation.premultiply(rotX).premultiply(rotY).normalize();
  }

  public rotateView90(dir: 1 | -1) {
    // Rotates horizontally by 90° from one 3-face view to the next 3-face view
    const camDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.targetOrientation).normalize();
    const pitch = Math.asin(Math.max(-1, Math.min(1, camDir.y)));
    const targetPitch = pitch >= 0 ? 0.52 : -0.52;

    const azimuth = Math.atan2(camDir.x, camDir.z);
    const base = Math.PI / 4;
    const step = Math.PI / 2;
    const currentSnappedAzimuth = Math.round((azimuth - base) / step) * step + base;
    const nextAzimuth = currentSnappedAzimuth + dir * (Math.PI / 2);

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), nextAzimuth);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -targetPitch);
    this.targetOrientation.copy(qYaw).multiply(qPitch).normalize();
  }

  public tiltView90(dir: 1 | -1) {
    // Toggles between viewing from above (+30°) and viewing from below (-30°)
    const camDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.targetOrientation).normalize();
    const azimuth = Math.atan2(camDir.x, camDir.z);
    const base = Math.PI / 4;
    const step = Math.PI / 2;
    const targetAzimuth = Math.round((azimuth - base) / step) * step + base;

    const targetPitch = dir > 0 ? 0.52 : -0.52;

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAzimuth);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -targetPitch);
    this.targetOrientation.copy(qYaw).multiply(qPitch).normalize();
  }

  private updateCameraPosition() {
    const basePos = new THREE.Vector3(0, 0, this.viewDistance);
    this.camera.position.copy(basePos).applyQuaternion(this.cameraOrientation);
    this.camera.up.set(0, 1, 0).applyQuaternion(this.cameraOrientation);
    this.camera.lookAt(0, 0, 0);

    // Keep contact shadow ALWAYS directly beneath the cube relative to user's view
    if (this.shadowMesh) {
      const camUp = this.camera.up.clone().normalize();
      this.shadowMesh.position.copy(camUp.clone().multiplyScalar(-1.85));
      this.shadowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), camUp);
    }
  }

  // --- Pointer & Touch Interaction ---

  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', this.onPointerDown.bind(this), { passive: false });
    window.addEventListener('pointermove', this.onPointerMove.bind(this), { passive: false });
    window.addEventListener('pointerup', this.onPointerUp.bind(this), { passive: false });
    window.addEventListener('pointercancel', this.onPointerUp.bind(this), { passive: false });

    // Wheel zoom
    el.addEventListener('wheel', this.onWheel.bind(this), { passive: true });

    // Window resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onPointerDown(e: PointerEvent) {
    e.preventDefault();

    // Check for two-finger pinch / orbit
    if (this.activeTouch && !this.secondTouch && this.activeTouch.pointerId !== e.pointerId) {
      this.secondTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
      const dx = this.secondTouch.x - this.activeTouch.currentX;
      const dy = this.secondTouch.y - this.activeTouch.currentY;
      this.initialPinchDist = Math.hypot(dx, dy);
      this.initialPinchRadius = this.viewDistance;
      return;
    }

    if (this.activeTouch) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    let intersectedCubie: THREE.Mesh | null = null;
    let hitNormal: THREE.Vector3 | null = null;
    let hitPoint: THREE.Vector3 | null = null;

    if (this.interactionMode === 'slice') {
      this.raycaster.setFromCamera(this.mouseVec, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cubies, false);

      if (intersects.length > 0 && intersects[0].face) {
        intersectedCubie = intersects[0].object as THREE.Mesh;
        hitPoint = intersects[0].point;

        // Transform face normal to world space
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersectedCubie.matrixWorld);
        hitNormal = intersects[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();
      }
    }

    this.activeTouch = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      intersectedCubie,
      hitNormal,
      hitPoint,
      handled: false,
      isBackgroundDrag: !intersectedCubie || this.interactionMode === 'orbit',
      pointerId: e.pointerId,
    };
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.activeTouch) return;

    // Handle two-finger pinch and two-finger 360° orbit
    if (this.secondTouch && this.secondTouch.id === e.pointerId) {
      const prevSecondX = this.secondTouch.x;
      const prevSecondY = this.secondTouch.y;
      this.secondTouch.x = e.clientX;
      this.secondTouch.y = e.clientY;

      const curDist = Math.hypot(this.secondTouch.x - this.activeTouch.currentX, this.secondTouch.y - this.activeTouch.currentY);
      if (this.initialPinchDist > 10 && curDist > 10) {
        const scale = this.initialPinchDist / curDist;
        this.targetDistance = Math.max(5.0, Math.min(14.0, this.initialPinchRadius * scale));
      }

      // Two-finger drag allows full 360° unconstrained view rotation
      const midDx = e.clientX - prevSecondX;
      const midDy = e.clientY - prevSecondY;
      const orbitSpeed = 0.0075 * this.sensitivityMultiplier;
      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraOrientation);
      const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.cameraOrientation);

      const rotY = new THREE.Quaternion().setFromAxisAngle(camUp, -midDx * orbitSpeed);
      const rotX = new THREE.Quaternion().setFromAxisAngle(camRight, -midDy * orbitSpeed);

      this.targetOrientation.premultiply(rotX).premultiply(rotY).normalize();
      return;
    }

    if (this.activeTouch.pointerId !== e.pointerId) return;

    const dx = e.clientX - this.activeTouch.currentX;
    const dy = e.clientY - this.activeTouch.currentY;
    this.activeTouch.currentX = e.clientX;
    this.activeTouch.currentY = e.clientY;

    const totalDx = e.clientX - this.activeTouch.startX;
    const totalDy = e.clientY - this.activeTouch.startY;
    const totalDist = Math.hypot(totalDx, totalDy);

    // If dragging background or in orbit mode: free unconstrained 360 degree rotation in any direction!
    if (this.activeTouch.isBackgroundDrag) {
      const orbitSpeed = 0.0075 * this.sensitivityMultiplier;
      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraOrientation);
      const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.cameraOrientation);

      const rotY = new THREE.Quaternion().setFromAxisAngle(camUp, -dx * orbitSpeed);
      const rotX = new THREE.Quaternion().setFromAxisAngle(camRight, -dy * orbitSpeed);

      this.targetOrientation.premultiply(rotX).premultiply(rotY).normalize();
      return;
    }

    // Slice dragging gesture over a cubie
    if (!this.activeTouch.handled && totalDist > 12 && this.activeTouch.intersectedCubie && this.activeTouch.hitNormal) {
      const detectedMove = this.detectSliceMove(
        this.activeTouch.intersectedCubie,
        this.activeTouch.hitNormal,
        this.activeTouch.hitPoint,
        totalDx,
        totalDy
      );

      if (detectedMove) {
        this.activeTouch.handled = true;
        this.executeMove(detectedMove);
      }
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (this.secondTouch && this.secondTouch.id === e.pointerId) {
      this.secondTouch = null;
      this.snapToMultiFaceView();
      return;
    }

    if (this.activeTouch && this.activeTouch.pointerId === e.pointerId) {
      const wasBackgroundDrag = this.activeTouch.isBackgroundDrag;
      this.activeTouch = null;
      if (wasBackgroundDrag) {
        this.snapToMultiFaceView();
      }
    }
  }

  private onWheel(e: WheelEvent) {
    const zoomDelta = e.deltaY * 0.003;
    this.targetDistance = Math.max(5.0, Math.min(14.0, this.targetDistance + zoomDelta));
  }

  /**
   * Determine all legal candidate moves for the touched cubie on the given face normal.
   */
  private getCandidateMovesForCubie(cubie: THREE.Mesh, normal: THREE.Vector3): Move[] {
    const grid = this.getCubieGridPosition(cubie);
    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);

    let faceNormalAxis: 'x' | 'y' | 'z' = 'z';
    if (absX >= absY && absX >= absZ) faceNormalAxis = 'x';
    else if (absY >= absX && absY >= absZ) faceNormalAxis = 'y';
    else faceNormalAxis = 'z';

    const candidates: Move[] = [];

    // Face Normal along Z (Front or Back)
    if (faceNormalAxis === 'z') {
      const gy = Math.round(grid.y);
      if (gy === 1) {
        candidates.push({ face: 'U', direction: 1, notation: 'U' });
        candidates.push({ face: 'U', direction: -1, notation: "U'" });
      } else if (gy === -1) {
        candidates.push({ face: 'D', direction: 1, notation: 'D' });
        candidates.push({ face: 'D', direction: -1, notation: "D'" });
      }

      const gx = Math.round(grid.x);
      if (gx === 1) {
        candidates.push({ face: 'R', direction: 1, notation: 'R' });
        candidates.push({ face: 'R', direction: -1, notation: "R'" });
      } else if (gx === -1) {
        candidates.push({ face: 'L', direction: 1, notation: 'L' });
        candidates.push({ face: 'L', direction: -1, notation: "L'" });
      }
    }
    // Face Normal along Y (Up or Down)
    else if (faceNormalAxis === 'y') {
      const gz = Math.round(grid.z);
      if (gz === 1) {
        candidates.push({ face: 'F', direction: 1, notation: 'F' });
        candidates.push({ face: 'F', direction: -1, notation: "F'" });
      } else if (gz === -1) {
        candidates.push({ face: 'B', direction: 1, notation: 'B' });
        candidates.push({ face: 'B', direction: -1, notation: "B'" });
      }

      const gx = Math.round(grid.x);
      if (gx === 1) {
        candidates.push({ face: 'R', direction: 1, notation: 'R' });
        candidates.push({ face: 'R', direction: -1, notation: "R'" });
      } else if (gx === -1) {
        candidates.push({ face: 'L', direction: 1, notation: 'L' });
        candidates.push({ face: 'L', direction: -1, notation: "L'" });
      }
    }
    // Face Normal along X (Right or Left)
    else if (faceNormalAxis === 'x') {
      const gy = Math.round(grid.y);
      if (gy === 1) {
        candidates.push({ face: 'U', direction: 1, notation: 'U' });
        candidates.push({ face: 'U', direction: -1, notation: "U'" });
      } else if (gy === -1) {
        candidates.push({ face: 'D', direction: 1, notation: 'D' });
        candidates.push({ face: 'D', direction: -1, notation: "D'" });
      }

      const gz = Math.round(grid.z);
      if (gz === 1) {
        candidates.push({ face: 'F', direction: 1, notation: 'F' });
        candidates.push({ face: 'F', direction: -1, notation: "F'" });
      } else if (gz === -1) {
        candidates.push({ face: 'B', direction: 1, notation: 'B' });
        candidates.push({ face: 'B', direction: -1, notation: "B'" });
      }
    }

    return candidates;
  }

  /**
   * Projects a candidate move's instantaneous 3D displacement at the hitPoint
   * to a 2D screen direction vector via camera projection.
   */
  private getMoveProjectedScreenVector(hitPoint: THREE.Vector3, move: Move): THREE.Vector2 {
    const { axis, angle } = this.getMoveParams(move);

    const axisVec = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    );

    // Tangent velocity v = omega x r
    const disp3D = axisVec.clone().multiplyScalar(angle).cross(hitPoint);

    // Project hitPoint and hitPoint + small displacement onto screen
    const p1 = hitPoint.clone().project(this.camera);
    const p2 = hitPoint.clone().add(disp3D.clone().multiplyScalar(0.05)).project(this.camera);

    // Convert Three.js NDC (+Y up) to screen pixel coordinates (+Y down)
    const screenDeltaX = p2.x - p1.x;
    const screenDeltaY = -(p2.y - p1.y);

    const vec = new THREE.Vector2(screenDeltaX, screenDeltaY);
    if (vec.lengthSq() < 1e-7) {
      return new THREE.Vector2(0, 0);
    }
    return vec.normalize();
  }

  /**
   * Project candidate moves to 2D screen space to detect exact slice turn
   * matching the user's swipe vector with 100% mathematical precision.
   */
  private detectSliceMove(
    cubie: THREE.Mesh,
    normal: THREE.Vector3,
    hitPoint: THREE.Vector3 | null,
    dragX: number,
    dragY: number
  ): Move | null {
    const point = hitPoint || cubie.position;
    const userDragVec = new THREE.Vector2(dragX, dragY).normalize();

    // Determine candidate moves
    const candidates = this.getCandidateMovesForCubie(cubie, normal);

    // If center piece (no slice candidate): swiping center piece rotates the whole cube
    if (candidates.length === 0) {
      const pCenter = point.clone().project(this.camera);
      const pUp = point.clone().add(new THREE.Vector3(0, 1, 0)).project(this.camera);
      const pRight = point.clone().add(new THREE.Vector3(1, 0, 0)).project(this.camera);

      const scrUp = new THREE.Vector2(pUp.x - pCenter.x, -(pUp.y - pCenter.y)).normalize();
      const scrRight = new THREE.Vector2(pRight.x - pCenter.x, -(pRight.y - pCenter.y)).normalize();

      const dotUp = userDragVec.dot(scrUp);
      const dotRight = userDragVec.dot(scrRight);

      if (Math.abs(dotRight) > Math.abs(dotUp)) {
        const dir = dotRight > 0 ? -1 : 1;
        this.rotateCubeWhole('y', dir);
      } else {
        const dir = dotUp > 0 ? 1 : -1;
        this.rotateCubeWhole('x', dir);
      }
      return null;
    }

    let bestMove: Move | null = null;
    let maxDot = -Infinity;

    for (const move of candidates) {
      const screenVec = this.getMoveProjectedScreenVector(point, move);
      const dot = userDragVec.dot(screenVec);

      if (dot > maxDot) {
        maxDot = dot;
        bestMove = move;
      }
    }

    // Require positive alignment with the gesture
    if (bestMove && maxDot > 0.35) {
      return bestMove;
    }

    return null;
  }

  // --- Animation Loop ---

  private animate() {
    if (this.isDisposed) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    // Smooth camera orbit slerp (Unconstrained 360° Trackball)
    this.viewDistance += (this.targetDistance - this.viewDistance) * 0.18;
    this.cameraOrientation.slerp(this.targetOrientation, 0.22);
    this.updateCameraPosition();

    // Slice rotation animation
    if (this.isAnimating && this.activePivot && this.currentRotatingMove) {
      this.animationProgress += dt / this.animationDuration;

      if (this.animationProgress >= 1.0) {
        this.finishCurrentRotation();
      } else {
        // Smooth ease-out sine
        const easeT = Math.sin((this.animationProgress * Math.PI) / 2);
        const currentAngle = this.targetRotationAngle * easeT;
        const { axis } = this.getMoveParams(this.currentRotatingMove);

        if (axis === 'x') this.activePivot.rotation.x = currentAngle;
        else if (axis === 'y') this.activePivot.rotation.y = currentAngle;
        else if (axis === 'z') this.activePivot.rotation.z = currentAngle;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  public onResize() {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || 360;
    const height = this.container.clientHeight || 480;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
