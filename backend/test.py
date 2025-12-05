import requests
import json

BASE = "http://localhost:8000"

# 1. Корень
print("1️⃣ Корень API:")
r = requests.get(f"{BASE}/")
print(r.json())

# 2. Регистрация
print("\n2️⃣ Регистрация:")
data = {"username": "admin", "password": "admin123"}
r = requests.post(f"{BASE}/auth/register", json=data)
print(r.status_code, r.json() if r.status_code == 200 else "Пользователь уже существует")

# 3. Вход
print("\n3️⃣ Вход:")
r = requests.post(f"{BASE}/auth/login", data={"username": "admin", "password": "admin123"})
if r.status_code == 200:
    token = r.json()["access_token"]
    print(f"✅ Токен получен: {token[:30]}...")
else:
    print("❌ Ошибка входа")