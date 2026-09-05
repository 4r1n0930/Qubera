import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { TopBar } from '../components/dashboard/TopBar'
import { useAuth } from '../contexts/AuthContext'

export function DashboardLayout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
