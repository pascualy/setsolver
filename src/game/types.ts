/**
 * Type definitions for the Set game solver.
 */

export type Shape = 'diamond' | 'oval' | 'squiggle';
export type Color = 'red' | 'green' | 'purple';
export type CardNumber = 1 | 2 | 3;
export type Shading = 'solid' | 'striped' | 'empty';

export interface CardProperties {
  shape: Shape;
  color: Color;
  number: CardNumber;
  shading: Shading;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectedCard extends CardProperties {
  id: number;
  bbox: BoundingBox;
  confidence: number;
}

export interface SetResult {
  cards: [DetectedCard, DetectedCard, DetectedCard];
  indices: [number, number, number];
}

export interface ProcessedFrame {
  cards: DetectedCard[];
  sets: SetResult[];
  timestamp: number;
}

// Index mappings
export const SHAPES: Shape[] = ['diamond', 'oval', 'squiggle'];
export const COLORS: Color[] = ['red', 'green', 'purple'];
export const NUMBERS: CardNumber[] = [1, 2, 3];
export const SHADINGS: Shading[] = ['solid', 'striped', 'empty'];

export const IDX_TO_SHAPE: Record<number, Shape> = {
  0: 'diamond',
  1: 'oval',
  2: 'squiggle',
};

export const IDX_TO_COLOR: Record<number, Color> = {
  0: 'red',
  1: 'green',
  2: 'purple',
};

export const IDX_TO_NUMBER: Record<number, CardNumber> = {
  0: 1,
  1: 2,
  2: 3,
};

export const IDX_TO_SHADING: Record<number, Shading> = {
  0: 'solid',
  1: 'striped',
  2: 'empty',
};
