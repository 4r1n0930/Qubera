import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { CircuitBoard, Code2, SplitSquareHorizontal } from 'lucide-react'
import type {
  CircuitState,
  GateOperation,
  GateType,
  BackendType,
  ExecutionState,
  Framework,
  UpdateSource,
  CodeError,
} from '../../types/quantumLab'
import { CircuitBuilder } from './CircuitBuilder'
import { ResultsPanel } from './ResultsPanel'
import { CodePanel } from './CodePanel'
import { simulateCircuit } from '../../utils/quantumSimulator'
import { generateCircuitCode } from '../../utils/codeSync'
import { codeToIrApi, ConversionError } from '../../services/conversionApi'
import { useDebouncedCallback } from '../../utils/debounce'
import '../../styles/quantumLab.css'

type LabMode = 'circuit' | 'split' | 'code'

const MODE_ORDER: LabMode[] = ['circuit', 'split', 'code']

const MODE_META: Record<
  LabMode,
  { icon: ComponentType<{ size?: number | string }>; label: string }
> = {
  circuit: { icon: CircuitBoard, label: 'Circuit' },
  split: { icon: SplitSquareHorizontal, label: 'Split' },
  code: { icon: Code2, label: 'Code' },
}

/** Debounce window for code → IR parsing (300 ms). */
const CODE_EDIT_DEBOUNCE_MS = 300

let idCounter = 1

function genId(): string {
  return `gate_${Date.now()}_${idCounter++}`
}

/**
 * Default rotation parameters for parameterized gates.
 */
function defaultParams(gate: GateType): { [key: string]: number } | undefined {
  switch (gate) {
    case 'RX':
    case 'RY':
    case 'RZ':
    case 'RXX':
    case 'RZZ':
      return { theta: Math.PI / 2 }
    case 'P':
      return { lambda: Math.PI / 2 }
    default:
      return undefined
  }
}

function createInitialCircuit(): CircuitState {
  return { num_qubits: 1, operations: [] }
}

/**
 * Computes the maximum column across all wires.
 */
function circuitWidth(circuit: CircuitState): number {
  return circuit.operations.reduce((max, op) => Math.max(max, op.moment + 1), 8)
}

/**
 * Places a gate at an insertion column on all target wires.
 *
 * Shifts are only performed when the gate is dropped in the gap between two
 * adjacent gates (a gate already at `column` and another right after it at
 * `column + 1`), pushing that and later gates right to make room. When dropped
 * into empty space, the gate is placed in the first free slot on/after the
 * column without shifting any existing gates, keeping layout consistent.
 */
function placeGate(
  circuit: CircuitState,
  gate: GateType,
  targets: number[],
  column: number,
  params?: { [key: string]: number }
): CircuitState {
  const overlapsWire = (op: GateOperation) => op.targets.some((t) => targets.includes(t))
  const opAt = (c: number) =>
    circuit.operations.find((op) => op.moment === c && overlapsWire(op))

  const gateAtColumn = opAt(column)
  const gateAdjacent = opAt(column + 1)

  const finalParams = params ?? defaultParams(gate)

  // Between two adjacent gates → insert and shift everything from that column right.
  if (gateAtColumn && gateAdjacent) {
    const op: GateOperation = { id: genId(), gate, targets: [...targets], moment: column, params: finalParams }
    const shifted = circuit.operations.map((existing) =>
      overlapsWire(existing) && existing.moment >= column
        ? { ...existing, moment: existing.moment + 1 }
        : existing
    )
    return { ...circuit, operations: [...shifted, op] }
  }

  // Empty space → place in the first free slot, shifting nothing.
  let moment = column
  while (opAt(moment)) moment += 1
  const op: GateOperation = { id: genId(), gate, targets: [...targets], moment, params: finalParams }
  return { ...circuit, operations: [...circuit.operations, op] }
}

/**
 * Moves an existing gate to a new column/targets, reusing the placement rules.
 */
function moveGate(
  circuit: CircuitState,
  gateId: string,
  targets: number[],
  column: number
): CircuitState {
  const source = circuit.operations.find((op) => op.id === gateId)
  if (!source) return circuit
  const samePosition =
    source.moment === column &&
    source.targets.length === targets.length &&
    source.targets.every((t, i) => t === targets[i])
  if (samePosition) return circuit
  const withoutSource = circuit.operations.filter((op) => op.id !== gateId)
  return placeGate({ ...circuit, operations: withoutSource }, source.gate, targets, column, source.params)
}

function removeGate(circuit: CircuitState, gateId: string): CircuitState {
  return { ...circuit, operations: circuit.operations.filter((op) => op.id !== gateId) }
}

export function QuantumLab() {
  const [mode, setMode] = useState<LabMode>('circuit')
  const [circuit, setCircuit] = useState<CircuitState>(createInitialCircuit)
  const circuitRef = useRef(circuit)
  const latestCircuit = useCallback((c: CircuitState) => {
    circuitRef.current = c
    setCircuit(c)
  }, [])

  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)
  const [backend, setBackend] = useState<BackendType>('qiskit')
  const [shots, setShots] = useState<number>(1000)
  const [runError, setRunError] = useState<string | null>(null)
  const [runTick, setRunTick] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const runVersion = useRef(0)

  // ---------------- Code ↔ circuit synchronization ----------------
  const [framework, setFramework] = useState<Framework>('qiskit')
  // Latest-value ref (synced in an effect) so the stable `runCodeParse`
  // callback reads the current framework at call time, never a stale closure.
  const frameworkRef = useRef<Framework>(framework)
  useEffect(() => {
    frameworkRef.current = framework
  }, [framework])
  const [code, setCode] = useState<string>(
    () => generateCircuitCode({ num_qubits: 1, operations: [] }, 'qiskit').code
  )
  const [codeStatus, setCodeStatus] = useState<'synced' | 'parsing' | 'error'>('synced')
  const [codeError, setCodeError] = useState<CodeError | null>(null)

  /**
   * Conversion-loop prevention state:
   *  - `circuitSourceRef` records whether the current circuit originated from
   *    the builder ('circuit'), from parsed code ('code'), or was mirrorred
   *    programmatically ('system').
   *  - `programmaticCodeRef` stores the exact text we last wrote into the
   *    editor, so the Monaco onChange echo of our own write is ignored and
   *    never fed back into the debounced parse.
   */
  const circuitSourceRef = useRef<UpdateSource>('circuit')
  const programmaticCodeRef = useRef<string>('')

  // Debounced parse state: abort in-flight requests and ignore stale results.
  const parseControllerRef = useRef<AbortController | null>(null)
  const parseVersionRef = useRef(0)

  const numQubits = circuit.num_qubits
  const width = circuitWidth(circuit)
  const ToggleIcon = MODE_META[mode].icon

  // Shared simulation state. Recomputed whenever the circuit structure, backend,
  // or shot count changes — and on every explicit Run — so the probability
  // distribution, statevector, and per-qubit Bloch vectors all stay in sync
  // without a separate second simulation engine.
  const sharedResult = useMemo(() => {
    void runTick
    return simulateCircuit(circuit, backend, shots)
  }, [circuit, backend, shots, runTick])

  const executionState: ExecutionState = runError
    ? { status: 'error', error: runError }
    : { status: 'success', result: sharedResult }

  /**
   * circuit → code (local, synchronous). Runs whenever the circuit or target
   * framework changes, UNLESS the circuit was just produced by code parsing —
   * that would echo the code back into the editor and restart the loop.
   */
  useEffect(() => {
    if (circuitSourceRef.current === 'code') return
    const generated = generateCircuitCode(circuit, framework)
    if (generated.code === programmaticCodeRef.current) return
    programmaticCodeRef.current = generated.code
    setCode(generated.code)
    setCodeStatus('synced')
    setCodeError(null)
  }, [circuit, framework])

  // Cancel anything in flight when the lab unmounts.
  useEffect(() => {
    return () => {
      parseControllerRef.current?.abort()
    }
  }, [])

  /**
   * code → circuit (debounced, backend). Applies the parsed IR only when the
   * response is the latest issued request (stale responses are dropped).
   * On failure the circuit is left untouched and the structured error is shown.
   */
  const runCodeParse = useCallback(
    async (sourceCode: string) => {
      parseControllerRef.current?.abort()
      const controller = new AbortController()
      parseControllerRef.current = controller
      const requestId = ++parseVersionRef.current

      setCodeStatus('parsing')
      setCodeError(null)

      try {
        const result = await codeToIrApi({
          code: sourceCode,
          framework: frameworkRef.current,
          signal: controller.signal,
          lastValidCircuit: circuitRef.current,
        })
        if (requestId !== parseVersionRef.current) return
        if (controller.signal.aborted) return

        circuitSourceRef.current = 'code'
        latestCircuit(result.circuit)
        setCodeStatus('synced')
        setCodeError(null)
      } catch (err) {
        if (requestId !== parseVersionRef.current) return
        if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return

        if (err instanceof ConversionError) {
          setCodeError({ type: err.type, message: err.message, line: err.line, column: err.column })
        } else {
          setCodeError({ type: 'parse_error', message: (err as Error)?.message ?? 'Failed to parse code.' })
        }
        setCodeStatus('error')
      } finally {
        if (parseControllerRef.current === controller) parseControllerRef.current = null
      }
    },
    [latestCircuit]
  )

  const scheduleCodeParse = useDebouncedCallback(runCodeParse, CODE_EDIT_DEBOUNCE_MS)

  /**
   * Editor onChange. Ignores the programmatic echo of our own generated code
   * (loop prevention); otherwise the 300ms-debounced code → IR parse starts.
   */
  const handleCodeChange = useCallback(
    (nextCode: string) => {
      if (nextCode === programmaticCodeRef.current) {
        programmaticCodeRef.current = ''
        return
      }
      scheduleCodeParse(nextCode)
    },
    [scheduleCodeParse]
  )

  const handleFrameworkChange = useCallback(
    (nextFramework: Framework) => {
      scheduleCodeParse.cancel()
      parseControllerRef.current?.abort()
      // Forcing the source to 'circuit' makes the editor regenerate from the
      // IR in the newly selected dialect on the next effect pass.
      circuitSourceRef.current = 'circuit'
      frameworkRef.current = nextFramework
      setFramework(nextFramework)
      setCodeError(null)
    },
    [scheduleCodeParse]
  )

  // ---------------- Circuit builder handlers ----------------
  const handleAddGate = useCallback(
    (gate: GateType, targets: number[], column: number) => {
      circuitSourceRef.current = 'circuit'
      latestCircuit(placeGate(circuitRef.current, gate, targets, column))
      setSelectedGateId(null)
    },
    [latestCircuit]
  )

  const handleMoveGate = useCallback(
    (gateId: string, targets: number[], column: number) => {
      circuitSourceRef.current = 'circuit'
      latestCircuit(moveGate(circuitRef.current, gateId, targets, column))
      setSelectedGateId(null)
    },
    [latestCircuit]
  )

  const handleRemoveGate = useCallback(
    (gateId: string) => {
      circuitSourceRef.current = 'circuit'
      latestCircuit(removeGate(circuitRef.current, gateId))
      if (selectedGateId === gateId) setSelectedGateId(null)
    },
    [latestCircuit, selectedGateId]
  )

  const handleAddQubit = useCallback(() => {
    if (circuitRef.current.num_qubits >= 8) return
    circuitSourceRef.current = 'circuit'
    latestCircuit({ ...circuitRef.current, num_qubits: circuitRef.current.num_qubits + 1 })
  }, [latestCircuit])

  const handleRemoveQubit = useCallback(() => {
    if (circuitRef.current.num_qubits <= 1) return
    const last = circuitRef.current.num_qubits - 1
    const filtered = circuitRef.current.operations.filter((op) => !op.targets.includes(last))
    circuitSourceRef.current = 'circuit'
    latestCircuit({ num_qubits: last, operations: filtered })
  }, [latestCircuit])

  const handleReorderWires = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      const remap: Record<number, number> = {}
      for (let i = 0; i < circuitRef.current.num_qubits; i++) {
        if (i === from) continue
        if (from < to) {
          remap[i] = i > from && i <= to ? i - 1 : i
        } else {
          remap[i] = i >= to && i < from ? i + 1 : i
        }
      }
      remap[from] = to
      const operations = circuitRef.current.operations.map((op) => ({
        ...op,
        targets: op.targets.map((t) => remap[t] ?? t),
      }))
      circuitSourceRef.current = 'circuit'
      latestCircuit({ ...circuitRef.current, operations })
    },
    [latestCircuit]
  )

  const handleClear = useCallback(() => {
    circuitSourceRef.current = 'circuit'
    latestCircuit({ ...circuitRef.current, operations: [] })
    setRunError(null)
    setSelectedGateId(null)
  }, [latestCircuit])

  const handleCycleMode = useCallback(() => {
    setMode((m) => MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length])
  }, [])

  const handleBackendChange = useCallback((b: BackendType) => {
    setBackend(b)
    setRunError(null)
  }, [])

  const handleShotsChange = useCallback((s: number) => {
    setShots(s)
    setRunError(null)
  }, [])

  const handleRun = useCallback(() => {
    setIsRunning(true)
    setRunError(null)
    const current = runVersion.current + 1
    runVersion.current = current

    window.setTimeout(() => {
      if (runVersion.current !== current) return
      setIsRunning(false)
    }, 400)

    // Trigger a fresh execution pass (new shot samples + runtime).
    setRunTick((t) => t + 1)
  }, [])

  return (
    <div className="qlab-container qlab-container-new qlab-stage" data-lab-mode={mode}>
      <div className="qlab-stage-toggle">
        <button
          type="button"
          className="qlab-toggle-btn"
          onClick={handleCycleMode}
          aria-label={`Workspace view: ${MODE_META[mode].label}. Click to switch.`}
          title={`View: ${MODE_META[mode].label}`}
        >
          <ToggleIcon size={18} />
        </button>
      </div>

      <div className="qlab-main-row">
        <section className="qlab-new-circuit-section" aria-label="Circuit builder">
          <CircuitBuilder
            circuit={circuit}
            width={width}
            numQubits={numQubits}
            selectedGateId={selectedGateId}
            highlightedGateId={null}
            onAddGate={handleAddGate}
            onMoveGate={handleMoveGate}
            onRemoveGate={handleRemoveGate}
            onSelectGate={setSelectedGateId}
            onAddQubit={handleAddQubit}
            onRemoveQubit={handleRemoveQubit}
            onReorderWires={handleReorderWires}
            onClear={handleClear}
          />
        </section>

        <aside className="qlab-code-drawer" data-mode={mode} aria-label="Code editor">
          <CodePanel
            code={code}
            framework={framework}
            status={codeStatus}
            error={codeError}
            onCodeChange={handleCodeChange}
            onFrameworkChange={handleFrameworkChange}
          />
        </aside>
      </div>

      <section className="qlab-new-results-section" aria-label="Measurements and results">
        <ResultsPanel
          executionState={executionState}
          backend={backend}
          shots={shots}
          numQubits={numQubits}
          onBackendChange={handleBackendChange}
          onShotsChange={handleShotsChange}
          onRun={handleRun}
          isRunning={isRunning}
        />
      </section>
    </div>
  )
}