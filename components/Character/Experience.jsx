"use client";
import { Canvas } from "@react-three/fiber";
import React, { Suspense } from "react";
import Astronaut from "./Character";
import { Environment, OrbitControls } from "@react-three/drei";

const Experience = () => {
  return (
    <div className="w-full h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <OrbitControls enableZoom={false} />
          <Environment preset="forest" />
          <directionalLight position={[0, 1, 0]} intensity={2} />
          <Astronaut scale={3} position={[0, -3, 0]} />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Experience;
