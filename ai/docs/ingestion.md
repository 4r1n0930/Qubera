# Document Ingestion

## Overview

The ingestion module loads quantum computing lessons from the Qubera MongoDB database.

The ingestion flow is:

MongoDB → Lessons Collection → Document Validation → Documents List

The module uses:

- MongoDB
- PyMongo
- python-dotenv
- Environment variables

---

## File

```text
src/ingestion.py
