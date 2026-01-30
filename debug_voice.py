
from improved_voice_assistant import AgriVoiceAssistant
import re

def test():
    assistant = AgriVoiceAssistant()
    
    # Test case from user
    query = "गेहूं में रोग आ गया है, क्या करें?"
    
    print(f"Original: {query}")
    
    # Test normalization
    norm = assistant.normalize_text(query)
    print(f"Normalized: '{norm}'")
    
    # Check regex behavior
    r_sub = re.sub(r'[^\w\s]', ' ', query)
    print(f"Regex Safe? : '{r_sub}'")
    
    # Run full process
    print("Processing...")
    try:
        response = assistant.process_voice_input(query)
        print("Response:", response)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test()
