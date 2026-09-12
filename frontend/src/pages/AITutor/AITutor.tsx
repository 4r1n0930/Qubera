import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BerryOverlay } from '../../components/berry/BerryOverlay'
import { useBerryVoice } from '../../hooks/useBerryVoice'
import { useTutorChat } from '../../hooks/useTutorChat'

export function AITutor() {
  const navigate = useNavigate()
  const chat = useTutorChat()
  const voice = useBerryVoice((text: string) => chat.send(text))

  const speakReplies = true

  // TTS can keep talking when the student leaves the screen — stop it.
  useEffect(() => {
    return () => voice.cancelSpeech()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="dash-page tutor-page">
      <BerryOverlay
        chat={chat}
        voice={voice}
        speakReplies={speakReplies}
        onClose={() => navigate('/dashboard')}
      />
    </div>
  )
}