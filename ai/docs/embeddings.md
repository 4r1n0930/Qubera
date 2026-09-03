
---

### `docs/embeddings.md`

```markdown
# Text Embeddings

Converts text chunks into numerical vector representations for semantic search.

## Generate Embeddings

function name: `generate_embeddings(chunks, model)`

inputs -> list of chunks and embedding model  
output -> NumPy array containing embeddings

### Embedding Model

Model used:

`all-MiniLM-L6-v2`

### Processing

- Takes the `content` from each chunk
- Converts the text into numerical vectors
- Uses the Sentence Transformers model
- Returns the embeddings as a NumPy array

### Input

Each chunk contains:

- `content` — text of the chunk
- `source` — original document path
- `filename` — original file name
- `category` — knowledge-base category
- `chunk_id` — chunk identifier

### Output

Returns:

- NumPy array of embeddings
- Each chunk is represented by a numerical vector

Example:

```python
embeddings = generate_embeddings(
    chunks,
    model
)