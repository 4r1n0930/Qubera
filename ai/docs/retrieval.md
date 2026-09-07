# Retrieval

## Overview

The retrieval module finds the most relevant knowledge chunks for a user's question.

It uses the same embedding model and FAISS vector store created during the earlier stages of the RAG pipeline.

The retrieval flow is:

```text
User Question
      ↓
Embedding Model
      ↓
Question Embedding
      ↓
FAISS Search
      ↓
Relevant Chunks