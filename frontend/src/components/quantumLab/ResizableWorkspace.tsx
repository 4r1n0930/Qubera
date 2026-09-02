import { useRef, useCallback, type ReactNode } from 'react'

export interface SplitPositions {
  horizontal: number
  vertical: number
}

interface ResizableWorkspaceProps {
  left: ReactNode
  right: ReactNode
  bottom: ReactNode
  positions: SplitPositions
  onSplitChange: (positions: SplitPositions) => void
}

export function ResizableWorkspace({
  left,
  right,
  bottom,
  positions,
  onSplitChange,
}: ResizableWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const onMouseDownHorizontal = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const parent = parentRef.current
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const startX = e.clientX
      const startPos = positions.horizontal

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        const newHPos = Math.max(18, Math.min(82, (startPos * parentRect.width + delta) / parentRect.width * 100))
        onSplitChange({ horizontal: newHPos, vertical: positions.vertical })
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        containerRef.current?.classList.remove('qlab-ws-dragging')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      containerRef.current?.classList.add('qlab-ws-dragging')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [positions.horizontal, positions.vertical, onSplitChange]
  )

  const onMouseDownVertical = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const parent = parentRef.current
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const startY = e.clientY
      const startPos = positions.vertical

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - startY
        const newVPos = Math.max(8, Math.min(85, (startPos * parentRect.height + delta) / parentRect.height * 100))
        onSplitChange({ horizontal: positions.horizontal, vertical: newVPos })
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        containerRef.current?.classList.remove('qlab-ws-dragging')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      containerRef.current?.classList.add('qlab-ws-dragging')
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [positions.horizontal, positions.vertical, onSplitChange]
  )

  return (
    <div ref={containerRef} className="qlab-ws-container">
      <div ref={parentRef} className="qlab-ws-inner">
        {/* Top row: Circuit | Code */}
        <div className="qlab-ws-top" style={{ flexBasis: `${positions.vertical}%` }}>
          <div className="qlab-ws-circuit" style={{ flexBasis: `${positions.horizontal}%` }}>
            {left}
          </div>

          <div
            className="qlab-ws-splitter qlab-ws-splitter-h"
            onMouseDown={onMouseDownHorizontal}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(positions.horizontal)}
            tabIndex={0}
          />

          <div className="qlab-ws-code" style={{ flexBasis: `${100 - positions.horizontal}%` }}>
            {right}
          </div>
        </div>

        {/* Vertical splitter */}
        <div
          className="qlab-ws-splitter qlab-ws-splitter-v"
          onMouseDown={onMouseDownVertical}
          role="separator"
          aria-orientation="horizontal"
          aria-valuenow={Math.round(100 - positions.vertical)}
          tabIndex={0}
        />

        {/* Results panel */}
        <div className="qlab-ws-results" style={{ flexBasis: `${100 - positions.vertical}%` }}>
          {bottom}
        </div>
      </div>
    </div>
  )
}
