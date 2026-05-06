import requests
import sys

url = "http://127.0.0.1:8000/health"

print(f"Testing health check at {url}...")
try:
    response = requests.get(url, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
