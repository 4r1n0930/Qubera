import type { CircuitState, GateType } from '../../../types/quantumLab'
import { GatePalette } from './GatePalette'
import { CircuitGrid } from './CircuitGrid'

interface CircuitBuilderProps {
  circuit: CircuitState
  onAddGate: (gate: GateType, targets: number[], moment: number) => void
  onRemoveGate: (id: string) => void
  onDuplicateGate: (id: string) => void
  selectedGateId: string | null
  onSelectGate: (id: string | null) => void
  highlightedGateId: string | null
  activeGateType?: GateType | null
  onDropMode?: (gate: GateType) => void
}

export function CircuitBuilder({
  circuit,
  onAddGate,
  onRemoveGate,
  onDuplicateGate,
  selectedGateId,
  onSelectGate,
  highlightedGateId,
  activeGateType,
  onDropMode,
}: CircuitBuilderProps) {
  return (
    <div className="qlab-circuit-section">
      <GatePalette activeGateType={activeGateType} onDropMode={onDropMode} />
      <CircuitGrid
        circuit={circuit}
        onAddGate={onAddGate}
        onRemoveGate={onRemoveGate}
        onDuplicateGate={onDuplicateGate}
        selectedGateId={selectedGateId}
        onSelectGate={onSelectGate}
        highlightedGateId={highlightedGateId}
      />
    </div>
  )
}
