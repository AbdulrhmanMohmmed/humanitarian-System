import requests

url = "http://localhost:8000/api/auth/login"
payload = {"username": "admin", "password": "admin123"}
response = requests.post(url, json=payload)

print(response.status_code)
print(response.json())
