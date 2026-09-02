import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Atom,
  Code2,
  Gamepad2,
  Swords,
  TrendingUp,
  Trophy,
  Bot,
  FolderOpen,
  User,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'

interface SidebarItem {
  label: string
  to: string
  icon: ComponentType<{ size?: number | string; strokeWidth?: number | string }>
}

const mainItems: SidebarItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Learn', to: '/dashboard/learn', icon: BookOpen },
  { label: 'Quantum Lab', to: '/dashboard/quantum-lab', icon: Atom },
  { label: 'Code Editor', to: '/dashboard/code-editor', icon: Code2 },
  { label: 'Games', to: '/dashboard/games', icon: Gamepad2 },
  { label: 'Challenges', to: '/dashboard/challenges', icon: Swords },
  { label: 'Progress', to: '/dashboard/progress', icon: TrendingUp },
  { label: 'Leaderboard', to: '/dashboard/leaderboard', icon: Trophy },
  { label: 'AI Tutor', to: '/dashboard/ai-tutor', icon: Bot },
  { label: 'Resources', to: '/dashboard/resources', icon: FolderOpen },
]

const accountItems: SidebarItem[] = [
  { label: 'Profile', to: '/dashboard/profile', icon: User },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`dash-sidebar${open ? ' dash-sidebar-open' : ''}`}
        aria-hidden={!open}
      >
        <div className="dash-sidebar-brand">
          <span className="dash-sidebar-logo" aria-hidden="true">
            <Sparkles size={20} strokeWidth={2.4} />
          </span>
          <span className="dash-sidebar-wordmark">QUBERA</span>
          <button
            type="button"
            className="dash-icon-btn dash-mobile-toggle"
            style={{ marginLeft: 'auto', background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#e7efe9' }}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="dash-sidebar-scroll">
          <nav className="dash-nav" aria-label="Main navigation">
            <div className="dash-nav-label">Main</div>
            {mainItems.map((item) => (
              <SidebarLink key={item.to} item={item} onClose={onClose} />
            ))}

            <div className="dash-nav-label">Account</div>
            {accountItems.map((item) => (
              <SidebarLink key={item.to} item={item} onClose={onClose} />
            ))}
          </nav>
        </div>

        <div className="dash-sidebar-foot">
          QUBERA · AI-powered quantum learning
        </div>
      </div>

      {open && (
        <div
          className="dash-mobile-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  )
}

function SidebarLink({
  item,
  onClose,
}: {
  item: SidebarItem
  onClose: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onClose}
    >
      {({ isActive }) => (
        <div
          className={`dash-nav-item${isActive ? ' dash-nav-item-active' : ''}`}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon size={18} strokeWidth={2} />
          <span>{item.label}</span>
        </div>
      )}
</NavLink>
  )
}