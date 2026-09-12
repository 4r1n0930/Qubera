import { useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'
import type { TutorMessage } from '../../hooks/useTutorChat'

interface TutorMessagesProps {
  messages: TutorMessage[]
  isThinking: boolean
  error: string | null
  onSpeak: (text: string) => void
}

/**
 * Scrollable conversation history. Purely presentational: reads from the
 * shared chat hook so message state survives every route change.
 */
export function TutorMessages({ messages, isThinking, error, onSpeak }: TutorMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'auto' })
  }, [messages, isThinking, error])

  if (messages.length === 0) {
    return (
      <div className="qut-messages qut-messages-empty" ref={scrollRef}>
        <div className="qut-empty">
          <p className="qut-empty-title">Ask me anything about what you are doing.</p>
          <p className="qut-empty-sub">
            I can see your circuit, your lesson and your progress — ask a question in plain
            English and I will help you understand it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="qut-messages" ref={scrollRef}>
      {messages.map((message, index) =>
        message.sender === 'user' ? (
          <div
            key={message.id}
            className="qut-bubble qut-bubble-user"
            style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
          >
            {message.text}
          </div>
        ) : (
          <div
            key={message.id}
            className="qut-bubble qut-bubble-tutor"
            style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
          >
            <span className="qut-bubble-text">{message.text || '\u00a0'}</span>
            {!message.pending && message.text && (
              <button
                type="button"
                className="qut-speak"
                onClick={() => onSpeak(message.text)}
                aria-label="Speak this reply"
                title="Listen"
              >
                <Volume2 size={13} />
              </button>
            )}
          </div>
        ),
      )}

      {isThinking && (
        <div className="qut-bubble qut-bubble-tutor qut-bubble-pending" aria-live="polite">
          <span className="qut-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}

      {error && <div className="qut-error">{error}</div>}
    </div>
  )
}