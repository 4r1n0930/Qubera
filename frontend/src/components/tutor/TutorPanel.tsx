import { RotateCcw, Volume2, VolumeX, X, Mic } from 'lucide-react'
import type { BerryVoice } from '../../hooks/useBerryVoice'
import type { TutorChatState } from '../../hooks/useTutorChat'
import { TutorInput } from './TutorInput'
import { TutorMessages } from './TutorMessages'
import { TutorQuickActions } from './TutorQuickActions'

interface TutorPanelProps {
  chat: TutorChatState
  voice: BerryVoice
  autoSpeak: boolean
  onToggleAutoSpeak: () => void
  contextLabel: string
  contextNotice: string | null
  quickActions: string[]
  onMinimize: () => void
}

/**
 * Expanded state of the Quantum Tutor: a full-screen, blurred modal so the
 * learner stays "in" the app context — they can see the alive, softened page
 * behind the glass while they talk to the tutor hands-free.
 */
export function TutorPanel({
  chat,
  voice,
  autoSpeak,
  onToggleAutoSpeak,
  contextLabel,
  contextNotice,
  quickActions,
  onMinimize,
}: TutorPanelProps) {
  const { messages, isThinking, error, send, reset } = chat
  const started = messages.length > 0
  const listening = voice.listening
  const speaking = voice.speaking

  const toggleListen = () => {
    if (listening) {
      voice.stopListening()
    } else {
      voice.cancelSpeech()
      voice.startListening()
    }
  }

  return (
    <div className="qut-overlay">
      <div className="qut-backdrop" onClick={onMinimize} aria-hidden="true" />

      <section className="qut-panel" role="dialog" aria-modal="true" aria-label="Quantum Tutor">
        <header className="qut-header">
          <div className="qut-heading">
            <span
              className={`qut-orb${listening ? ' qut-orb-listening' : ''}${speaking ? ' qut-orb-speaking' : ''}`}
              aria-hidden="true"
            >
              {speaking && (
                <span className="qut-mini-wave" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
              {listening && (
                <span className="qut-mini-wave qut-mini-wave-listen" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </span>
            <div className="qut-title-wrap">
              <span className="qut-title">Quantum Tutor</span>
              <span className="qut-context" title={contextLabel}>
                Context:&nbsp;<b>{contextLabel}</b>
              </span>
              <span className="qut-voice-status" role="status">
                {listening
                  ? 'Listening…'
                  : speaking
                    ? 'Speaking…'
                    : voice.canSpeak
                      ? 'Tap the orb or mic to talk'
                      : 'Voice is not supported here'}
              </span>
            </div>
          </div>

          <div className="qut-actions">
            {voice.canSpeak && (
              <button
                type="button"
                className={`qut-icon${autoSpeak ? ' qut-icon-active' : ''}`}
                onClick={onToggleAutoSpeak}
                aria-label={autoSpeak ? 'Turn off spoken replies' : 'Turn on spoken replies'}
                aria-pressed={autoSpeak}
                title={autoSpeak ? 'Spoken replies on' : 'Spoken replies off'}
              >
                {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
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
              onClick={onMinimize}
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
          {/* Siri-style tap-to-talk orb */}
          <div className="qut-orb-row">
            <button
              type="button"
              className={`qut-listening-orb${listening ? ' qut-listening-orb-active' : ''}`}
              onClick={toggleListen}
              disabled={!voice.supported}
              aria-label={listening ? 'Stop listening' : 'Tap to talk to the tutor'}
              title={!voice.supported ? 'Voice input is not supported here' : 'Tap to talk'}
            >
              <span className="qut-listening-halo" aria-hidden="true" />
              {listening ? (
                <span className="qut-wave" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <Mic size={22} />
              )}
            </button>
            {/* Expanding pulse rings while listening */}
            {listening && (
              <span className="qut-pulse-rings" aria-hidden="true">
                <i />
                <i />
              </span>
            )}
          </div>

          {!started && (
            <TutorQuickActions actions={quickActions} onPick={(text) => send(text)} />
          )}
          <TutorInput disabled={isThinking} voice={voice} onSend={(text) => send(text)} />
        </div>
      </section>
    </div>
  )
}