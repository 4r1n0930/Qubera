import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTutorChat } from '../../hooks/useTutorChat'
import { useBerryVoice } from '../../hooks/useBerryVoice'
import { getTutorContext, subscribeTutorContext } from '../../tutor/tutorContextStore'
import { TutorButton, type TutorButtonStatus } from './TutorButton'
import { TutorPanel } from './TutorPanel'
import { buildTutorContext, contextLabelFor, quickActionsFor } from './tutorContext'
import { useTutorOpen } from './tutorOpen'
import '../../styles/tutor.css'

const CONTEXT_NOTICE_MS = 3600

/**
 * The persistent Quantum Tutor overlay.
 *
 * Lives at the root layout so it — and its conversation — survive route
 * changes across Dashboard, Learn, lessons, the Quantum Lab and Progress.
 * It subscribes to the tutor context store, which pages (the lab, Learn,
 * Progress) keep populated with the learner's live circuit, simulation,
 * lesson and progress.
 */
export function QuantumTutor() {
  const { isOpen, open: openPanel, close } = useTutorOpen()
  const { isAuthenticated } = useAuth()

  const chat = useTutorChat()
  const voice = useBerryVoice((text: string) => chat.send(text))

  const [contextLabel, setContextLabel] = useState<string>(() =>
    contextLabelFor(getTutorContext()),
  )
  const [contextNotice, setContextNotice] = useState<string | null>(null)

  const isOpenRef = useRef(isOpen)
  const lastLabelRef = useRef(contextLabelFor(getTutorContext()))
  const noticeTimerRef = useRef<number | undefined>(undefined)

  // Follow the live snapshot so the panel header always reflects where the
  // learner currently is. While the panel is open, a screen or circuit change
  // also surfaces the transient "Context updated · …" notice.
  useEffect(() => {
    const unsubscribe = subscribeTutorContext(() => {
      const next = contextLabelFor(getTutorContext())
      setContextLabel(next)
      if (!isOpenRef.current || lastLabelRef.current === next) return
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

  // Mirror open/closed for the subscription above, and anchor the notice when
  // the panel opens so moving screens while collapsed never flashes a stale
  // "Context updated" on the next open.
  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) {
      lastLabelRef.current = contextLabelFor(getTutorContext())
      return
    }
    if (noticeTimerRef.current !== undefined) {
      window.clearTimeout(noticeTimerRef.current)
      noticeTimerRef.current = undefined
    }
  }, [isOpen])

  // A tiny unread pill on the collapsed button while the conversation grows.
  const unread = useMemo(
    () => (isOpen ? 0 : chat.messages.filter((m) => m.sender === 'tutor' && !m.pending).length),
    [isOpen, chat.messages],
  )

  // Escape collapses the panel; voice keeps playing otherwise.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const closeAndHush = useCallback(() => {
    voice.cancelSpeech()
    close()
  }, [voice, close])

  const openTutor = useCallback(() => {
    voice.cancelSpeech()
    openPanel()
  }, [voice, openPanel])

  if (!isAuthenticated) return null

  const status: TutorButtonStatus = chat.error ? 'error' : chat.isThinking ? 'thinking' : 'idle'

  return (
    <>
      {!isOpen && (
        <TutorButton
          status={status}
          unread={unread}
          contextLabel={contextLabel}
          onClick={openTutor}
        />
      )}
      {isOpen && (
        <TutorPanel
          chat={chat}
          voice={voice}
          contextLabel={contextLabel}
          contextNotice={contextNotice}
          quickActions={quickActionsFor(buildTutorContext(getTutorContext()))}
          onClose={closeAndHush}
        />
      )}
    </>
  )
}