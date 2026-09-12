import { Lightbulb, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { ChallengeDefinition } from '../../types/challenges'

interface ChallengeHeaderProps {
  challenge: ChallengeDefinition
  allChallenges: ChallengeDefinition[]
  onSelectChallenge: (c: ChallengeDefinition) => void
  attempts: number
  isCompleted: boolean
  showHint: boolean
  onToggleHint: () => void
}

const DIFFICULTY_LABELS: Record<ChallengeDefinition['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function ChallengeHeader({
  challenge,
  allChallenges,
  onSelectChallenge,
  attempts,
  isCompleted,
  showHint,
  onToggleHint,
}: ChallengeHeaderProps) {
  const currentIndex = allChallenges.findIndex((c) => c.id === challenge.id)
  const prevChallenge = currentIndex > 0 ? allChallenges[currentIndex - 1] : null
  const nextChallenge = currentIndex < allChallenges.length - 1 ? allChallenges[currentIndex + 1] : null

  return (
    <div className="qlab-challenge-header">
      <div className="qlab-challenge-header-top">
        <div className="qlab-challenge-meta">
          <div className="qlab-challenge-badges">
            <span className={`qlab-diff-badge ${challenge.difficulty}`}>
              {DIFFICULTY_LABELS[challenge.difficulty]}
            </span>
            <span className="qlab-topic-badge">{challenge.topic}</span>
            {isCompleted && (
              <span className="qlab-completed-badge" title="You have solved this challenge">
                <CheckCircle2 size={12} />
                <span>Solved</span>
              </span>
            )}
            {attempts > 0 && (
              <span className="qlab-attempts-badge">
                Attempt #{attempts + 1}
              </span>
            )}
          </div>
          <h2 className="qlab-challenge-title">{challenge.title}</h2>
          {challenge.description && (
            <p className="qlab-challenge-desc">{challenge.description}</p>
          )}
        </div>

        <div className="qlab-challenge-nav">
          <div className="qlab-challenge-stepper">
            <button
              type="button"
              className="qlab-nav-arrow"
              onClick={() => prevChallenge && onSelectChallenge(prevChallenge)}
              disabled={!prevChallenge}
              title="Previous Challenge"
              aria-label="Previous Challenge"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              className="qlab-challenge-select"
              value={challenge.id}
              onChange={(e) => {
                const found = allChallenges.find((c) => c.id === e.target.value)
                if (found) onSelectChallenge(found)
              }}
              aria-label="Select Challenge"
            >
              {allChallenges.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {i + 1}. {c.title} ({DIFFICULTY_LABELS[c.difficulty]})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="qlab-nav-arrow"
              onClick={() => nextChallenge && onSelectChallenge(nextChallenge)}
              disabled={!nextChallenge}
              title="Next Challenge"
              aria-label="Next Challenge"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {challenge.hint && (
            <button
              type="button"
              className={`qlab-hint-btn ${showHint ? 'is-active' : ''}`}
              onClick={onToggleHint}
              title="Toggle helpful hint"
              aria-expanded={showHint}
            >
              <Lightbulb size={14} />
              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            </button>
          )}
        </div>
      </div>

      {showHint && challenge.hint && (
        <div className="qlab-challenge-hint-box" role="note">
          <Lightbulb size={16} className="qlab-hint-icon" />
          <p className="qlab-hint-text">
            <strong>Hint:</strong> {challenge.hint}
          </p>
        </div>
      )}
    </div>
  )
}
