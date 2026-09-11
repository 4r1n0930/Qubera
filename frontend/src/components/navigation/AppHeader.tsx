import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, IconButton } from '../common'
import { Brand } from './Brand'
import { NavLinkItem } from './NavLinkItem'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { NavItem } from '../../types/navigation'

const primaryItems: NavItem[] = [
  { label: 'Learn', to: '/learn', icon: 'learn', section: 'primary' },
  { label: 'Lab', to: '/lab', icon: 'learn', section: 'primary' },
  { label: 'Roadmap', to: '/roadmap', icon: 'roadmap', section: 'primary' },
  { label: 'Playground', to: '/playground', icon: 'playground', section: 'primary' },
  { label: 'Progress', to: '/progress', icon: 'progress', section: 'primary' },
]

export function AppHeader() {
  const isMobile = useMediaQuery('(max-width: 860px)')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const getStarted = (
    <Link to="/roadmap" onClick={closeMenu}>
      <Button size="sm">Get started</Button>
    </Link>
  )

  return (
    <header className="q-header">
      <div className="q-header-inner">
        <Brand />

        {!isMobile && (
          <nav className="q-primary-nav" aria-label="Primary">
            {primaryItems.map((item) => (
              <NavLinkItem key={item.to} item={item} />
            ))}
          </nav>
        )}

        <div className="q-header-actions">
          <div className="q-header-tutor">
            <span className="q-tutor-trigger">
              <IconButton icon="tutor" label="AI Tutor" variant="outline" />
              <span className="q-tutor-text">AI Tutor</span>
            </span>
          </div>
          <div className="q-header-user">
            <IconButton icon="user" label="Account" />
          </div>
          {!isMobile && getStarted}
          {isMobile && (
            <IconButton
              icon={menuOpen ? 'close' : 'menu'}
              label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
            />
          )}
        </div>
      </div>

      {isMobile && menuOpen && (
        <nav ref={menuRef} className="q-mobile-nav" aria-label="Primary">
          {primaryItems.map((item) => (
            <NavLinkItem key={item.to} item={item} onNavigate={closeMenu} />
          ))}
          <div className="q-mobile-nav-account">
            <button type="button" className="q-mobile-nav-link">
              AI Tutor
            </button>
            <Link to="/roadmap" onClick={closeMenu}>
              <button type="button" className="q-mobile-nav-link">
                Get started
              </button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
