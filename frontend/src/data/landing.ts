import type { IconName } from '../components/common'

export interface MethodStep {
  id: string
  title: string
  description: string
  icon: IconName
}

export const learningMethod: MethodStep[] = [
  { id: 'understand', title: 'Understand', description: 'Meet a concept in plain language, with the intuition first.', icon: 'bulb' },
  { id: 'visualize', title: 'Visualize', description: 'See it as a clear, honest visual — how quantum states actually behave.', icon: 'eye' },
  { id: 'experiment', title: 'Experiment', description: 'Push buttons, change inputs, and watch the system respond.', icon: 'flask' },
  { id: 'predict', title: 'Predict', description: 'Guess the outcome before you run it, then check yourself.', icon: 'target' },
  { id: 'simulate', title: 'Simulate', description: 'Run the idea and confirm whether your mental model holds.', icon: 'cpu' },
  { id: 'explain', title: 'Explain', description: 'Put it into your own words — the surest test of understanding.', icon: 'message' },
  { id: 'master', title: 'Master', description: 'Build on the idea until it becomes a stepping stone.', icon: 'trophy' },
]

export interface RoadmapNode {
  title: string
  short: string
  status: 'done' | 'current' | 'next' | 'locked'
}

export const journeyNodes: RoadmapNode[] = [
  { title: 'Quantum Foundations', short: 'The ideas that make quantum different', status: 'done' },
  { title: 'Qubits', short: 'The basic unit of quantum information', status: 'done' },
  { title: 'Superposition', short: 'Holding multiple possibilities at once', status: 'current' },
  { title: 'Measurement', short: 'Turning quantum states into outcomes', status: 'locked' },
  { title: 'Quantum Gates', short: 'Controlling quantum states', status: 'locked' },
  { title: 'Entanglement', short: 'Connecting quantum systems', status: 'locked' },
  { title: 'Quantum Circuits', short: 'Building quantum programs', status: 'locked' },
  { title: 'Quantum Algorithms', short: 'Applying quantum thinking', status: 'locked' },
]

export interface Feature {
  id: string
  icon: IconName
  title: string
  description: string
}

export const platformFeatures: Feature[] = [
  { id: 'interactive', icon: 'flask', title: 'Interactive learning', description: 'Manipulate concepts instead of only reading about them. Change a gate, watch the state respond.' },
  { id: 'tutor', icon: 'tutor', title: 'AI quantum tutor', description: 'Ask questions any way you like and get explanations matched to where you are in your learning.' },
  { id: 'predict', icon: 'target', title: 'Predict before you run', description: 'Form a hypothesis, then simulate. Catching wrong guesses is how real understanding forms.' },
  { id: 'mastery', icon: 'trophy', title: 'Concept mastery', description: 'The platform tracks understanding — not just which lessons you opened.' },
  { id: 'playground', icon: 'playground', title: 'Quantum playground', description: 'Explore freely once the guided lessons are done, safe to experiment as much as you like.' },
  { id: 'journey', icon: 'compass', title: 'Guided journey', description: 'Know what comes next and why it matters, so you never feel lost on the path.' },
]

export interface Module {
  stage: string
  title: string
  description: string
}

export const modules: Module[] = [
  { stage: 'Foundations', title: 'Quantum Computing Basics', description: 'The essential ideas that make quantum different.' },
  { stage: 'Qubits', title: 'Understanding quantum states', description: 'How a single qubit stores and expresses information.' },
  { stage: 'Superposition', title: 'Exploring multiple possibilities', description: 'What it means for a system to be in many states at once.' },
  { stage: 'Measurement', title: 'Understanding quantum outcomes', description: 'How a definite result emerges from a quantum state.' },
  { stage: 'Gates', title: 'Controlling quantum states', description: 'The operations that reshape a qubit.' },
  { stage: 'Entanglement', title: 'Connecting quantum systems', description: 'How separated qubits can stay linked.' },
  { stage: 'Circuits', title: 'Building quantum programs', description: 'Combining gates into meaningful computation.' },
  { stage: 'Algorithms', title: 'Applying quantum thinking', description: 'Using quantum mechanics to solve real problems.' },
]

export interface TutorAction {
  label: string
}

export const tutorActions: TutorAction[] = [
  { label: 'Explain simply' },
  { label: 'Give an analogy' },
  { label: 'Show visually' },
  { label: 'Give me a hint' },
]
