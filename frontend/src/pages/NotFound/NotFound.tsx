import { PageHeader, EmptyState } from '../../components/common'

export function NotFound() {
  return (
    <div>
      <PageHeader
        overline="Error 404"
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
      />
      <EmptyState
        icon="close"
        title="Nothing here"
        description="Try navigating from the top menu to get back to your learning path."
      />
    </div>
  )
}
