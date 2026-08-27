import { Fragment } from 'react'
import { Icon } from '../common'
import { SectionHeader } from '../common'
import { platformFeatures } from '../../data/landing'
import { Reveal } from './Reveal'

export function PlatformFeatures() {
  return (
    <section className="q-landing-section" aria-labelledby="why-title">
      <SectionHeader
        overline="Why this platform"
        title="Built for the way real learning works"
        description="Not another course website — a place designed to move you from confused to confident, one honest interaction at a time."
      />

      <ol className="q-features">
        {platformFeatures.map((feature, i) => (
          <Fragment key={feature.id}>
            <li className={`q-feature q-feature-${feature.id}`}>
              <Reveal>
                <article className="q-feature-card">
                  <div className="q-feature-head">
                    <span className="q-feature-icon" aria-hidden="true">
                      <Icon name={feature.icon} size={22} />
                    </span>
                    <span className="q-feature-no" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="q-feature-title">{feature.title}</h3>
                  <p className="q-feature-desc">{feature.description}</p>
                </article>
              </Reveal>
            </li>
            {i !== platformFeatures.length - 1 && (
              <li className="q-feature-gap" aria-hidden="true" />
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  )
}
