import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/navigation/AppHeader'
import { AppFooter } from '../components/navigation/AppFooter'

export function MainLayout() {
  return (
    <div className="q-app">
      <a className="q-skip" href="#main">
        Skip to content
      </a>
      <AppHeader />
      <main id="main" className="q-main">
        <div className="q-content">
          <Outlet />
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
