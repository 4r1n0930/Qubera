/**
 * Browser-native voice assist for the AI Tutor ("Berry").
 *
 * Uses the Web Speech API (SpeechRecognition for listening, speechSynthesis
 * for speaking) with feature detection and graceful degradation when the
 * browser/OS has no voices or a non-supporting engine.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionCtor = new () => RecognitionLike

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface RecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    item: (i: number) => {
      isFinal: boolean
      item: (j: number) => { transcript: string }
    }
  }
}

function speechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function finalTranscript(event: RecognitionEventLike): string {
  let text = ''
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results.item(i)
    if (result.isFinal) text += result.item(0)?.transcript ?? ''
  }
  return text.trim()
}

/* ------------------------- Text-to-speech helpers ------------------------- */
/* 
 * The tutor's replies are markdown. Dictating raw markdown is unreadable
 * ("double asterisk ... asterisk"), so we reduce it to plain spoken text and
 * split long replies into sentence-sized utterances that the engine queues.
 */

function toSpokenText(text: string): string {
  const withLinks = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  const withCodeLabel = withLinks.replace(/```[\s\S]*?```/g, 'I have included the code in a code block. ')
  const plain = withCodeLabel
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_~|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain
}

function chunkForSpeech(text: string, maxChars = 380): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*|\S[^.!?]*$/g) ?? [text]
  const chunks: string[] = []
  let buffer = ''
  for (const sentence of sentences) {
    if (buffer.length + sentence.length > maxChars && buffer) {
      chunks.push(buffer.trim())
      buffer = ''
    }
    buffer += sentence
  }
  if (buffer.trim()) chunks.push(buffer.trim())
  return chunks
}

function pickPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  return (
    voices.find(
      (v) => v.lang?.toLowerCase().startsWith('en') && /google|natural|neural|native/i.test(v.name),
    ) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ??
    null
  )
}

export type BerryVoiceStatus = 'idle' | 'listening' | 'speaking' | 'unavailable'

export interface BerryVoice {
  supported: boolean
  canSpeak: boolean
  status: BerryVoiceStatus
  listening: boolean
  speaking: boolean
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => void
  cancelSpeech: () => void
}

export function useBerryVoice(onVoiceResult: (text: string) => void): BerryVoice {
  const [status, setStatus] = useState<BerryVoiceStatus>('idle')
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const speakTimerRef = useRef<number | null>(null)
  const onResultRef = useRef(onVoiceResult)

  useEffect(() => {
    onResultRef.current = onVoiceResult
  }, [onVoiceResult])

  const supported = typeof window !== 'undefined' && speechRecognitionCtor() !== null
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!supported) return
    const Ctor = speechRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setStatus('listening')
    recognition.onend = () => setStatus((s) => (s === 'speaking' ? 'speaking' : 'idle'))
    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setStatus((s) => (s === 'speaking' ? 'speaking' : 'idle'))
        return
      }
      setStatus('unavailable')
    }
    recognition.onresult = (event) => {
      const text = finalTranscript(event)
      if (text) onResultRef.current(text)
    }

    recognitionRef.current = recognition
    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [supported])

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    try {
      recognition.start()
    } catch {
      // already started — ignore
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!canSpeak || !text) return
      const spoken = toSpokenText(text)
      if (!spoken) return
      const parts = chunkForSpeech(spoken)
      if (parts.length === 0) return

      const voice = pickPreferredVoice()

      // Chrome commonly swallows a speak() called immediately after cancel(),
      // so brake for a tick before queuing the new utterance(s).
      window.speechSynthesis.resume()
      window.speechSynthesis.cancel()
      if (speakTimerRef.current !== null) window.clearTimeout(speakTimerRef.current)
      setStatus('speaking')
      speakTimerRef.current = window.setTimeout(() => {
        window.speechSynthesis.cancel()
        parts.forEach((part, index) => {
          const utterance = new SpeechSynthesisUtterance(part)
          utterance.rate = 1.02
          utterance.pitch = 1.1
          if (voice) utterance.voice = voice
          const isLast = index === parts.length - 1
          utterance.onend = () => {
            if (isLast) setStatus('idle')
          }
          utterance.onerror = () => {
            if (isLast) setStatus('idle')
          }
          window.speechSynthesis.speak(utterance)
        })
        speakTimerRef.current = null
      }, 80)
    },
    [canSpeak],
  )

  const cancelSpeech = useCallback(() => {
    if (speakTimerRef.current !== null) {
      window.clearTimeout(speakTimerRef.current)
      speakTimerRef.current = null
    }
    if (canSpeak) window.speechSynthesis.cancel()
    setStatus('idle')
  }, [canSpeak])

  useEffect(() => {
    return () => {
      if (speakTimerRef.current !== null) window.clearTimeout(speakTimerRef.current)
      if (canSpeak) window.speechSynthesis.cancel()
    }
  }, [canSpeak])

  return {
    supported,
    canSpeak,
    status,
    listening: status === 'listening',
    speaking: status === 'speaking',
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  }
}