# RAG Pipeline

## Overview

The RAG pipeline connects all the individual components of the Qubera AI system.

RAG stands for **Retrieval-Augmented Generation**.

The pipeline combines:

- MongoDB document ingestion
- Text chunking
- Text embeddings
- FAISS vector storage
- Semantic retrieval
- Gemini LLM generation

The complete flow is:

```text
MongoDB
   ↓
Document Ingestion
   ↓
Chunking
   ↓
Embeddings
   ↓
FAISS Vector Store
   ↓
User Question
   ↓
Retrieval
   ↓
Relevant Context
   ↓
Gemini LLM
   ↓
Final Answer