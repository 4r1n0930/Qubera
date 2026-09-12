import { useState, type FormEvent } from 'react'
import { Loader2, Mic, MicOff, Send } from 'lucide-react'
import type { BerryVoice } from '../../hooks/useBerryVoice'

interface TutorInputProps {
  disabled: boolean
  voice: BerryVoice
  onSend: (text: string) => void
}

/**
 * Message composer for the tutor panel: text input plus a (optional) on-device
 * microphone, mirroring the app-wide voice assist behaviour.
 */
export function TutorInput({ disabled, voice, onSend }: TutorInputProps) {
  const [draft, setDraft] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft('')
  }

  const toggleMic = () => {
    if (disabled) return
    if (voice.listening) {
      voice.stopListening()
    } else {
      voice.cancelSpeech()
      voice.startListening()
    }
  }

  return (
    <form className="qut-input-row" onSubmit={submit}>
      <button
        type="button"
        className={`qut-mic${voice.listening ? ' qut-mic-listening' : ''}${!voice.supported ? ' qut-mic-off' : ''}`}
        onClick={toggleMic}
        disabled={disabled || !voice.supported}
        aria-label={voice.listening ? 'Stop listening' : 'Talk to the tutor'}
        title={!voice.supported ? 'Voice input is not supported here' : undefined}
      >
        {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>

      <input
        className="qut-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ask anything about what you are learning…"
        aria-label="Message to your AI tutor"
        disabled={disabled}
        autoComplete="off"
      />

      <button
        type="submit"
        className="qut-send"
        disabled={disabled || !draft.trim()}
        aria-label="Send message"
      >
        {disabled ? <Loader2 size={17} className="qut-spin" /> : <Send size={17} />}
      </button>
    </form>
  )
}