import type { GateOperation } from '../../../types/quantumLab'
import { DeleteButton } from './Gate'

interface MultiQubitGateProps {
  op: GateOperation
  qubitIndex: number
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
  onDelete: () => void
}

export function MultiQubitGate({
  op,
  qubitIndex,
  isSelected,
  isHighlighted,
  onSelect,
  onDelete,
}: MultiQubitGateProps) {
  const isControlNode = (op.gate === 'CNOT' || op.gate === 'CZ') && op.targets[0] === qubitIndex
  const isCnotTarget = op.gate === 'CNOT' && op.targets[1] === qubitIndex
  const isCzTarget = op.gate === 'CZ' && op.targets[1] === qubitIndex
  const isSwapNode = op.gate === 'SWAP'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const selectedRing = isSelected
    ? 'qlab-multi-selected'
    : isHighlighted
      ? 'qlab-multi-highlighted'
      : ''

  // SWAP: draw crosses on both qubit wires
  if (isSwapNode) {
    return (
      <div
        className="qlab-multi-slot relative flex items-center justify-center cursor-pointer"
        onClick={handleClick}
        title={`SWAP on wires [${op.targets.join(', ')}]`}
      >
        <span className={`qlab-target-swap ${selectedRing}`}>✕</span>
        {isSelected && <DeleteButton onDelete={onDelete} />}
      </div>
    )
  }

  // CZ: control dot on both wires
  if (isControlNode || isCzTarget) {
    return (
      <div
        className="qlab-multi-slot relative flex items-center justify-center cursor-pointer"
        onClick={handleClick}
        title={`CZ on ${op.targets[0]} · ${op.targets[1]}`}
      >
        <span className={`qlab-control-dot ${selectedRing}`} />
        {isSelected && <DeleteButton onDelete={onDelete} />}
      </div>
    )
  }

  // CNOT: control dot on control wire, ⊕ on target wire
  if (isControlNode) {
    return (
      <div
        className="relative flex items-center justify-center cursor-pointer"
        onClick={handleClick}
        title={`CNOT control on wire q${qubitIndex}`}
      >
        <span className={`qlab-control-dot ${selectedRing}`} />
        {isSelected && <DeleteButton onDelete={onDelete} />}
      </div>
    )
  }

  if (isCnotTarget) {
    return (
      <div
        className="qlab-multi-slot relative flex items-center justify-center cursor-pointer"
        onClick={handleClick}
        title={`CNOT target on wire q${qubitIndex}`}
      >
        <span className={`qlab-target-cnot ${selectedRing}`}>+</span>
        {isSelected && <DeleteButton onDelete={onDelete} />}
      </div>
    )
  }

  return null
}
