import { useState } from 'react'
import { ChevronDown, GripVertical } from 'lucide-react'
import type { GateDefinition, GateCategory } from '../../types/quantumLab'
import { GATE_CATALOG, GATE_CATEGORIES } from '../../types/quantumLab'

export function GatePalette() {
  const [open, setOpen] = useState<Record<GateCategory, boolean>>({
    GENERAL: true,
    ROTATION: false,
    CONTROLLED: false,
    MULTI_QUBIT: false,
    MEASURE: false,
  })

  const toggle = (cat: GateCategory) => setOpen((prev) => ({ ...prev, [cat]: !prev[cat] }))

  const handleDragStart = (e: React.DragEvent, gate: GateDefinition) => {
    e.dataTransfer.setData(
      'application/x-quantum-gate',
      JSON.stringify({ type: gate.type, qubits: gate.qubitsRequired })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="qlab-palette">
      <div className="qlab-palette-head">
        <span className="qlab-palette-title">Gates</span>
        <span className="qlab-palette-sub">drag onto a wire</span>
      </div>

      <div className="qlab-palette-scroll">
        {GATE_CATEGORIES.map((cat) => {
          const gates = GATE_CATALOG.filter((g) => g.category === cat.value)
          if (gates.length === 0) return null
          const isOpen = open[cat.value]
          return (
            <div key={cat.value} className="qlab-palette-group">
              <button
                type="button"
                className="qlab-palette-group-head"
                onClick={() => toggle(cat.value)}
                aria-expanded={isOpen}
              >
                <span className="qlab-palette-group-label">{cat.label}</span>
                <ChevronDown
                  size={14}
                  className={`qlab-palette-chev ${isOpen ? 'is-open' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="qlab-palette-gates">
                  {gates.map((gate) => (
                    <button
                      key={gate.type}
                      type="button"
                      className={`qlab-palette-gate qlab-palette-gate-${String(gate.type).toLowerCase()}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, gate)}
                    >
                      <GripVertical size={10} className="qlab-palette-gate-grip" />
                      <span className="qlab-palette-gate-symbol">{gate.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
