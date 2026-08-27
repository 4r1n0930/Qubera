import { Link } from 'react-router-dom'
import { Button, Icon } from '../common'
import { Reveal } from './Reveal'

export function FinalCTA() {
  return (
    <section className="q-landing-final" aria-labelledby="final-cta-title">
      <Reveal>
        <div className="q-final-inner">
          <p className="q-overline">Begin now</p>
          <h2 id="final-cta-title" className="q-final-title">
            Your quantum journey starts with one concept.
          </h2>
          <p className="q-final-desc">
            No need for a physics degree or a maths background. Just your
            curiosity, and the first step.
          </p>
          <Link to="/roadmap">
            <Button size="lg">
              Start your journey
              <Icon name="arrow-right" size={18} />
            </Button>
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
