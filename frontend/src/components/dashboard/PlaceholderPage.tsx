import type { ComponentType } from 'react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: ComponentType<{ size?: number | string; strokeWidth?: number | string }>
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="dash-page">
      <div className="placeholder-card">
        <div className="placeholder-icon">
          <Icon size={26} strokeWidth={1.8} />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
