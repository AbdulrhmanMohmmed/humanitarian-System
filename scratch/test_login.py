import requests
import sys

url = "http://127.0.0.1:8000/api/auth/login"
payload = {
    "username": "admin",
    "password": "admin123"
}

print(f"Testing login at {url}...")
try:
    response = requests.post(url, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except requests.exceptions.RequestException as e:
    print(f"Request Error: {e}")
except Exception as e:
    print(f"Unexpected Error: {e}")
