import { useMemo, useState } from 'react'
import {
  Trophy,
  Search,
  ChevronUp,
  ChevronDown,
  Minus,
  Crown,
  Medal,
  Sparkles,
  Flame,
  ShieldCheck,
  User,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

type Period = 'week' | 'month' | 'all'

interface Ranks {
  xp: number
  level: number
  streak: number
}

interface Learner {
  name: string
  initials: string
  cohort: string
  week: Ranks
  month: Ranks
  all: Ranks
  delta: 'up' | 'down' | 'same'
  isYou?: boolean
  badge?: string
}

const learners: Learner[] = [
  { name: 'Anaya Mehta', initials: 'AM', cohort: 'Quantum Pioneer', week: { xp: 2480, level: 14, streak: 12 }, month: { xp: 9120, level: 14, streak: 12 }, all: { xp: 28400, level: 18, streak: 12 }, delta: 'up', badge: 'Algorithm Ace' },
  { name: 'Rohan Verma', initials: 'RV', cohort: 'Circuit Builder', week: { xp: 2210, level: 13, streak: 9 }, month: { xp: 8840, level: 13, streak: 9 }, all: { xp: 25100, level: 17, streak: 9 }, delta: 'same', badge: 'Qubit Master' },
  { name: 'Ishita Rao', initials: 'IR', cohort: 'Quantum Pioneer', week: { xp: 2140, level: 13, streak: 7 }, month: { xp: 7660, level: 12, streak: 7 }, all: { xp: 19800, level: 15, streak: 7 }, delta: 'up', badge: 'Entanglement Pro' },
  { name: 'Kabir Singh', initials: 'KS', cohort: 'Circuit Builder', week: { xp: 1980, level: 12, streak: 5 }, month: { xp: 7420, level: 12, streak: 5 }, all: { xp: 17200, level: 14, streak: 5 }, delta: 'down' },
  { name: 'Meera Iyer', initials: 'MI', cohort: 'Algorithm Enthusiast', week: { xp: 1890, level: 12, streak: 8 }, month: { xp: 7110, level: 12, streak: 8 }, all: { xp: 16500, level: 14, streak: 8 }, delta: 'up' },
  { name: 'Arjun Nair', initials: 'AN', cohort: 'Quantum Researcher', week: { xp: 1760, level: 12, streak: 6 }, month: { xp: 6380, level: 11, streak: 6 }, all: { xp: 14900, level: 13, streak: 6 }, delta: 'same' },
  { name: 'Sana Khan', initials: 'SK', cohort: 'Circuit Builder', week: { xp: 1620, level: 11, streak: 4 }, month: { xp: 5960, level: 11, streak: 4 }, all: { xp: 13800, level: 13, streak: 4 }, delta: 'up' },
  { name: 'Dev Patel', initials: 'DP', cohort: 'Quantum Pioneer', week: { xp: 1550, level: 11, streak: 3 }, month: { xp: 5740, level: 11, streak: 3 }, all: { xp: 13100, level: 13, streak: 3 }, delta: 'down' },
  { name: 'Nisha Menon', initials: 'NM', cohort: 'Algorithm Enthusiast', week: { xp: 1490, level: 11, streak: 10 }, month: { xp: 5520, level: 11, streak: 10 }, all: { xp: 12900, level: 12, streak: 10 }, delta: 'up', badge: 'Streak Champion' },
  { name: 'Vivaan Joshi', initials: 'VJ', cohort: 'Quantum Researcher', week: { xp: 1380, level: 10, streak: 2 }, month: { xp: 4810, level: 10, streak: 2 }, all: { xp: 11500, level: 12, streak: 2 }, delta: 'same' },
  { name: 'Aisha Gupta', initials: 'AG', cohort: 'Circuit Builder', week: { xp: 1310, level: 10, streak: 6 }, month: { xp: 4650, level: 10, streak: 6 }, all: { xp: 11200, level: 12, streak: 6 }, delta: 'down' },
  { name: 'Reyansh Kulkarni', initials: 'RK', cohort: 'Quantum Pioneer', week: { xp: 1240, level: 10, streak: 5 }, month: { xp: 4310, level: 10, streak: 5 }, all: { xp: 10800, level: 11, streak: 5 }, delta: 'up' },
  { name: 'Zara Ali', initials: 'ZA', cohort: 'Algorithm Enthusiast', week: { xp: 1180, level: 10, streak: 4 }, month: { xp: 3980, level: 10, streak: 4 }, all: { xp: 10200, level: 11, streak: 4 }, delta: 'same' },
  { name: 'Ishaan Bose', initials: 'IB', cohort: 'Quantum Researcher', week: { xp: 1120, level: 9, streak: 7 }, month: { xp: 3650, level: 9, streak: 7 }, all: { xp: 9600, level: 11, streak: 7 }, delta: 'up', badge: 'Lab Explorer' },
  { name: 'Tara Shukla', initials: 'TS', cohort: 'Circuit Builder', week: { xp: 1050, level: 9, streak: 3 }, month: { xp: 3520, level: 9, streak: 3 }, all: { xp: 9100, level: 11, streak: 3 }, delta: 'down' },
  { name: 'Aditya Chakraborty', initials: 'AC', cohort: 'Quantum Pioneer', week: { xp: 980, level: 9, streak: 2 }, month: { xp: 3340, level: 9, streak: 2 }, all: { xp: 8700, level: 10, streak: 2 }, delta: 'same' },
  { name: 'Diya Rao', initials: 'DR', cohort: 'Algorithm Enthusiast', week: { xp: 930, level: 8, streak: 5 }, month: { xp: 3110, level: 8, streak: 5 }, all: { xp: 8200, level: 10, streak: 5 }, delta: 'up' },
  { name: 'Atharv Mishra', initials: 'AM', cohort: 'Circuit Builder', week: { xp: 890, level: 8, streak: 4 }, month: { xp: 2950, level: 8, streak: 4 }, all: { xp: 7900, level: 10, streak: 4 }, delta: 'down' },
  { name: 'Sara Fernandes', initials: 'SF', cohort: 'Quantum Researcher', week: { xp: 840, level: 8, streak: 3 }, month: { xp: 2820, level: 8, streak: 3 }, all: { xp: 7600, level: 9, streak: 3 }, delta: 'same' },
  { name: 'Yash Deshmukh', initials: 'YD', cohort: 'Algorithm Enthusiast', week: { xp: 790, level: 8, streak: 6 }, month: { xp: 2660, level: 7, streak: 6 }, all: { xp: 7200, level: 9, streak: 6 }, delta: 'up' },
  { name: 'Ira Bansal', initials: 'IB', cohort: 'Circuit Builder', week: { xp: 740, level: 7, streak: 2 }, month: { xp: 2440, level: 7, streak: 2 }, all: { xp: 6800, level: 9, streak: 2 }, delta: 'down' },
  { name: 'Riya Ghosh', initials: 'RG', cohort: 'Quantum Pioneer', week: { xp: 690, level: 7, streak: 4 }, month: { xp: 2210, level: 7, streak: 4 }, all: { xp: 6400, level: 8, streak: 4 }, delta: 'same' },
  { name: 'Nikhil Anand', initials: 'NA', cohort: 'Algorithm Enthusiast', week: { xp: 640, level: 7, streak: 3 }, month: { xp: 2080, level: 6, streak: 3 }, all: { xp: 6100, level: 8, streak: 3 }, delta: 'up' },
  { name: 'Kiara Sethi', initials: 'KS', cohort: 'Quantum Researcher', week: { xp: 590, level: 6, streak: 5 }, month: { xp: 1910, level: 6, streak: 5 }, all: { xp: 5700, level: 8, streak: 5 }, delta: 'down' },
  { name: 'Om Trivedi', initials: 'OT', cohort: 'Circuit Builder', week: { xp: 540, level: 6, streak: 2 }, month: { xp: 1760, level: 6, streak: 2 }, all: { xp: 5300, level: 7, streak: 2 }, delta: 'same' },
  { name: 'Pari Sehgal', initials: 'PS', cohort: 'Quantum Pioneer', week: { xp: 490, level: 6, streak: 4 }, month: { xp: 1620, level: 6, streak: 4 }, all: { xp: 5000, level: 7, streak: 4 }, delta: 'up', badge: 'First Responder' },
  { name: 'Kavya Pillai', initials: 'KP', cohort: 'Algorithm Enthusiast', week: { xp: 440, level: 5, streak: 1 }, month: { xp: 1490, level: 5, streak: 1 }, all: { xp: 4600, level: 7, streak: 1 }, delta: 'down' },
  { name: 'Shaurya Bathla', initials: 'SB', cohort: 'Circuit Builder', week: { xp: 390, level: 5, streak: 3 }, month: { xp: 1340, level: 5, streak: 3 }, all: { xp: 4300, level: 6, streak: 3 }, delta: 'same' },
  { name: 'Gauri Kulkarni', initials: 'GK', cohort: 'Quantum Researcher', week: { xp: 340, level: 5, streak: 2 }, month: { xp: 1180, level: 5, streak: 2 }, all: { xp: 3900, level: 6, streak: 2 }, delta: 'up' },
  { name: 'Pranav Hegde', initials: 'PH', cohort: 'Algorithm Enthusiast', week: { xp: 290, level: 4, streak: 4 }, month: { xp: 1010, level: 4, streak: 4 }, all: { xp: 3500, level: 6, streak: 4 }, delta: 'down' },
  { name: 'Maya Dutta', initials: 'MD', cohort: 'Circuit Builder', week: { xp: 240, level: 4, streak: 2 }, month: { xp: 880, level: 4, streak: 2 }, all: { xp: 3100, level: 5, streak: 2 }, delta: 'same' },
  { name: 'Rudra Patil', initials: 'RP', cohort: 'Quantum Pioneer', week: { xp: 200, level: 4, streak: 1 }, month: { xp: 720, level: 3, streak: 1 }, all: { xp: 2700, level: 5, streak: 1 }, delta: 'up' },
  { name: 'You', initials: 'QE', cohort: 'Quantum Explorer', week: { xp: 410, level: 6, streak: 6 }, month: { xp: 1640, level: 6, streak: 6 }, all: { xp: 5120, level: 7, streak: 6 }, delta: 'up', isYou: true },
  { name: 'Leela Mohanty', initials: 'LM', cohort: 'Algorithm Enthusiast', week: { xp: 310, level: 5, streak: 3 }, month: { xp: 970, level: 5, streak: 3 }, all: { xp: 3300, level: 6, streak: 3 }, delta: 'down' },
  { name: 'Farhan Sheikh', initials: 'FS', cohort: 'Quantum Researcher', week: { xp: 270, level: 4, streak: 2 }, month: { xp: 870, level: 4, streak: 2 }, all: { xp: 2900, level: 5, streak: 2 }, delta: 'same' },
  { name: 'Amaira Kaur', initials: 'AK', cohort: 'Circuit Builder', week: { xp: 230, level: 4, streak: 1 }, month: { xp: 760, level: 4, streak: 1 }, all: { xp: 2500, level: 5, streak: 1 }, delta: 'up' },
  { name: 'Veer Saxena', initials: 'VS', cohort: 'Algorithm Enthusiast', week: { xp: 190, level: 3, streak: 3 }, month: { xp: 640, level: 3, streak: 3 }, all: { xp: 2200, level: 4, streak: 3 }, delta: 'down' },
  { name: 'Tia Kapoor', initials: 'TK', cohort: 'Quantum Pioneer', week: { xp: 150, level: 3, streak: 2 }, month: { xp: 520, level: 3, streak: 2 }, all: { xp: 1900, level: 4, streak: 2 }, delta: 'same' },
  { name: 'Rajat Bhandari', initials: 'RB', cohort: 'Quantum Researcher', week: { xp: 120, level: 3, streak: 1 }, month: { xp: 430, level: 2, streak: 1 }, all: { xp: 1600, level: 4, streak: 1 }, delta: 'up' },
  { name: 'Ojasvi Tandon', initials: 'OT', cohort: 'Circuit Builder', week: { xp: 90, level: 2, streak: 2 }, month: { xp: 300, level: 2, streak: 2 }, all: { xp: 1200, level: 3, streak: 2 }, delta: 'down' },
  { name: 'Manav Rao', initials: 'MR', cohort: 'Algorithm Enthusiast', week: { xp: 60, level: 2, streak: 1 }, month: { xp: 210, level: 2, streak: 1 }, all: { xp: 900, level: 3, streak: 1 }, delta: 'same' },
]

const PERIOD_LABEL: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
}

const MEDALS = [
  { key: 1, icon: Crown, color: '#9a7b3f', bg: '#fff0c9', border: '#f0d9a8' },
  { key: 2, icon: Medal, color: '#557a67', bg: '#eef4ef', border: '#d8e4da' },
  { key: 3, icon: Medal, color: '#b3483c', bg: '#f7e5e2', border: '#e8ccc8' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Leaderboard() {
  const [period, setPeriod] = useState<Period>('week')
  const [query, setQuery] = useState('')

  const ranked = useMemo(() => {
    const rows = learners
      .map((l, idx) => ({ learner: l, rank: idx + 1, score: l[period].xp }))
      .sort((a, b) => b.score - a.score)
      .map((r, idx) => ({ ...r, rank: idx + 1 }))
    return rows
  }, [period])

  const topThree = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  const filtered = useMemo(() => {
    if (!query.trim()) return rest
    const q = query.toLowerCase()
    return rest.filter(
      (r) => r.learner.name.toLowerCase().includes(q) || r.learner.cohort.toLowerCase().includes(q)
    )
  }, [rest, query])

  const you = ranked.find((r) => r.learner.isYou)
  const youVisible = filtered.some((r) => r.learner.isYou)
  const totalLearners = ranked.length
  const totalXp = ranked.reduce((s, r) => s + r.score, 0)

  return (
    <div className="dash-page" style={{ display: 'grid', gap: 18 }}>
      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
            Leaderboard
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
              <Trophy size={16} />
            </span>
          </h1>
          <p style={{ marginTop: 6, color: 'var(--color-inkmuted)', fontSize: '0.88rem', maxWidth: 440 }}>
            Compare your Q-XP against learners worldwide and see who tops the quantum ranks.
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--color-cardborder)',
            background: '#fff',
            minWidth: 240,
          }}
        >
          <Search size={16} color="var(--color-inkmuted)" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a learner…"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: '0.88rem',
              color: 'var(--color-ink)',
            }}
          />
        </div>
      </div>

      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => {
          const active = p === period
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: active ? '1.5px solid #2f6b57' : '1px solid var(--color-cardborder)',
                background: active ? 'var(--color-sage-faint)' : '#fff',
                color: active ? '#0b3d32' : 'var(--color-inkmuted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              {PERIOD_LABEL[p]}
            </button>
          )
        })}
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '0.76rem', color: 'var(--color-inkmuted)' }}>
          {totalLearners} learners · {totalXp.toLocaleString()} Q-XP
        </span>
      </div>

      {/* Podium */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
        className="lb-podium"
      >
        {/* 2nd */}
        {topThree[1] && <PodiumCard rank={2} learner={topThree[1].learner} score={topThree[1].score} period={period} />}
        {/* 1st */}
        {topThree[0] && <PodiumCard rank={1} learner={topThree[0].learner} score={topThree[0].score} period={period} />}
        {/* 3rd */}
        {topThree[2] && <PodiumCard rank={3} learner={topThree[2].learner} score={topThree[2].score} period={period} />}
      </div>

      {/* Ranked list */}
      <section className="dash-card" style={{ padding: '18px 18px 12px' }}>
        <div
          className="dash-card-title"
          style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f1ef' }}
        >
          <h3>All Rankings</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-inkmuted)' }}>
            <strong style={{ color: 'var(--color-ink)' }}>{filtered.length}</strong> of {rest.length} shown
          </span>
        </div>

        <div style={{ display: 'grid', gap: 2 }}>
          {query.trim() && !youVisible && you && (
            <RankRow you={you} period={period} />
          )}
          {filtered.map((r) => (
            <RankRow key={r.learner.name} you={r} period={period} />
          ))}
        </div>
      </section>

      {/* Your rank card */}
      {you && !query.trim() && (
        <section
          className="dash-card"
          style={{
            padding: '18px',
            background: 'linear-gradient(135deg, #0b3d32, #2f6b57)',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <User size={22} />
              </span>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>Your Rank</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  #{you.rank} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>of {totalLearners}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {you.score.toLocaleString()} Q-XP this {period === 'all' ? 'all time' : period}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <MiniStat label="Level" value={String(you.learner[period].level)} />
              <MiniStat label="Streak" value={`${you.learner[period].streak} days`} />
              <MiniStat label="To next rank" value={`${(topThree[you.rank - 1] ?? you).score - you.score} XP`} />
            </div>
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 760px) {
          .lb-podium { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .lb-podium { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Delta({ delta }: { delta: 'up' | 'down' | 'same' }) {
  const color = delta === 'up' ? '#2f7d5b' : delta === 'down' ? '#b3483c' : '#9aa19b'
  const icon = delta === 'up' ? <ChevronUp size={13} /> : delta === 'down' ? <ChevronDown size={13} /> : <Minus size={12} />
  const label = delta === 'up' ? 'Gained position' : delta === 'down' ? 'Lost position' : 'Held position'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontSize: '0.74rem', fontWeight: 700 }} title={label}>
      {icon}
      <span className="lb-delta-label">{delta === 'up' ? 'new' : delta === 'down' ? 'drop' : '—'}</span>
    </span>
  )
}

function PodiumCard({
  rank,
  learner,
  score,
  period,
}: {
  rank: number
  learner: Learner
  score: number
  period: Period
}) {
  const medal = MEDALS.find((m) => m.key === rank) ?? MEDALS[0]
  const order = rank === 1 ? '1' : rank === 2 ? '2' : '3'
  return (
    <div
      className="dash-card"
      style={{
        padding: '18px 16px',
        borderRadius: 16,
        textAlign: 'center',
        position: 'relative',
        border: rank === 1 ? '1.5px solid #f0d9a8' : '1px solid var(--color-cardborder)',
        background: rank === 1 ? '#fffbf0' : '#fff',
        transform: rank === 1 ? 'translateY(-6px)' : 'none',
        boxShadow: rank === 1 ? '0 8px 20px rgba(154,123,63,0.12)' : 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 26,
          height: 26,
          borderRadius: 999,
          background: medal.bg,
          border: `1px solid ${medal.border}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: medal.color,
        }}
        title={`Rank #${order}`}
        aria-hidden="true"
      >
        <medal.icon size={14} />
      </span>
      <span
        style={{
          width: '100%',
          maxWidth: 200,
          height: `${rank === 1 ? 92 : rank === 2 ? 76 : 66}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px 16px 10px 10px',
          background: 'linear-gradient(180deg, #6d927d 0%, #0b3d32 100%)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.6rem',
          letterSpacing: '0.04em',
        }}
        aria-hidden="true"
      >
        {rank}
      </span>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: '#fff',
          border: `1.5px solid ${medal.border}`,
          margin: '-14px auto 0',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink)',
          fontWeight: 700,
          fontSize: '0.9rem',
          position: 'relative',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        {learner.initials}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-ink)', marginTop: 10 }}>
        {learner.isYou ? 'You' : learner.name}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)', marginTop: 2 }}>
        {learner.cohort} · Lvl {learner[period].level}
      </div>
      {learner.badge && (
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2f6b57', background: '#dce8de', border: '1px solid #c8d9cb', padding: '3px 8px', borderRadius: 999, display: 'inline-block', marginTop: 6 }}>
          {learner.badge}
        </div>
      )}
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>
        {score.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-inkmuted)' }}>Q-XP</span>
      </div>
    </div>
  )
}

function RankRow({ you, period }: { you: { learner: Learner; rank: number; score: number }; period: Period }) {
  const { learner, rank, score } = you
  const isYou = learner.isYou
  const medalOrder = rank === 1 ? 'first' : rank === 2 ? 'second' : rank === 3 ? 'third' : undefined

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 12,
        background: isYou ? 'var(--color-sage-faint)' : 'transparent',
        border: isYou ? '1px solid #d8e4da' : '1px solid transparent',
        cursor: 'default',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: medalOrder ? (rank === 1 ? '#fff0c9' : rank === 2 ? '#eef4ef' : '#f7e5e2') : '#f0f1ef',
          border: `1px solid ${medalOrder ? (rank === 1 ? '#f0d9a8' : rank === 2 ? '#d8e4da' : '#e8ccc8') : 'var(--color-cardborder)'}`,
          color: 'var(--color-ink)',
          fontWeight: 700,
          fontSize: '0.8rem',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: 'linear-gradient(135deg, #6d927d, #9fc0a8)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0b3d32',
          fontWeight: 700,
          fontSize: '0.78rem',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {learner.initials}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--color-ink)' }}>
          {learner.isYou ? 'You' : learner.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {learner.cohort}
        </div>
      </div>
      {learner.badge && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#2f6b57',
            background: '#dce8de',
            border: '1px solid #c8d9cb',
            padding: '3px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
          className="lb-badge"
        >
          <Sparkles size={11} /> {learner.badge}
        </span>
      )}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: '0.74rem',
          color: 'var(--color-inkmuted)',
          whiteSpace: 'nowrap',
        }}
        title={`Level ${learner[period].level}`}
      >
        <ShieldCheck size={13} /> Lvl {learner[period].level}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: '0.74rem',
          color: 'var(--color-inkmuted)',
          whiteSpace: 'nowrap',
        }}
        className="lb-streak"
        title={`${learner[period].streak} day learning streak`}
      >
        <Flame size={13} color="#a5761c" /> {learner[period].streak}
      </span>
      <span
        style={{
          minWidth: 90,
          textAlign: 'right',
          fontWeight: 800,
          fontSize: '0.9rem',
          color: isYou ? '#0b3d32' : 'var(--color-ink)',
          whiteSpace: 'nowrap',
        }}
      >
        {score.toLocaleString()}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          flexShrink: 0,
        }}
      >
        <Delta delta={learner.delta} />
      </span>
    </div>
  )
}