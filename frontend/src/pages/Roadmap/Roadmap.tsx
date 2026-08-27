import { PageHeader, EmptyState } from '../../components/common'

export function Roadmap() {
  return (
    <div>
      <PageHeader
        overline="Your path"
        title="Quantum Roadmap"
        description="A visual journey from foundations to algorithms. The interactive roadmap is built in a later step."
      />
      <EmptyState
        icon="roadmap"
        title="Roadmap coming soon"
        description="You'll follow a guided sequence from Quantum Foundations to Quantum Algorithms."
      />
    </div>
  )
}
