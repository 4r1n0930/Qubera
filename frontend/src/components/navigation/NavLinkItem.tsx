import { NavLink } from 'react-router-dom'
import { Icon } from '../common'
import type { NavItem } from '../../types/navigation'

export interface NavLinkProps {
  item: NavItem
  onNavigate?: () => void
}

export function NavLinkItem({ item, onNavigate }: NavLinkProps) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `q-nav-link${isActive ? ' q-nav-link-active' : ''}`
      }
      onClick={onNavigate}
    >
      <Icon name={item.icon} size={18} />
      <span>{item.label}</span>
    </NavLink>
  )
}
