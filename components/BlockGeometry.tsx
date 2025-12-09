
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BlockType, BlockRotation } from '../types';

interface BlockGeometryProps {
  id?: string;
  type: BlockType;
  color: string;
  rotation: BlockRotation;
  position: [number, number, number];
  holes?: number[];
  opacity?: number;
  transparent?: boolean;
  isSelected?: boolean;
  onClick?: (e: any) => void;
  onPointerDown?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

const TriangleGeometry: React.FC<{ color: string }> = ({ color }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Create a right-angled triangle
    shape.moveTo(-0.5, -0.5);
    shape.lineTo(0.5, -0.5);
    shape.lineTo(-0.5, 0.5);
    shape.lineTo(-0.5, -0.5);

    const extrudeSettings = {
      steps: 1,
      depth: 1,
      bevelEnabled: false,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.translate(0, 0, -0.5);
    // Recompute normals for flat shading look
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} flatShading />
      <lineSegments raycast={() => null} position={[0,0,0]} scale={[0.99, 0.99, 0.99]}>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="black" opacity={0.3} transparent />
      </lineSegments>
    </mesh>
  );
};

const CubeGeometry: React.FC<{ color: string }> = ({ color }) => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} flatShading />
      <lineSegments raycast={() => null} scale={[0.999, 0.999, 0.999]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="black" opacity={0.3} transparent />
      </lineSegments>
    </mesh>
  );
};

// Geometry for a face with a hole
const holedFaceGeometry = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.5);
  shape.lineTo(0.5, -0.5);
  shape.lineTo(0.5, 0.5);
  shape.lineTo(-0.5, 0.5);
  shape.lineTo(-0.5, -0.5);

  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.35, 0, Math.PI * 2, false);
  shape.holes.push(hole);

  return new THREE.ShapeGeometry(shape);
})();

// Geometry for a solid face (plane)
const solidFaceGeometry = new THREE.PlaneGeometry(1, 1);

const DrilledCubeGeometry: React.FC<{ color: string; holes: number[] }> = ({ color, holes }) => {
  // Face definitions matching Three.js materialIndex order
  // 0: +x, 1: -x, 2: +y, 3: -y, 4: +z, 5: -z
  const faces = [
    { pos: [0.5, 0, 0], rot: [0, Math.PI / 2, 0], id: 0 },   // Right
    { pos: [-0.5, 0, 0], rot: [0, -Math.PI / 2, 0], id: 1 }, // Left
    { pos: [0, 0.5, 0], rot: [-Math.PI / 2, 0, 0], id: 2 },  // Top
    { pos: [0, -0.5, 0], rot: [Math.PI / 2, 0, 0], id: 3 },  // Bottom
    { pos: [0, 0, 0.5], rot: [0, 0, 0], id: 4 },             // Front
    { pos: [0, 0, -0.5], rot: [0, Math.PI, 0], id: 5 },      // Back
  ];

  return (
    <group>
      {faces.map((face, index) => {
        const isHoled = holes.includes(index);
        return (
          <mesh
            key={index}
            position={face.pos as [number, number, number]}
            rotation={face.rot as [number, number, number]}
            geometry={isHoled ? holedFaceGeometry : solidFaceGeometry}
            userData={{ faceIndex: face.id }} // Explicitly store face index for raycaster
          >
            {/* Use DoubleSide so we can see inside the cube through holes */}
            <meshStandardMaterial color={color} side={THREE.DoubleSide} flatShading />
          </mesh>
        );
      })}
      {/* Edges for definitions */}
      <lineSegments raycast={() => null} scale={[0.999, 0.999, 0.999]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="black" opacity={0.3} transparent />
      </lineSegments>
    </group>
  );
};

export const BlockGeometry: React.FC<BlockGeometryProps> = ({
  id,
  type,
  color,
  rotation,
  position,
  holes = [],
  opacity = 1,
  transparent = false,
  isSelected = false,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerOut
}) => {
  const rotationY = -rotation * (Math.PI / 2);

  return (
    <group 
      position={position} 
      rotation={[0, rotationY, 0]} 
      onClick={onClick} 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove} 
      onPointerOut={onPointerOut}
      userData={{ id }}
    >
      {transparent ? (
         <mesh raycast={() => null}>
           {type === 'cube' ? <boxGeometry args={[1, 1, 1]} /> : null}
           {type === 'triangle' ? (
              <primitive object={new THREE.ExtrudeGeometry(
                (() => {
                  const s = new THREE.Shape();
                  s.moveTo(-0.5, -0.5);
                  s.lineTo(0.5, -0.5);
                  s.lineTo(-0.5, 0.5);
                  s.lineTo(-0.5, -0.5);
                  return s;
                })(), { steps: 1, depth: 1, bevelEnabled: false }
              ).translate(0, 0, -0.5)} />
           ) : null}
           <meshStandardMaterial color={color} opacity={opacity} transparent={transparent} flatShading />
         </mesh>
      ) : (
        <>
          {type === 'cube' && (
            holes.length > 0 ? (
              <DrilledCubeGeometry color={color} holes={holes} />
            ) : (
              <CubeGeometry color={color} />
            )
          )}
          {type === 'triangle' && <TriangleGeometry color={color} />}
          
          {/* Selection Highlight */}
          {isSelected && (
             <mesh>
                <boxGeometry args={[1.05, 1.05, 1.05]} />
                <meshBasicMaterial color="#ffff00" wireframe />
             </mesh>
          )}
        </>
      )}
    </group>
  );
};
