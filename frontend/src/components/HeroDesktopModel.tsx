import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const HERO_BASE_ROTATION_Y = -Math.PI / 2;
const HERO_FIT_MARGIN = 0.995;
const HERO_FILL_RATIO_MIN = 0.98;
const HERO_FILL_RATIO_MAX = 1.12;

function getHeroViewportScaleFactor(viewportWidth: number) {
  if (viewportWidth <= 1536) return 1;
  if (viewportWidth >= 1920) return 0.78;

  const progress = (viewportWidth - 1536) / (1920 - 1536);
  return THREE.MathUtils.lerp(1, 0.78, progress);
}

function getHeroFillRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) return HERO_FILL_RATIO_MIN;

  const widthProgress = THREE.MathUtils.clamp((width - 420) / 520, 0, 1);
  const heightProgress = THREE.MathUtils.clamp((height - 320) / 420, 0, 1);
  const combinedProgress = widthProgress * 0.7 + heightProgress * 0.3;

  return THREE.MathUtils.lerp(HERO_FILL_RATIO_MIN, HERO_FILL_RATIO_MAX, combinedProgress);
}

function getRenderableBoundingSphere(root: THREE.Object3D): THREE.Sphere | null {
  root.updateMatrixWorld(true);

  const box = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  let hasMesh = false;

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.visible === false) return;
    if (!mesh.geometry) return;

    const geometry = mesh.geometry as THREE.BufferGeometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingBox) return;

    tmpBox.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
    if (tmpBox.isEmpty()) return;

    if (!hasMesh) {
      box.copy(tmpBox);
      hasMesh = true;
      return;
    }

    box.union(tmpBox);
  });

  if (!hasMesh || box.isEmpty()) return null;

  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return null;
  return sphere;
}

type HeroModelLayout = {
  groupPosition: [number, number, number];
  scale: number;
  wrapperClassName: string;
  camera: {
    position: [number, number, number];
    fov: number;
  };
};

const HERO_MODEL_LAYOUTS = {
  mobile: {
    groupPosition: [0, -1.34, 0] as [number, number, number],
    scale: 1.34,
    wrapperClassName: "hero-model-edgefade hero-model-edgefade--mobile hero-model-frame pointer-events-none",
    camera: {
      position: [0, 1.05, 10.8] as [number, number, number],
      fov: 30,
    },
  },
  tablet: {
    groupPosition: [0.45, -1.54, 0] as [number, number, number],
    scale: 1.72,
    wrapperClassName: "hero-model-edgefade hero-model-edgefade--tablet hero-model-frame pointer-events-none",
    camera: {
      position: [0, 1.1, 9.55] as [number, number, number],
      fov: 28.25,
    },
  },
  compact: {
    groupPosition: [0.55, -1.56, 0] as [number, number, number],
    scale: 1.86,
    wrapperClassName: "hero-model-edgefade hero-model-edgefade--compact hero-model-frame pointer-events-none",
    camera: {
      position: [0, 1.12, 9.15] as [number, number, number],
      fov: 27.25,
    },
  },
  medium: {
    groupPosition: [0.65, -1.62, 0] as [number, number, number],
    scale: 1.94,
    wrapperClassName: "hero-model-edgefade hero-model-edgefade--medium hero-model-frame pointer-events-none",
    camera: {
      position: [0, 1.12, 9.2] as [number, number, number],
      fov: 25.5,
    },
  },
  wide: {
    groupPosition: [0.25, -1.45, 0] as [number, number, number],
    scale: 2.18,
    wrapperClassName: "hero-model-edgefade hero-model-edgefade--wide hero-model-frame pointer-events-none",
    camera: {
      position: [0, 1.15, 9] as [number, number, number],
      fov: 24,
    },
  },
  ultraWide: {
    groupPosition: [0.2, -1.28, 0] as [number, number, number],
    scale: 2.45,
    wrapperClassName: "hero-model-edgefade hero-model-edgefade--wide hero-model-frame pointer-events-none",
    camera: {
      position: [0, 1.18, 9.15] as [number, number, number],
      fov: 24.8,
    },
  },
} satisfies Record<string, HeroModelLayout>;

type HeroModelLayoutKey = keyof typeof HERO_MODEL_LAYOUTS;
type HeroModelLayoutStop = {
  minWidth: number;
  key: HeroModelLayoutKey;
};

const HERO_MODEL_LAYOUT_STOPS: HeroModelLayoutStop[] = [
  { minWidth: 0, key: "mobile" },
  { minWidth: 768, key: "tablet" },
  { minWidth: 1024, key: "compact" },
  { minWidth: 1280, key: "medium" },
  { minWidth: 1536, key: "wide" },
  { minWidth: 1680, key: "ultraWide" },
];

function getHeroModelLayoutKey(width: number): HeroModelLayoutKey {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  if (width < 1280) return "compact";
  if (width < 1536) return "medium";
  if (width < 1680) return "wide";
  return "ultraWide";
}

function interpolateVector(
  from: [number, number, number],
  to: [number, number, number],
  progress: number,
): [number, number, number] {
  return [
    THREE.MathUtils.lerp(from[0], to[0], progress),
    THREE.MathUtils.lerp(from[1], to[1], progress),
    THREE.MathUtils.lerp(from[2], to[2], progress),
  ];
}

function getInterpolatedHeroLayout(width: number): HeroModelLayout {
  if (width <= HERO_MODEL_LAYOUT_STOPS[0].minWidth) {
    return HERO_MODEL_LAYOUTS[HERO_MODEL_LAYOUT_STOPS[0].key];
  }

  for (let index = 0; index < HERO_MODEL_LAYOUT_STOPS.length - 1; index += 1) {
    const currentStop = HERO_MODEL_LAYOUT_STOPS[index];
    const nextStop = HERO_MODEL_LAYOUT_STOPS[index + 1];

    if (width < nextStop.minWidth) {
      const progress = THREE.MathUtils.clamp(
        (width - currentStop.minWidth) / (nextStop.minWidth - currentStop.minWidth),
        0,
        1,
      );
      const currentLayout = HERO_MODEL_LAYOUTS[currentStop.key];
      const nextLayout = HERO_MODEL_LAYOUTS[nextStop.key];

      return {
        wrapperClassName: currentLayout.wrapperClassName,
        groupPosition: interpolateVector(currentLayout.groupPosition, nextLayout.groupPosition, progress),
        scale: THREE.MathUtils.lerp(currentLayout.scale, nextLayout.scale, progress),
        camera: {
          position: interpolateVector(currentLayout.camera.position, nextLayout.camera.position, progress),
          fov: THREE.MathUtils.lerp(currentLayout.camera.fov, nextLayout.camera.fov, progress),
        },
      };
    }
  }

  return HERO_MODEL_LAYOUTS[HERO_MODEL_LAYOUT_STOPS[HERO_MODEL_LAYOUT_STOPS.length - 1].key];
}

function HeroModel({
  mouse,
  layout,
  reducedMotion,
  viewportWidth,
  onReady,
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  layout: HeroModelLayout;
  reducedMotion: boolean;
  viewportWidth: number;
  onReady?: () => void;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const pointerRafRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);
  const { scene } = useGLTF("/models/hero-dantex.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const fittedScale = useMemo(() => {
    const sphere = getRenderableBoundingSphere(clonedScene) ?? (() => {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const fallbackSphere = new THREE.Sphere();
      box.getBoundingSphere(fallbackSphere);
      return fallbackSphere;
    })();

    if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return layout.scale;

    const aspect = size.width > 0 && size.height > 0 ? size.width / size.height : 1;
    const fov = THREE.MathUtils.degToRad(layout.camera.fov);
    const cameraPos = new THREE.Vector3(...layout.camera.position);
    const targetPos = new THREE.Vector3(...layout.groupPosition);
    const distance = cameraPos.distanceTo(targetPos);

    // Fit the bounding sphere into the current camera frustum with a small margin
    // to prevent hard clipping by the canvas edge.
    const halfHeight = Math.tan(fov / 2) * distance;
    const halfWidth = halfHeight * aspect;
    const maxRadius = Math.min(halfHeight, halfWidth) * HERO_FIT_MARGIN;
    const capScale = maxRadius / sphere.radius;
    const fillRatio = getHeroFillRatio(size.width, size.height);
    const targetScale = capScale * fillRatio;
    const minScale = layout.scale * 0.92;
    const maxScale = layout.scale * 1.14;
    const viewportScaleFactor = getHeroViewportScaleFactor(viewportWidth);

    return THREE.MathUtils.clamp(targetScale, minScale, maxScale) * viewportScaleFactor;
  }, [
    clonedScene,
    layout.camera.fov,
    layout.camera.position,
    layout.groupPosition,
    layout.scale,
    size.height,
    size.width,
    viewportWidth,
  ]);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      const nextX = (event.clientX / window.innerWidth - 0.5) * 2;
      const nextY = (event.clientY / window.innerHeight - 0.5) * 2;

      if (
        Math.abs(mouse.current.x - nextX) < 0.0015 &&
        Math.abs(mouse.current.y - nextY) < 0.0015
      ) {
        return;
      }

      mouse.current.x = nextX;
      mouse.current.y = nextY;

      if (pointerRafRef.current !== null) return;
      pointerRafRef.current = window.requestAnimationFrame(() => {
        pointerRafRef.current = null;
        invalidate();
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (pointerRafRef.current !== null) {
        window.cancelAnimationFrame(pointerRafRef.current);
      }
    };
  }, [invalidate, mouse, reducedMotion]);

  useEffect(() => {
    if (readyRef.current) return;
    readyRef.current = true;

    const frameId = window.requestAnimationFrame(() => {
      onReady?.();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [onReady]);

  useFrame(() => {
    if (!groupRef.current) return;

    const targetRotationX = -0.12 - mouse.current.y * 0.18;
    const targetRotationY = HERO_BASE_ROTATION_Y + (-0.55 + mouse.current.x * 0.3);
    const targetPositionY = layout.groupPosition[1];

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.045);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.045);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPositionY, 0.06);

    const isStillAnimating =
      Math.abs(groupRef.current.rotation.x - targetRotationX) > 0.0008 ||
      Math.abs(groupRef.current.rotation.y - targetRotationY) > 0.0008 ||
      Math.abs(groupRef.current.position.y - targetPositionY) > 0.0008;

    if (isStillAnimating) {
      invalidate();
    }
  });

  return (
    <group ref={groupRef} position={layout.groupPosition} scale={fittedScale}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

export function HeroDesktopModel({ onReady }: { onReady?: () => void }) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  const wrapperClassName = HERO_MODEL_LAYOUTS[getHeroModelLayoutKey(viewportWidth)].wrapperClassName;
  const layout = useMemo(() => getInterpolatedHeroLayout(viewportWidth), [viewportWidth]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={wrapperClassName}>
      <Canvas
        className="hero-model-edgefade__canvas"
        dpr={1}
        camera={layout.camera}
        frameloop="demand"
        gl={{
          alpha: true,
          antialias: false,
          premultipliedAlpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.setClearAlpha(0);
          gl.domElement.style.background = "transparent";
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[4, 6, 6]} intensity={2.8} color="#dfe8ff" />
          <directionalLight position={[-5, 3, 1]} intensity={1.2} color="#7aa2ff" />
          <spotLight position={[2, 8, 10]} angle={0.28} penumbra={0.9} intensity={34} color="#ffffff" />
          <spotLight position={[7, 2, 3]} angle={0.42} penumbra={1} intensity={14} color="#a7c2ff" />
          <HeroModel
            mouse={mouseRef}
            layout={layout}
            reducedMotion={reducedMotion}
            viewportWidth={viewportWidth}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HeroDesktopModel;
