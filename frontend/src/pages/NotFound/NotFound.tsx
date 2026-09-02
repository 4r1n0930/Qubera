import { FileQuestion } from 'lucide-react'
import { PlaceholderPage } from '../../components/dashboard/PlaceholderPage'

export function NotFound() {
  return (
    <PlaceholderPage
      icon={FileQuestion}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved. Use the sidebar to get back on track."
    />
  )
}
