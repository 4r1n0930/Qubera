import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTutorChat } from '../../hooks/useTutorChat'
import { useBerryVoice } from '../../hooks/useBerryVoice'
import { getTutorContext, subscribeTutorContext } from '../../tutor/tutorContextStore'
import { TutorButton, type TutorButtonStatus } from './TutorButton'
import { TutorCompanion } from './TutorCompanion'
import { TutorPanel } from './TutorPanel'
import { buildTutorContext, contextLabelFor, quickActionsFor } from './tutorContext'
import { useTutorOpen } from './tutorOpen'
import '../../styles/tutor.css'

const CONTEXT_NOTICE_MS = 3600

/**
 * The persistent Quantum Tutor overlay.
 *
 * Lives at the root layout so it — and its conversation and voice state —
 * survive route changes across Dashboard, Learn, lessons, the Quantum Lab and
 * Progress. Three visual states:
 *
 *   closed    → launcher orb          (before first use)
 *   overlay   → full-screen, blurred chat with voice
 *   companion → small side sphere that keeps listening/speaking while the
 *               learner focuses on whatever lesson/circuit the tutor last
 *               navigated them to
 */
export function QuantumTutor() {
  const { mode, openOverlay, minimizeToCompanion } = useTutorOpen()
  const { isAuthenticated } = useAuth()

  const chatOptions = useMemo(() => ({ onNavigation: minimizeToCompanion }), [minimizeToCompanion])
  const chat = useTutorChat(chatOptions)
  const voice = useBerryVoice((text: string) => chat.send(text))

  const [autoSpeak, setAutoSpeak] = useState(true)
  const [contextLabel, setContextLabel] = useState<string>(() =>
    contextLabelFor(getTutorContext()),
  )
  const [contextNotice, setContextNotice] = useState<string | null>(null)

  const modeRef = useRef(mode)
  const lastLabelRef = useRef(contextLabelFor(getTutorContext()))
  const noticeTimerRef = useRef<number | undefined>(undefined)

  // Follow the live snapshot so the panel header always reflects where the
  // learner currently is. While the overlay is open, a screen or circuit
  // change also surfaces the transient "Context updated · …" notice.
  useEffect(() => {
    const unsubscribe = subscribeTutorContext(() => {
      const next = contextLabelFor(getTutorContext())
      setContextLabel(next)
      if (modeRef.current !== 'overlay' || lastLabelRef.current === next) return
      lastLabelRef.current = next
      if (noticeTimerRef.current !== undefined) window.clearTimeout(noticeTimerRef.current)
      setContextNotice(next)
      noticeTimerRef.current = window.setTimeout(() => {
        setContextNotice(null)
        noticeTimerRef.current = undefined
      }, CONTEXT_NOTICE_MS)
    })
    return unsubscribe
  }, [])

  // Mirror mode for the subscription above, and anchor the notice whenever the
  // overlay opens so moving screens while collapsed never flashes a stale
  // "Context updated" on the next open.
  useEffect(() => {
    modeRef.current = mode
    if (mode === 'overlay') {
      lastLabelRef.current = contextLabelFor(getTutorContext())
      return
    }
    if (noticeTimerRef.current !== undefined) {
      window.clearTimeout(noticeTimerRef.current)
      noticeTimerRef.current = undefined
    }
  }, [mode])

  // While the full-screen overlay is up, the app behind it should not scroll.
  useEffect(() => {
    if (mode !== 'overlay') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mode])

  // Escape collapses the overlay into the companion sphere instead of ending
  // the conversation; voice keeps playing.
  useEffect(() => {
    if (mode !== 'overlay') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') minimizeToCompanion()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, minimizeToCompanion])

  // Read new tutor replies aloud when auto-speak is on. Each reply is spoken
  // at most once (guarded by the last-spoken id) and never while the learner
  // is dictating.
  const lastSpokenRef = useRef<string | null>(null)
  useEffect(() => {
    if (!autoSpeak) return
    const latest = chat.messages[chat.messages.length - 1]
    if (!latest || latest.sender !== 'tutor' || latest.pending || !latest.text) return
    if (latest.id === lastSpokenRef.current || voice.listening) return
    lastSpokenRef.current = latest.id
    voice.speak(latest.text)
  }, [chat.messages, autoSpeak, voice])

  // Conversation length badge (launcher orb / companion sphere).
  const unread = useMemo(
    () => chat.messages.filter((m) => m.sender === 'tutor' && !m.pending).length,
    [chat.messages],
  )

  const toggleAutoSpeak = useCallback(() => setAutoSpeak((value) => !value), [])

  const openTutor = useCallback(() => {
    voice.cancelSpeech()
    openOverlay()
  }, [voice, openOverlay])

  const minimizeAndHush = useCallback(() => {
    voice.cancelSpeech()
    minimizeToCompanion()
  }, [voice, minimizeToCompanion])

  if (!isAuthenticated) return null

  const status: TutorButtonStatus = chat.error ? 'error' : chat.isThinking ? 'thinking' : 'idle'

  return (
    <>
      {mode === 'closed' && (
        <TutorButton
          status={status}
          unread={unread}
          contextLabel={contextLabel}
          onClick={openTutor}
        />
      )}

      {mode === 'companion' && (
        <TutorCompanion
          status={status}
          unread={unread}
          contextLabel={contextLabel}
          listening={voice.listening}
          speaking={voice.speaking}
          onOpen={openTutor}
        />
      )}

      {mode === 'overlay' && (
        <TutorPanel
          chat={chat}
          voice={voice}
          autoSpeak={autoSpeak}
          onToggleAutoSpeak={toggleAutoSpeak}
          contextLabel={contextLabel}
          contextNotice={contextNotice}
          quickActions={quickActionsFor(buildTutorContext(getTutorContext()))}
          onMinimize={minimizeAndHush}
        />
      )}
    </>
  )
}