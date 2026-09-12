import { Sparkles } from 'lucide-react'

interface TutorQuickActionsProps {
  actions: string[]
  onPick: (text: string) => void
}

/**
 * Contextual suggestions shown when the panel opens. The choice of actions is
 * derived from the current page/circuit, so it never has to be typed.
 */
export function TutorQuickActions({ actions, onPick }: TutorQuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="qut-quick" aria-label="Suggested questions">
      <span className="qut-quick-label" aria-hidden="true">
        <Sparkles size={12} /> Try asking
      </span>
      <div className="qut-quick-list">
        {actions.map((action) => (
          <button key={action} type="button" className="qut-chip" onClick={() => onPick(action)}>
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}