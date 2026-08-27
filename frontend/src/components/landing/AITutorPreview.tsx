import { useState } from 'react'
import { SectionHeader } from '../common'
import { tutorActions } from '../../data/landing'

interface TutorReply {
  title: string
  body: string
}

const baseReply: TutorReply = {
  title: 'A better way to think about it',
  body: 'A qubit is not "both 0 and 1" in the everyday sense. It exists in a quantum state that combines the possibilities of 0 and 1. Only at measurement does it resolve into a definite result — and that result is fundamentally probabilistic.',
}

const replies: Record<string, TutorReply> = {
  'Explain simply': {
    title: 'In plain words',
    body: 'Imagine a qubit as a coin still spinning in the air. Before it lands you cannot say "heads" or "tails" — it holds both possibilities at once. Measurement is the coin landing.',
  },
  'Give an analogy': {
    title: 'An analogy',
    body: 'Think of a dimmer switch instead of an on/off switch. A normal bit can be only fully on or fully off, but a qubit can be a blend — and the exact blend matters for the computation.',
  },
  'Show visually': {
    title: 'See it',
    body: 'On the interactive demo above, press the H gate on the qubit. The state changes from a single |0⟩ to a superposition where |0⟩ and |1⟩ each have a 50% chance. Try it, then reset and try again.',
  },
  'Give me a hint': {
    title: 'A small hint',
    body: 'Focus on the word "possibility" rather than "both". The key idea is that the quantum state stores information about a distribution of outcomes, not a single hidden value.',
  },
}

export function AITutorPreview() {
  const [active, setActive] = useState<string | null>(null)
  const reply = active ? replies[active] : baseReply

  return (
    <section className="q-landing-section" aria-labelledby="tutor-title">
      <SectionHeader
        overline="AI quantum tutor"
        title="Stuck? Ask. It adapts to you."
        description="A preview of the tutor. Later it will answer questions and match explanations to your level. For now, pick a style to see how one idea can be framed differently."
      />

      <div className="q-tutor">
        <div className="q-tutor-thread" aria-label="Example tutor conversation">
          <div className="q-tutor-msg q-tutor-student">
            <span className="q-tutor-role" aria-label="Student">
              Student
            </span>
            <p>Why can a qubit be both 0 and 1?</p>
          </div>

          <div className="q-tutor-msg q-tutor-ai">
            <span className="q-tutor-role q-tutor-role-ai" aria-label="AI tutor">
              AI tutor
            </span>
            <p className="q-tutor-title">{reply.title}</p>
            <p>{reply.body}</p>
          </div>
        </div>

        <div className="q-tutor-quick" role="group" aria-label="Choose an explanation style">
          <span className="q-tutor-quick-label">Ask for it differently</span>
          <div className="q-tutor-quick-buttons">
            {tutorActions.map((action) => {
              const selected = active === action.label
              return (
                <button
                  key={action.label}
                  type="button"
                  className={selected ? 'q-tutor-chip q-tutor-chip-on' : 'q-tutor-chip'}
                  aria-pressed={selected}
                  onClick={() =>
                    setActive((v) => (v === action.label ? null : action.label))
                  }
                >
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
