import { Outlet } from 'react-router-dom'
import { QuantumTutor, TutorOpenProvider } from '../components/tutor'

/**
 * Root shell for the whole app. Wraps every route in the tutor's open-state
 * provider and mounts the persistent Quantum Tutor overlay beside the routed
 * content, so the tutor (and its conversation) survives route changes without
 * needing a dedicated page.
 */
export function RootLayout() {
  return (
    <TutorOpenProvider>
      <Outlet />
      <QuantumTutor />
    </TutorOpenProvider>
  )
}