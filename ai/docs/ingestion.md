# Document Ingestion

Loads Markdown files from the quantum knowledge base.

## Load Documents

function name: `load_documents()`

inputs -> knowledge base directory is configured internally  
output -> list of documents containing content and metadata

### Processing

- Recursively searches for `.md` files inside the knowledge base
- Reads the content of each Markdown file
- Skips empty files
- Extracts the relative file path
- Uses the first knowledge-base folder as the category
- Stores document metadata

### Output

Each document contains:

- `content` — text content of the Markdown file
- `source` — relative path of the original Markdown file
- `filename` — name of the Markdown file
- `category` — knowledge-base category

Example:

```python
{
    "content": "# Qubit\nA qubit is...",
    "source": "01_fundamentals/qubit.md",
    "filename": "qubit.md",
    "category": "01_fundamentals"
}