import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'

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
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  // Fetch all modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/modules')
        const data = await response.json()

        setModules(data.modules)
      } catch (error) {
        console.error('Error fetching modules:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [])

  // Fetch lessons of selected module
  const handleModuleClick = async (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null)
      setLessons([])
      return
    }

    try {
      setExpandedModule(moduleId)

      const response = await fetch(`/api/modules/${moduleId}/lessons`)
      const data = await response.json()

      setLessons(data.lessons)
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  if (loading) {
    return <div>Loading modules...</div>
  }

  return (
    <div className="flex gap-6 p-6">

      {/* Modules */}
      <div className="w-80">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen size={24} />
          <h1 className="text-2xl font-bold">Learn</h1>
        </div>

        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module._id}>
              <button
                onClick={() => handleModuleClick(module._id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100"
              >
                <span>{module.title}</span>

                {expandedModule === module._id ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>

              {/* Lessons */}
              {expandedModule === module._id && (
                <div className="ml-5 mt-1 space-y-1">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson._id}
                      onClick={() => setSelectedLesson(lesson)}
                      className="p-2 text-sm rounded hover:bg-gray-100 cursor-pointer"
                    >
                      {lesson.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lesson content - next step */}
      <div className="flex-1">
        <div className="p-6 rounded-lg border">
          {selectedLesson ? (
            <>
              <h2 className="text-2xl font-bold">
                {selectedLesson.title}
              </h2>

              <div className="mt-4 prose max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {selectedLesson.content}
  </ReactMarkdown>
</div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">
                Select a lesson
              </h2>

              <p className="mt-2 text-gray-500">
                Select a lesson from a module to start learning.
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}