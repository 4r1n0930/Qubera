import { Link } from 'react-router-dom'
import { Button, StatusIndicator } from '../common'
import { QuantumHeroVisualization } from './QuantumHeroVisualization'

export function HeroSection() {
  return (
    <section className="q-landing-hero">
      <div className="q-landing-hero-copy">
        <StatusIndicator tone="success" label="A guided learning journey" />

        <h1 className="q-landing-hero-title">
          Understand quantum.
          <span className="q-landing-hero-accent"> One concept at a time.</span>
        </h1>

        <p className="q-landing-hero-sub">
          Quantum computing is built from a handful of ideas — qubits,
          superposition, gates, entanglement. Each is easier to grasp when
          you can see it, try it, and get help the moment you're stuck.
        </p>

        <div className="q-landing-hero-actions">
          <Link to="/roadmap">
            <Button size="lg">
              Start your journey
              <span aria-hidden="true">→</span>
            </Button>
          </Link>
          <Link to="/roadmap">
            <Button size="lg" variant="outline">
              Explore roadmap
            </Button>
          </Link>
        </div>

        <ul className="q-landing-hero-points">
          <li>Visual explanations</li>
          <li>Interactive experiments</li>
          <li>Guided learning paths</li>
        </ul>
      </div>

      <div className="q-landing-hero-vis">
        <QuantumHeroVisualization />
      </div>
    </section>
  )
}
