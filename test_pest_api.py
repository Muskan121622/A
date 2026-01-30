
import requests
import json

def test_pest_api():
    url = "http://localhost:5000/predict-pest"
    data = {
        "crop": "rice",
        "temp": 28,
        "humidity": 95,
        "rainfall": 120
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print("SUCCESS: API returned 200")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"FAILURE: Status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_pest_api()
