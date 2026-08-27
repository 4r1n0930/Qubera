import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon } from '../common'
import { SectionHeader } from '../common'
import { journeyNodes } from '../../data/landing'
import type { RoadmapNode } from '../../data/landing'

function NodeIcon({ status }: { status: RoadmapNode['status'] }) {
  if (status === 'done') {
    return (
      <span className="q-journey-node-icon q-journey-node-done" aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
    )
  }
  if (status === 'current') {
    return <span className="q-journey-node-icon q-journey-node-current" aria-hidden="true" />
  }
  if (status === 'next') {
    return <span className="q-journey-node-icon q-journey-node-next" aria-hidden="true" />
  }
  return (
    <span className="q-journey-node-icon q-journey-node-locked" aria-hidden="true">
      <Icon name="lock" size={14} />
    </span>
  )
}

const statusAria: Record<RoadmapNode['status'], string> = {
  done: 'Completed',
  current: 'Current',
  next: 'Available',
  locked: 'Locked',
}

export function RoadmapPreview() {
  return (
    <section className="q-landing-section" aria-labelledby="journey-title">
      <SectionHeader
        overline="Your journey"
        title="A clear path from foundations to algorithms"
        description="Each idea unlocks the next, so you always know where you are and what to do next — never a random pile of topics."
      />

      <ol className="q-journey">
        {journeyNodes.map((node, i) => (
          <Fragment key={node.title}>
            <li className={`q-journey-node q-journey-${node.status}`}>
              <div className="q-journey-rail">
                <NodeIcon status={node.status} />
                {i !== journeyNodes.length - 1 && (
                  <span className="q-journey-line" aria-hidden="true" />
                )}
              </div>
              <div className="q-journey-card">
                <span className="q-journey-status" aria-label={statusAria[node.status]}>
                  {statusAria[node.status]}
                </span>
                <h3 className="q-journey-title">{node.title}</h3>
                <p className="q-journey-desc">{node.short}</p>
              </div>
            </li>
          </Fragment>
        ))}
      </ol>

      <div className="q-landing-cta-row">
        <Link to="/roadmap">
          <Button size="md">
            Explore the full roadmap
            <Icon name="arrow-right" size={18} />
          </Button>
        </Link>
      </div>
    </section>
  )
}
