# Document Chunking

## Overview

The chunking module splits lesson documents into smaller pieces called **chunks**.

Chunking is required because large documents are difficult to process efficiently during embedding and retrieval.

The chunking flow is:

Documents → Text Splitting → Chunks + Metadata

---

## File

```text
src/chunking.py