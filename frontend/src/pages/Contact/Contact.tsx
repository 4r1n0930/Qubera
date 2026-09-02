import { Mail } from 'lucide-react'
import { PlaceholderPage } from '../../components/dashboard/PlaceholderPage'

export function Contact() {
  return (
    <div style={{maxWidth:960, margin:'0 auto', padding:'48px 28px'}}>
      <PlaceholderPage icon={Mail} title="Contact Us" description="Reach out to the QUBERA team — we'd love to hear from you. Email us at hello@qubera.io" />
    </div>
  )
}
