from ragpipeline import build_rag_pipeline, ask_question


def main():

    print("Building Quantum AI Tutor...")

    # Build RAG pipeline
    embedding_model, vector_store, chunks = build_rag_pipeline()

    print("RAG pipeline ready!")
    print(f"Knowledge chunks loaded: {len(chunks)}")
    print("\nAsk a quantum computing question.")
    print("Type 'exit' to stop.\n")

    while True:

        question = input("You: ")

        if question.lower() == "exit":
            print("Goodbye!")
            break

        answer = ask_question(
            question,
            embedding_model,
            vector_store,
            chunks
        )

        print("\nAI:", answer)
        print()


if __name__ == "__main__":
    main()