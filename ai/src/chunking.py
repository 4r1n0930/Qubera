def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()

    chunks = []

    if not words:
        return chunks

    start = 0

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(words[start:end])

        chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def chunk_documents(documents, chunk_size=500, overlap=50):
    all_chunks = []

    for document in documents:

        chunks = chunk_text(
            document["content"],
            chunk_size,
            overlap
        )

        for index, chunk in enumerate(chunks):

            all_chunks.append({
                "content": chunk,
                "source": document["source"],
                "filename": document["filename"],
                "category": document["category"],
                "chunk_id": index
            })

    print(f"Total chunks created: {len(all_chunks)}")

    return all_chunks