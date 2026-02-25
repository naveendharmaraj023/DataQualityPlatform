import requests

# Test 1: Valid Data
resp1 = requests.post("http://127.0.0.1:8000/validate", json={"email": "test@example.com", "age": 25})
print("Test 1 (Valid Data) Status:", resp1.status_code)
print("Test 1 (Valid Data) Response:", resp1.json())

# Test 2: Invalid Email
resp2 = requests.post("http://127.0.0.1:8000/validate", json={"email": "not-an-email", "age": 25})
print("\nTest 2 (Invalid Email) Status:", resp2.status_code)
print("Test 2 (Invalid Email) Response:", resp2.json())

# Test 3: Underage
resp3 = requests.post("http://127.0.0.1:8000/validate", json={"email": "test@example.com", "age": 17})
print("\nTest 3 (Underage) Status:", resp3.status_code)
print("Test 3 (Underage) Response:", resp3.json())

# Test 4: Overage
resp4 = requests.post("http://127.0.0.1:8000/validate", json={"email": "test@example.com", "age": 101})
print("\nTest 4 (Overage) Status:", resp4.status_code)
print("Test 4 (Overage) Response:", resp4.json())

# Test 5: Missing Field
resp5 = requests.post("http://127.0.0.1:8000/validate", json={"email": "test@example.com"})
print("\nTest 5 (Missing Field) Status:", resp5.status_code)
print("Test 5 (Missing Field) Response:", resp5.json())
