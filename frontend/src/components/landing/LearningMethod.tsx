import { Fragment } from 'react'
import { Icon } from '../common'
import { SectionHeader } from '../common'
import { learningMethod } from '../../data/landing'
import { Reveal } from './Reveal'

export function LearningMethod() {
  const last = learningMethod.length - 1
  return (
    <section className="q-landing-section" aria-labelledby="method-title">
      <SectionHeader
        overline="How you learn"
        title="One concept, from first idea to real mastery"
        description="Every concept moves through the same calm, connected flow — so you build understanding instead of memorising names."
      />

      <ol className="q-method">
        {learningMethod.map((step, i) => (
          <Fragment key={step.id}>
            <li className="q-method-item">
              <Reveal>
                <div className="q-method-card">
                  <span className="q-method-index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="q-method-icon" aria-hidden="true">
                    <Icon name={step.icon} size={20} />
                  </span>
                  <div className="q-method-body">
                    <h3 className="q-method-title">{step.title}</h3>
                    <p className="q-method-desc">{step.description}</p>
                  </div>
                </div>
              </Reveal>
            </li>
            {i !== last && (
            <li
              className="q-method-connector"
              aria-hidden="true"
            >
              <span className="q-method-connector-line" />
              <Icon name="arrow-down" size={16} />
            </li>
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  )
}
