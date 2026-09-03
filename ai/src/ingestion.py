from pathlib import Path


KNOWLEDGE_BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge_base"


def load_documents():
    documents = []

    if not KNOWLEDGE_BASE_PATH.exists():
        print(f"Knowledge base not found: {KNOWLEDGE_BASE_PATH}")
        return documents

    for file_path in KNOWLEDGE_BASE_PATH.rglob("*.md"):

        try:
            content = file_path.read_text(encoding="utf-8").strip()

            if not content:
                continue

            relative_path = file_path.relative_to(KNOWLEDGE_BASE_PATH)

            # First folder represents the category
            category = relative_path.parts[0] if len(relative_path.parts) > 1 else "general"

            documents.append({
                "content": content,
                "source": str(relative_path),
                "filename": file_path.name,
                "category": category
            })

        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    print(f"Documents loaded: {len(documents)}")

    return documents