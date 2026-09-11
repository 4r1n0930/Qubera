import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Search,
  Flame,
  Bell,
  User,
  Settings,
  LogOut,
  BookOpen,
  Sparkles,
  Trophy,
  Menu,
} from 'lucide-react'

interface TopBarProps {
  onOpenSidebar: () => void
}

export function TopBar({ onOpenSidebar }: TopBarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setProfileOpen(false)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  return (
    <header className="dash-topbar">
      <button
        type="button"
        className="dash-icon-btn dash-mobile-toggle"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="dash-topbar-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics, labs, challenges..."
          aria-label="Search topics, labs, challenges"
        />
      </div>

      <div className="dash-topbar-actions">
        <span className="dash-streak dash-topbar-streak">
          <Flame size={17} fill="#f0a83b" stroke="#a5761c" aria-hidden="true" />
          6 day streak
        </span>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => {
              setNotifOpen((v) => !v)
              setProfileOpen(false)
            }}
          >
            <Bell size={19} />
            <span className="dash-dot" aria-hidden="true" />
          </button>
          {notifOpen && (
            <div className="dash-dropdown">
              <div className="dash-dropdown-head">
                <Bell size={15} /> Notifications
              </div>
              <button
                type="button"
                className="dash-dropdown-item"
                onClick={() => navigate('/dashboard/challenges')}
              >
                <BookOpen size={16} /> Daily challenge is ready
              </button>
              <button
                type="button"
                className="dash-dropdown-item"
                onClick={() => navigate('/dashboard/ai-tutor')}
              >
                <Sparkles size={16} /> AI Tutor replied to you
              </button>
              <button
                type="button"
                className="dash-dropdown-item"
                onClick={() => navigate('/dashboard/leaderboard')}
              >
                <Trophy size={16} /> You reached rank #126
              </button>
            </div>
          )}
        </div>

        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="dash-avatar"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((v) => !v)
              setNotifOpen(false)
            }}
          >
            Explorer
          </button>
          {profileOpen && (
            <div className="dash-dropdown">
              <div className="dash-dropdown-head">
                <User size={15} /> Quantum Explorer
                <span className="dash-kbd">Lv. 12</span>
              </div>
              <button
                type="button"
                className="dash-dropdown-item"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/dashboard/profile')
                }}
              >
                <User size={16} /> My Profile
              </button>
              <button
                type="button"
                className="dash-dropdown-item"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/dashboard/settings')
                }}
              >
                <Settings size={16} /> Settings
              </button>
              <button
                type="button"
                className="dash-dropdown-item"
                onClick={() => {
                  setProfileOpen(false)
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
