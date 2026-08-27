import type { ReactNode } from 'react'

export interface SectionHeaderProps {
  overline?: string
  title: ReactNode
  description?: ReactNode
  as?: 'h1' | 'h2' | 'h3'
  align?: 'left' | 'center'
}

export function SectionHeader({
  overline,
  title,
  description,
  as: Tag = 'h2',
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div className={`q-section-header q-section-header-${align}`}>
      {overline && <span className="q-overline">{overline}</span>}
      <Tag className="q-section-title">{title}</Tag>
      {description && (
        <p className="q-section-description">{description}</p>
      )}
    </div>
  )
}
