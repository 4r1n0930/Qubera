import { useState, useCallback, useMemo } from 'react'
import { CHALLENGES } from './challengeData'
import type {
  ChallengeDefinition,
  ChallengeAttemptResult,
} from '../../types/challenges'
import { ChallengeHeader } from './ChallengeHeader'
import { PredictionPanel } from './PredictionPanel'
import { ChallengeResultModal } from './ChallengeResultModal'
import { CircuitBuilder } from '../quantumLab/CircuitBuilder'
import { ResultsPanel } from '../quantumLab/ResultsPanel'
import {
  executeQuantumCircuit,
  DEFAULT_QUANTUM_OUTPUTS,
} from '../../api/quantumApi'
import { circuitToApiIr } from '../../utils/circuitToApi'
import {
  recordChallengeEvent,
  getLocalChallengeStats,
} from '../../services/challengeProgressService'
import type { ExecutionState } from '../../types/quantumLab'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import '../../styles/challenges.css'

export function GuessTheOutput() {
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeDefinition>(
    () => CHALLENGES[0]
  )
  const [prediction, setPrediction] = useState<Record<string, number> | string>(
    () => (currentChallenge.predictionType === 'multiple_choice' ? '' : {})
  )
  const [attempts, setAttempts] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState<ChallengeAttemptResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    return getLocalChallengeStats().completedIds
  })
  const [showFullResults, setShowFullResults] = useState(false)
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)

  // Dedicated execution state for the ResultsPanel if student chooses to inspect
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: 'idle',
  })

  // Whenever challenge changes, reset prediction & attempt count
  const handleSelectChallenge = useCallback((challenge: ChallengeDefinition) => {
    setCurrentChallenge(challenge)
    setPrediction(challenge.predictionType === 'multiple_choice' ? '' : {})
    setAttempts(0)
    setLastResult(null)
    setIsModalOpen(false)
    setShowHint(false)
    setShowFullResults(false)
    setSelectedGateId(null)
    setExecutionState({ status: 'idle' })
  }, [])

  // Calculate circuit width for visual rendering
  const width = useMemo(() => {
    return currentChallenge.circuit.operations.reduce(
      (max, op) => Math.max(max, op.moment + 1),
      8
    )
  }, [currentChallenge])

  // Answer validation logic
  const validatePrediction = useCallback(
    (
      challenge: ChallengeDefinition,
      userPred: Record<string, number> | string,
      actualProbabilities: Record<string, number>
    ): boolean => {
      const tolerance = challenge.tolerance ?? 0.05

      if (challenge.predictionType === 'multiple_choice') {
        return userPred === challenge.expectedAnswer
      }

      // Probability distribution validation
      const predMap: Record<string, number> =
        typeof userPred === 'object' && userPred !== null ? userPred : {}

      const numStates = 1 << challenge.circuit.num_qubits
      for (let i = 0; i < numStates; i++) {
        const bit = i.toString(2).padStart(challenge.circuit.num_qubits, '0')
        const expectedP = actualProbabilities[bit] ?? 0
        const userP = predMap[bit] ?? 0
        if (Math.abs(userP - expectedP) > tolerance) {
          return false
        }
      }
      return true
    },
    []
  )

  // Submit prediction and execute the circuit ONLY AFTER submission
  const handleSubmit = useCallback(async () => {
    if (isRunning) return
    setIsRunning(true)

    try {
      // Step 1: Execute circuit via existing quantum API gateway
      const ir = circuitToApiIr(currentChallenge.circuit)
      const simResult = await executeQuantumCircuit({
        backend: 'qiskit',
        shots: 1000,
        circuit: ir,
        output: DEFAULT_QUANTUM_OUTPUTS,
      })

      const actualProbabilities = simResult.probabilities ?? {}
      const isCorrect = validatePrediction(
        currentChallenge,
        prediction,
        actualProbabilities
      )

      const attemptResult: ChallengeAttemptResult = {
        challengeId: currentChallenge.id,
        isCorrect,
        prediction,
        actualResult: simResult,
        actualProbabilities,
        elapsedTimeMs: simResult.elapsed ?? simResult.elapsed_time_ms,
        attempts: attempts + 1,
        explanation: currentChallenge.explanation,
        tolerance: currentChallenge.tolerance ?? 0.05,
      }

      setLastResult(attemptResult)
      setIsModalOpen(true)
      setExecutionState({ status: 'success', result: simResult })

      if (isCorrect) {
        setCompletedIds((prev) =>
          prev.includes(currentChallenge.id) ? prev : [...prev, currentChallenge.id]
        )
      }

      // Record learning event for progress tracking and AI tutor
      recordChallengeEvent({
        challenge: currentChallenge,
        isCorrect,
        attempts: attempts + 1,
      })
    } catch (err) {
      setExecutionState({
        status: 'error',
        error: {
          type: 'EXECUTION_FAILED',
          message: (err as Error)?.message ?? 'Quantum simulation failed.',
        },
      })
    } finally {
      setIsRunning(false)
    }
  }, [
    isRunning,
    currentChallenge,
    prediction,
    attempts,
    validatePrediction,
  ])

  const handleTryAgain = () => {
    setAttempts((a) => a + 1)
    setIsModalOpen(false)
  }

  const handleContinue = () => {
    setIsModalOpen(false)
    const currentIndex = CHALLENGES.findIndex((c) => c.id === currentChallenge.id)
    if (currentIndex < CHALLENGES.length - 1) {
      handleSelectChallenge(CHALLENGES[currentIndex + 1])
    }
  }

  return (
    <div className="qlab-challenges-container">
      {/* Challenge Navigation & Meta Header */}
      <ChallengeHeader
        challenge={currentChallenge}
        allChallenges={CHALLENGES}
        onSelectChallenge={handleSelectChallenge}
        attempts={attempts}
        isCompleted={completedIds.includes(currentChallenge.id)}
        showHint={showHint}
        onToggleHint={() => setShowHint((h) => !h)}
      />

      {/* Main Workspace Layout */}
      <div className="qlab-challenge-body">
        {/* Left Column: Read-Only Challenge Circuit */}
        <section className="qlab-challenge-circuit-section" aria-label="Challenge Circuit">
          <div className="qlab-challenge-pane-head">
            <div className="qlab-pane-title-group">
              <Sparkles size={14} className="qlab-pane-icon" />
              <span className="qlab-pane-title">Target Circuit</span>
            </div>
            <span className="qlab-readonly-pill">Read-Only</span>
          </div>

          <div className="qlab-challenge-builder-wrapper">
            <CircuitBuilder
              circuit={currentChallenge.circuit}
              width={width}
              numQubits={currentChallenge.circuit.num_qubits}
              selectedGateId={selectedGateId}
              highlightedGateId={null}
              onSelectGate={setSelectedGateId}
              editable={false}
            />
          </div>
        </section>

        {/* Right Column: Prediction Controls OR Post-Execution Inspection */}
        <section className="qlab-challenge-action-section" aria-label="Prediction and Results">
          <div className="qlab-challenge-pane-head">
            <div className="qlab-pane-title-group">
              <span className="qlab-pane-title">
                {showFullResults ? 'Quantum Results Inspection' : 'Your Prediction'}
              </span>
            </div>

            {lastResult && (
              <button
                type="button"
                className="qlab-toggle-inspect-btn"
                onClick={() => setShowFullResults((s) => !s)}
                title={showFullResults ? 'Back to Prediction' : 'Inspect Full Results & Bloch Sphere'}
              >
                {showFullResults ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showFullResults ? 'Show Prediction' : 'Inspect Simulation'}</span>
              </button>
            )}
          </div>

          {showFullResults && lastResult ? (
            <div className="qlab-challenge-results-wrapper">
              <ResultsPanel
                executionState={executionState}
                backend="qiskit"
                shots={lastResult.actualResult.shots}
                numQubits={currentChallenge.circuit.num_qubits}
                onBackendChange={() => {}}
                onShotsChange={() => {}}
                onRun={() => {}}
                isRunning={false}
              />
            </div>
          ) : (
            <PredictionPanel
              challenge={currentChallenge}
              prediction={prediction}
              onChangePrediction={setPrediction}
              onSubmit={handleSubmit}
              isRunning={isRunning}
              hasResult={Boolean(lastResult)}
            />
          )}
        </section>
      </div>

      {/* Result Modal Popup */}
      {isModalOpen && lastResult && (
        <ChallengeResultModal
          challenge={currentChallenge}
          result={lastResult}
          onTryAgain={handleTryAgain}
          onContinue={handleContinue}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
