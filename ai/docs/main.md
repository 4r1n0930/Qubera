# Main Application

## Overview

The `main.py` file is the entry point of the Qubera Quantum AI Tutor.

It starts the RAG pipeline and provides a simple command-line interface (CLI) where the user can ask quantum computing questions.

The flow is:

```text
Start Application
      ↓
Build RAG Pipeline
      ↓
Load Knowledge Base
      ↓
Ready for Questions
      ↓
User Enters Question
      ↓
RAG Pipeline
      ↓
Display AI Answer