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
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.02
      utterance.pitch = 1.1
      utterance.onend = () => setStatus('idle')
      utterance.onerror = () => setStatus('idle')
      setStatus('speaking')
      window.speechSynthesis.speak(utterance)
    },
    [canSpeak],
  )

  const cancelSpeech = useCallback(() => {
    if (canSpeak) window.speechSynthesis.cancel()
    setStatus('idle')
  }, [canSpeak])

  useEffect(() => {
    return () => {
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