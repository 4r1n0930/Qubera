import { useState } from 'react'
import type { GateDefinition, GateType } from '../../../types/quantumLab'
import { GATE_CATALOG } from '../../../types/quantumLab'

interface GatePaletteProps {
  activeGateType?: GateType | null
  onDropMode?: (gate: GateType) => void
}

export function GatePalette({ activeGateType, onDropMode }: GatePaletteProps) {
  const [hoveredGate, setHoveredGate] = useState<GateDefinition | null>(null)

  const categories = [
    { label: 'BASIC', gates: GATE_CATALOG.filter((g) => g.category === 'BASIC') },
    { label: 'PHASE', gates: GATE_CATALOG.filter((g) => g.category === 'PHASE') },
    { label: 'CONTROLLED', gates: GATE_CATALOG.filter((g) => g.category === 'CONTROLLED') },
    { label: 'MULTI-QUBIT', gates: GATE_CATALOG.filter((g) => g.category === 'MULTI-QUBIT') },
    { label: 'MEASURE', gates: GATE_CATALOG.filter((g) => g.category === 'MEASURE') },
  ]

  const handleDragStart = (e: React.DragEvent, gate: GateDefinition) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: gate.type, qubits: gate.qubitsRequired }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="qlab-palette-card">
      <div className="qlab-palette-header">
        <span className="qlab-palette-title">Gate Palette</span>
        {hoveredGate && (
          <div className="qlab-palette-hint">
            <span className="font-semibold text-[var(--color-primary)]">{hoveredGate.name}:</span>
            <span>{hoveredGate.description}</span>
          </div>
        )}
      </div>

      <div className="qlab-palette-categories">
        {categories.map((cat) => (
          <div key={cat.label} className="qlab-category-block">
            <span className="qlab-category-label">{cat.label}</span>
            <div className="qlab-gate-list">
              {cat.gates.map((gate) => {
                const isSelected = activeGateType === gate.type
                let extraClass = ''
                if (gate.type === 'CNOT') extraClass = 'qlab-gate-btn-cnot'
                else if (gate.type === 'SWAP') extraClass = 'qlab-gate-btn-swap'
                else if (gate.type === 'M') extraClass = 'qlab-gate-btn-measure'

                return (
                  <button
                    key={gate.type}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, gate)}
                    onClick={() => onDropMode?.(gate.type)}
                    onMouseEnter={() => setHoveredGate(gate)}
                    onMouseLeave={() => setHoveredGate(null)}
                    className={`qlab-gate-btn ${extraClass} ${isSelected ? 'qlab-gate-btn-active' : ''}`}
                    title={`${gate.name} — ${gate.description}`}
                    aria-label={`Quantum gate ${gate.name}`}
                  >
                    {gate.symbol}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
