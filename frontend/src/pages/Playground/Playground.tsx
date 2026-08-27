import { PageHeader, EmptyState } from '../../components/common'

export function Playground() {
  return (
    <div>
      <PageHeader
        overline="Hands-on"
        title="Playground"
        description="Interactive quantum visualizations, experiments and circuit building arrive in later steps."
      />
      <EmptyState
        icon="playground"
        title="Playground coming soon"
        description="Experiment with qubit states, quantum gates and entangled systems in an interactive sandbox."
      />
    </div>
  )
}
