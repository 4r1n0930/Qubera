import { PageHeader, EmptyState } from '../../components/common'

export function Learn() {
  return (
    <div>
      <PageHeader
        overline="Structured learning"
        title="Learn"
        description="Structured modules that follow the Understand → Visualize → Experiment journey."
      />
      <EmptyState
        icon="learn"
        title="Learning modules coming soon"
        description="Qubits, superposition, measurement, gates, entanglement, circuits and algorithms will be taught here."
      />
    </div>
  )
}
