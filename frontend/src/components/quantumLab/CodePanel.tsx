import { AlertCircle, CheckCircle2, Code2, Loader2 } from 'lucide-react'
import { Editor } from '@monaco-editor/react'
import type { CodeError, Framework } from '../../types/quantumLab'
import { FRAMEWORKS, FRAMEWORK_LABELS } from '../../types/quantumLab'

export interface CodePanelProps {
  code: string
  framework: Framework
  status: 'synced' | 'parsing' | 'error'
  error?: CodeError | null
  onCodeChange: (code: string) => void
  onFrameworkChange: (framework: Framework) => void
}

const FILE_NAMES: Record<Framework, string> = {
  qiskit: 'quantum_circuit.py',
  pennylane: 'pennylane_circuit.py',
  cirq: 'cirq_circuit.py',
  openqasm2: 'circuit.qasm',
  openqasm3: 'circuit.qasm3',
}

const PYTHON = new Set<Framework>(['qiskit', 'pennylane', 'cirq'])

export function CodePanel({
  code,
  framework,
  status,
  error,
  onCodeChange,
  onFrameworkChange,
}: CodePanelProps) {
  const language = PYTHON.has(framework) ? 'python' : 'plaintext'
  const fileName = FILE_NAMES[framework]

  return (
    <div className="qlab-code-panel">
      <div className="qlab-code-header">
        <div className="qlab-code-title-group">
          <span className="qlab-code-overline">{FRAMEWORK_LABELS[framework]}</span>
          <span className="qlab-code-subtitle">{fileName}</span>
        </div>

        <div className="qlab-code-controls">
          <label className="qlab-meta-item" htmlFor="qlab-framework-select">
            <span>Target</span>
            <select
              id="qlab-framework-select"
              value={framework}
              onChange={(e) => onFrameworkChange(e.target.value as Framework)}
            >
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f}>
                  {FRAMEWORK_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="qlab-monaco-wrapper">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={(value) => onCodeChange(value ?? '')}
          loading={
            <div className="qlab-code-loading">
              <Code2 size={18} />
              <span>Loading editor…</span>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
            padding: { top: 12, bottom: 12 },
            fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", Consolas, Menlo, monospace',
            tabSize: 2,
            readOnly: false,
          }}
        />
      </div>

      {status === 'error' && error && (
        <div className="qlab-code-error-banner" role="alert">
          <AlertCircle size={14} />
          <span>
            {error.message}
            {typeof error.line === 'number' ? ` (line ${error.line}${typeof error.column === 'number' ? `, col ${error.column}` : ''})` : ''}
          </span>
        </div>
      )}

      <div className="qlab-code-footer">
        {status === 'parsing' ? (
          <span className="qlab-code-status">
            <Loader2 size={12} className="qlab-spin" />
            Parsing…
          </span>
        ) : status === 'error' ? (
          <span className="qlab-code-status qlab-code-status-error">
            <AlertCircle size={12} />
            Not synced
          </span>
        ) : (
          <span className="qlab-code-status">
            <CheckCircle2 size={12} />
            {framework === 'openqasm2' || framework === 'openqasm3' ? 'OpenQASM' : 'Python'} · in sync
          </span>
        )}
        <span className="qlab-code-filename">{fileName}</span>
      </div>
    </div>
  )
}