import type { ReactNode } from 'react'

interface QubitWireProps {
  index: number
  children?: ReactNode
}

export function QubitWire({ index, children }: QubitWireProps) {
  return (
    <div className="qlab-wire-row">
      <div className="qlab-wire-label-group">
        <span className="qlab-qubit-label">q{index}</span>
        <span className="qlab-qubit-state-tag">|0⟩</span>
      </div>
      <div className="qlab-wire-line-track" />
      {children}
    </div>
  )
}
