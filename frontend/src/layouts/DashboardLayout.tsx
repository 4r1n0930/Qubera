import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { TopBar } from '../components/dashboard/TopBar'
import { useAuth } from '../contexts/AuthContext'
import { getTutorContext, setTutorContext, subscribeTutorContext } from '../tutor/tutorContextStore'
import { syncTutorContextApi } from '../services/tutorApi'
import { screenPageLabel } from '../components/tutor/tutorContext'

const CONTEXT_SYNC_DELAY_MS = 400

function screenForPath(pathname: string): string {
  if (pathname.startsWith('/dashboard/learn')) return 'learn'
  if (pathname.startsWith('/dashboard/quantum-lab') || pathname.startsWith('/dashboard/lab')) return 'quantumLab'
  if (pathname.startsWith('/dashboard/progress')) return 'progress'
  if (pathname.startsWith('/dashboard/leaderboard')) return 'leaderboard'
  if (pathname.startsWith('/dashboard/profile')) return 'profile'
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  if (pathname.startsWith('/dashboard/resources')) return 'resources'
  if (pathname.startsWith('/dashboard/ai-tutor')) return 'ai-tutor'
  return 'dashboard'
}

export function DashboardLayout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Reflect the current route in the tutor context snapshot.
  useEffect(() => {
    const screen = screenForPath(location.pathname)
    setTutorContext({
      screen,
      route: location.pathname,
      page: screenPageLabel(screen),
    })
  }, [location.pathname])

  // Throttle-push the snapshot (plus any Quantum Lab state) to the tutor
  // context endpoint so the agent always sees the student's live screen.
  useEffect(() => {
    let timer: number | undefined
    const unsubscribe = subscribeTutorContext(() => {
      if (timer !== undefined) return
      timer = window.setTimeout(() => {
        timer = undefined
        void syncTutorContextApi(getTutorContext()).catch(() => {
          // non-fatal: the tutor just starts with slightly stale context
        })
      }, CONTEXT_SYNC_DELAY_MS)
    })
    return () => {
      unsubscribe()
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="dash-app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dash-main">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main">
          <div className="dash-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}