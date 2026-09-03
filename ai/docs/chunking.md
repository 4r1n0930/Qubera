
---

### `docs/chunking.md`

```markdown
# Document Chunking

Splits loaded documents into smaller text chunks for efficient retrieval.

## Chunk Documents

function name: `chunk_documents(documents, chunk_size=500, overlap=50)`

inputs -> list of loaded documents  
output -> list of chunks containing content and metadata

### Input

Each document contains:

- `content` — text content of the document
- `source` — original document path
- `filename` — original file name
- `category` — knowledge-base category

### Processing

- Takes the loaded documents from ingestion
- Splits document content into words
- Creates chunks of up to 500 words
- Uses 50 words of overlap between chunks
- Preserves document metadata
- Assigns a chunk ID

### Output

Each chunk contains:

- `content` — chunk text
- `source` — original document path
- `filename` — original file name
- `category` — knowledge-base category
- `chunk_id` — chunk identifier

Example:

```python
{
    "content": "A qubit is the basic unit of quantum information...",
    "source": "01_fundamentals/qubit.md",
    "filename": "qubit.md",
    "category": "01_fundamentals",
    "chunk_id": 0
}