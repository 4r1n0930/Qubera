import { Atom } from 'lucide-react'
import { PlaceholderPage } from '../../components/dashboard/PlaceholderPage'

export function QuantumLab() {
  return (
    <PlaceholderPage
      icon={Atom}
      title="Quantum Lab"
      description="Experiment with qubits, gates, entanglement and circuits in an interactive quantum sandbox."
    />
  )
}
