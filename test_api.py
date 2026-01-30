#!/usr/bin/env python3
"""Quick API test for AgriSphere AI"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_voice_query():
    print("Testing voice assistant...")
    queries = [
        "kharif crop kise kahte hain?",
        "What are Kharif crops?",
        "wheat has disease what to do"
    ]
    
    for query in queries:
        print(f"Query: {query}")
        response = requests.post(
            f"{BASE_URL}/voice-query",
            json={"text": query}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data['response']['text'][:100]}...")
        else:
            print(f"Error: {response.status_code}")
        print()

def test_voice_examples():
    print("Testing voice examples endpoint...")
    response = requests.get(f"{BASE_URL}/voice-examples")
    print(f"Status: {response.status_code}")
    print(f"Examples: {json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    print("=" * 60)
    print("AgriSphere AI - API Tests")
    print("=" * 60)
    print()
    
    try:
        test_health()
        test_voice_examples()
        test_voice_query()
        
        print("=" * 60)
        print("All tests completed!")
        print("=" * 60)
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to backend server!")
        print("Make sure the server is running on http://localhost:5000")
    except Exception as e:
        print(f"ERROR: {e}")
