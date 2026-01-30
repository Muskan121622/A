import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_CHATBOT_API_KEY")

if not api_key:
    print("No API key found")
    exit(1)

client = Groq(api_key=api_key)

try:
    models = client.models.list()
    with open("models.txt", "w") as f:
        for model in models.data:
            f.write(model.id + "\n")
            print(model.id)
except Exception as e:
    print(f"Error: {e}")
