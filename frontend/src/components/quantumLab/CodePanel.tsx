import { useState } from 'react'
import { Code2 } from 'lucide-react'
import { Editor } from '@monaco-editor/react'

const DEFAULT_CODE = `from qiskit import QuantumCircuit

# Build a Bell state
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)

# Measure both qubits
qc.measure([0, 1], [0, 1])

print(qc.draw())
`

export function CodePanel() {
  const [code, setCode] = useState(DEFAULT_CODE)

  return (
    <div className="qlab-code-panel">
      <div className="qlab-code-header">
        <div className="qlab-code-title-group">
          <span className="qlab-code-overline">Qiskit</span>
          <span className="qlab-code-subtitle">quantum_circuit.py</span>
        </div>
      </div>

      <div className="qlab-monaco-wrapper">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value ?? '')}
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
          }}
        />
      </div>

      <div className="qlab-code-footer">
        <span className="qlab-code-status">Python · Qiskit</span>
        <span className="qlab-code-filename">quantum_circuit.py</span>
      </div>
    </div>
  )
}