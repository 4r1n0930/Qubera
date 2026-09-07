# Embeddings

## Overview

The embeddings module converts text chunks into numerical vector representations called **embeddings**.

Embeddings allow the RAG system to compare the semantic meaning of a user's question with the stored knowledge chunks.

The embedding flow is:

```text
Documents
    ↓
Chunks
    ↓
Embedding Model
    ↓
Numerical Vectors
    ↓
FAISS Vector Store