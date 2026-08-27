import { Link } from 'react-router-dom'
import { Brand } from './Brand'

const footerLinks = [
  { label: 'Learn', to: '/learn' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Playground', to: '/playground' },
  { label: 'Progress', to: '/progress' },
  { label: 'AI Tutor', to: '/' },
]

export function AppFooter() {
  return (
    <footer className="q-footer">
      <div className="q-footer-inner">
        <div className="q-footer-cols">
          <div className="q-footer-brand-col">
            <Brand />
            <p className="q-footer-desc">
              An interactive platform for learning quantum computing, one
              concept at a time.
            </p>
          </div>
          <nav className="q-footer-links" aria-label="Footer">
            {footerLinks.map((link) => (
              <Link key={link.label} to={link.to} className="q-footer-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="q-footer-bottom">
          <p className="q-footer-meta">
            Understand · Visualize · Experiment · Predict · Simulate · Explain
            · Master
          </p>
        </div>
      </div>
    </footer>
  )
}
