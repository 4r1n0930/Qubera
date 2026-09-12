/**
 * Tutor chat state machine.
 *
 * Owns the conversation: user messages, agent replies, the transient
 * "activity" status (e.g. "Running your circuit…"), and action dispatch
 * against the live UI. Page components (the AI Tutor screen and the Berry
 * overlay) call `send()`; everything else stays inside this hook.
 */

import { useCallback, useRef, useState } from 'react'
import { useTutorActions } from './useTutorActions'
import { chatTutorApi } from '../services/tutorApi'
import { getTutorContext } from '../tutor/tutorContextStore'
import { buildTutorContext } from '../components/tutor/tutorContext'
import type { TutorAction, TutorContextSnapshot, TutorReply } from '../tutor/types'

export type TutorSender = 'user' | 'tutor'

export interface TutorMessage {
  id: string
  sender: TutorSender
  text: string
  grounded?: boolean
  pending?: boolean
}

export interface TutorChatState {
  messages: TutorMessage[]
  isThinking: boolean
  activity: string | string[] | null
  error: string | null
  send: (text: string) => Promise<void>
  reset: () => void
  dispatchOnly: (actions: TutorAction[]) => Promise<void>
}

let messageSeq = 0

export function useTutorChat(): TutorChatState {
  const dispatch = useTutorActions()
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [activity, setActivity] = useState<string | string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const dispatchActions = useCallback(
    async (actions: TutorAction[]) => {
      const results = await dispatch(actions)
      const unhandled = results.filter((r) => !r.handled)
      return unhandled.length === 0
    },
    [dispatch],
  )

  const append = useCallback((message: TutorMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || inFlight.current) return

      inFlight.current = true
      const userMessage: TutorMessage = {
        id: `u${++messageSeq}`,
        sender: 'user',
        text: trimmed,
      }
      const tutorMessage: TutorMessage = {
        id: `t${++messageSeq}`,
        sender: 'tutor',
        text: '',
        pending: true,
      }
      append(userMessage)
      append(tutorMessage)
      setIsThinking(true)
      setError(null)

      try {
        const snapshot = getTutorContext()
        // The structured, Qubera-aware view the tutor knows how to read.
        const context: Partial<TutorContextSnapshot> = {
          ...snapshot,
          ...buildTutorContext(snapshot),
        }
        const reply: TutorReply = await chatTutorApi({
          message: trimmed,
          studentId: 'guest',
          context,
        })

        setActivity(reply.activity ?? null)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tutorMessage.id
              ? { ...m, text: reply.message, pending: false, grounded: reply.grounded }
              : m,
          ),
        )
        await dispatchActions(reply.actions)
        setActivity(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tutor service unavailable.')
        setMessages((prev) =>
          prev.map((m) => (m.id === tutorMessage.id ? { ...m, text: 'Sorry — I lost my connection to the tutor service. Try again.', pending: false } : m)),
        )
      } finally {
        inFlight.current = false
        setIsThinking(false)
      }
    },
    [append, dispatchActions],
  )

  const reset = useCallback(() => {
    setMessages([])
    setActivity(null)
    setError(null)
  }, [])

  const dispatchOnly = useCallback(
    async (actions: TutorAction[]) => {
      await dispatchActions(actions)
    },
    [dispatchActions],
  )

  return { messages, isThinking, activity, error, send, reset, dispatchOnly }
}