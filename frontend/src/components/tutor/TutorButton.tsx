import { Sparkles } from 'lucide-react'

export type TutorButtonStatus = 'idle' | 'thinking' | 'error'

interface TutorButtonProps {
  status: TutorButtonStatus
  unread: number
  contextLabel?: string
  onClick: () => void
}

/**
 * Collapsed state of the Quantum Tutor: a small, circular floating button
 * fixed to the bottom-right corner. Uses Qubera's brand gradient and tokens
 * so it reads as part of the app rather than as a bolt-on widget.
 */
export function TutorButton({ status, unread, contextLabel, onClick }: TutorButtonProps) {
  return (
    <button
      type="button"
      className="qut-btn"
      onClick={onClick}
      aria-label="Open Quantum Tutor"
      aria-haspopup="dialog"
      title={contextLabel ? `Quantum Tutor — ${contextLabel}` : 'Quantum Tutor'}
    >
      <span className="qut-btn-halo" aria-hidden="true" />
      <span className="qut-btn-core" aria-hidden="true">
        <Sparkles size={20} strokeWidth={2.1} />
      </span>
      <span className="qut-btn-state" aria-hidden="true" data-status={status} />
      {unread > 0 && (
        <span className="qut-btn-badge" aria-hidden="true">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}