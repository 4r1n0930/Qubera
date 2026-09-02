import { Outlet } from 'react-router-dom'
import { PublicHeader } from '../components/home/PublicHeader'
import { PublicFooter } from '../components/home/PublicFooter'

export function PublicLayout() {
  return (
    <div className="home-page">
      <PublicHeader />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
