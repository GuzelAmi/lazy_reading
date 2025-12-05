# update_tables.py
from app.database import engine
from app import models
import sys

if __name__ == "__main__":
    print("Обновление таблицы sessions...")
    try:
        # Временное решение: удаляем и создаем заново
        models.Session.__table__.drop(engine)
        models.Session.__table__.create(engine)
        print("✅ Таблица sessions обновлена с полем current_position")
    except Exception as e:
        print(f"❌ Ошибка: {e}")