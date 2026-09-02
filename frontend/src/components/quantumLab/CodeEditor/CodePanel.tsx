import { Copy, Check, Code2, AlertTriangle, Wand2 } from 'lucide-react'
import { useState } from 'react'
import type { BackendType } from '../../../types/quantumLab'
import { QuantumCodeEditor } from './QuantumCodeEditor'
import { FrameworkSelector } from './FrameworkSelector'

interface CodePanelProps {
  code: string
  backend: BackendType
  onBackendChange: (b: BackendType) => void
  onChange: (value: string) => void
  onFormat: () => void
  error?: string
  highlightedLine?: number
  onLineCursorChange?: (lineNumber: number) => void
}

export function CodePanel({
  code,
  backend,
  onBackendChange,
  onChange,
  onFormat,
  error,
  highlightedLine,
  onLineCursorChange,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="qlab-code-panel" role="region" aria-label="Python Code Editor">
      <div className="qlab-code-header">
        <div className="qlab-code-title-group">
          <span className="qlab-code-overline">Circuit Code</span>
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-[var(--color-primary)]" />
            <span className="qlab-code-subtitle">Framework-specific Python</span>
          </div>
        </div>

        <div className="qlab-code-controls">
          <FrameworkSelector value={backend} onChange={onBackendChange} compact />

          <button
            type="button"
            className="qlab-btn-compact !py-1 text-xs"
            onClick={onFormat}
            title="Regenerate code from circuit"
            aria-label="Regenerate code from circuit"
          >
            <Wand2 size={13} />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            className="qlab-btn-compact !py-1 text-xs"
            onClick={handleCopy}
            title="Copy Python script to clipboard"
            aria-label="Copy Python script"
          >
            {copied ? (
              <>
                <Check size={13} className="text-[var(--color-success)]" />
                <span className="text-[var(--color-success)]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <QuantumCodeEditor
        code={code}
        onChange={onChange}
        highlightedLine={highlightedLine}
        onLineCursorChange={onLineCursorChange}
      />

      {error && (
        <div className="qlab-code-error-banner" role="alert">
          <AlertTriangle size={15} className="shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-semibold">Code Syntax Note:</span> {error}
          </div>
        </div>
      )}
    </div>
  )
}
