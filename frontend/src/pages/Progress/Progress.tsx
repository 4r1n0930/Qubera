import { PageHeader, EmptyState, ProgressRing } from '../../components/common'

export function Progress() {
  return (
    <div>
      <PageHeader
        overline="Your understanding"
        title="Progress"
        description="Concept mastery, quizzes and achievements are tracked here."
      />
      <div className="q-progress-overview">
        <ProgressRing value={0} label="Overall progress" size={96} stroke={8}>
          <strong>0%</strong>
        </ProgressRing>
      </div>
      <EmptyState
        icon="progress"
        title="Progress tracking coming soon"
        description="Your learning progress and concept mastery will be shown here."
      />
    </div>
  )
}
