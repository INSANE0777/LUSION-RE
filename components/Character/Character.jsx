import React, { useEffect, useRef, useState } from "react";
import { exportToGLTF, fetchData } from "../Loaders/loader";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader } from "three";
import * as THREE from "three";
import { loadAnimationBuffer } from "../Loaders/animationLoader";
import { useFrame } from "@react-three/fiber";

const Astronaut = ({ scale = 1, position = [0, 0, 0] }) => {
  const astronaut = useRef();
  const astronaut_wearpack = useRef();
  const astronaut_body = useRef();
  const astronaut_glove_shoes = useRef();
  const astronaut_helmet = useRef();
  const astronaut_helmet_glass = useRef();

  const [percentageLoaded, setPercentage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const bufferPaths = [
    "/assets/astronaut_wearpack/astronaut_wearpack.buf",
    "/assets/astronaut.buf",
    "/assets/astronaut_glove_shoes/astronaut_glove_shoes.buf",
    "/assets/astronaut_helmet/astronaut_helmet.buf",
    "/assets/astronaut_helmet_glass.buf",
  ];

  const texturePaths = [
    {
      base: "/assets/astronaut_glove_shoes/astronaut_glove_shoes_base.webp",
      arm: "/assets/astronaut_glove_shoes/astronaut_glove_shoes_arm.webp",
      nor: "/assets/astronaut_glove_shoes/astronaut_glove_shoes_nor.webp",
    },
    {
      base: "/assets/astronaut_helmet/astronaut_helmet_base.webp",
      arm: "/assets/astronaut_helmet/astronaut_helmet_arm.webp",
      nor: "/assets/astronaut_helmet/astronaut_helmet_nor.webp",
    },
    {
      base: "/assets/astronaut_wearpack/astronaut_wearpack_base.webp",
      arm: "/assets/astronaut_wearpack/astronaut_wearpack_arm.webp",
      nor: "/assets/astronaut_wearpack/astronaut_wearpack_nor.webp",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const loadTexture = (texturePath) => {
      const loader = new TextureLoader();
      return new Promise((resolve, reject) => {
        loader.load(
          texturePath,
          (texture) => resolve(texture),
          undefined,
          (error) => reject(error)
        );
      });
    };

    const fetchBuffers = async () => {
      try {
        const meshArray = await Promise.all(
          bufferPaths.map((path) => fetchData(path, setPercentage))
        );

        const textures = await Promise.all(
          texturePaths.map((textures) =>
            Promise.all(
              Object.values(textures).map((texturePath) =>
                loadTexture(texturePath)
              )
            )
          )
        );

        if (!mounted) return;

        const meshes = [
          { ref: astronaut_wearpack, geometry: meshArray[0], textures: textures[2] },
          { ref: astronaut_body, geometry: meshArray[1] },
          { ref: astronaut_glove_shoes, geometry: meshArray[2], textures: textures[0] },
          { ref: astronaut_helmet, geometry: meshArray[3], textures: textures[1] },
          { ref: astronaut_helmet_glass, geometry: meshArray[4] },
        ];

        meshes.forEach(({ ref, geometry, textures }) => {
          if (ref.current) {
            ref.current.geometry = geometry.geometry.clone();
            if (textures) {
              ref.current.material = new THREE.MeshStandardMaterial({
                map: textures[0],
                normalMap: textures[2],
                roughnessMap: textures[1],
                metalnessMap: textures[1],
                aoMap: textures[1],
              });
            }
          }
        });

        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading assets:", error);
        setError(error);
      }
    };

    fetchBuffers();

    return () => {
      mounted = false;
    };
  }, []);

  useFrame(() => {
    if (astronaut.current && isLoaded) {
      astronaut.current.rotation.y += 0.01;
    }
  });

  if (error) {
    return null; // Or return an error component
  }

  return (
    <group ref={astronaut} scale={scale} position={position}>
      <mesh ref={astronaut_wearpack} />
      <mesh ref={astronaut_body} />
      <mesh ref={astronaut_glove_shoes} />
      <mesh ref={astronaut_helmet} />
      <mesh ref={astronaut_helmet_glass} />
    </group>
  );
};

export default Astronaut;
