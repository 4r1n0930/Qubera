import { BookOpen } from 'lucide-react'
import { PlaceholderPage } from '../../components/dashboard/PlaceholderPage'

export function Learn() {
  return (
    <PlaceholderPage
      icon={BookOpen}
      title="Learn"
      description="Structured modules covering qubits, superposition, measurement, gates, entanglement, circuits and algorithms are built here."
    />
  )
}
