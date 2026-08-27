import { useId, useState, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: ReactNode
  content: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  defaultId?: string
  ariaLabel?: string
}

export function Tabs({ tabs, defaultId, ariaLabel }: TabsProps) {
  const generatedId = useId()
  const [activeId, setActiveId] = useState(defaultId ?? tabs[0]?.id)

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  return (
    <div className="q-tabs">
      <div className="q-tabs-list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const selected = tab.id === active.id
          return (
            <button
              key={tab.id}
              id={`${generatedId}-tab-${tab.id}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${generatedId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'q-tab q-tab-active' : 'q-tab'}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        id={`${generatedId}-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`${generatedId}-tab-${active.id}`}
        className="q-tabs-panel"
      >
        {active.content}
      </div>
    </div>
  )
}
