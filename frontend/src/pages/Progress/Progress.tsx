import { Link } from 'react-router-dom'
import {
  Atom,
  TrendingUp,
  Zap,
  ShieldCheck,
  Award,
  CircuitBoard,
  Code2,
  Waves,
  FlaskConical,
  Check,
  Lock,
  ListTodo,
  Gamepad2,
  ArrowRight,
  Search,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Data — matches spec + reference image (sum = 1,320 XP)
// ---------------------------------------------------------------------------
const weeklyXp = [
  { day: 'Mon', value: 120 },
  { day: 'Tue', value: 180 },
  { day: 'Wed', value: 210 },
  { day: 'Thu', value: 260 },
  { day: 'Fri', value: 320 },
  { day: 'Sat', value: 140 },
  { day: 'Sun', value: 90 },
]

const yourProgress = [
  {
    title: 'Quantum Concepts',
    pct: 86,
    desc: 'Understand qubits, states and phenomena.',
    icon: Atom,
    to: '/dashboard/learn',
  },
  {
    title: 'Quantum Circuits',
    pct: 64,
    desc: 'Design and analyze quantum circuits.',
    icon: CircuitBoard,
    to: '/dashboard/quantum-lab',
  },
  {
    title: 'Quantum Algorithms',
    pct: 47,
    desc: 'Learn and implement quantum algorithms.',
    icon: Atom,
    to: '/dashboard/learn',
  },
  {
    title: 'Quantum Programming',
    pct: 27,
    desc: 'Write quantum programs and simulations.',
    icon: Code2,
    to: '/dashboard/code-editor',
  },
]

const skillNodes = [
  { name: 'Qubits', state: 'mastered' as const },
  { name: 'Superposition', state: 'mastered' as const },
  { name: 'Entanglement', state: 'mastered' as const },
  { name: 'Quantum Gates', state: 'mastered' as const },
  { name: 'Quantum Circuits', state: 'current' as const },
  { name: 'Algorithms', state: 'locked' as const },
]

const recentActivity = [
  { label: 'Completed Introduction to Quantum Circuits', time: '2h ago', icon: ListTodo },
  { label: 'Solved Quantum Detective', time: 'Yesterday', icon: Search },
  { label: 'Built Bell State circuit', time: '2 days ago', icon: CircuitBoard },
  { label: 'Completed Superposition Challenge', time: '3 days ago', icon: Gamepad2 },
  { label: 'Earned Superposition Specialist badge', time: '4 days ago', icon: Award },
]

export function Progress() {
  const maxXp = 400 // fixed scale like image (0-400)

  return (
    <div className="dash-page" style={{ display: 'grid', gap: 18 }}>
      {/* ===== Page header + summary cards — same visual rhythm as Dashboard ===== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ minWidth: 260, paddingTop: 4 }}>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--color-ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            Progress
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'var(--color-sage-faint)',
                border: '1px solid #d8e4da',
                color: 'var(--color-sage-dark)',
              }}
              aria-hidden="true"
            >
              <TrendingUp size={16} />
            </span>
          </h1>
          <p style={{ marginTop: 6, color: 'var(--color-inkmuted)', fontSize: '0.88rem', maxWidth: 420 }}>
            Track your quantum learning journey and see how your skills are evolving.
          </p>
        </div>

        {/* Summary cards — reuse card language: white rounded, green hairline, soft shadow */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(140px, 180px))',
            gap: 12,
            flex: '1 1 auto',
            maxWidth: 760,
          }}
          className="progress-summary-grid"
        >
          {/* Overall Progress */}
          <div className="dash-card" style={{ padding: '14px 16px', borderRadius: 14 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Overall Progress</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: 2 }}>58%</div>
            <div className="progress-track" style={{ marginTop: 10, height: 6 }}>
              <div className="progress-fill" style={{ width: '58%' }} />
            </div>
          </div>

          {/* Q-XP Earned */}
          <div className="dash-card" style={{ padding: '14px 16px', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--color-sage-faint)',
                border: '1px solid #d8e4da',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-sage-dark)',
                flexShrink: 0,
              }}
            >
              <Atom size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Q-XP Earned</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: 1 }}>2,480</div>
            </div>
          </div>

          {/* Current Level */}
          <div className="dash-card" style={{ padding: '14px 16px', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#fff',
                border: '1px solid var(--color-cardborder)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-sage-dark)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Current Level</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: 1 }}>12</div>
              <div style={{ fontSize: '0.70rem', color: 'var(--color-inkmuted)' }}>Quantum Explorer</div>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="dash-card" style={{ padding: '14px 16px', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#fff6e5',
                border: '1px solid #f0d9a8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5761c',
                flexShrink: 0,
              }}
            >
              <Zap size={18} fill="#f0c24a" stroke="#a5761c" />
            </span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Learning Streak</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: 1 }}>6 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== YOUR PROGRESS + SKILL TREE + WEEKLY Q-XP (mirrors image grid) ===== */}
      <div
        className="progress-mid-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.85fr 1.35fr', gap: 16 }}
      >
        {/* Your Progress */}
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3>Your Progress</h3>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {yourProgress.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    paddingBottom: 14,
                    borderBottom: '1px solid #f0f1ef',
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'var(--color-sage-faint)',
                      border: '1px solid #d8e4da',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-sage-dark)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-ink)' }}>{item.pct}%</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-inkmuted)', marginTop: 2, lineHeight: 1.35 }}>{item.desc}</div>
                    <div className="progress-track" style={{ marginTop: 10, height: 6 }}>
                      <div className="progress-fill" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                  <Link
                    to={item.to}
                    style={{
                      alignSelf: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      borderRadius: 10,
                      border: '1px solid var(--color-cardborder)',
                      background: '#fff',
                      color: 'var(--color-ink)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Continue <ArrowRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quantum Skill Tree — vertical, minimal, educational */}
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3>Quantum Skill Tree</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: 6 }}>
            {skillNodes.map((node, idx) => {
              const isLast = idx === skillNodes.length - 1
              const isMastered = node.state === 'mastered'
              const isCurrent = node.state === 'current'
              const isLocked = node.state === 'locked'
              return (
                <div key={node.name} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                  {/* line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isCurrent ? '1.5px solid #2f6b57' : isLocked ? '1.5px solid #d9ddd8' : '1.5px solid #2f6b57',
                        background: isMastered ? '#0b3d32' : isCurrent ? '#fff' : '#eef1ee',
                        color: isMastered ? '#fff' : isCurrent ? '#0b3d32' : '#9aa19b',
                        flexShrink: 0,
                      }}
                    >
                      {isMastered ? <Check size={16} strokeWidth={2.5} /> : isLocked ? <Lock size={14} /> : <CircuitBoard size={14} />}
                    </span>
                    {!isLast && (
                      <span
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 18,
                          margin: '4px 0',
                          background: idx < 4 ? '#0b3d32' : '#e1e3df',
                          borderRadius: 999,
                          opacity: idx < 4 ? 0.95 : 1,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingTop: isCurrent || isLocked ? 6 : 5, paddingBottom: isLast ? 0 : 18 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: isLocked ? 'var(--color-inkmuted)' : 'var(--color-ink)',
                      }}
                    >
                      {node.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)', marginTop: 1 }}>
                      {isMastered ? 'Mastered' : isCurrent ? 'In Progress' : 'Locked'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Weekly Q-XP */}
        <section className="dash-card" style={{ padding: '18px 18px 14px', display: 'flex', flexDirection: 'column' }}>
          <div className="dash-card-title" style={{ marginBottom: 6 }}>
            <h3>Weekly Q-XP</h3>
            <Link
              to="/dashboard/leaderboard"
              style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-sage-dark)', textDecoration: 'none' }}
            >
              View Analytics →
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-ink)' }}>1,320 Q-XP this week</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2f6b57' }}>+18% from last week</span>
          </div>
          {/* chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 170, padding: '14px 6px 0', borderTop: '1px solid transparent' }}>
            {/* y-axis */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 140, paddingBottom: 18, flexShrink: 0 }}>
              {[400, 300, 200, 100, 0].map((v) => (
                <span key={v} style={{ fontSize: '0.68rem', color: 'var(--color-inkmuted)', lineHeight: 1, textAlign: 'right', width: 24 }}>
                  {v}
                </span>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
              {weeklyXp.map((d) => {
                const h = (d.value / maxXp) * 120
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-ink)', minHeight: 12 }}>{d.value}</span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 36,
                        height: Math.max(10, h),
                        borderRadius: '6px 6px 4px 4px',
                        background: 'linear-gradient(180deg, #2a6a55 0%, #0b3d32 100%)',
                        border: '1px solid #0b3d32',
                      }}
                    />
                    <span style={{ fontSize: '0.70rem', color: 'var(--color-inkmuted)', fontWeight: 500 }}>{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ===== Recent Activity + Recommended Next Steps ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="progress-activity-grid">
        <section className="dash-card" style={{ padding: '18px 18px 12px' }}>
          <div className="dash-card-title" style={{ marginBottom: 12 }}>
            <h3>Recent Activity</h3>
            <Link to="/dashboard/learn" style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-sage-dark)', textDecoration: 'none' }}>
              View All →
            </Link>
          </div>
          <div style={{ display: 'grid', gap: 0 }}>
            {recentActivity.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: '1px solid #f0f1ef',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'var(--color-sage-faint)',
                      border: '1px solid #d8e4da',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-sage-dark)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-ink)', fontWeight: 500, lineHeight: 1.3 }}>{item.label}</span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--color-inkmuted)', whiteSpace: 'nowrap' }}>{item.time}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="dash-card" style={{ padding: '18px 18px 12px' }}>
          <div className="dash-card-title" style={{ marginBottom: 12 }}>
            <h3>Recommended Next Steps</h3>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link
              to="/dashboard/learn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #e1e3df',
                background: '#fff',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--color-sage-faint)',
                  border: '1px solid #d8e4da',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-sage-dark)',
                }}
              >
                <Waves size={18} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-ink)' }}>Review Superposition</span>
                <br />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)' }}>Strengthen your understanding</span>
              </span>
              <ArrowRight size={16} color="var(--color-inkmuted)" />
            </Link>

            <Link
              to="/dashboard/learn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #e1e3df',
                background: '#fff',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--color-sage-faint)',
                  border: '1px solid #d8e4da',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-sage-dark)',
                }}
              >
                <Atom size={18} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-ink)' }}>Grover&apos;s Algorithm</span>
                <br />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)' }}>Continue learning algorithms</span>
              </span>
              <ArrowRight size={16} color="var(--color-inkmuted)" />
            </Link>

            <Link
              to="/dashboard/quantum-lab"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #e1e3df',
                background: '#fff',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--color-sage-faint)',
                  border: '1px solid #d8e4da',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-sage-dark)',
                }}
              >
                <FlaskConical size={18} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-ink)' }}>Quantum Interference Lab</span>
                <br />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)' }}>Try an experiment</span>
              </span>
              <ArrowRight size={16} color="var(--color-inkmuted)" />
            </Link>
          </div>
        </section>
      </div>

      {/* ===== Recommended Activities For You — spec required 3 cards, clickable ===== */}
      <section className="dash-card" style={{ padding: '18px 18px 16px' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: 14 }}>Recommended Activities For You</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }} className="progress-rec-grid">
          <Link
            to="/dashboard/games"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
              borderRadius: 16,
              border: '1px solid #d8e4da',
              background: '#f7fbf7',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#eef4ef',
                  border: '1px solid #d8e4da',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0b3d32',
                  flexShrink: 0,
                }}
              >
                <Search size={22} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink)' }}>Quantum Detective</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-inkmuted)', marginTop: 3, lineHeight: 1.4 }}>
                  Debug a broken quantum circuit and find the issue.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#2f6b57',
                  background: '#dce8de',
                  border: '1px solid #c8d9cb',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                +100 Q-XP
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0b3d32', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Start Now <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link
            to="/dashboard/challenges"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
              borderRadius: 16,
              border: '1px solid #f0d9a8',
              background: '#fffbf0',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#fff6e5',
                  border: '1px solid #f0d9a8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7a5a1a',
                  flexShrink: 0,
                }}
              >
                <CircuitBoard size={22} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink)' }}>Beat the Circuit</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-inkmuted)', marginTop: 3, lineHeight: 1.4 }}>
                  Build the most efficient circuit with the least gates.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#7a5a1a',
                  background: '#fff0c9',
                  border: '1px solid #f0d9a8',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                +150 Q-XP
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0b3d32', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Start Now <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link
            to="/dashboard/quantum-lab"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
              borderRadius: 16,
              border: '1px solid #ddd8ee',
              background: '#faf7ff',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#f0eef8',
                  border: '1px solid #ddd8ee',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4a3f6b',
                  flexShrink: 0,
                }}
              >
                <Waves size={22} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink)' }}>Quantum Interference</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-inkmuted)', marginTop: 3, lineHeight: 1.4 }}>
                  Explore interference through experimentation and visualization.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4a3f6b',
                  background: '#ebe6f7',
                  border: '1px solid #ddd8ee',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                +120 Q-XP
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0b3d32', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Start Now <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* responsive helpers — minimal, no new visual language */}
      <style>{`
        @media (max-width: 1100px) {
          .progress-mid-grid { grid-template-columns: 1fr 1fr !important; }
          .progress-mid-grid > section:last-child { grid-column: 1 / -1; }
          .progress-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; max-width: 420px !important; }
        }
        @media (max-width: 720px) {
          .progress-mid-grid { grid-template-columns: 1fr !important; }
          .progress-activity-grid { grid-template-columns: 1fr !important; }
          .progress-rec-grid { grid-template-columns: 1fr !important; }
          .progress-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 420px) {
          .progress-summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
