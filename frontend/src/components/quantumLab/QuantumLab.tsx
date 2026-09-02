import { useRef, useState, useCallback, useEffect } from 'react'
import type {
  CircuitState,
  GateType,
  BackendType,
  ExecutionState,
  PresetCircuit,
  UpdateSource,
} from '../../types/quantumLab'
import { PRESET_CIRCUITS } from '../../types/quantumLab'
import { generatePythonCode } from '../../utils/codeSync'
import { executeCircuitApi, parseCodeApi } from '../../services/quantumApi'
import { LabToolbar } from './LabToolbar'
import { ResizableWorkspace, type SplitPositions } from './ResizableWorkspace'
import { CircuitBuilder } from './CircuitBuilder/CircuitBuilder'
import { CodePanel } from './CodeEditor/CodePanel'
import { ResultsPanel } from './ResultsPanel'
import { LAYOUT_PRESETS, DEFAULT_POSITIONS, type LayoutPreset } from './layoutPresets'
import '../../styles/quantumLab.css'

let idCounter = 1

function createInitialCircuit(): CircuitState {
  const defaultPreset = PRESET_CIRCUITS[0]
  return {
    num_qubits: defaultPreset.qubits,
    operations: defaultPreset.operations.map((op) => ({
      ...op,
      id: `gate_${Date.now()}_${idCounter++}`,
    })),
  }
}

interface QuantumLabProps {
  layoutPreset?: LayoutPreset
  initialCircuit?: CircuitState
  initialFramework?: BackendType
}

/**
 * QuantumLab — the interactive quantum circuit workspace.
 *
 * Circuit IR (circuit) is the single source of truth. The visual circuit grid,
 * framework-specific Python code, and execution results are all derived from it.
 */
export function QuantumLab({
  layoutPreset: initialLayoutPreset = 'split',
  initialCircuit,
  initialFramework = 'qiskit',
}: QuantumLabProps) {
  const [circuit, setCircuit] = useState<CircuitState>(() => initialCircuit ?? createInitialCircuit())
  const circuitRef = useRef<CircuitState>(circuit)
  useEffect(() => {
    circuitRef.current = circuit
  }, [circuit])

  const [framework, setFramework] = useState<BackendType>(initialFramework)
  const [shots, setShots] = useState<number>(1000)
  const [code, setCode] = useState<string>(() => generatePythonCode(circuit, framework, 1000).code)
  const [results, setResults] = useState<ExecutionState>({ status: 'idle' })
  const [isRunning, setIsRunning] = useState(false)
  const [updateSource, setUpdateSource] = useState<UpdateSource>('system')

  const [history, setHistory] = useState<CircuitState[]>([circuit])
  const [historyIndex, setHistoryIndex] = useState(0)

  const [lineToGateId, setLineToGateId] = useState<Record<number, string>>(() =>
    generatePythonCode(circuit, framework, 1000).lineToGateId
  )
  const [gateIdToLine, setGateIdToLine] = useState<Record<string, number>>(() =>
    generatePythonCode(circuit, framework, 1000).gateIdToLine
  )
  const [codeError, setCodeError] = useState<string | undefined>()

  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)
  const [highlightedGateId, setHighlightedGateId] = useState<string | null>(null)
  const [highlightedCodeLine, setHighlightedCodeLine] = useState<number | undefined>()

  // --- Layout ---
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>(initialLayoutPreset)
  const [splitPositions, setSplitPositions] = useState<SplitPositions>(DEFAULT_POSITIONS)

  const applyLayoutPreset = useCallback((preset: LayoutPreset) => {
    const p = LAYOUT_PRESETS[preset]
    setLayoutPreset(preset)
    setSplitPositions({ horizontal: p.horizontal, vertical: p.vertical })
  }, [])

  const handleSplitChange = useCallback((positions: SplitPositions) => {
    // A custom (manual) resize overrides the active preset marker.
    setSplitPositions(positions)
  }, [])

  const debounceTimerRef = useRef<number | null>(null)
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // --- History ---
  const pushHistory = useCallback(
    (nextCircuit: CircuitState) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1)
        return [...sliced, nextCircuit]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex]
  )

  // --- Sync visual -> code ---
  const syncVisualToCode = useCallback(
    (currCircuit: CircuitState, currFramework: BackendType, currShots: number) => {
      const gen = generatePythonCode(currCircuit, currFramework, currShots)
      setCode(gen.code)
      setLineToGateId(gen.lineToGateId)
      setGateIdToLine(gen.gateIdToLine)
      setCodeError(undefined)
    },
    []
  )

  const applyVisualCircuitChange = useCallback(
    (nextCircuit: CircuitState) => {
      circuitRef.current = nextCircuit
      setUpdateSource('visual')
      setCircuit(nextCircuit)
      pushHistory(nextCircuit)
      syncVisualToCode(nextCircuit, framework, shots)
    },
    [pushHistory, syncVisualToCode, framework, shots]
  )

  // --- Gate operations ---
  const handleAddGate = useCallback(
    (gate: GateType, targets: number[], moment: number) => {
      const filteredOps = circuitRef.current.operations.filter(
        (op) => !(op.moment === moment && op.targets.some((t) => targets.includes(t)))
      )
      const newOp = { id: `gate_${Date.now()}_${idCounter++}`, gate, targets, moment }
      const nextCircuit: CircuitState = {
        ...circuitRef.current,
        operations: [...filteredOps, newOp],
      }
      applyVisualCircuitChange(nextCircuit)
    },
    [applyVisualCircuitChange]
  )

  const handleRemoveGate = useCallback(
    (gateId: string) => {
      const nextCircuit: CircuitState = {
        ...circuitRef.current,
        operations: circuitRef.current.operations.filter((op) => op.id !== gateId),
      }
      applyVisualCircuitChange(nextCircuit)
    },
    [applyVisualCircuitChange]
  )

  const handleDuplicateGate = useCallback(
    (gateId: string) => {
      const op = circuitRef.current.operations.find((o) => o.id === gateId)
      if (!op) return
      const duplicate = { ...op, id: `gate_${Date.now()}_${idCounter++}` }
      const nextCircuit: CircuitState = {
        ...circuitRef.current,
        operations: [...circuitRef.current.operations, duplicate],
      }
      applyVisualCircuitChange(nextCircuit)
    },
    [applyVisualCircuitChange]
  )

  const handleAddQubit = useCallback(() => {
    if (circuitRef.current.num_qubits >= 6) return
    const nextCircuit: CircuitState = {
      ...circuitRef.current,
      num_qubits: circuitRef.current.num_qubits + 1,
    }
    applyVisualCircuitChange(nextCircuit)
  }, [applyVisualCircuitChange])

  const handleRemoveQubit = useCallback(() => {
    if (circuitRef.current.num_qubits <= 1) return
    const targetQ = circuitRef.current.num_qubits - 1
    const filteredOps = circuitRef.current.operations.filter((op) => !op.targets.includes(targetQ))
    const nextCircuit: CircuitState = {
      num_qubits: circuitRef.current.num_qubits - 1,
      operations: filteredOps,
    }
    applyVisualCircuitChange(nextCircuit)
  }, [applyVisualCircuitChange])

  const handleClear = useCallback(() => {
    const nextCircuit: CircuitState = { ...circuitRef.current, operations: [] }
    applyVisualCircuitChange(nextCircuit)
  }, [applyVisualCircuitChange])

  const handleLoadPreset = useCallback(
    (preset: PresetCircuit) => {
      setSelectedGateId(null)
      const nextCircuit: CircuitState = {
        num_qubits: preset.qubits,
        operations: preset.operations.map((op) => ({
          ...op,
          id: `gate_${Date.now()}_${idCounter++}`,
        })),
      }
      applyVisualCircuitChange(nextCircuit)
    },
    [applyVisualCircuitChange]
  )

  // --- Undo / Redo ---
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    const nextIdx = historyIndex - 1
    const prevCircuit = history[nextIdx]
    circuitRef.current = prevCircuit
    setHistoryIndex(nextIdx)
    setCircuit(prevCircuit)
    setSelectedGateId(null)
    syncVisualToCode(prevCircuit, framework, shots)
  }, [historyIndex, history, framework, shots, syncVisualToCode])

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const nextIdx = historyIndex + 1
    const nextCircuit = history[nextIdx]
    circuitRef.current = nextCircuit
    setHistoryIndex(nextIdx)
    setCircuit(nextCircuit)
    setSelectedGateId(null)
    syncVisualToCode(nextCircuit, framework, shots)
  }, [historyIndex, history, framework, shots, syncVisualToCode])

  // --- Framework / shots ---
  const handleBackendChange = useCallback(
    (nextFramework: BackendType) => {
      setFramework(nextFramework)
      setUpdateSource('system')
      syncVisualToCode(circuitRef.current, nextFramework, shots)
    },
    [shots, syncVisualToCode]
  )

  const handleShotsChange = useCallback(
    (nextShots: number) => {
      setShots(nextShots)
      syncVisualToCode(circuitRef.current, framework, nextShots)
    },
    [framework, syncVisualToCode]
  )

  // --- Code -> visual (debounced parse) ---
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      setCodeError(undefined)
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)

      debounceTimerRef.current = window.setTimeout(async () => {
        setUpdateSource('code')
        const parseRes = await parseCodeApi({
          code: newCode,
          backend: framework,
          lastValidCircuit: circuitRef.current,
        })
        if (parseRes.error) {
          setCodeError(parseRes.error)
        } else {
          setCodeError(undefined)
          circuitRef.current = parseRes.circuit
          setCircuit(parseRes.circuit)
          setLineToGateId(parseRes.lineToGateId)
          setGateIdToLine(parseRes.gateIdToLine)
          pushHistory(parseRes.circuit)
        }
      }, 350)
    },
    [framework, pushHistory]
  )

  const handleFormatCode = useCallback(() => {
    setUpdateSource('system')
    syncVisualToCode(circuitRef.current, framework, shots)
  }, [framework, shots, syncVisualToCode])

  // --- Gate / line linking ---
  const handleSelectGate = useCallback(
    (gateId: string | null) => {
      setSelectedGateId(gateId)
      setHighlightedCodeLine(gateId && gateIdToLine[gateId] ? gateIdToLine[gateId] : undefined)
    },
    [gateIdToLine]
  )

  const handleLineCursorChange = useCallback(
    (lineNumber: number) => {
      const gateId = lineToGateId[lineNumber]
      setHighlightedGateId(gateId ?? null)
    },
    [lineToGateId]
  )

  // --- Run (uses circuit ID directly, never code) ---
  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setResults({ status: 'loading' })
    try {
      const result = await executeCircuitApi({
        backend: framework,
        shots,
        circuit: circuitRef.current,
      })
      setResults({ status: 'success', result })
    } catch (err: unknown) {
      setResults({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to simulate quantum circuit.',
      })
    } finally {
      setIsRunning(false)
    }
  }, [framework, shots])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isTyping =
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        active?.getAttribute('role') === 'textbox' ||
        (active?.closest('.monaco-editor') != null)

      if (!isTyping && (e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
        } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          e.preventDefault()
          handleRedo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  return (
    <div className="qlab-container" data-update-source={updateSource}>
      <LabToolbar
        numQubits={circuit.num_qubits}
        onAddQubit={handleAddQubit}
        onRemoveQubit={handleRemoveQubit}
        onClear={handleClear}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onLoadPreset={handleLoadPreset}
        backend={framework}
        onBackendChange={handleBackendChange}
        shots={shots}
        onShotsChange={handleShotsChange}
        onRun={handleRun}
        isRunning={isRunning}
        layoutPreset={layoutPreset}
        onLayoutPresetChange={applyLayoutPreset}
      />

      <ResizableWorkspace
        left={<CircuitBuilder
          circuit={circuit}
          onAddGate={handleAddGate}
          onRemoveGate={handleRemoveGate}
          onDuplicateGate={handleDuplicateGate}
          selectedGateId={selectedGateId}
          onSelectGate={handleSelectGate}
          highlightedGateId={highlightedGateId}
        />}
        right={<CodePanel
          code={code}
          backend={framework}
          onBackendChange={handleBackendChange}
          onChange={handleCodeChange}
          onFormat={handleFormatCode}
          error={codeError}
          highlightedLine={highlightedCodeLine}
          onLineCursorChange={handleLineCursorChange}
        />}
        bottom={<ResultsPanel
          executionState={results}
          currentBackend={framework}
          currentShots={shots}
          numQubits={circuit.num_qubits}
          onRunAgain={handleRun}
        />}
        positions={splitPositions}
        onSplitChange={handleSplitChange}
      />
    </div>
  )
}