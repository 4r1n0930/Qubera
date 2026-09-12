import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Play } from 'lucide-react'
import type { Framework } from '../../types/quantumLab'

const PYTHON_LANGS = new Set(['python', 'qiskit', 'pennylane', 'cirq'])

const LANGUAGE_TO_FRAMEWORK: Record<string, Framework> = {
  python: 'qiskit',
  qiskit: 'qiskit',
  pennylane: 'pennylane',
  cirq: 'cirq',
}

function toFramework(language: string): Framework {
  return LANGUAGE_TO_FRAMEWORK[language.toLowerCase()] ?? 'qiskit'
}

interface LearnCodeBlockProps {
  language: string
  children: string
}

export function LearnCodeBlock({ language, children }: LearnCodeBlockProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  if (!PYTHON_LANGS.has(language.toLowerCase())) {
    return (
      <pre className="learn-pre">
        <code>{children}</code>
      </pre>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
    } catch {
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = () => {
    navigate('/dashboard/quantum-lab', {
      state: { code: children, framework: toFramework(language) },
    })
  }

  return (
    <div className="learn-code-panel">
      <div className="learn-code-header">
        <span className="learn-code-lang">{language}</span>
        <div className="learn-code-actions">
          <button
            type="button"
            className="learn-code-btn"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className="learn-code-btn learn-code-btn-run"
            onClick={handleRun}
            aria-label="Run code in Quantum Lab"
          >
            <Play size={14} />
            Run
          </button>
        </div>
      </div>
      <pre className="learn-code-pre">
        <code>{children}</code>
      </pre>
    </div>
  )
}