# Qubera

### Learn. Experiment. Understand Quantum.

Qubera is an **AI-powered interactive quantum computing learning platform** designed to make quantum computing practical and understandable for beginners.

Instead of learning quantum computing only through mathematical theory and static explanations, Qubera connects **concepts, circuit construction, code, simulation, visualization, and AI-assisted learning** in a single environment.

> **From theory to experimentation — without requiring a quantum computer.**

---

## 🚀 Why Qubera?

Quantum computing is difficult for beginners because concepts such as **superposition, measurement, quantum gates, entanglement, probability distributions, and state vectors** are highly abstract.

Traditional learning resources often separate:

* 📚 Theory
* 💻 Quantum programming
* 🔬 Circuit experimentation
* 📊 Result visualization
* 🤖 Personalized assistance

Qubera brings these together into one interactive learning workflow.

A learner can understand a concept, build a circuit, execute it on a simulator, inspect the results, and use an AI assistant to understand **why the result occurred**.

---

## ✨ Core Features

### 📚 Interactive Learning

Structured learning modules introduce quantum computing progressively:

* Qubits
* Superposition
* Measurement
* Quantum Gates
* Quantum Circuits
* Entanglement
* Quantum Algorithms

Lessons combine explanations with practical experimentation rather than relying exclusively on mathematical descriptions.

---

### 🧩 Visual Quantum Circuit Builder

Build quantum circuits using an interactive drag-and-drop interface.

Supported operations include gates such as:

* `I`
* `X`
* `Y`
* `Z`
* `H`
* `S`
* `T`
* `CNOT`
* `CZ`
* `SWAP`

The circuit is represented internally using a common **Circuit Intermediate Representation (IR)**, allowing different simulation backends to work with the same circuit definition.

---

### 💻 Quantum Code Editor

Qubera provides an integrated environment for writing and experimenting with quantum code.

The goal is to connect:

```text
Visual Circuit
      ↕
Circuit IR
      ↕
Quantum Code
```

This allows learners to understand the relationship between a visual quantum circuit and its programmatic representation.

---

### 🔬 Multi-Backend Quantum Simulation

Qubera currently uses simulators rather than requiring access to physical quantum hardware.

The quantum execution service can work with multiple simulation frameworks:

* **PennyLane**
* **Qiskit**
* **Cirq**

This multi-backend architecture makes it possible to compare execution environments while keeping the learner-facing circuit representation consistent.

---

### 📊 Quantum State Visualization

Simulation results are transformed into visual representations that help learners understand what is happening inside a quantum circuit.

Visualizations can include:

* Measurement counts
* Probability distributions
* State-vector information
* Bloch-sphere representation
* Quantum-state changes after operations

Rather than simply returning numerical output, Qubera aims to show the learner **how the circuit produces that output**.

---

### 🤖 AI Quantum Assistant

Qubera includes an AI assistant designed specifically around the learner's current quantum-computing context.

The assistant can help explain:

* Quantum concepts
* Circuit behavior
* Gate operations
* Simulation results
* Code
* Probability distributions
* Common mistakes

The assistant can be extended with contextual tools such as retrieving the learner's current circuit, code, progress, or areas of difficulty.

This allows assistance to be based on **what the learner is actually doing**, rather than providing generic chatbot responses.

---

### 🧠 Learn by Experimenting

Qubera emphasizes active learning.

For example, instead of only explaining a Hadamard gate, a learner can:

```text
Learn the concept
      ↓
Create a circuit
      ↓
Predict the result
      ↓
Run the simulation
      ↓
Compare prediction vs result
      ↓
Inspect the quantum state
      ↓
Understand why
```

This transforms quantum computing from a purely theoretical subject into an experimentation-based learning experience.

---

## 🏗️ Architecture

Qubera follows a modular architecture with separate frontend, application/backend, AI, and quantum-simulation responsibilities.

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │   React + TypeScript │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Node Backend    │
                    │  Express + TypeScript│
                    └───────┬─────┬───────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌─────────────────┐            ┌─────────────────┐
       │ Quantum Service │            │   AI Service    │
       │ Python / FastAPI│            │ AI / Assistant  │
       └────────┬────────┘            └─────────────────┘
                │
                ▼
       ┌─────────────────────────┐
       │ Quantum Simulation      │
       │                         │
       │ PennyLane / Qiskit/Cirq │
       └─────────────────────────┘
```

### Frontend

Responsible for:

* Learning interface
* Dashboard
* Quantum Lab
* Circuit builder
* Code editor
* Result visualization
* User interaction

**Technology:** React + TypeScript + Vite

### Node Backend

Acts as the main application gateway.

Responsible for:

* Authentication
* Application APIs
* Learning modules
* User progress
* Database communication
* AI integration
* Quantum-service orchestration

**Technology:** Node.js + Express.js + TypeScript

### Quantum Service

A separate Python service handles quantum simulation.

This separation keeps computational quantum workloads isolated from the main application server.

**Technology:** Python + FastAPI

### AI Layer

The AI layer provides contextual quantum-learning assistance and can be integrated with the application backend independently of the quantum simulator.

---

## 🔄 Quantum Execution Flow

A typical circuit execution follows this architecture:

```text
User creates circuit
        │
        ▼
React Quantum Lab
        │
        ▼
Circuit IR
        │
        ▼
Node Backend
        │
        ▼
Python Quantum Service
        │
        ▼
Selected Simulator
(PennyLane / Qiskit / Cirq)
        │
        ▼
Execution Results
        │
        ▼
Node Backend
        │
        ▼
Frontend Visualization
```

The browser does **not need to communicate directly with the Python quantum service**.

This provides a cleaner separation between application logic and quantum computation.

---

## 🧬 Circuit Intermediate Representation

Qubera uses a common circuit representation as the source of truth.

Example:

```json
{
  "num_qubits": 2,
  "operations": [
    {
      "gate": "H",
      "targets": [0]
    },
    {
      "gate": "CNOT",
      "targets": [0, 1]
    }
  ]
}
```

This representation allows the same circuit to be executed through different quantum simulation backends.

It also creates a foundation for synchronizing:

```text
Circuit Builder
       ↕
     Circuit IR
       ↕
  Quantum Code
       ↕
Simulation Backend
```

---

## 📡 Quantum API

The quantum service exposes an execution endpoint:

```http
POST /api/quantum/execute
```

Example request:

```json
{
  "backend": "qiskit",
  "shots": 1024,
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {
        "gate": "H",
        "targets": [0]
      },
      {
        "gate": "CNOT",
        "targets": [0, 1]
      }
    ]
  },
  "output": [
    "counts",
    "probabilities"
  ]
}
```

The service returns simulation results that can be consumed by the frontend for visualization and learning activities.

---

## 🛠️ Technology Stack

| Layer              | Technology                       |
| ------------------ | -------------------------------- |
| Frontend           | React                            |
| Language           | TypeScript                       |
| Build Tool         | Vite                             |
| Backend            | Node.js                          |
| API Framework      | Express.js                       |
| Quantum Service    | Python                           |
| Quantum API        | FastAPI                          |
| Quantum Simulation | PennyLane / Qiskit / Cirq        |
| Database           | MongoDB                          |
| Authentication     | JWT / OAuth-based authentication |
| AI                 | AI-powered contextual assistant  |
| Version Control    | Git + GitHub                     |

---

## 📁 Repository Structure

```text
Qubera/
│
├── ai/
│   └── AI assistant and AI-related components
│
├── backend/
│   └── Node.js application backend
│
├── frontend/
│   └── React + TypeScript frontend
│
├── package.json
├── package-lock.json
└── README.md
```

The repository is organized into separate application layers rather than combining the frontend, backend, and AI functionality into one codebase.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Python 3.10+
* Git
* MongoDB or MongoDB Atlas

Clone the repository:

```bash
git clone https://github.com/4r1n0930/Qubera.git
cd Qubera
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start using the Vite development server.

---

### Backend

```bash
cd backend
npm install
npm run dev
```

Configure the required environment variables before starting the backend.

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

### Quantum Service

Navigate to the quantum service directory and install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI service:

```bash
uvicorn main:app --reload --port 8000
```

The exact command may vary depending on the service entry point in the current repository.

---

## 🔐 Environment Variables

Do **not** commit secrets or API keys to Git.

Typical configuration may include:

```env
# Backend
PORT=3000
MONGODB_URI=
JWT_SECRET=

# AI
AI_API_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Quantum Service
QUANTUM_SERVICE_URL=http://localhost:8000
```

Use a `.env` file locally and provide production secrets through the deployment platform's environment-variable configuration.

---

## 🎯 Project Vision

Qubera is built around a simple idea:

> **Quantum computing should be learned by doing, not just by reading.**

The platform aims to bridge the gap between:

**Concept → Circuit → Code → Simulation → Visualization → Understanding**

By combining interactive experimentation, multi-backend simulation, visual feedback, and contextual AI assistance, Qubera provides a practical environment for learners entering quantum computing.

---

## 🔮 Future Scope

Potential future improvements include:

* More quantum algorithms
* Advanced circuit visualization
* Improved Bloch-sphere and multi-qubit visualization
* Personalized learning paths
* AI-generated exercises
* Prediction-based learning challenges
* Progress and competency analytics
* More simulation backends
* OpenQASM support
* Real quantum hardware integration
* Collaborative quantum labs
* Retrieval-augmented quantum tutoring

---

## 🌱 Development Philosophy

Qubera is designed around three principles:

### 1. Understand

Explain quantum concepts in an accessible way.

### 2. Experiment

Allow learners to construct and execute circuits themselves.

### 3. Visualize

Make abstract quantum states and probabilistic results observable.

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome.

To contribute:

```bash
git clone https://github.com/4r1n0930/Qubera.git
cd Qubera
```

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them, and submit a pull request.

---

## 📄 License

Add the project's chosen license here before publishing the repository for external contributions.

---

## 👨‍💻 Project

**Qubera — Learn. Experiment. Understand Quantum.**

Built to make quantum computing more **interactive, practical, visual, and approachable**.

**Repository:** https://github.com/4r1n0930/Qubera
