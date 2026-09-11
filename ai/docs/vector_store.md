# Vector Store

## Overview

The vector store module creates a searchable vector index using **FAISS**.

FAISS (Facebook AI Similarity Search) is used to efficiently store and search numerical vectors.

The vector store flow is:

```text
Text Chunks
    ↓
Embeddings
    ↓
FAISS Vector Store
    ↓
Similarity Search