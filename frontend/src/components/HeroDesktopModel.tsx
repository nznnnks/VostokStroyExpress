import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";

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
  compact: {
    groupPosition: [0.9, -1.72, 0] as [number, number, number],
    scale: 1.72,
    wrapperClassName: "pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[42%] md:block lg:w-[44%]",
    camera: {
      position: [0, 1.1, 9.6] as [number, number, number],
      fov: 27,
    },
  },
  medium: {
    groupPosition: [0.65, -1.62, 0] as [number, number, number],
    scale: 1.94,
    wrapperClassName: "pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[46%] md:block xl:w-[48%]",
    camera: {
      position: [0, 1.12, 9.2] as [number, number, number],
      fov: 25.5,
    },
  },
  wide: {
    groupPosition: [0.25, -1.45, 0] as [number, number, number],
    scale: 2.3,
    wrapperClassName: "pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[58%] md:block xl:w-[56%] 2xl:w-[54%]",
    camera: {
      position: [0, 1.15, 9] as [number, number, number],
      fov: 24,
    },
  },
} satisfies Record<string, HeroModelLayout>;

type HeroModelLayoutKey = keyof typeof HERO_MODEL_LAYOUTS;

function getHeroModelLayoutKey(width: number): HeroModelLayoutKey {
  if (width < 1280) return "compact";
  if (width < 1536) return "medium";
  return "wide";
}

function HeroModel({
  mouse,
  layout,
  reducedMotion,
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  layout: HeroModelLayout;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  const { scene } = useGLTF("/models/hero-dantex.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
      invalidate();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [invalidate, mouse, reducedMotion]);

  useFrame(() => {
    if (!groupRef.current) return;

    const targetRotationX = -0.12 - mouse.current.y * 0.18;
    const targetRotationY = -0.55 + mouse.current.x * 0.3;
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
    <group ref={groupRef} position={layout.groupPosition} scale={layout.scale}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

export function HeroDesktopModel() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [layoutKey, setLayoutKey] = useState<HeroModelLayoutKey>(() =>
    typeof window === "undefined" ? "wide" : getHeroModelLayoutKey(window.innerWidth),
  );
  const layout = HERO_MODEL_LAYOUTS[layoutKey];

  useEffect(() => {
    const handleResize = () => {
      const nextLayoutKey = getHeroModelLayoutKey(window.innerWidth);
      setLayoutKey((current) => (current === nextLayoutKey ? current : nextLayoutKey));
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={layout.wrapperClassName}>
      <Canvas
        dpr={[1, 1.25]}
        camera={layout.camera}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[4, 6, 6]} intensity={2.8} color="#dfe8ff" />
          <directionalLight position={[-5, 3, 1]} intensity={1.2} color="#7aa2ff" />
          <spotLight position={[2, 8, 10]} angle={0.28} penumbra={0.9} intensity={34} color="#ffffff" />
          <spotLight position={[7, 2, 3]} angle={0.42} penumbra={1} intensity={14} color="#a7c2ff" />
          <HeroModel mouse={mouseRef} layout={layout} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hero-dantex.glb");

export default HeroDesktopModel;
