import { RotateCcw, X } from 'lucide-react'
import type { BerryVoice } from '../../hooks/useBerryVoice'
import type { TutorChatState } from '../../hooks/useTutorChat'
import { TutorInput } from './TutorInput'
import { TutorMessages } from './TutorMessages'
import { TutorQuickActions } from './TutorQuickActions'

interface TutorPanelProps {
  chat: TutorChatState
  voice: BerryVoice
  contextLabel: string
  contextNotice: string | null
  quickActions: string[]
  onClose: () => void
}

/**
 * Expanded state of the Quantum Tutor. A compact, fixed-position chat panel
 * that floats above the app, carrying Qubera's typography, spacing and color
 * tokens so it feels native.
 */
export function TutorPanel({
  chat,
  voice,
  contextLabel,
  contextNotice,
  quickActions,
  onClose,
}: TutorPanelProps) {
  const { messages, isThinking, error, send, reset } = chat
  const started = messages.length > 0

  return (
    <aside
      className="qut-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Quantum Tutor"
    >
      <header className="qut-header">
        <div className="qut-heading">
          <span className="qut-orb" aria-hidden="true" />
          <div className="qut-title-wrap">
            <span className="qut-title">Quantum Tutor</span>
            <span className="qut-context" title={contextLabel}>
              Context:&nbsp;<b>{contextLabel}</b>
            </span>
          </div>
        </div>

        <div className="qut-actions">
          {started && (
            <button
              type="button"
              className="qut-icon"
              onClick={reset}
              aria-label="Start a new conversation"
              title="New conversation"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            type="button"
            className="qut-icon"
            onClick={onClose}
            aria-label="Minimize Quantum Tutor"
            title="Minimize"
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {contextNotice && (
        <div className="qut-notice" role="status">
          Context updated · {contextNotice}
        </div>
      )}

      <TutorMessages
        messages={messages}
        isThinking={isThinking}
        error={error}
        onSpeak={(text) => voice.speak(text)}
      />

      <div className="qut-footer">
        {!started && (
          <TutorQuickActions actions={quickActions} onPick={(text) => send(text)} />
        )}
        <TutorInput disabled={isThinking} voice={voice} onSend={(text) => send(text)} />
      </div>
    </aside>
  )
}