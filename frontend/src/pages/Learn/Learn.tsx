import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import remarkGfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'
import type { ReactNode } from 'react'
import { LearnCodeBlock } from '../../components/learn/LearnCodeBlock'

type Module = {
  _id: string
  title: string
  description: string
  order: number
  difficulty: string
  estimatedTime: number
  isPublished: boolean
}

type Lesson = {
  _id: string
  moduleId: string
  title: string
  content: string
  order: number
  duration: number
  isPublished: boolean
}

export function Learn() {
  const [modules, setModules] = useState<Module[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({})
  const [lessonsLoading, setLessonsLoading] = useState<Record<string, boolean>>({})
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({})
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLessons = async (moduleId: string) => {
    if (lessonsLoading[moduleId] || lessonsByModule[moduleId]) return

    setLessonsLoading((prev) => ({ ...prev, [moduleId]: true }))

    try {
      const response = await fetch(`/api/modules/${moduleId}/lessons`)
      if (!response.ok) throw new Error(`Failed to load lessons (${response.status})`)

      const data = await response.json().catch(() => ({}))
      const list: Lesson[] = Array.isArray(data?.lessons) ? data.lessons : []

      setLessonsByModule((prev) => ({ ...prev, [moduleId]: list }))
      setSelectedLesson((prev) => prev ?? list[0] ?? null)
    } catch (err) {
      setLessonErrors((prev) => ({
        ...prev,
        [moduleId]: err instanceof Error ? err.message : 'Failed to load lessons',
      }))
    } finally {
      setLessonsLoading((prev) => ({ ...prev, [moduleId]: false }))
    }
  }

  const fetchModules = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/modules')
      if (!response.ok) throw new Error(`Failed to fetch modules (${response.status})`)

      const data = await response.json().catch(() => ({}))
      const mods: Module[] = Array.isArray(data?.modules) ? data.modules : []

      setModules(mods)

      const first = mods[0]
      if (first) {
        setExpandedModule(first._id)
        loadLessons(first._id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleModuleClick = (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null)
      return
    }

    setExpandedModule(moduleId)
    if (!lessonsLoading[moduleId] && !lessonsByModule[moduleId]) {
      loadLessons(moduleId)
    }
  }

  const difficultyClass = (difficulty: string) => difficulty.toLowerCase()

  const renderModuleLessons = (module: Module) => {
    if (lessonsLoading[module._id]) {
      return (
        <div className="learn-lesson-status">
          <Loader2 size={14} className="learn-spin" />
          Loading lessons…
        </div>
      )
    }

    if (lessonErrors[module._id]) {
      return (
        <div className="learn-lesson-status learn-lesson-error">
          <AlertTriangle size={14} />
          Couldn't load lessons.
        </div>
      )
    }

    const lessons = lessonsByModule[module._id] ?? []

    if (lessons.length === 0) {
      return <div className="learn-lesson-status">No lessons in this module yet.</div>
    }

    return (
      <>
        {lessons.map((lesson) => (
          <div
            key={lesson._id}
            className={`learn-lesson${selectedLesson?._id === lesson._id ? ' learn-lesson-active' : ''}`}
            aria-current={selectedLesson?._id === lesson._id ? 'true' : undefined}
            onClick={() => setSelectedLesson(lesson)}
          >
            <FileText size={15} />
            <span className="learn-lesson-title">{lesson.title}</span>
            {lesson.duration > 0 && (
              <span className="learn-lesson-duration">{lesson.duration} min</span>
            )}
          </div>
        ))}
      </>
    )
  }

  if (loading) {
    return (
      <div className="learn-status-page">
        <Loader2 size={26} className="learn-spin" />
        <span>Loading modules…</span>
      </div>
    )
  }

  if (error && modules.length === 0) {
    return (
      <div className="learn-error-box">
        <AlertTriangle size={28} />
        <h2>Couldn't load learning content</h2>
        <p>{error}</p>
        <button type="button" className="learn-retry-btn" onClick={fetchModules}>
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    )
  }

  const selectedModule = selectedLesson
    ? modules.find((m) => m._id === selectedLesson.moduleId)
    : undefined

  return (
    <div className="learn-layout">
      <aside className="learn-panel learn-modules">
        <header className="learn-panel-head">
          <BookOpen size={20} />
          <h1>Learn</h1>
        </header>

        <nav className="learn-module-list" aria-label="Modules and lessons">
          {modules.map((module) => {
            const isOpen = expandedModule === module._id
            const lessonCount = lessonsByModule[module._id]?.length

            return (
              <div key={module._id} className="learn-module">
                <button
                  type="button"
                  className="learn-module-head"
                  aria-expanded={isOpen}
                  onClick={() => handleModuleClick(module._id)}
                >
                  <span className="learn-module-title">{module.title}</span>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {isOpen && (
                  <div className="learn-module-body">
                    {module.description && (
                      <p className="learn-module-desc">{module.description}</p>
                    )}

                    <div className="learn-module-meta">
                      <span className={`learn-chip learn-chip-${difficultyClass(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                      {module.estimatedTime > 0 && (
                        <span className="learn-meta-item">
                          <Clock size={13} />
                          ~{module.estimatedTime} min
                        </span>
                      )}
                      {typeof lessonCount === 'number' && (
                        <span className="learn-meta-item">
                          {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                        </span>
                      )}
                    </div>

                    <div className="learn-lesson-list">{renderModuleLessons(module)}</div>
                  </div>
                )}
              </div>
            )
          })}

          {modules.length === 0 && (
            <div className="learn-empty">
              <BookOpen size={26} />
              <p>No modules available yet.</p>
            </div>
          )}
        </nav>
      </aside>

      <section className="learn-panel learn-reader" aria-live="polite">
        {selectedLesson ? (
          <article>
            <h2 className="learn-reader-title">{selectedLesson.title}</h2>

            <div className="learn-reader-meta">
              {selectedModule && <span className="learn-meta-item">{selectedModule.title}</span>}
              {selectedLesson.duration > 0 && (
                <span className="learn-meta-item">
                  <Clock size={13} />
                  {selectedLesson.duration} min read
                </span>
              )}
            </div>

            <div className="learn-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre({ children }: { children?: ReactNode }) {
                    return <>{children}</>
                  },
                  code({ className, children }: { className?: string; children?: ReactNode }) {
                    const match = /language-(\w+)/.exec(className || '')
                    if (match) {
                      return (
                        <LearnCodeBlock language={match[1]}>
                          {String(children).replace(/\n$/, '')}
                        </LearnCodeBlock>
                      )
                    }
                    return <code className={className}>{children}</code>
                  },
                }}
              >
                {selectedLesson.content}
              </ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="learn-empty learn-reader-empty">
            <BookOpen size={30} />
            <h2>Select a lesson</h2>
            <p>Select a lesson from a module to start learning.</p>
          </div>
        )}
      </section>
    </div>
  )
}