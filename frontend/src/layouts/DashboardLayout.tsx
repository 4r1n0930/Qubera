import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { TopBar } from '../components/dashboard/TopBar'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
