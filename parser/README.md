# Encar.com Parser

Бесплатный асинхронный парсер корейского авторынка [encar.com](https://www.encar.com).  
Использует внутренний JSON API сайта — без сторонних платных сервисов.

## Что собирает

| Поле | Описание |
|------|----------|
| `title` | Полное название авто |
| `manufacturer` | Марка |
| `model` | Модель |
| `grade` | Комплектация |
| `year` | Год выпуска |
| `mileage` | Пробег (км) |
| `price_won` | Цена в корейских вонах (KRW) |
| `fuel` | Тип топлива |
| `transmission` | КПП |
| `color` | Цвет |
| `standard_options` | Базовые опции комплектации |
| `unique_options` | Уникальные опции с ценами (선택 옵션) |
| `photos` | Список URL фотографий |
| `url` | Ссылка на объявление |

## Установка

```bash
git clone https://github.com/YOUR_USERNAME/encar-parser.git
cd encar-parser
pip install -r requirements.txt
```

## Запуск

```bash
# 100 авто (тест)
python run.py

# 5000 авто
python run.py --total 5000

# С настройками
python run.py --total 1000 --workers 8 --output ./data
```

### Параметры

| Параметр | По умолчанию | Описание |
|----------|-------------|----------|
| `--total` | 100 | Количество авто |
| `--workers` | 5 | Параллельных запросов |
| `--delay-min` | 0.5 | Мин. задержка между запросами (с) |
| `--delay-max` | 1.5 | Макс. задержка (с) |
| `--output` | output/ | Папка для результатов |

## Использование как библиотеки

```python
import asyncio
from encar_parser import EncarParser

async def main():
    parser = EncarParser(concurrency=5)
    cars = await parser.fetch_all(total=500)

    parser.save_json(cars, "cars.json")
    parser.save_csv(cars,  "cars.csv")

    for car in cars[:3]:
        print(f"{car.title} | {car.price_won:,}₩ | {car.mileage:,}km")
        print(f"  Уникальные опции: {', '.join(car.unique_options)}")

    await parser.close()

asyncio.run(main())
```

## Пример вывода (JSON)

```json
{
  "car_id": 41894389,
  "url": "https://fem.encar.com/cars/detail/41894389",
  "title": "기아 K5 하이브리드 3세대 시그니처",
  "manufacturer": "기아",
  "model": "K5 하이브리드 3세대",
  "grade": "시그니처",
  "year": 2022,
  "mileage": 34817,
  "price_won": 26500000,
  "fuel": "가솔린+전기",
  "transmission": "오토",
  "color": "흰색",
  "standard_options": ["브레이크 잠김 방지(ABS)", "헤드업 디스플레이(HUD)", "..."],
  "unique_options": [
    "스타일 — 20만원",
    "10.25인치 UVO 내비게이션 — 95만원",
    "헤드업 디스플레이 — 65만원",
    "드라이브 와이즈 — 75만원",
    "솔라루프 — 130만원"
  ],
  "photos": [
    "https://ci.encar.com/carpicture08/pic4188/41885072_001.jpg"
  ]
}
```

## Архитектура

```
run.py
  └── EncarParser.fetch_all(total)
        ├── load_option_map()          ← GET /search/.../general?inav  (1 раз)
        ├── fetch_ids(total)           ← GET /search/car/list/general  (пагинация)
        └── fetch_car(car_id)          ← 2 запроса на авто:
              ├── GET /v1/readside/vehicle/{id}
              └── GET /v1/readside/vehicles/car/{vehicleId}/options/choice
```

## Советы

- Для объёмов 10k+ используй `--workers 3 --delay-min 1.0`
- Данные приходят на корейском языке
- Уникальные опции есть не у всех авто — это нормально
- Рекомендуется перезапускать каждые 6-12 часов для актуальных данных

## Лицензия

MIT
