# LLM

## Overview

The LLM module generates the final answer to the user's question using the relevant context retrieved from the Qubera knowledge base.

The module uses the **Google Gemini API**.

The LLM flow is:

```text
User Question
      ↓
Retrieved Context
      ↓
Prompt
      ↓
Gemini LLM
      ↓
Generated Answer