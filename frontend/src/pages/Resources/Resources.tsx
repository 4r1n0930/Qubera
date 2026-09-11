import { useMemo, useState } from 'react'
import {
  FolderOpen,
  Search,
  FileText,
  Video,
  ExternalLink,
  BookOpen,
  Wrench,
  GraduationCap,
  Download,
  Code2,
  Atom,
  Globe,
  Shield,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

type Category = 'All' | 'Cheat Sheets' | 'Papers' | 'Videos' | 'Tools' | 'Books'

interface Resource {
  title: string
  description: string
  category: Exclude<Category, 'All'>
  type: string
  meta: string
  icon: typeof FileText
  color: string
  bg: string
  border: string
  url: string
  featured?: boolean
}

const categories: Category[] = ['All', 'Cheat Sheets', 'Papers', 'Videos', 'Tools', 'Books']

const resources: Resource[] = [
  {
    title: 'Qiskit Cheat Sheet',
    description: 'Quick reference for Qiskit circuit construction, gates and common patterns.',
    category: 'Cheat Sheets',
    type: 'PDF',
    meta: '2 pages',
    icon: FileText,
    color: '#2f6b57',
    bg: '#e3eee9',
    border: '#bfd5cc',
    url: 'https://docs.quantum.ibm.com/api/qiskit',
    featured: true,
  },
  {
    title: 'Quantum Gate Reference',
    description: 'Complete list of single-qubit and multi-qubit gates with matrix forms.',
    category: 'Cheat Sheets',
    type: 'PDF',
    meta: '4 pages',
    icon: Atom,
    color: '#0b3d32',
    bg: '#eef4ef',
    border: '#d8e4da',
    url: 'https://en.wikipedia.org/wiki/Quantum_logic_gate',
  },
  {
    title: 'Shor\'s Algorithm Explained',
    description: 'Step-by-step walkthrough of Shor\'s factoring algorithm for beginners.',
    category: 'Videos',
    type: 'YouTube',
    meta: '18 min',
    icon: Video,
    color: '#b3483c',
    bg: '#f7e5e2',
    border: '#e8ccc8',
    url: 'https://www.youtube.com/results?search_query=shors+algorithm+explained',
    featured: true,
  },
  {
    title: 'Quantum Entanglement — Visual Intro',
    description: 'Interactive visualization of Bell pairs and entanglement phenomena.',
    category: 'Videos',
    type: 'YouTube',
    meta: '12 min',
    icon: Video,
    color: '#b3483c',
    bg: '#f7e5e2',
    border: '#e8ccc8',
    url: 'https://www.youtube.com/results?search_query=quantum+entanglement+visual',
  },
  {
    title: 'Introduction to Quantum Computing (Nielsen & Chuang)',
    description: 'The foundational textbook for quantum computation and quantum information.',
    category: 'Books',
    type: 'Book',
    meta: 'Chapter 1–4',
    icon: BookOpen,
    color: '#4a3f6b',
    bg: '#ebe6f7',
    border: '#ddd8ee',
    url: 'https://en.wikipedia.org/wiki/Quantum_Computation_and_Quantum_Information',
    featured: true,
  },
  {
    title: 'Quantum Computing: A Gentle Introduction',
    description: 'Accessible introduction covering theory, algorithms and implementations.',
    category: 'Books',
    type: 'Book',
    meta: 'Selected chapters',
    icon: BookOpen,
    color: '#4a3f6b',
    bg: '#ebe6f7',
    border: '#ddd8ee',
    url: 'https://en.wikipedia.org/wiki/Quantum_computing',
  },
  {
    title: 'Quantum Error Correction with Qiskit',
    description: 'Implementing the bit-flip, phase-flip and Shor codes on real hardware.',
    category: 'Papers',
    type: 'Paper',
    meta: 'arXiv 2024',
    icon: FileText,
    color: '#5e3b1a',
    bg: '#f5ece2',
    border: '#e0d1c0',
    url: 'https://arxiv.org/abs/2404.14721',
  },
  {
    title: 'Quantum Approximate Optimization Algorithm',
    description: 'The foundational QAOA paper for combinatorial optimization.',
    category: 'Papers',
    type: 'Paper',
    meta: 'arXiv 2014',
    icon: FileText,
    color: '#5e3b1a',
    bg: '#f5ece2',
    border: '#e0d1c0',
    url: 'https://arxiv.org/abs/1411.4028',
  },
  {
    title: 'IBM Quantum Platform',
    description: 'Access real quantum hardware and run experiments via Qiskit Runtime.',
    category: 'Tools',
    type: 'Website',
    meta: 'Free tier available',
    icon: Globe,
    color: '#1a4a5e',
    bg: '#e4eef6',
    border: '#c0d5e3',
    url: 'https://quantum.ibm.com',
    featured: true,
  },
  {
    title: 'Quantum Circuit Simulator',
    description: 'Local and browser-based simulators for testing circuits before running on hardware.',
    category: 'Tools',
    type: 'Tool',
    meta: 'Open source',
    icon: Wrench,
    color: '#5e1a2e',
    bg: '#f6e2eb',
    border: '#e0c0cc',
    url: 'https://github.com/Qiskit/qiskit-aer',
  },
  {
    title: 'PennyLane Documentation',
    description: 'Quantum machine learning framework documentation and tutorials.',
    category: 'Tools',
    type: 'Docs',
    meta: 'Online',
    icon: Code2,
    color: '#2f6b57',
    bg: '#e3eee9',
    border: '#bfd5cc',
    url: 'https://docs.pennylane.ai',
  },
  {
    title: 'Quantum Computing Roadmap',
    description: 'Overview of the global quantum computing development timeline and milestones.',
    category: 'Cheat Sheets',
    type: 'PDF',
    meta: '1 page',
    icon: GraduationCap,
    color: '#7a5a1a',
    bg: '#fff0c9',
    border: '#f0d9a8',
    url: 'https://en.wikipedia.org/wiki/Roadmap_for_quantum_computing',
  },
  {
    title: 'Grover\'s Search Algorithm',
    description: 'Animation walkthrough of Grover\'s amplitude amplification for unstructured search.',
    category: 'Videos',
    type: 'YouTube',
    meta: '15 min',
    icon: Video,
    color: '#b3483c',
    bg: '#f7e5e2',
    border: '#e8ccc8',
    url: 'https://www.youtube.com/results?search_query=grovers+algorithm+visual',
  },
  {
    title: 'Variational Quantum Eigensolver',
    description: 'Paper on VQE for molecular ground state estimation on near-term devices.',
    category: 'Papers',
    type: 'Paper',
    meta: 'arXiv 2014',
    icon: Shield,
    color: '#5e3b1a',
    bg: '#f5ece2',
    border: '#e0d1c0',
    url: 'https://arxiv.org/abs/1111.6613',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Resources() {
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = resources
    if (activeCategory !== 'All') {
      list = list.filter((r) => r.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCategory, query])

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
          Resources
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
            <FolderOpen size={16} />
          </span>
        </h1>
        <p style={{ marginTop: 6, color: 'var(--color-inkmuted)', fontSize: '0.88rem', maxWidth: 500 }}>
          Cheat sheets, papers, video explainers and reference materials to deepen your quantum knowledge.
        </p>
      </div>

      {/* Search + filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
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
            flex: '1 1 260px',
            maxWidth: 380,
          }}
        >
          <Search size={16} color="var(--color-inkmuted)" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources…"
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

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: '1 1 auto' }}>
          {categories.map((cat) => {
            const active = cat === activeCategory
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: active ? '1.5px solid #2f6b57' : '1px solid var(--color-cardborder)',
                  background: active ? 'var(--color-sage-faint)' : '#fff',
                  color: active ? '#0b3d32' : 'var(--color-inkmuted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 180ms ease',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <span style={{ fontSize: '0.76rem', color: 'var(--color-inkmuted)', whiteSpace: 'nowrap' }}>
          {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Featured banner (only when All + no query) */}
      {activeCategory === 'All' && !query.trim() && (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {resources
            .filter((r) => r.featured)
            .slice(0, 3)
            .map((r) => {
              const Icon = r.icon
              return (
                <a
                  key={r.title}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: `1px solid ${r.border}`,
                    background: r.bg,
                    textDecoration: 'none',
                    transition: 'box-shadow 180ms ease',
                  }}
                  className="res-featured-card"
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#fff',
                      border: `1px solid ${r.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: r.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--color-ink)' }}>{r.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-inkmuted)', marginTop: 3 }}>
                      {r.type} · {r.meta}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: '#2f6b57',
                      background: '#dce8de',
                      border: '1px solid #c8d9cb',
                      padding: '3px 7px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                    }}
                  >
                    Featured
                  </span>
                </a>
              )
            })}
        </section>
      )}

      {/* Resources grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: 16,
            border: '1px solid var(--color-cardborder)',
            background: '#fff',
          }}
        >
          <Search size={28} color="var(--color-inkmuted)" />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', marginTop: 12 }}>
            No resources found
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--color-inkmuted)', marginTop: 4 }}>
            Try adjusting your search or category filter.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}
          className="res-grid"
        >
          {filtered.map((r) => {
            const Icon = r.icon
            return (
              <a
                key={r.title}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: 18,
                  borderRadius: 16,
                  border: '1px solid var(--color-cardborder)',
                  background: '#fff',
                  textDecoration: 'none',
                  transition: 'box-shadow 180ms ease, border-color 180ms ease',
                }}
                className="res-card"
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: r.bg,
                      border: `1px solid ${r.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: r.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink)' }}>{r.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-inkmuted)', marginTop: 3, lineHeight: 1.4 }}>
                      {r.description}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: r.color,
                        background: r.bg,
                        border: `1px solid ${r.border}`,
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {r.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-inkmuted)' }}>
                      {r.type} · {r.meta}
                    </span>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#0b3d32',
                    }}
                  >
                    Open <ExternalLink size={12} />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Download / Quick links section */}
      {!query.trim() && (
        <section className="dash-card" style={{ padding: '18px 18px 14px' }}>
          <div className="dash-card-title" style={{ marginBottom: 14 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={18} color="var(--color-sage-dark)" aria-hidden="true" />
              Quick Downloads
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { label: 'Qiskit Installation Guide', sub: 'PDF · Get started', url: 'https://docs.quantum.ibm.com/start/install' },
              { label: 'Quantum Concepts Poster', sub: 'PDF · Wall reference', url: 'https://en.wikipedia.org/wiki/Quantum_mechanics' },
              { label: 'Gate Matrix Cheat Sheet', sub: 'PDF · All common gates', url: 'https://en.wikipedia.org/wiki/Quantum_logic_gate' },
              { label: 'Error Correction Workbook', sub: 'PDF · Practice problems', url: 'https://en.wikipedia.org/wiki/Quantum_error_correction' },
            ].map((d) => (
              <a
                key={d.label}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--color-cardborder)',
                  background: '#fff',
                  textDecoration: 'none',
                }}
                className="res-download-card"
              >
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
                  <Download size={15} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--color-inkmuted)' }}>{d.sub}</div>
                </div>
                <ExternalLink size={13} color="var(--color-inkmuted)" style={{ flexShrink: 0, marginLeft: 'auto' }} />
              </a>
            ))}
          </div>
        </section>
      )}

      <style>{`
        .res-card:hover { box-shadow: 0 4px 12px rgba(31,33,29,0.1); border-color: var(--color-sage); }
        .res-featured-card:hover { box-shadow: 0 4px 12px rgba(31,33,29,0.1); }
        .res-download-card:hover { border-color: var(--color-sage); background: var(--color-sage-faint); }
        @media (max-width: 720px) {
          .res-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}