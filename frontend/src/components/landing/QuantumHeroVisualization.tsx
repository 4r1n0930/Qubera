import { useState } from 'react'
import { Button } from '../common'
import { GATES, zeroState } from '../../utils/quantum'
import { QubitPanel } from './QubitPanel'
import { applyGate } from '../../utils/quantum'

export function QuantumHeroVisualization() {
  const [applied, setApplied] = useState(true)
  const state = applied ? applyGate(zeroState, GATES.H.matrix) : zeroState

  return (
    <div className="q-hero-vis">
      <div className="q-hero-vis-flow" aria-label="Quantum state evolution">
        <QubitPanel state={zeroState} />
        <div className="q-hero-vis-step" aria-hidden="true">
          <span className="q-hero-vis-gate">{applied ? 'H' : ' '}</span>
        </div>
        <QubitPanel state={state} />
      </div>

      <div className="q-hero-vis-actions">
        <Button
          size="sm"
          variant={applied ? 'outline' : 'primary'}
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
        >
          {applied ? 'Reset to |0⟩' : 'Apply H gate'}
        </Button>
        {applied && (
          <span className="q-hero-vis-hint">
            A Hadamard (H) gate puts the qubit into superposition.
          </span>
        )}
      </div>
    </div>
  )
}
