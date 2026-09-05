from ingestion import load_documents
from chunking import chunk_documents
from embeddings import load_embedding_model, generate_embeddings
from vector_store import create_vector_store
from retrieval import retrieve_chunks
from llm import generate_answer


def build_rag_pipeline():
    """
    Build the complete RAG knowledge base.

    Flow:
    Documents → Chunks → Embeddings → FAISS
    """

    # 1. Load documents from knowledge base
    documents = load_documents()

    # 2. Split documents into chunks
    chunks = chunk_documents(documents)

    # 3. Load embedding model
    embedding_model = load_embedding_model()

    # 4. Generate embeddings for all chunks
    embeddings = generate_embeddings(
        chunks,
        embedding_model
    )

    # 5. Create FAISS vector store
    vector_store = create_vector_store(
        embeddings
    )

    return embedding_model, vector_store, chunks


def ask_question(
    question,
    embedding_model,
    vector_store,
    chunks
):
    """
    Retrieve relevant knowledge and generate an answer.
    """

    # Retrieve relevant chunks
    results = retrieve_chunks(
        question,
        embedding_model,
        vector_store,
        chunks,
        top_k=3
    )

    # If nothing relevant was found
    if not results:
        return "I could not find relevant information in the current knowledge base."

    # Combine retrieved chunks into context
    context = "\n\n".join(
        result["content"]
        for result in results
    )

    # Generate answer using Gemini
    answer = generate_answer(
        question,
        context
    )

    return answer