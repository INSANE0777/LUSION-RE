import * as THREE from "three";
import { useRef, useReducer, useMemo, useEffect, useLayoutEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, MeshTransmissionMaterial, Environment, Lightformer, useTexture } from "@react-three/drei";
import { CuboidCollider, BallCollider, Physics, RigidBody } from "@react-three/rapier";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { fetchData } from "../Loaders/loader";

const accents = ["#4060ff", "#a259ff", "#ff1a1a", "#bfff00", "#ffd600"];
const shuffle = (accent = 0) => [
  { color: "#0a0a0a", roughness: 0.3 },
  { color: "#0a0a0a", roughness: 0.6 },
  { color: "#0a0a0a", roughness: 0.4 },
  { color: "#ffffff", roughness: 0.2 },
  { color: "#ffffff", roughness: 0.5 },
  { color: "#ffffff", roughness: 0.3 },
  { color: accents[accent], roughness: 0.2, accent: true },
  { color: accents[accent], roughness: 0.3, accent: true },
  { color: accents[accent], roughness: 0.25, accent: true },
  // Add more variations
  { color: "#0a0a0a", roughness: 0.4 },
  { color: "#0a0a0a", roughness: 0.5 },
  { color: "#ffffff", roughness: 0.25 },
  { color: "#ffffff", roughness: 0.4 },
  { color: accents[accent], roughness: 0.2, accent: true },
  { color: accents[accent], roughness: 0.3, accent: true },
];

export function Planets(props) {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0);
  const [jiggle, setJiggle] = useState(false);
  const connectors = useMemo(() => shuffle(accent), [accent]);

  const handleClick = () => {
    click();
    setJiggle(true);
    setTimeout(() => setJiggle(false), 1000);
  };

  return (
    <Canvas onClick={handleClick} shadows dpr={[1, 1.5]} gl={{ antialias: false }} camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }} {...props}>
      <color attach="background" args={["#0f0f14"]} />
      <fog attach="fog" args={["#0f0f14", 10, 30]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
      <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} />

      {/* Subtle blue gradient in the center */}
      <pointLight position={[0, 0, 8]} intensity={1.5} color="#2040ff" distance={20} decay={2} />
      <pointLight position={[0, 0, 3]} intensity={0.8} color="#3050ff" distance={15} decay={2} />

      {/* Background light that changes with accent color */}
      <pointLight position={[0, 0, -20]} intensity={2} color={accents[accent]} />
      <pointLight position={[0, 0, -15]} intensity={1.5} color={accents[accent]} />

      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {connectors.map((props, i) => <Connector key={i} {...props} jiggle={jiggle} />)}
        <Connector position={[10, 10, 5]}>
          <Model>
            <MeshTransmissionMaterial
              clearcoat={1}
              thickness={0.1}
              anisotropicBlur={0.1}
              chromaticAberration={0.1}
              samples={8}
              resolution={512}
            />
          </Model>
        </Connector>
      </Physics>

      <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>

      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
        </group>
      </Environment>
    </Canvas>
  );
}

function Connector({ position, children, vec = new THREE.Vector3(), scale, r = THREE.MathUtils.randFloatSpread, accent, jiggle, ...props }) {
  const api = useRef();
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [position]);

  useEffect(() => {
    if (jiggle) {
      const impulse = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      api.current?.applyImpulse(impulse);
      api.current?.applyTorqueImpulse({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      });
    }
  }, [jiggle]);

  useFrame((state, delta) => {
    delta = Math.min(0.1, delta);
    api.current?.applyImpulse(vec.copy(api.current.translation()).negate().multiplyScalar(0.2));

    // Add slow continuous rotation
    if (api.current) {
      api.current.applyTorqueImpulse({
        x: Math.sin(state.clock.elapsedTime * 0.1) * 0.001,
        y: Math.cos(state.clock.elapsedTime * 0.1) * 0.001,
        z: Math.sin(state.clock.elapsedTime * 0.15) * 0.001
      });
    }
  });

  return (
    <RigidBody linearDamping={4} angularDamping={1} friction={0.1} position={pos} ref={api} colliders={false}>
      <CuboidCollider args={[0.45, 1.5, 0.45]} />
      <CuboidCollider args={[1.5, 0.45, 0.45]} />
      <CuboidCollider args={[0.45, 0.45, 1.5]} />
      {children ? children : <Model {...props} />}
      {accent && <pointLight intensity={8} distance={4} color={props.color} />}
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef();

  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0));
  });

  return (
    <RigidBody position={[0, 0, 0]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

function Model({ children, color = 'white', roughness = 0, ...props }) {
  const ref = useRef();
  const { nodes, materials } = useGLTF('/c-transformed.glb');

  return (
    <mesh ref={ref} castShadow receiveShadow scale={10} geometry={nodes.connector.geometry}>
      <meshStandardMaterial metalness={0.3} roughness={roughness} map={materials.base.map} color={color} />
      {children}
    </mesh>
  );
}
