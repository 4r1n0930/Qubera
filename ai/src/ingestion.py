import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB")


def load_documents():

    documents = []

    if not MONGODB_URI:
        print("MONGODB_URI is not configured.")
        return documents

    if not MONGODB_DB:
        print("MONGODB_DB is not configured.")
        return documents

    try:
        client = MongoClient(MONGODB_URI)

        # Test connection
        client.admin.command("ping")
        print("MongoDB connected successfully.")

        db = client[MONGODB_DB]

        # Qubera lessons collection
        lessons_collection = db["lessons"]

        # Load all lessons
        lessons = list(lessons_collection.find({}))

        print(f"Lessons found in MongoDB: {len(lessons)}")

        for lesson in lessons:

            content = lesson.get("content", "")

            if not isinstance(content, str):
                continue

            content = content.strip()

            if not content:
                continue

            documents.append({
                "content": content,
                "source": str(lesson.get("_id", "")),
                "filename": lesson.get("title", "lesson"),
                "category": str(lesson.get("moduleId", "general")),
                "lesson_id": str(lesson.get("_id", "")),
                "module_id": str(lesson.get("moduleId", ""))
            })

        print(f"Documents loaded: {len(documents)}")

        client.close()

        return documents

    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return documents