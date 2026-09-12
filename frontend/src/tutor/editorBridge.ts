/**
 * Tiny bridge between the tutor action dispatcher and the Quantum Lab's
 * Monaco editor. The dispatcher cannot reach into Monaco, so the lab registers
 * a handle here when its editor mounts; the handle reveals + positions a line.
 */

export interface EditorHandle {
  revealLine: (line: number) => boolean
}

let handle: EditorHandle | null = null

export function registerEditorHandle(next: EditorHandle | null): void {
  handle = next
}

export function getEditorHandle(): EditorHandle | null {
  return handle
}

/** True if a live editor consumed the request. */
export function tryRevealLine(line: number): boolean {
  try {
    return handle?.revealLine(line) ?? false
  } catch {
    return false
  }
}