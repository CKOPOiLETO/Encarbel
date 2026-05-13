"""
python test_db.py
Быстрая проверка подключения к БД и парсинга 100 авто.
"""
import asyncio
import logging
from database import Database
from encar_parser import EncarParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)

async def main():
    db     = Database()
    parser = EncarParser(concurrency=5, delay_min=0.5, delay_max=1.2, translate=True)

    try:
        # 1. Подключение к БД
        print("Подключаемся к БД...")
        await db.connect()
        print("✅ БД подключена")

        # 2. Загрузка справочника опций
        parser._option_map = await parser.load_option_map()

        # 3. Парсим 100 авто
        print("\nПарсим 500 авто...")
        cars = await parser.fetch_all(total=500)
        print(f"✅ Спарсено: {len(cars)} авто")

        # 4. Записываем в БД
        print("\nЗаписываем в БД...")
        stats = await db.upsert_many(cars)
        print(f"✅ Результат: {stats}")

        # 5. Статистика
        counts = await db.count()
        print(f"\n📊 В БД сейчас:")
        print(f"  Всего:   {counts['total']:,}")
        print(f"  Активных: {counts['active']:,}")

        # 6. Пример первой записи
        if cars:
            s = cars[0]
            print(f"\n─── Пример записи ───")
            print(f"ID:      {s.car_id}")
            print(f"Авто:    {s.title}")
            print(f"Год:     {s.year}")
            print(f"Пробег:  {s.mileage:,} км" if s.mileage else "Пробег: —")
            print(f"Цена:    {s.price_won:,} вон" if s.price_won else "Цена: —")
            print(f"Опции:   {len(s.standard_options)} стандартных, {len(s.unique_options)} уникальных")
            print(f"Фото:    {len(s.photos)} шт")

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        await parser.close()
        await db.close()

asyncio.run(main())
