/**
 * Set Game Solver
 * 
 * Core logic for finding valid Sets from detected cards.
 * Based on the rules from jgrodziski/set-game:
 * - For each property (shape, color, number, shading), all three cards must be
 *   either all the same OR all different.
 * - This is equivalent to: count of unique values ≠ 2
 */

import type { Card, SetResult, Shape, Color, Number, Shading } from '../types'

// Constants for mapping indices to values
export const SHAPES: Shape[] = ['diamond', 'oval', 'squiggle']
export const COLORS: Color[] = ['red', 'green', 'purple']
export const NUMBERS: Number[] = [1, 2, 3]
export const SHADINGS: Shading[] = ['solid', 'striped', 'empty']

/**
 * Check if three values are either all the same or all different.
 * This is the core rule of the Set game.
 * 
 * Returns true if valid (all same or all different)
 * Returns false if invalid (exactly 2 are the same)
 */
function isIdenticalOrDistinct<T>(v1: T, v2: T, v3: T): boolean {
  const uniqueCount = new Set([v1, v2, v3]).size
  // Valid: 1 (all same) or 3 (all different)
  // Invalid: 2 (two same, one different)
  return uniqueCount !== 2
}

/**
 * Check if three cards form a valid Set.
 */
export function isValidSet(c1: Card, c2: Card, c3: Card): boolean {
  return (
    isIdenticalOrDistinct(c1.shape, c2.shape, c3.shape) &&
    isIdenticalOrDistinct(c1.color, c2.color, c3.color) &&
    isIdenticalOrDistinct(c1.number, c2.number, c3.number) &&
    isIdenticalOrDistinct(c1.shading, c2.shading, c3.shading)
  )
}

/**
 * Find all valid Sets from a list of cards.
 * 
 * Uses brute-force O(n³) approach, which is fine since n ≤ 21 typically
 * (max ~1,771 combinations for 21 cards).
 */
export function findAllSets(cards: Card[]): SetResult[] {
  const sets: SetResult[] = []
  const n = cards.length

  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          sets.push({
            cards: [cards[i], cards[j], cards[k]],
            indices: [i, j, k] as [number, number, number],
          })
        }
      }
    }
  }

  return sets
}

/**
 * Optimized set finding using hash-based lookup.
 * For each pair of cards, compute what the third card would need to be
 * for a valid set, then check if that card exists.
 * 
 * O(n²) instead of O(n³), useful for larger card counts.
 */
export function findAllSetsOptimized(cards: Card[]): SetResult[] {
  const sets: SetResult[] = []
  
  // Build a lookup map: card signature -> index
  const cardMap = new Map<string, number>()
  cards.forEach((card, idx) => {
    const key = `${card.shape}-${card.color}-${card.number}-${card.shading}`
    cardMap.set(key, idx)
  })

  // For each pair, compute required third card
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const required = computeRequiredThirdCard(cards[i], cards[j])
      const key = `${required.shape}-${required.color}-${required.number}-${required.shading}`

      if (cardMap.has(key)) {
        const k = cardMap.get(key)!
        // Only count if k > j to avoid duplicates
        if (k > j) {
          sets.push({
            cards: [cards[i], cards[j], cards[k]],
            indices: [i, j, k] as [number, number, number],
          })
        }
      }
    }
  }

  return sets
}

/**
 * Given two cards, compute what properties the third card would need
 * to form a valid set.
 */
function computeRequiredThirdCard(
  c1: Card,
  c2: Card
): { shape: Shape; color: Color; number: Number; shading: Shading } {
  return {
    shape: getThirdValue(c1.shape, c2.shape, SHAPES),
    color: getThirdValue(c1.color, c2.color, COLORS),
    number: getThirdValue(c1.number, c2.number, NUMBERS),
    shading: getThirdValue(c1.shading, c2.shading, SHADINGS),
  }
}

/**
 * Given two values of a property, determine what the third value must be.
 * - If both are the same, third must also be the same
 * - If both are different, third must be the remaining value
 */
function getThirdValue<T>(v1: T, v2: T, allValues: T[]): T {
  if (v1 === v2) {
    // All same
    return v1
  }
  // All different - find the third value
  return allValues.find((v) => v !== v1 && v !== v2)!
}

/**
 * Analyze a set and return human-readable description of why it's valid.
 */
export function analyzeSet(cards: [Card, Card, Card]): {
  shape: 'all same' | 'all different'
  color: 'all same' | 'all different'
  number: 'all same' | 'all different'
  shading: 'all same' | 'all different'
} {
  const analyze = <T>(values: T[]): 'all same' | 'all different' => {
    const unique = new Set(values).size
    return unique === 1 ? 'all same' : 'all different'
  }

  return {
    shape: analyze(cards.map((c) => c.shape)),
    color: analyze(cards.map((c) => c.color)),
    number: analyze(cards.map((c) => c.number)),
    shading: analyze(cards.map((c) => c.shading)),
  }
}

/**
 * Convert index values to card properties.
 */
export function indicesToCard(
  shapeIdx: number,
  colorIdx: number,
  numberIdx: number,
  shadingIdx: number
): { shape: Shape; color: Color; number: Number; shading: Shading } {
  return {
    shape: SHAPES[shapeIdx],
    color: COLORS[colorIdx],
    number: NUMBERS[numberIdx],
    shading: SHADINGS[shadingIdx],
  }
}
