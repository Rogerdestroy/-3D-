
export type BlockType = 'cube' | 'triangle';

export type BlockRotation = 0 | 1 | 2 | 3; // 0, 90, 180, 270 degrees

export type Tool = 'build' | 'delete' | 'drill' | 'paint' | 'circle' | 'rectangle' | 'triangle_poly' | 'select';

export type DrillAxis = 'x' | 'y' | 'z';

export interface BlockData {
  id: string;
  position: [number, number, number];
  color: string;
  type: BlockType;
  rotation: BlockRotation;
  holes?: number[]; // Indices of faces with holes (0-5)
}

export interface DragState {
  isDragging: boolean;
}

export interface LightSettings {
  enabled: boolean;
  intensity: number;
  position: [number, number, number];
}
