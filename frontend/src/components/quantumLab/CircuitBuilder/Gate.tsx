import { X } from 'lucide-react'
import type { GateOperation } from '../../../types/quantumLab'

interface GateProps {
  op: GateOperation
  qubitIndex: number
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
  onDelete: () => void
}

export function Gate({ op, qubitIndex, isSelected, isHighlighted, onSelect, onDelete }: GateProps) {
  const isMeasure = op.gate === 'M'

  const baseClasses = `qlab-gate-node ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${isMeasure ? 'qlab-measure-node' : ''}`

  return (
    <div
      className={baseClasses}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      title={`${op.gate} Gate on wire q${qubitIndex}`}
    >
      <span>{op.gate}</span>
      {isSelected && (
        <DeleteButton onDelete={onDelete} />
      )}
    </div>
  )
}

export function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      type="button"
      className="qlab-node-delete"
      onClick={(e) => {
        e.stopPropagation()
        onDelete()
      }}
      title="Remove gate"
      aria-label="Remove gate"
    >
      <X size={12} />
    </button>
  )
}
