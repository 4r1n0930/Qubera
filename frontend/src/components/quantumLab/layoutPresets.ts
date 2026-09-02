import type { SplitPositions } from './ResizableWorkspace'

export type LayoutPreset = 'split' | 'circuit-focus' | 'code-focus' | 'results-focus'

export const LAYOUT_PRESETS: Record<LayoutPreset, { label: string; horizontal: number; vertical: number }> = {
  split: { label: 'Split', horizontal: 50, vertical: 70 },
  'circuit-focus': { label: 'Circuit Focus', horizontal: 70, vertical: 70 },
  'code-focus': { label: 'Code Focus', horizontal: 30, vertical: 70 },
  'results-focus': { label: 'Results Focus', horizontal: 50, vertical: 50 },
}

export const DEFAULT_POSITIONS: SplitPositions = {
  horizontal: LAYOUT_PRESETS.split.horizontal,
  vertical: LAYOUT_PRESETS.split.vertical,
}
