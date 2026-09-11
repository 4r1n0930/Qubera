import {
  User,
  Award,
  Zap,
  Flame,
  TrendingUp,
  Check,
  Lock,
  ChevronRight,
  BookOpen,
  CircuitBoard,
  Code2,
  FlaskConical,
  Sparkles,
  Target,
  ShieldCheck,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readUser() {
  try {
    const raw = localStorage.getItem('qubera_user')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, string>
    return { name: parsed.name ?? 'Quantum Explorer', email: parsed.email ?? '' }
  } catch {
    return null
  }
}

function initial(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const stats = [
  { label: 'Q-XP Earned', value: '2,480', sub: '+310 this week', accent: false },
  { label: 'Current Level', value: '12', sub: 'Quantum Explorer', accent: false },
  { label: 'Learning Streak', value: '6 days', sub: 'Best: 14 days', accent: true },
  { label: 'Badges Earned', value: '9', sub: '4 remaining', accent: false },
  { label: 'Rank', value: '#126', sub: 'Top 18%', accent: false },
  { label: 'Courses Done', value: '3', sub: '7 in progress', accent: false },
]

const skills = [
  { label: 'Quantum Concepts', pct: 86 },
  { label: 'Quantum Circuits', pct: 64 },
  { label: 'Quantum Algorithms', pct: 41 },
  { label: 'Quantum Programming', pct: 27 },
]

interface Badge {
  name: string
  description: string
  icon: typeof Award
  color: string
  bg: string
  border: string
  earned: boolean
}

const badges: Badge[] = [
  {
    name: 'Qubit Master',
    description: 'Complete all qubit fundamentals',
    icon: Sparkles,
    color: '#0b3d32',
    bg: '#eef4ef',
    border: '#d8e4da',
    earned: true,
  },
  {
    name: 'Entanglement Pro',
    description: 'Build a Bell state',
    icon: Zap,
    color: '#4a3f6b',
    bg: '#ebe6f7',
    border: '#ddd8ee',
    earned: true,
  },
  {
    name: 'Streak Champion',
    description: '14-day learning streak',
    icon: Flame,
    color: '#a5761c',
    bg: '#fff6e5',
    border: '#f0d9a8',
    earned: true,
  },
  {
    name: 'Algorithm Ace',
    description: 'Complete all algorithms',
    icon: CircuitBoard,
    color: '#0b3d32',
    bg: '#eef4ef',
    border: '#d8e4da',
    earned: true,
  },
  {
    name: 'Code Craft',
    description: 'Write 50 quantum circuits',
    icon: Code2,
    color: '#1a4a5e',
    bg: '#e4eef6',
    border: '#c0d5e3',
    earned: true,
  },
  {
    name: 'Lab Explorer',
    description: 'Try 10 lab experiments',
    icon: FlaskConical,
    color: '#5e3b1a',
    bg: '#f5ece2',
    border: '#e0d1c0',
    earned: true,
  },
  {
    name: 'First Responder',
    description: 'Solve a daily challenge',
    icon: Target,
    color: '#5e1a2e',
    bg: '#f6e2eb',
    border: '#e0c0cc',
    earned: true,
  },
  {
    name: 'Leaderboard Legend',
    description: 'Reach the top 100',
    icon: Trophy,
    color: '#7a5a1a',
    bg: '#fff0c9',
    border: '#f0d9a8',
    earned: true,
  },
  {
    name: 'Open Qubit',
    description: 'Complete orientation module',
    icon: GraduationCap,
    color: '#2f6b57',
    bg: '#e3eee9',
    border: '#bfd5cc',
    earned: true,
  },
  {
    name: 'Circuit Wizard',
    description: 'Master circuit design',
    icon: CircuitBoard,
    color: '#6d7471',
    bg: '#f0f1ef',
    border: '#e1e3df',
    earned: false,
  },
  {
    name: 'Error Corrector',
    description: 'Complete error correction',
    icon: ShieldCheck,
    color: '#6d7471',
    bg: '#f0f1ef',
    border: '#e1e3df',
    earned: false,
  },
  {
    name: 'Top 100',
    description: 'Rank in the top 100',
    icon: Award,
    color: '#6d7471',
    bg: '#f0f1ef',
    border: '#e1e3df',
    earned: false,
  },
  {
    name: '30-Day Streak',
    description: 'Maintain a 30-day streak',
    icon: Flame,
    color: '#6d7471',
    bg: '#f0f1ef',
    border: '#e1e3df',
    earned: false,
  },
]

const recentActivity = [
  { label: 'Completed Superposition lesson', time: '2h ago', icon: BookOpen },
  { label: 'Built Bell State circuit', time: '5h ago', icon: CircuitBoard },
  { label: 'Earned Code Craft badge', time: 'Yesterday', icon: Award },
  { label: 'Completed Quantum Lab exercise', time: 'Yesterday', icon: FlaskConical },
  { label: 'Finished Chapter 3 quiz', time: '2 days ago', icon: Target },
  { label: 'Earned Lab Explorer badge', time: '3 days ago', icon: FlaskConical },
]

const completedModules = [
  { title: 'Introduction to Quantum Circuits', pct: 100, lessons: '8/8' },
  { title: 'Superposition & Measurement', pct: 100, lessons: '6/6' },
  { title: 'Entanglement Fundamentals', pct: 100, lessons: '7/7' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Profile() {
  const user = readUser()
  const name = user?.name ?? 'Quantum Explorer'
  const email = user?.email ?? 'explorer@qubera.io'
  const badgeCount = badges.filter((b) => b.earned).length

  return (
    <div className="dash-page" style={{ display: 'grid', gap: 18 }}>
      {/* Page header */}
      <div style={{ paddingTop: 4 }}>
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
          My Profile
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
            <User size={16} />
          </span>
        </h1>
        <p style={{ marginTop: 6, color: 'var(--color-inkmuted)', fontSize: '0.88rem', maxWidth: 420 }}>
          Your quantum learning identity — rank, badges, streaks and history in one place.
        </p>
      </div>

      {/* Profile hero card */}
      <section
        className="dash-card"
        style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
      >
        {/* Banner */}
        <div
          style={{
            height: 82,
            background: 'linear-gradient(135deg, #0b3d32 0%, #2f6b57 50%, #6d927d 100%)',
          }}
        />
        <div style={{ padding: '0 24px 22px', marginTop: -34, position: 'relative' }}>
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: '#fff',
              border: '3px solid #fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0b3d32',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            aria-hidden="true"
          >
            {initial(name)}
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)' }}>{name}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-inkmuted)', marginTop: 2 }}>{email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2f6b57', background: '#dce8de', border: '1px solid #c8d9cb', padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <TrendingUp size={12} /> Quantum Explorer
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Member since Sep 2025</span>
              </div>
            </div>
            <Link
              to="/dashboard/settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--color-cardborder)',
                background: '#fff',
                color: 'var(--color-ink)',
                fontWeight: 600,
                fontSize: '0.84rem',
                textDecoration: 'none',
                flexShrink: 0,
                marginTop: 6,
              }}
            >
              Edit Profile <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
        {stats.map((s) => (
          <div key={s.label} className="dash-card" style={{ padding: '14px 16px', borderRadius: 14 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>{s.label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: 2 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-col: Skills + Badges */}
      <div className="dash-grid dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        {/* Skills progress */}
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3>Skills Progress</h3>
            <Target size={18} color="var(--color-sage-dark)" aria-hidden="true" />
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {skills.map((s) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{s.pct}%</span>
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Badges grid */}
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3>Badges</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-inkmuted)' }}>
              <strong style={{ color: 'var(--color-ink)' }}>{badgeCount}</strong> / {badges.length} earned
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 10,
            }}
          >
            {badges.map((b) => {
              const Icon = b.icon
              return (
                <div
                  key={b.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: `1px solid ${b.border}`,
                    background: b.bg,
                    opacity: b.earned ? 1 : 0.45,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#fff',
                      border: `1px solid ${b.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: b.color,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {b.earned ? <Icon size={20} /> : <Lock size={18} color="#9aa19b" />}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-ink)' }}>{b.name}</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--color-inkmuted)', lineHeight: 1.35, marginTop: 2 }}>
                      {b.earned ? b.description : 'Locked'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Two-col: Completed modules + Recent activity */}
      <div className="dash-grid dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16 }}>
        {/* Completed modules */}
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3>Completed Modules</h3>
            <GraduationCap size={18} color="var(--color-sage-dark)" aria-hidden="true" />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {completedModules.map((m) => (
              <div
                key={m.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #d8e4da',
                  background: '#f7fbf7',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#0b3d32',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <Check size={16} strokeWidth={2.5} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--color-ink)' }}>{m.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)', marginTop: 2 }}>{m.lessons} lessons</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2f6b57', background: '#dce8de', padding: '4px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  100%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3>Recent Activity</h3>
            <Link
              to="/dashboard/learn"
              style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-sage-dark)', textDecoration: 'none' }}
            >
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
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: 'var(--color-sage-faint)',
                      border: '1px solid #d8e4da',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-sage-dark)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-ink)', fontWeight: 500, lineHeight: 1.3 }}>{item.label}</span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--color-inkmuted)', whiteSpace: 'nowrap' }}>{item.time}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Level progress */}
      <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
        <div className="dash-card-title" style={{ marginBottom: 14 }}>
          <h3>Level Progress</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-inkmuted)' }}>
            <strong style={{ color: 'var(--color-ink)' }}>1,220</strong> / 1,500 XP to Level 13
          </span>
        </div>
        <div className="progress-track" style={{ height: 10, marginBottom: 12 }}>
          <div className="progress-fill" style={{ width: '82%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-inkmuted)' }}>
          <span>Level 12 — Quantum Explorer</span>
          <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>82%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--color-sage-faint)', border: '1px solid #d8e4da' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Next Unlock</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-ink)', marginTop: 2 }}>Level 13 — Quantum Apprentice</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: '#fff6e5', border: '1px solid #f0d9a8' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a5761c' }}>Weekly Milestone</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7a5a1a', marginTop: 2 }}>310 Q-XP this week</div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .profile-mid-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}