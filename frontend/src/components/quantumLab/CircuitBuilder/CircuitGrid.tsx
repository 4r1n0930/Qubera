import { useState, useEffect, useMemo } from 'react'
import { Gauge, Copy, Trash2 } from 'lucide-react'
import type { CircuitState, GateOperation, GateType } from '../../../types/quantumLab'
import { Gate } from './Gate'
import { MultiQubitGate } from './MultiQubitGate'

interface CircuitGridProps {
  circuit: CircuitState
  onAddGate: (gate: GateType, targets: number[], moment: number) => void
  onRemoveGate: (id: string) => void
  onDuplicateGate?: (id: string) => void
  selectedGateId: string | null
  onSelectGate: (id: string | null) => void
  highlightedGateId: string | null
}

export function CircuitGrid({
  circuit,
  onAddGate,
  onRemoveGate,
  onDuplicateGate,
  selectedGateId,
  onSelectGate,
  highlightedGateId,
}: CircuitGridProps) {
  const [dragOverCell, setDragOverCell] = useState<{ qubit: number; moment: number } | null>(null)

  const maxMoment = Math.max(7, ...circuit.operations.map((op) => op.moment + 1))
  const moments = useMemo(() => Array.from({ length: maxMoment + 1 }, (_, i) => i), [maxMoment])
  const numQubits = Math.max(1, circuit.num_qubits)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGateId) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return
        }
        onRemoveGate(selectedGateId)
        onSelectGate(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGateId, onRemoveGate, onSelectGate])

  const handleDragOver = (e: React.DragEvent, qubit: number, moment: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (!dragOverCell || dragOverCell.qubit !== qubit || dragOverCell.moment !== moment) {
      setDragOverCell({ qubit, moment })
    }
  }

  const handleDragLeave = () => setDragOverCell(null)

  const handleDrop = (e: React.DragEvent, qubit: number, moment: number) => {
    e.preventDefault()
    setDragOverCell(null)
    const rawData = e.dataTransfer.getData('text/plain')
    if (!rawData) return

    try {
      const { type, qubits } = JSON.parse(rawData) as { type: GateType; qubits: number }
      if (qubits === 1) {
        onAddGate(type, [qubit], moment)
      } else if (qubits === 2) {
        const targetQubit = qubit < numQubits - 1 ? qubit + 1 : Math.max(0, qubit - 1)
        if (targetQubit !== qubit) {
          onAddGate(type, [qubit, targetQubit], moment)
        }
      }
    } catch {
      // ignore invalid drag data
    }
  }

  const getOpAt = (qubit: number, moment: number): GateOperation | undefined =>
    circuit.operations.find((op) => op.moment === moment && op.targets.includes(qubit))

  const twoQubitOps = circuit.operations.filter(
    (op) => (op.gate === 'CNOT' || op.gate === 'CZ' || op.gate === 'SWAP') && op.targets.length >= 2
  )

  const selectedOp = selectedGateId
    ? circuit.operations.find((op) => op.id === selectedGateId)
    : undefined

  return (
    <div
      className="qlab-circuit-card"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectGate(null)
      }}
    >
      <div className="qlab-circuit-canvas">
        <div className="qlab-moments-row">
          {moments.map((m) => (
            <div key={m} className="qlab-moment-header">
              {m}
            </div>
          ))}
        </div>

        {Array.from({ length: numQubits }, (_, qIdx) => (
          <div key={qIdx} className="qlab-wire-row">
            <div className="qlab-wire-label-group">
              <span className="qlab-qubit-label">q{qIdx}</span>
              <span className="qlab-qubit-state-tag">|0⟩</span>
            </div>

            <div className="qlab-wire-line-track" />

            <div className="qlab-wire-cells">
              {moments.map((mIdx) => {
                const isDragOver = dragOverCell?.qubit === qIdx && dragOverCell?.moment === mIdx
                const op = getOpAt(qIdx, mIdx)

                return (
                  <div
                    key={mIdx}
                    className={`qlab-grid-cell ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, qIdx, mIdx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, qIdx, mIdx)}
                    onClick={() => {
                      if (!op) onSelectGate(null)
                    }}
                  >
                    {op && renderGateNode(op, qIdx)}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {twoQubitOps.map((op) => (
          <ConnectorLine key={`conn-${op.id}`} op={op} selected={selectedGateId === op.id} highlighted={highlightedGateId === op.id} />
        ))}
      </div>

      {/* Contextual info for selected gate */}
      {selectedOp && (
        <div className="qlab-gate-context" role="status">
          <div className="qlab-gate-context-main">
            <span className="qlab-gate-context-gate">{selectedOp.gate}</span>
            <span className="qlab-gate-context-sep">·</span>
            <span>Qubit: {selectedOp.targets.join(', ')}</span>
            <span className="qlab-gate-context-sep">·</span>
            <span>Column: {selectedOp.moment}</span>
          </div>
          <div className="qlab-gate-context-actions">
            <button
              type="button"
              className="qlab-context-btn"
              onClick={() => onDuplicateGate?.(selectedOp.id)}
              title="Duplicate gate"
              aria-label="Duplicate gate"
            >
              <Copy size={13} />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              className="qlab-context-btn qlab-context-btn-danger"
              onClick={() => {
                onRemoveGate(selectedOp.id)
                onSelectGate(null)
              }}
              title="Remove gate"
              aria-label="Remove gate"
            >
              <Trash2 size={13} />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function renderGateNode(op: GateOperation, qIdx: number) {
    const isMulti = op.gate === 'CNOT' || op.gate === 'CZ' || op.gate === 'SWAP'
    const isMeasure = op.gate === 'M'

    if (isMulti) {
      return (
        <MultiQubitGate
          op={op}
          qubitIndex={qIdx}
          isSelected={selectedGateId === op.id}
          isHighlighted={highlightedGateId === op.id}
          onSelect={() => onSelectGate(op.id)}
          onDelete={() => {
            onRemoveGate(op.id)
            onSelectGate(null)
          }}
        />
      )
    }

    if (isMeasure) {
      return (
        <div
          className={`qlab-gate-node qlab-measure-node ${selectedGateId === op.id ? 'is-selected' : ''} ${highlightedGateId === op.id ? 'is-highlighted' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelectGate(op.id)
          }}
          title={`Measurement on wire q${qIdx}`}
        >
          <Gauge size={18} strokeWidth={2.2} />
        </div>
      )
    }

    return (
      <Gate
        op={op}
        qubitIndex={qIdx}
        isSelected={selectedGateId === op.id}
        isHighlighted={highlightedGateId === op.id}
        onSelect={() => onSelectGate(op.id)}
        onDelete={() => {
          onRemoveGate(op.id)
          onSelectGate(null)
        }}
      />
    )
  }
}

function ConnectorLine({
  op,
  selected,
  highlighted,
}: {
  op: GateOperation
  selected: boolean
  highlighted: boolean
}) {
  const [qA, qB] = op.targets
  const minQ = Math.min(qA, qB)
  const maxQ = Math.max(qA, qB)
  const momentIdx = op.moment

  const topOffset = 28 + minQ * 64 + 32
  const height = (maxQ - minQ) * 64
  const leftOffset = 90 + momentIdx * 68 + 30

  return (
    <div
      className="qlab-connector-line"
      style={{
        top: `${topOffset}px`,
        left: `${leftOffset}px`,
        height: `${height}px`,
        background:
          selected || highlighted ? 'var(--color-secondary)' : 'var(--color-primary)',
      }}
    />
  )
}
