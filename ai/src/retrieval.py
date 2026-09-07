import numpy as np


def retrieve_chunks(query, model, index, chunks, top_k=3):
    if index is None or not chunks:
        return []

    # Convert user question into an embedding
    query_embedding = model.encode(
        [query],
        convert_to_numpy=True
    )

    query_embedding = np.asarray(query_embedding).astype("float32")

    # Search FAISS
    distances, indices = index.search(
        query_embedding,
        min(top_k, len(chunks))
    )

    results = []

    for distance, index_position in zip(distances[0], indices[0]):

        if index_position == -1:
            continue

        chunk = chunks[index_position].copy()

        chunk["distance"] = float(distance)

        results.append(chunk)

    return results




if __name__ == "__main__":
    from embeddings import load_embedding_model, generate_embeddings
    from vector_store import create_vector_store

    model = load_embedding_model()

    test_chunks = [
        {
            "content": "A qubit is the basic unit of quantum information.",
            "source": "qubit.md",
            "category": "fundamentals",
            "chunk_id": 0
        },
        {
            "content": "Superposition allows a quantum system to exist in multiple states.",
            "source": "superposition.md",
            "category": "fundamentals",
            "chunk_id": 1
        },
        {
            "content": "The CNOT gate is a two-qubit quantum gate.",
            "source": "cnot_gate.md",
            "category": "quantum_gates",
            "chunk_id": 2
        }
    ]

    embeddings = generate_embeddings(test_chunks, model)

    index = create_vector_store(embeddings)

    query = "What is a qubit?"

    results = retrieve_chunks(
        query,
        model,
        index,
        test_chunks,
        top_k=2
    )

    print("\nQuery:", query)
    print("\nRetrieved chunks:")

    for result in results:
        print("\nSource:", result["source"])
        print("Distance:", result["distance"])
        print("Content:", result["content"])