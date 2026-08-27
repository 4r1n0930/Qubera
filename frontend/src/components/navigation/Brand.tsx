import { NavLink } from 'react-router-dom'
import { Icon } from '../common'

export interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <NavLink to="/" className="q-brand" aria-label="Quantum home">
      <span className="q-brand-mark" aria-hidden="true">
        <Icon name="spark" size={20} />
      </span>
      {!compact && <span className="q-brand-name">Quantum</span>}
    </NavLink>
  )
}
