import type { BackendType } from '../../../types/quantumLab'

interface FrameworkSelectorProps {
  value: BackendType
  onChange: (backend: BackendType) => void
  compact?: boolean
  label?: string
}

const FRAMEWORKS: { value: BackendType; label: string }[] = [
  { value: 'qiskit', label: 'Qiskit' },
  { value: 'pennylane', label: 'PennyLane' },
  { value: 'cirq', label: 'Cirq' },
]

export function FrameworkSelector({ value, onChange, compact, label }: FrameworkSelectorProps) {
  return (
    <div className="qlab-select-group">
      {label && (
        <label htmlFor={`framework-${value}`} className="qlab-select-label">
          {label}
        </label>
      )}
      <select
        id={`framework-${value}`}
        className={`qlab-select ${compact ? 'qlab-select-compact' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value as BackendType)}
        aria-label="Select quantum framework / backend"
      >
        {FRAMEWORKS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  )
}
