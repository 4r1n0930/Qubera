import { Fragment } from 'react'
import { SectionHeader } from '../common'
import { modules } from '../../data/landing'
import { Reveal } from './Reveal'

export function ModuleJourney() {
  return (
    <section className="q-landing-section" aria-labelledby="modules-title">
      <SectionHeader
        overline="What you'll learn"
        title="A progression that builds on itself"
        description="Eight modules, each preparing you for the next. Follow them in order, or jump in and fill gaps as you go."
      />

      <ol className="q-modules">
        {modules.map((module, i) => {
          const alternate = i % 2 === 1
          return (
            <Fragment key={module.stage}>
              <li className={`q-module ${alternate ? 'q-module-alt' : ''}`}>
                <div className="q-module-rail" aria-hidden="true">
                  <span className="q-module-marker">{String(i + 1).padStart(2, '0')}</span>
                  {i !== modules.length - 1 && <span className="q-module-line" />}
                </div>
                <Reveal className="q-module-card-wrap">
                  <article className="q-module-card">
                    <span className="q-module-stage">{module.stage}</span>
                    <h3 className="q-module-title">{module.title}</h3>
                    <p className="q-module-desc">{module.description}</p>
                  </article>
                </Reveal>
              </li>
            </Fragment>
          )
        })}
      </ol>
    </section>
  )
}
