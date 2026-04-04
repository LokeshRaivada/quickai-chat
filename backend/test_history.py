import urllib.request
import json

try:
    response = urllib.request.urlopen('http://127.0.0.1:8000/history?email=test@gmail.com')
    print("Status:", response.status)
    print("Data:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Body:", e.read().decode())
except Exception as e:
    print("Exception:", e)
