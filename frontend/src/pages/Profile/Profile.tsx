import { User } from 'lucide-react'
import { PlaceholderPage } from '../../components/dashboard/PlaceholderPage'

export function Profile() {
  return (
    <PlaceholderPage
      icon={User}
      title="My Profile"
      description="View your rank, badges, streaks and learning history all in one place."
    />
  )
}
