/**
 * Berry's student-facing chat experience.
 *
 * Two-pane: the orb (with voice control) and the conversation. The orb
 * mirrors the chat hook's thinking/activity states, and the mic speaks
 * directly through the Web Speech layer.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react'
import { BerryOrb, type BerryState } from './BerryOrb'
import type { BerryVoice } from '../../hooks/useBerryVoice'
import type { TutorChatState, TutorMessage } from '../../hooks/useTutorChat'

interface BerryOverlayProps {
  chat: TutorChatState
  voice: BerryVoice
  speakReplies?: boolean
  onClose?: () => void
}

const SUGGESTIONS = [
  'What is superposition?',
  'Explain entanglement like I\u2019m five',
  'Run my circuit',
  'What am I struggling with?',
  'Take me to my progress',
]

export function BerryOverlay({ chat, voice, speakReplies = true, onClose }: BerryOverlayProps) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, isThinking, activity, error, send } = chat

  const orbState: BerryState = useMemo(() => {
    if (error) return 'error'
    if (voice.listening) return 'listening'
    if (voice.speaking) return 'speaking'
    if (isThinking) return 'thinking'
    return messages.length === 0 ? 'quiet' : 'idle'
  }, [error, voice.listening, voice.speaking, isThinking, messages.length])

  // Speak the latest completed tutor reply.
  useEffect(() => {
    if (!speakReplies) return
    const last = messages[messages.length - 1]
    if (last && last.sender === 'tutor' && !last.pending && last.text) {
      voice.speak(last.text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, speakReplies])

  // Auto-scroll on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, activity, isThinking])

  const toggleMic = () => {
    if (chat.isThinking) return
    if (voice.listening) {
      voice.stopListening()
    } else {
      voice.cancelSpeech()
      voice.startListening()
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || chat.isThinking) return
    send(draft)
    setDraft('')
  }

  const pickSuggestion = (text: string) => {
    setDraft('')
    send(text)
  }

  return (
    <div className="berry-layout">
      <section className="berry-presence" aria-label="Berry assistant">
        <div className="berry-presence-top">
          <span className="berry-brand">
            <Sparkles size={16} /> Berry — your quantum AI tutor
          </span>
          {onClose && (
            <button type="button" className="berry-icon-btn" aria-label="Close tutor" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="berry-presence-orb">
          <BerryOrb state={orbState} size={120} />
        </div>

        <button
          type="button"
          className={`berry-mic-btn ${voice.listening ? 'is-listening' : ''}`}
          onClick={toggleMic}
          disabled={!voice.supported || chat.isThinking}
          aria-label={voice.listening ? 'Stop listening' : 'Talk to Berry'}
        >
          {voice.listening ? <MicOff size={22} /> : <Mic size={22} />}
          <span>{voice.listening ? 'Stop listening' : 'Talk to Berry'}</span>
        </button>
        {!voice.supported && <p className="berry-voice-note">Voice isn\u2019t supported here — type instead.</p>}

        {activity && (
          <div className="berry-activity" role="status">
            <Loader2 size={14} className="berry-spin" />
            {activityText(activity)}
          </div>
        )}
      </section>

      <section className="berry-chat" aria-label="Tutor conversation">
        <div className="berry-chat-scroll" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="berry-empty">
              <p className="berry-empty-title">Ask me anything about quantum computing — or press the mic.</p>
              <div className="berry-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="berry-chip" onClick={() => pickSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {isThinking && messages.length > 0 && (
            <div className="berry-bubble berry-bubble-tutor berry-bubble-pending">
              <span className="berry-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}

          {error && <div className="berry-error">{error}</div>}
        </div>

        <form className="berry-input-row" onSubmit={submit}>
          <input
            className="berry-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Berry about a quantum concept…"
            aria-label="Message to your AI tutor"
            disabled={chat.isThinking}
          />
          <button type="submit" className="berry-send-btn" disabled={chat.isThinking || !draft.trim()}>
            {chat.isThinking ? <Loader2 size={18} className="berry-spin" /> : <Send size={18} />}
          </button>
        </form>
      </section>
    </div>
  )
}

function activityText(activity: string | string[] | null): string {
  if (Array.isArray(activity)) return activity.join(' ')
  return activity ?? ''
}

function MessageBubble({ message }: { message: TutorMessage }) {
  if (message.sender === 'user') {
    return (
      <div className="berry-bubble berry-bubble-user">
        {message.text}
      </div>
    )
  }

  return (
    <div className="berry-bubble berry-bubble-tutor">
      <Volume2 size={13} className="berry-bubble-icon" aria-hidden="true" />
      <span>{message.text}</span>
    </div>
  )
}