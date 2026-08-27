import { PageHeader, EmptyState } from '../../components/common'

export function Dashboard() {
  return (
    <div>
      <PageHeader
        overline="Your learning hub"
        title="Dashboard"
        description="A personalized view of where you are and what to explore next is coming in a later step."
      />
      <EmptyState
        icon="dashboard"
        title="Dashboard coming soon"
        description="Personalized insights, recent activity, and recommended next steps will appear here."
      />
    </div>
  )
}
