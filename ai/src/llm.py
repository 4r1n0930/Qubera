import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
def generate_answer(question, context):

    prompt = f"""
You are a Quantum Computing AI Tutor.

Use the provided context to answer the user's question.

Rules:
- Explain concepts clearly and simply.
- Use the provided context as the primary source.
- Do not invent information.
- If the answer is not available in the context,
  say that the information is not available in
  the current knowledge base.

Context:
{context}

User Question:
{question}

Answer:
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text