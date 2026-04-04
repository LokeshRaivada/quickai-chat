from app import app
import urllib.parse
import json
with app.test_client() as client:
    resp = client.get("/history?email=raivadalokesh@gmail.com")
    with open("test_route_output.txt", "w") as f:
        f.write(json.dumps(resp.json))
