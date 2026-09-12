import { useEffect, useRef, useState } from 'react'
import { Mic, Sparkles, Volume2 } from 'lucide-react'
import type { TutorButtonStatus } from './TutorButton'

interface TutorCompanionProps {
  status: TutorButtonStatus
  unread: number
  contextLabel?: string
  listening: boolean
  speaking: boolean
  onOpen: () => void
}

/**
 * The collapsed "companion" state of the tutor: a small sphere docked to the
 * side of the screen. It appears after the tutor navigates the learner to a
 * topic, and keeps the voice channel alive so they can keep talking
 * hands-free while focusing on the redirected lesson/circuit. Tap to expand.
 */
export function TutorCompanion({
  status,
  unread,
  contextLabel,
  listening,
  speaking,
  onOpen,
}: TutorCompanionProps) {
  const [held, setHeld] = useState(false)
  const heldTimer = useRef<number | undefined>(undefined)

  // Track press quickly so the CSS can render the ring state without a
  // re-render race on quick taps.
  useEffect(() => () => window.clearTimeout(heldTimer.current), [])

  const onPointerDown = () => {
    heldTimer.current = window.setTimeout(() => setHeld(true), 160)
  }
  const finishPress = () => {
    window.clearTimeout(heldTimer.current)
    setHeld(false)
  }

  const hasAudio = listening || speaking
  const ring = listening ? 'listen' : speaking ? 'speak' : status === 'thinking' ? 'think' : 'idle'

  return (
    <button
      type="button"
      className={`qut-companion${hasAudio ? ' qut-companion-audio' : ''}${held ? ' qut-companion-held' : ''}`}
      data-ring={ring}
      onClick={onOpen}
      onPointerDown={onPointerDown}
      onPointerUp={finishPress}
      onPointerLeave={finishPress}
      onPointerCancel={finishPress}
      aria-label="Open Quantum Tutor"
      aria-haspopup="dialog"
      title={contextLabel ? `Quantum Tutor — ${contextLabel}` : 'Quantum Tutor'}
    >
      <span className="qut-companion-halo" aria-hidden="true" />
      <span className="qut-companion-core" aria-hidden="true">
        {listening ? <Mic size={20} /> : speaking ? <Volume2 size={20} /> : <Sparkles size={20} />}
      </span>
      <span className="qut-companion-ring" aria-hidden="true" />
      {unread > 0 && (
        <span className="qut-btn-badge" aria-hidden="true">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}