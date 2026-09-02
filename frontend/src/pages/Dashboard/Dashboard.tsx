import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  Atom,
  Target,
  BookOpen,
  Play,
  Flame,
  Sparkles,
  ChevronRight,
  FlaskConical,
  Swords,
  CircuitBoard,
  Crown,
  Lock,
} from 'lucide-react'
import { QuantumOrbit } from '../../components/dashboard/QuantumOrbit'

const recentlyOpened = [
  { title: 'Teleportation Circuit', note: 'Quantum Lab · 12 min ago', icon: CircuitBoard },
  { title: "Grover's Algorithm", note: 'Learn · 1 hr ago', icon: BookOpen },
  { title: 'Quantum Phase Kickback', note: 'Learn · Yesterday', icon: Atom },
  { title: 'Deutsch–Jozsa Algorithm', note: 'Learn · 2 days ago', icon: Atom },
]

const progressAreas = [
  { label: 'Quantum Concepts', value: 86 },
  { label: 'Quantum Circuits', value: 64 },
  { label: 'Quantum Algorithms', value: 41 },
  { label: 'Quantum Programming', value: 27 },
]

const weeklyXp = [
  { day: 'Mon', value: 120 },
  { day: 'Tue', value: 240 },
  { day: 'Wed', value: 180 },
  { day: 'Thu', value: 320 },
  { day: 'Fri', value: 260 },
  { day: 'Sat', value: 410, today: true },
  { day: 'Sun', value: 0 },
]

function StatBox({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="stat-box">
      <div className="stat-box-label">{label}</div>
      <div className="stat-box-value">{value}</div>
      {sub && <div className="stat-box-sub">{sub}</div>}
    </div>
  )
}

function ProgressRow({
  label,
  value,
  beige = false,
}: {
  label: string
  value: number
  beige?: boolean
}) {
  return (
    <div className="progress-row">
      <span className="progress-label">{label}</span>
      <div className="progress-track">
        <div
          className={`progress-fill${beige ? ' progress-fill-beige' : ''}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="progress-pct">{value}%</span>
    </div>
  )
}

export function Dashboard() {
  const todayXp = weeklyXp.reduce((sum, d) => sum + d.value, 0)
  const maxXp = Math.max(...weeklyXp.map((d) => d.value), 1)

  return (
    <div className="dash-page" style={{ display: 'grid', gap: 20 }}>
      {/* Hero */}
      <section className="dash-hero">
        <QuantumOrbit />
        <div style={{ position: 'relative' }}>
          <h1 className="dash-hero-title">Welcome back! 👋</h1>
          <p className="dash-hero-sub">Ready to continue your quantum journey?</p>
        </div>
      </section>

      {/* Gamification summary + daily challenge */}
      <div className="dash-grid dash-grid-2">
        <section className="dash-card">
          <div className="dash-card-title">
            <h3>Gamification Summary</h3>
            <Crown size={18} color="#9a7b3f" aria-hidden="true" />
          </div>
          <div className="stat-grid">
            <StatBox label="Rank" value="Explorer" sub="Quantum Explorer" />
            <StatBox label="Level" value="12" sub="Novice → Apprentice" />
            <StatBox label="Q-XP" value="2,480" sub="+310 this week" />
          </div>
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'var(--color-inkmuted)',
                marginBottom: 6,
              }}
            >
              <span>
                Level 12 → 13 · <strong style={{ color: 'var(--color-ink)' }}>1,220 / 1,500</strong> XP
              </span>
              <span>82%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '82%' }} />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 14,
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: '#fff6e5',
                  border: '1px solid #f0d9a8',
                }}
              >
                <div className="stat-box-label" style={{ color: '#a5761c' }}>
                  Leaderboard
                </div>
                <div className="stat-box-value" style={{ fontSize: '1.1rem' }}>
                  #126
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'var(--color-sage-faint)',
                  border: '1px solid #d8e4da',
                }}
              >
                <div className="stat-box-label">Badges</div>
                <div className="stat-box-value" style={{ fontSize: '1.1rem' }}>
                  9 earned
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dash-card">
          <div className="dash-card-title">
            <h3>Daily Challenge</h3>
            <Flame size={18} color="#e8a23a" aria-hidden="true" />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Atom size={24} />
            </span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
                Create a Bell State
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-inkmuted)' }}>
                Entangle two qubits with H and CNOT gates.
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              color: 'var(--color-inkmuted)',
              marginBottom: 18,
            }}
          >
            <Sparkles size={16} color="#9a7b3f" />
            Reward: <strong style={{ color: 'var(--color-ink)' }}>+120 Q-XP</strong>
          </div>
          <Link
            to="/dashboard/challenges"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2f6b57, #0b3d32)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Start Challenge →
          </Link>
        </section>
      </div>

      {/* Continue learning */}
      <section className="dash-card">
        <div className="dash-card-title">
          <h3>Continue Learning</h3>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6d927d, #9fc0a8)',
              color: '#0b3d32',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookOpen size={26} />
          </span>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '1.05rem' }}>
              Introduction to Quantum Circuits
            </div>
            <div
              style={{ fontSize: '0.88rem', color: 'var(--color-inkmuted)', marginTop: 4 }}
            >
              Build your first multi-qubit circuit and understand gate sequencing.
            </div>
          </div>
          <div style={{ minWidth: 180, flex: '1 1 220px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--color-inkmuted)',
                marginBottom: 6,
              }}
            >
              <span>Lesson 3 of 8</span>
              <strong style={{ color: 'var(--color-ink)' }}>64%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '64%' }} />
            </div>
          </div>
          <Link
            to="/dashboard/learn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 18px',
              borderRadius: 12,
              border: '1px solid var(--color-sage)',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              background: 'var(--color-sage-faint)',
            }}
          >
            Continue →
          </Link>
        </div>
      </section>

      {/* Recently opened */}
      <section className="dash-card">
        <div className="dash-card-title">
          <h3>Recently Opened</h3>
          <ChevronRight size={18} color="var(--color-inkmuted)" aria-hidden="true" />
        </div>
        <div className="dash-grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {recentlyOpened.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--color-cardborder)',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--color-sage-faint)',
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={19} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.87rem',
                      color: 'var(--color-ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-inkmuted)' }}>
                    {item.note}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Your Progress */}
      <section className="dash-card">
        <div className="dash-card-title">
          <h3>Your Progress</h3>
          <Target size={18} color="var(--color-sage-dark)" aria-hidden="true" />
        </div>
        {progressAreas.map((area, i) => (
          <ProgressRow
            key={area.label}
            label={area.label}
            value={area.value}
            beige={i === 2}
          />
        ))}
      </section>

      {/* Skill tree + Weekly XP */}
      <div className="dash-grid dash-grid-2">
        <section className="dash-card">
          <div className="dash-card-title">
            <h3>Skill Tree</h3>
          </div>
          <SkillTree />
        </section>

        <section className="dash-card">
          <div className="dash-card-title">
            <h3>Weekly XP</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-inkmuted)' }}>
              <strong style={{ color: 'var(--color-ink)' }}>{todayXp} XP</strong> this week
            </span>
          </div>
          <div className="xp-chart">
            {weeklyXp.map((d) => (
              <div key={d.day} className="xp-bar">
                <span className="xp-bar-val">{d.value > 0 ? d.value : ''}</span>
                <div
                  className={`xp-bar-fill${d.today ? ' xp-bar-today' : ''}`}
                  style={{ height: `${Math.max(6, (d.value / maxXp) * 100)}%` }}
                />
                <span className="xp-bar-day">{d.day}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recommended activities */}
      <section>
        <div
          style={{
            fontSize: '1.02rem',
            fontWeight: 700,
            color: 'var(--color-ink)',
            margin: '4px 0 14px',
          }}
        >
          Recommended Activities
        </div>
        <div className="dash-grid dash-grid-3">
          <RecCard
            icon={<Play size={20} />}
            bg="linear-gradient(135deg,#6d927d,#9fc0a8)"
            fg="#0b3d32"
            title="Quantum Detective"
            meta="Play · Interactive game"
            to="/dashboard/games"
          />
          <RecCard
            icon={<Swords size={20} />}
            bg="linear-gradient(135deg,#c8b184,#9a7b3f)"
            fg="#3b2f14"
            title="Beat the Circuit"
            meta="Challenge · Time trial"
            to="/dashboard/challenges"
          />
          <RecCard
            icon={<FlaskConical size={20} />}
            bg="linear-gradient(135deg,#0b3d32,#2f6b57)"
            fg="#fff"
            title="Quantum Interference"
            meta="Lab · Guided experiment"
            to="/dashboard/quantum-lab"
          />
        </div>
      </section>
    </div>
  )
}

function SkillTree() {
  const nodes = [
    { name: 'Qubits', state: 'mastered' },
    { name: 'Superposition', state: 'mastered' },
    { name: 'Entanglement', state: 'progress' },
    { name: 'Algorithms', state: 'locked' },
  ]
  return (
    <div className="skill-tree">
      {nodes.map((node, i) => (
        <div key={node.name} style={{ display: 'contents' }}>
          {i > 0 && (
            <div
              className={`skill-connector${i <= 2 ? ' skill-connector-done' : ''}`}
            />
          )}
          <div className={`skill-node skill-node-${node.state}`}>
            <span className="skill-dot">
              {node.state === 'mastered' ? (
                '✓'
              ) : node.state === 'progress' ? (
                '→'
              ) : (
                <Lock size={15} />
              )}
            </span>
            <div className="skill-node-name">{node.name}</div>
            <div className="skill-node-state">
              {node.state === 'mastered' ? 'Mastered' : node.state === 'progress' ? 'In progress' : 'Locked'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecCard({
  icon,
  bg,
  fg,
  title,
  meta,
  to,
}: {
  icon: ReactNode
  bg: string
  fg: string
  title: string
  meta: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="rec-card"
      style={{ textDecoration: 'none' }}
    >
      <span
        className="rec-icon"
        style={{ background: bg, color: fg }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span>
        <span className="rec-card-title">{title}</span>
        <br />
        <span className="rec-card-meta">{meta}</span>
      </span>
    </Link>
  )
}
