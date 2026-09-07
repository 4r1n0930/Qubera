import faiss
import numpy as np


def create_vector_store(embeddings):
    """
    Create a FAISS vector store from embeddings.
    """

    if embeddings is None or len(embeddings) == 0:
        return None

    embeddings = np.asarray(embeddings).astype("float32")

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    index.add(embeddings)

    print(f"FAISS vector store created.")
    print(f"Vectors stored: {index.ntotal}")

    return index