
import React, { useState, useRef, useEffect } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BlockData, BlockType, BlockRotation, Tool, DrillAxis, LightSettings } from '../types';
import { BlockGeometry } from './BlockGeometry';

interface SceneProps {
  blocks: BlockData[];
  setBlocks: (action: React.SetStateAction<BlockData[]>) => void;
  currentColor: string;
  currentType: BlockType;
  currentRotation: BlockRotation;
  currentTool: Tool;
  isCameraLocked: boolean;
  isFilled: boolean;
  drillAxis: DrillAxis;
  resetCameraTrigger: number;
  lightSettings: LightSettings;
  screenshotTrigger: number;
  stlTrigger: number;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

export const Scene: React.FC<SceneProps> = ({
  blocks,
  setBlocks,
  currentColor,
  currentType,
  currentRotation,
  currentTool,
  isCameraLocked,
  isFilled,
  drillAxis,
  resetCameraTrigger,
  lightSettings,
  screenshotTrigger,
  stlTrigger,
  selectedIds,
  setSelectedIds
}) => {
  const { gl, scene, camera, size } = useThree();
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
  const [hoverBlockId, setHoverBlockId] = useState<string | null>(null);
  const [hoverFaceIndex, setHoverFaceIndex] = useState<number | null>(null);
  
  // Selection Box State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{x: number, y: number} | null>(null);
  const [selectEnd, setSelectEnd] = useState<{x: number, y: number} | null>(null);

  // Circle specific state
  const [circleCenter, setCircleCenter] = useState<{ x: number, y: number, z: number, normal: THREE.Vector3 } | null>(null);
  const [circlePreview, setCirclePreview] = useState<[number, number, number][]>([]);

  // Rectangle specific state
  const [rectStartPos, setRectStartPos] = useState<[number, number, number] | null>(null);
  const [rectPreviewBox, setRectPreviewBox] = useState<{pos: [number, number, number], size: [number, number, number]} | null>(null);

  // Triangle Polygon State
  const [triPoints, setTriPoints] = useState<[number, number, number][]>([]);
  const [triPreview, setTriPreview] = useState<{pos: [number, number, number], type: BlockType, rotation: BlockRotation}[]>([]);

  const orbitRef = useRef<any>(null);
  const pointerDownPos = useRef<{x: number, y: number} | null>(null);
  
  // Track direction of the last manually placed block for "Space" key feature
  const lastPlacementNormal = useRef<THREE.Vector3 | null>(null);

  // Reset Camera Effect
  useEffect(() => {
    if (orbitRef.current) {
        orbitRef.current.reset();
    }
  }, [resetCameraTrigger]);

  // Screenshot Logic
  useEffect(() => {
    if (screenshotTrigger === 0) return;
    
    // Ensure the scene is rendered before capturing
    gl.render(scene, camera);
    
    const url = gl.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxel-screenshot-${new Date().toISOString().slice(0,19)}.png`;
    link.click();
  }, [screenshotTrigger, gl, scene, camera]);

  // STL Export Logic
  useEffect(() => {
    if (stlTrigger === 0) return;

    let stlString = 'solid voxel_model\n';
    let count = 0;

    const processMesh = (mesh: THREE.Mesh) => {
        // Skip hidden or non-mesh objects
        if (!mesh.isMesh) return;
        if (!mesh.visible) return;
        
        // Skip helper objects (grids, ghosts with transparent materials)
        const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
        if (mat.transparent && mat.opacity < 1) return;
        
        // Skip ground plane (which uses BasicMaterial with opacity 0 usually, but checking geometry type is safer)
        if (mesh.geometry.type === 'PlaneGeometry') return;

        // Ensure we have a geometry
        const geometry = mesh.geometry;
        if (!geometry) return;

        // Clone and convert to non-indexed to iterate triangles easily
        const geo = geometry.clone().toNonIndexed();
        const positions = geo.attributes.position;
        
        // Update world matrix to ensure correct position/rotation
        mesh.updateWorldMatrix(true, false);
        const matrixWorld = mesh.matrixWorld;

        const vA = new THREE.Vector3();
        const vB = new THREE.Vector3();
        const vC = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const diffBA = new THREE.Vector3();
        const diffCA = new THREE.Vector3();

        for (let i = 0; i < positions.count; i += 3) {
            vA.fromBufferAttribute(positions, i).applyMatrix4(matrixWorld);
            vB.fromBufferAttribute(positions, i + 1).applyMatrix4(matrixWorld);
            vC.fromBufferAttribute(positions, i + 2).applyMatrix4(matrixWorld);

            // Compute face normal manually for transformed vertices
            diffBA.subVectors(vB, vA);
            diffCA.subVectors(vC, vA);
            normal.crossVectors(diffBA, diffCA).normalize();
            
            // Check if valid normal
            if (isNaN(normal.x)) continue;

            stlString += `facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
            stlString += `  outer loop\n`;
            stlString += `    vertex ${vA.x} ${vA.y} ${vA.z}\n`;
            stlString += `    vertex ${vB.x} ${vB.y} ${vB.z}\n`;
            stlString += `    vertex ${vC.x} ${vC.y} ${vC.z}\n`;
            stlString += `  endloop\n`;
            stlString += `endfacet\n`;
            count++;
        }
    };

    scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
             processMesh(object as THREE.Mesh);
        }
    });

    stlString += 'endsolid voxel_model';

    if (count > 0) {
        const blob = new Blob([stlString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'model.stl';
        link.click();
        URL.revokeObjectURL(url);
    } else {
        alert("Nothing solid to export!");
    }

  }, [stlTrigger, scene]);

  // Smart Placement Shortcuts (Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (currentTool !== 'build') return;
        if (blocks.length === 0) return;

        const hasBlock = (x: number, y: number, z: number) => 
            blocks.some(b => Math.abs(b.position[0]-x)<0.1 && Math.abs(b.position[1]-y)<0.1 && Math.abs(b.position[2]-z)<0.1);

        // ENTER: Extend pattern (vector between last 2 blocks)
        if (e.code === 'Enter') {
             e.preventDefault();
             if (blocks.length >= 2) {
                 const last = blocks[blocks.length - 1];
                 const prev = blocks[blocks.length - 2];
                 const dx = Math.round(last.position[0] - prev.position[0]);
                 const dy = Math.round(last.position[1] - prev.position[1]);
                 const dz = Math.round(last.position[2] - prev.position[2]);

                 const newPos: [number, number, number] = [
                     last.position[0] + dx,
                     last.position[1] + dy,
                     last.position[2] + dz
                 ];

                 if (newPos[1] >= 0 && !hasBlock(...newPos)) {
                     const newB: BlockData = {
                        id: crypto.randomUUID(),
                        position: newPos,
                        color: currentColor,
                        type: currentType,
                        rotation: currentRotation
                    };
                    setBlocks(prev => [...prev, newB]);
                 }
             }
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, currentTool, currentColor, currentType, currentRotation]);

  useEffect(() => {
    // Reset temporary states on tool change
    setCircleCenter(null);
    setCirclePreview([]);
    setRectStartPos(null);
    setRectPreviewBox(null);
    setTriPoints([]);
    setTriPreview([]);
    setHoverPos(null);
    setHoverBlockId(null);
    setHoverFaceIndex(null);
    setIsSelecting(false);
    setSelectStart(null);
    setSelectEnd(null);
  }, [currentTool]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };

    // Start Selection Box logic
    if (currentTool === 'select') {
        // If clicking on a block, the handleClick logic handles toggle.
        // If clicking on background, start selection box.
        // We need to differentiate click vs drag.
        // But for drag box, we start immediately on background.
        
        let isBackground = true;
        let obj = e.object;
        while(obj) {
            if (obj.userData && obj.userData.id) {
                isBackground = false;
                break;
            }
            if (!obj.parent) break;
            obj = obj.parent;
        }

        if (isBackground) {
            setIsSelecting(true);
            setSelectStart({ x: e.clientX, y: e.clientY });
            setSelectEnd({ x: e.clientX, y: e.clientY });
        }
    }
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();

    // Update Selection Box
    if (isSelecting && selectStart) {
        setSelectEnd({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        setHoverPos(null);
        return;
    }
    
    if (e.buttons > 0) {
      setHoverPos(null);
      return;
    }

    let targetId: string | null = null;
    let obj = e.object;
    while(obj) {
        if (obj.userData && obj.userData.id) {
            targetId = obj.userData.id;
            break;
        }
        if (!obj.parent) break;
        obj = obj.parent;
    }

    // ----------------------
    // DRILL TOOL
    // ----------------------
    if (currentTool === 'drill') {
        if (targetId) {
            setHoverBlockId(targetId);
            const faceIdx = e.object.userData?.faceIndex !== undefined 
                ? e.object.userData.faceIndex 
                : e.face?.materialIndex;
            setHoverFaceIndex(faceIdx ?? null);
            setHoverPos(null);
        } else {
            setHoverBlockId(null);
            setHoverFaceIndex(null);
        }
        return;
    }

    // ----------------------
    // DELETE, PAINT, SELECT TOOLS
    // ----------------------
    if (currentTool === 'delete' || currentTool === 'paint' || currentTool === 'select') {
        if (targetId) {
            setHoverBlockId(targetId);
            setHoverPos(null);
        } else {
            setHoverBlockId(null);
        }
        return;
    }

    // ----------------------
    // BUILD, CIRCLE, RECTANGLE, TRIANGLE_POLY
    // ----------------------
    setHoverBlockId(null);
    setHoverFaceIndex(null);

    if (e.object && e.face) {
      const normal = e.face.normal.clone();
      normal.transformDirection(e.object.matrixWorld);
      
      const x = e.point.x + normal.x * 0.5;
      const y = e.point.y + normal.y * 0.5;
      const z = e.point.z + normal.z * 0.5;

      const snappedPos: [number, number, number] = [
        Math.floor(x) + 0.5,
        Math.floor(y) + 0.5,
        Math.floor(z) + 0.5,
      ];

      // Prevent placing below ground
      if (snappedPos[1] < 0.49) {
        setHoverPos(null);
        return;
      }

      // ----------------------
      // RECTANGLE TOOL LOGIC
      // ----------------------
      if (currentTool === 'rectangle') {
        if (rectStartPos) {
          const minX = Math.min(rectStartPos[0], snappedPos[0]);
          const maxX = Math.max(rectStartPos[0], snappedPos[0]);
          const minY = Math.min(rectStartPos[1], snappedPos[1]);
          const maxY = Math.max(rectStartPos[1], snappedPos[1]);
          const minZ = Math.min(rectStartPos[2], snappedPos[2]);
          const maxZ = Math.max(rectStartPos[2], snappedPos[2]);

          const size: [number, number, number] = [
            maxX - minX + 1,
            maxY - minY + 1,
            maxZ - minZ + 1
          ];
          const center: [number, number, number] = [
            minX + (size[0] - 1) / 2,
            minY + (size[1] - 1) / 2,
            minZ + (size[2] - 1) / 2
          ];
          setRectPreviewBox({ pos: center, size });
          setHoverPos(snappedPos);
        } else {
          setHoverPos(snappedPos);
        }
        return;
      }

      // ----------------------
      // TRIANGLE POLY TOOL LOGIC
      // ----------------------
      if (currentTool === 'triangle_poly') {
          setHoverPos(snappedPos);
          if (triPoints.length === 2) {
              const p1 = triPoints[0];
              const p2 = triPoints[1];
              const p3 = snappedPos;

              const previewBlocks: {pos: [number, number, number], type: BlockType, rotation: BlockRotation}[] = [];
              
              const minX = Math.min(p1[0], p2[0], p3[0]);
              const maxX = Math.max(p1[0], p2[0], p3[0]);
              const minY = Math.min(p1[1], p2[1], p3[1]);
              const maxY = Math.max(p1[1], p2[1], p3[1]);
              const minZ = Math.min(p1[2], p2[2], p3[2]);
              const maxZ = Math.max(p1[2], p2[2], p3[2]);

              const v0 = new THREE.Vector3().subVectors(new THREE.Vector3(...p2), new THREE.Vector3(...p1));
              const v1 = new THREE.Vector3().subVectors(new THREE.Vector3(...p3), new THREE.Vector3(...p1));
              const norm = new THREE.Vector3().crossVectors(v0, v1).normalize();

              const dot00 = v0.dot(v0);
              const dot01 = v0.dot(v1);
              const dot11 = v1.dot(v1);
              const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
              const vStart = new THREE.Vector3(...p1);

              for (let tx = minX; tx <= maxX; tx++) {
                  for (let ty = minY; ty <= maxY; ty++) {
                      for (let tz = minZ; tz <= maxZ; tz++) {
                          const p = new THREE.Vector3(tx, ty, tz);
                          const dist = norm.dot(p.clone().sub(vStart));
                          
                          if (Math.abs(dist) < 0.8) {
                              const v2 = p.clone().sub(vStart);
                              const dot02 = v0.dot(v2);
                              const dot12 = v1.dot(v2);
                              const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                              const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                              
                              if (u >= -0.1 && v >= -0.1 && (u + v) <= 1.1) {
                                  let blockType: BlockType = 'cube';
                                  let blockRot: BlockRotation = 0;
                                  const nx = norm.x;
                                  const ny = norm.y;
                                  const nz = norm.z;

                                  if (Math.abs(ny) > 0.3 && Math.abs(ny) < 0.9) {
                                      if (Math.abs(nx) > Math.abs(nz)) {
                                          if ((nx * ny) > 0) {
                                              blockType = 'triangle';
                                              blockRot = 0;
                                          } else {
                                              blockType = 'triangle';
                                              blockRot = 2;
                                          }
                                      } else {
                                          if ((nz * ny) > 0) {
                                               blockType = 'triangle';
                                               blockRot = 1;
                                          } else {
                                               blockType = 'triangle';
                                               blockRot = 3;
                                          }
                                      }
                                  }

                                  previewBlocks.push({ pos: [tx, ty, tz], type: blockType, rotation: blockRot });
                              }
                          }
                      }
                  }
              }

              const uniqueBlocks: typeof previewBlocks = [];
              const seen = new Set();
              previewBlocks.forEach(b => {
                  const k = b.pos.join(',');
                  if (!seen.has(k)) {
                      seen.add(k);
                      uniqueBlocks.push(b);
                  }
              });
              setTriPreview(uniqueBlocks);
          }
          return;
      }

      // ----------------------
      // CIRCLE TOOL LOGIC
      // ----------------------
      if (currentTool === 'circle' && circleCenter) {
          const dist = Math.sqrt(
              Math.pow(snappedPos[0] - circleCenter.x, 2) + 
              Math.pow(snappedPos[1] - circleCenter.y, 2) + 
              Math.pow(snappedPos[2] - circleCenter.z, 2)
          );
          const r = Math.round(dist);
          
          const newPreview: [number, number, number][] = [];
          const nx = Math.abs(circleCenter.normal.x);
          const ny = Math.abs(circleCenter.normal.y);
          
          for (let i = -r; i <= r; i++) {
              for (let j = -r; j <= r; j++) {
                  const d2 = i*i + j*j;
                  const d = Math.sqrt(d2);
                  
                  let match = false;
                  if (isFilled) {
                      if (d <= r + 0.5) match = true;
                  } else {
                      if (Math.abs(d - r) < 0.6) match = true;
                  }

                  if (match) {
                      let px = 0, py = 0, pz = 0;
                      if (ny > 0.9) { 
                          px = circleCenter.x + i;
                          py = circleCenter.y;
                          pz = circleCenter.z + j;
                      } else if (nx > 0.9) { 
                          px = circleCenter.x;
                          py = circleCenter.y + i;
                          pz = circleCenter.z + j;
                      } else { 
                          px = circleCenter.x + i;
                          py = circleCenter.y + j;
                          pz = circleCenter.z;
                      }
                      
                      if (py >= 0.5) {
                          newPreview.push([px, py, pz]);
                      }
                  }
              }
          }
          setCirclePreview(newPreview);
          setHoverPos(null);
      } else {
        const blocksAtPos = blocks.filter(b => 
          Math.abs(b.position[0] - snappedPos[0]) < 0.1 && 
          Math.abs(b.position[1] - snappedPos[1]) < 0.1 && 
          Math.abs(b.position[2] - snappedPos[2]) < 0.1
        );

        if (blocksAtPos.length === 0) {
            setHoverPos(snappedPos);
        } else {
             const existing = blocksAtPos[0];
             if (
                currentType === 'triangle' && 
                existing.type === 'triangle' &&
                blocksAtPos.length === 1 &&
                (existing.rotation + 2) % 4 === currentRotation &&
                currentTool === 'build'
            ) {
                setHoverPos(snappedPos);
            } else {
                setHoverPos(null);
            }
        }
      }
    }
  };

  const handlePointerOut = () => {
    setHoverPos(null);
    setHoverBlockId(null);
    setHoverFaceIndex(null);
    if (!circleCenter) setCirclePreview([]);
    if (!rectStartPos) setRectPreviewBox(null);
    if (triPoints.length < 3) setTriPreview([]);
  };

  const handlePointerUp = (e: any) => {
      // End Selection Box logic
      if (currentTool === 'select' && isSelecting && selectStart && selectEnd) {
          const minX = Math.min(selectStart.x, selectEnd.x);
          const maxX = Math.max(selectStart.x, selectEnd.x);
          const minY = Math.min(selectStart.y, selectEnd.y);
          const maxY = Math.max(selectStart.y, selectEnd.y);

          // Check drag direction
          const isCrossing = selectEnd.x < selectStart.x; // Right to Left
          
          const newSelection: string[] = [];

          blocks.forEach(block => {
              const pos = new THREE.Vector3(...block.position);
              // Project 3D position to 2D screen coordinates
              pos.project(camera);
              
              // Map -1..1 to screen coordinates
              const x = (pos.x * 0.5 + 0.5) * size.width;
              const y = (-(pos.y) * 0.5 + 0.5) * size.height;

              // Simple center-point check
              const inBox = x >= minX && x <= maxX && y >= minY && y <= maxY;
              
              if (isCrossing) {
                  // Crossing: Select if touching (approximate with radius for simple check)
                  // Or if strictly inside
                  // Usually Crossing selects anything intersecting.
                  // For voxel cubes, check if center is in box OR close to it.
                  if (inBox) {
                      newSelection.push(block.id);
                  } else {
                       // Heuristic: check if distance to box is small (touching edges)
                       // A 1 unit cube projects to some size. 
                       // Let's assume a rough screen radius check if not strictly inside.
                       const cx = Math.max(minX, Math.min(x, maxX));
                       const cy = Math.max(minY, Math.min(y, maxY));
                       const dist = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
                       if (dist < 40) { // arbitrary threshold for "touching"
                           newSelection.push(block.id);
                       }
                  }
              } else {
                  // Window: Strictly inside
                  if (inBox) {
                       newSelection.push(block.id);
                  }
              }
          });

          // If simple click (drag distance < 5), it's handled in handleClick usually, 
          // but if we clicked background, clear selection
          const dragDist = Math.sqrt(Math.pow(selectEnd.x - selectStart.x, 2) + Math.pow(selectEnd.y - selectStart.y, 2));
          if (dragDist < 5) {
              setSelectedIds([]);
          } else {
              setSelectedIds(newSelection);
          }
      }

      setIsSelecting(false);
      setSelectStart(null);
      setSelectEnd(null);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    
    // If selecting via box, don't trigger click
    if (currentTool === 'select' && isSelecting) return;

    if (e.button !== 0) return;
    if (!pointerDownPos.current) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return;

    // ----------------------
    // SELECT (Single Click)
    // ----------------------
    if (currentTool === 'select') {
        if (hoverBlockId) {
            if (selectedIds.includes(hoverBlockId)) {
                setSelectedIds(selectedIds.filter(id => id !== hoverBlockId));
            } else {
                setSelectedIds([...selectedIds, hoverBlockId]);
            }
        } else {
            // Clicked background -> Clear (if not dragging, which is handled in pointerUp)
            setSelectedIds([]);
        }
        return;
    }

    // ----------------------
    // DELETE
    // ----------------------
    if (currentTool === 'delete') {
      if (hoverBlockId) {
        setBlocks((prev) => prev.filter((b) => b.id !== hoverBlockId));
        setHoverBlockId(null);
      }
      return;
    }

    // ----------------------
    // PAINT
    // ----------------------
    if (currentTool === 'paint') {
        if (hoverBlockId) {
            setBlocks(prev => prev.map(b => b.id === hoverBlockId ? { ...b, color: currentColor } : b));
        }
        return;
    }

    // ----------------------
    // DRILL (Through-Hole)
    // ----------------------
    if (currentTool === 'drill') {
        if (hoverBlockId) {
             let facesToDrill: number[] = [];

             if (drillAxis === 'x') {
                 facesToDrill = [0, 1];
             } else if (drillAxis === 'y') {
                 facesToDrill = [2, 3];
             } else if (drillAxis === 'z') {
                 facesToDrill = [4, 5];
             }

             if (facesToDrill.length > 0) {
                 setBlocks(prev => prev.map(b => {
                     if (b.id === hoverBlockId) {
                         const currentHoles = b.holes || [];
                         let newHoles = [...currentHoles];
                         
                         const allPresent = facesToDrill.every(f => currentHoles.includes(f));
                         
                         if (allPresent) {
                             newHoles = newHoles.filter(h => !facesToDrill.includes(h));
                         } else {
                             facesToDrill.forEach(f => {
                                 if (!newHoles.includes(f)) newHoles.push(f);
                             });
                         }
                         return { ...b, holes: newHoles };
                     }
                     return b;
                 }));
             }
        }
        return;
    }

    // ----------------------
    // RECTANGLE
    // ----------------------
    if (currentTool === 'rectangle') {
        if (!hoverPos) return;

        if (!rectStartPos) {
            setRectStartPos(hoverPos);
        } else {
            const minX = Math.min(rectStartPos[0], hoverPos[0]);
            const maxX = Math.max(rectStartPos[0], hoverPos[0]);
            const minY = Math.min(rectStartPos[1], hoverPos[1]);
            const maxY = Math.max(rectStartPos[1], hoverPos[1]);
            const minZ = Math.min(rectStartPos[2], hoverPos[2]);
            const maxZ = Math.max(rectStartPos[2], hoverPos[2]);

            const newBlocks: BlockData[] = [];
            const existingMap = new Set(blocks.map(b => `${b.position[0]},${b.position[1]},${b.position[2]}`));

            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                         let shouldPlace = false;
                         if (isFilled) {
                             shouldPlace = true;
                         } else {
                             // Hollow: Frame only (Edges)
                             let edgeCount = 0;
                             if (x === minX || x === maxX) edgeCount++;
                             if (y === minY || y === maxY) edgeCount++;
                             if (z === minZ || z === maxZ) edgeCount++;
                             // A block is on the frame if it touches at least 2 "sides" of the bounding box
                             if (edgeCount >= 2) shouldPlace = true;
                         }

                         if (shouldPlace) {
                             const key = `${x},${y},${z}`;
                             if (!existingMap.has(key)) {
                                 newBlocks.push({
                                     id: crypto.randomUUID(),
                                     position: [x, y, z],
                                     color: currentColor,
                                     type: 'cube',
                                     rotation: 0
                                 });
                             }
                         }
                    }
                }
            }

            if (newBlocks.length > 0) {
                setBlocks(prev => [...prev, ...newBlocks]);
            }
            setRectStartPos(null);
            setRectPreviewBox(null);
        }
        return;
    }

    // ----------------------
    // TRIANGLE POLY
    // ----------------------
    if (currentTool === 'triangle_poly') {
        if (!hoverPos) return;
        const newPoints = [...triPoints, hoverPos];
        if (newPoints.length === 3) {
            const newBlocks: BlockData[] = [];
            const existingMap = new Set(blocks.map(b => `${b.position[0]},${b.position[1]},${b.position[2]}`));
            
            triPreview.forEach(b => {
                const key = `${b.pos[0]},${b.pos[1]},${b.pos[2]}`;
                if (!existingMap.has(key)) {
                    newBlocks.push({
                        id: crypto.randomUUID(),
                        position: b.pos,
                        color: currentColor,
                        type: b.type,
                        rotation: b.rotation
                    });
                }
            });

             if (newBlocks.length > 0) {
                setBlocks(prev => [...prev, ...newBlocks]);
            }
            setTriPoints([]);
            setTriPreview([]);
        } else {
            setTriPoints(newPoints);
        }
        return;
    }

    // ----------------------
    // CIRCLE
    // ----------------------
    if (currentTool === 'circle') {
        if (!hoverPos && !circleCenter) return;

        if (!circleCenter && hoverPos) {
            if (e.face && e.object) {
                const normal = e.face.normal.clone();
                normal.transformDirection(e.object.matrixWorld);
                setCircleCenter({ x: hoverPos[0], y: hoverPos[1], z: hoverPos[2], normal });
            }
        } else {
            if (circlePreview.length > 0) {
                const newBlocks: BlockData[] = [];
                const existingMap = new Set(blocks.map(b => `${b.position[0]},${b.position[1]},${b.position[2]}`));

                circlePreview.forEach(pos => {
                    const key = `${pos[0]},${pos[1]},${pos[2]}`;
                    if (!existingMap.has(key)) {
                        newBlocks.push({
                            id: crypto.randomUUID(),
                            position: pos,
                            color: currentColor,
                            type: 'cube',
                            rotation: 0
                        });
                    }
                });

                if (newBlocks.length > 0) {
                    setBlocks(prev => [...prev, ...newBlocks]);
                }
                setCircleCenter(null);
                setCirclePreview([]);
            }
        }
        return;
    }

    // ----------------------
    // BUILD (Default)
    // ----------------------
    if (hoverPos) {
      const blocksAtPos = blocks.filter(b => 
        Math.abs(b.position[0] - hoverPos[0]) < 0.1 && 
        Math.abs(b.position[1] - hoverPos[1]) < 0.1 && 
        Math.abs(b.position[2] - hoverPos[2]) < 0.1
      );

      let allow = false;
      if (blocksAtPos.length === 0) allow = true;
      else if (
          blocksAtPos.length === 1 &&
          currentType === 'triangle' &&
          blocksAtPos[0].type === 'triangle' &&
          (blocksAtPos[0].rotation + 2) % 4 === currentRotation
      ) {
          allow = true;
      }

      if (allow) {
        // Capture direction of placement for "Space" key
        if (e.face && e.object) {
             const n = e.face.normal.clone();
             n.transformDirection(e.object.matrixWorld);
             n.round();
             lastPlacementNormal.current = n;
        }

        const newBlock: BlockData = {
          id: crypto.randomUUID(),
          position: hoverPos,
          color: currentColor,
          type: currentType,
          rotation: currentRotation,
        };
        setBlocks((prev) => [...prev, newBlock]);
      }
    }
    
    pointerDownPos.current = null;
  };

  const deletePreviewBlock = blocks.find(b => b.id === hoverBlockId);

  return (
    <>
      <OrbitControls 
        ref={orbitRef} 
        makeDefault 
        dampingFactor={0.1} 
        enabled={!isCameraLocked && (!isSelecting)} 
        // If selecting, disable controls so we can drag box
        mouseButtons={{
          LEFT: -1 as any, 
          MIDDLE: THREE.MOUSE.PAN, 
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
      
      {/* Selection Box Overlay */}
      {isSelecting && selectStart && selectEnd && (
          <Html fullscreen style={{pointerEvents: 'none', zIndex: 100}}>
              <div style={{
                  position: 'absolute',
                  left: Math.min(selectStart.x, selectEnd.x),
                  top: Math.min(selectStart.y, selectEnd.y),
                  width: Math.abs(selectEnd.x - selectStart.x),
                  height: Math.abs(selectEnd.y - selectStart.y),
                  border: selectEnd.x < selectStart.x ? '2px dashed #4ade80' : '2px solid #60a5fa', // Green dashed (Crossing) vs Blue solid (Window)
                  backgroundColor: selectEnd.x < selectStart.x ? 'rgba(74, 222, 128, 0.2)' : 'rgba(96, 165, 250, 0.2)',
                  pointerEvents: 'none'
              }} />
          </Html>
      )}

      <ambientLight intensity={0.7} />
      <directionalLight 
        position={lightSettings.position} 
        intensity={lightSettings.enabled ? lightSettings.intensity : 0} 
        castShadow 
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Effectively infinite grid */}
      <gridHelper args={[2000, 2000, 0x444444, 0x222222]} position={[0, -0.01, 0]} />
      
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>

      {blocks.map((block) => (
        <BlockGeometry
          key={block.id}
          {...block}
          isSelected={selectedIds.includes(block.id)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      ))}

      {/* Delete/Paint/Drill Highlight */}
      {(currentTool === 'delete' || currentTool === 'paint' || currentTool === 'drill') && deletePreviewBlock && (
          <mesh position={deletePreviewBlock.position}>
             <boxGeometry args={[1.02, 1.02, 1.02]} />
             <meshBasicMaterial 
                color={currentTool === 'delete' ? '#ff0000' : (currentTool === 'paint' ? currentColor : '#ffff00')} 
                wireframe 
                opacity={0.8} 
                transparent 
             />
          </mesh>
      )}

      {/* Circle Preview */}
      {currentTool === 'circle' && circlePreview.length > 0 && (
          <group>
              {circlePreview.map((pos, idx) => (
                   <mesh key={idx} position={pos}>
                       <boxGeometry args={[1, 1, 1]} />
                       <meshStandardMaterial color={currentColor} opacity={0.5} transparent />
                   </mesh>
              ))}
          </group>
      )}
      
      {/* Rectangle Preview */}
      {currentTool === 'rectangle' && rectPreviewBox && (
          <group>
            {isFilled ? (
                <mesh position={rectPreviewBox.pos}>
                    <boxGeometry args={rectPreviewBox.size} />
                    <meshBasicMaterial color={currentColor} wireframe opacity={0.5} transparent />
                </mesh>
            ) : (
                <mesh position={rectPreviewBox.pos}>
                    <boxGeometry args={rectPreviewBox.size} />
                    <meshBasicMaterial color={currentColor} wireframe opacity={0.8} transparent />
                </mesh>
            )}
          </group>
      )}

      {/* Triangle Polygon Preview */}
      {currentTool === 'triangle_poly' && (
          <>
            {/* Points */}
            {triPoints.map((p, i) => (
                 <mesh key={i} position={p}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="lime" />
                 </mesh>
            ))}
            {/* Preview Blocks */}
            {triPreview.map((b, idx) => (
                 <BlockGeometry 
                    key={idx}
                    type={b.type}
                    color={currentColor}
                    rotation={b.rotation}
                    position={b.pos}
                    opacity={0.5}
                    transparent={true}
                />
            ))}
          </>
      )}

      {/* Circle Center Marker */}
      {currentTool === 'circle' && circleCenter && (
          <mesh position={[circleCenter.x, circleCenter.y, circleCenter.z]}>
              <sphereGeometry args={[0.2]} />
              <meshBasicMaterial color="yellow" />
          </mesh>
      )}

      {/* Standard Build Ghost Block */}
      {currentTool === 'build' && hoverPos && (
        <BlockGeometry 
            type={currentType}
            color={currentColor}
            rotation={currentRotation}
            position={hoverPos}
            opacity={0.5}
            transparent={true}
        />
      )}
      
      {/* Ghost for points (Rect/Circle/Tri) */}
      {(currentTool === 'rectangle' || (currentTool === 'circle' && !circleCenter) || (currentTool === 'triangle_poly')) && hoverPos && (
         <mesh position={hoverPos}>
             <sphereGeometry args={[0.15]} />
             <meshBasicMaterial color="white" opacity={0.5} transparent />
         </mesh>
      )}

    </>
  );
};
