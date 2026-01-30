
import google.generativeai as genai
import os

GENAI_API_KEY = "AIzaSyBeWiL-p4SWZq88eEE1ZP0qixiDKfIKOsI"
genai.configure(api_key=GENAI_API_KEY)

try:
    with open("models.txt", "w") as f:
        f.write("Listing models:\n")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
            
    print("Models written to models.txt")
except Exception as e:
    print(f"Error: {e}")
