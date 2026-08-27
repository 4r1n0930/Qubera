import { useCallback, useState } from 'react'
import { Button, Icon, SectionHeader } from '../common'
import { QubitPanel } from './QubitPanel'
import {
  GATES,
  applyGate,
  zeroState,
  type QubitState,
} from '../../utils/quantum'

interface DemoButton {
  id: 'H' | 'X' | 'Z'
  hint: string
}

const controls: DemoButton[] = [
  { id: 'H', hint: 'Hadamard — create superposition' },
  { id: 'X', hint: 'Pauli-X — flip the qubit' },
  { id: 'Z', hint: 'Pauli-Z — flip the phase' },
]

export function InteractiveLearningPreview() {
  const [state, setState] = useState<QubitState>(zeroState)
  const [history, setHistory] = useState<string[]>([])

  const apply = useCallback((gateId: DemoButton['id']) => {
    setState((s) => applyGate(s, GATES[gateId].matrix))
    setHistory((h) => [...h, gateId])
  }, [])

  const reset = useCallback(() => {
    setState(zeroState)
    setHistory([])
  }, [])

  return (
    <section className="q-landing-section" aria-labelledby="try-title">
      <SectionHeader
        overline="Interactive learning preview"
        title="Don't just read it. Try it."
        description="This is a real, lightweight qubit — apply a gate and watch the state and its probabilities change."
      />

      <div className="q-try">
        <div className="q-try-visual">
          <QubitPanel state={state} showBasis />
        </div>

        <div className="q-try-controls">
          <div className="q-try-buttons" role="group" aria-label="Apply a gate">
            {controls.map((c) => (
              <button
                key={c.id}
                type="button"
                className="q-gate-btn"
                onClick={() => apply(c.id)}
                title={c.hint}
                aria-label={`Apply ${GATES[c.id].name} (${c.hint})`}
              >
                {c.id}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={reset} disabled={history.length === 0}>
            <Icon name="arrow-left" size={16} />
            Reset to |0⟩
          </Button>

          <div className="q-try-history" aria-live="polite">
            <span className="q-try-history-label">Applied:</span>
            {history.length === 0 ? (
              <span className="q-try-history-empty">none yet</span>
            ) : (
              <span className="q-try-history-gates">
                {history.join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
