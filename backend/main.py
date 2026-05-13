import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from dotenv import load_dotenv
from pathlib import Path
import httpx


# Ищем .env в корне проекта (на уровень выше папки backend)
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL)
    yield
    await pool.close()

app = FastAPI(lifespan=lifespan)

# Разрешаем запросы с React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В рабочей версии тут будет http://localhost:5173
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/cars")
@app.get("/api/cars")
async def get_cars(
    manufacturer: str = None,
    model_group: str = None, # Теперь используем группу
    model: str = None,
    body_type: str = None,   # Новый фильтр
    year_min: int = None,
    year_max: int = None,
    price_min: int = None,
    price_max: int = None,
    mileage_min: int = None,
    mileage_max: int = None,
    displacement_min: int = None, # Фильтр по объему
    displacement_max: int = None,
    fuel: str = None,
    search: str = None,
    sort: str = "newest",
    limit: int = 30,
    offset: int = 0
):
    # 1. Базовый запрос
    query = "SELECT * FROM cars WHERE is_active = TRUE"
    params = []
    
    # 2. Глобальный поиск (если передан)
    if search:
        params.append(f"%{search}%")
        query += f" AND (title ILIKE ${len(params)} OR manufacturer ILIKE ${len(params)} OR model ILIKE ${len(params)})"
    
    # 3. Фильтры (добавляем к существующему query)
    if manufacturer:
        params.append(manufacturer)
        query += f" AND manufacturer = ${len(params)}"

    if model_group:
        params.append(model_group)
        query += f" AND model_group = ${len(params)}"
    if model:
        params.append(model)
        query += f" AND model = ${len(params)}"
    if body_type: 
        params.append(body_type); query += f" AND body_type ILIKE ${len(params)}"
        
    if year_min: 
        params.append(year_min)
        query += f" AND year >= ${len(params)}"
        
    if year_max: 
        params.append(year_max)
        query += f" AND year <= ${len(params)}"
        
    if price_min: 
        params.append(price_min)
        query += f" AND price_won >= ${len(params)}"
        
    if price_max: 
        params.append(price_max)
        query += f" AND price_won <= ${len(params)}"
        
    if mileage_min: 
        params.append(mileage_min)
        query += f" AND mileage >= ${len(params)}"
        
    if mileage_max: 
        params.append(mileage_max)
        query += f" AND mileage <= ${len(params)}"
        
    if fuel: 
        params.append(fuel)
        query += f" AND fuel ILIKE ${len(params)}"
    if displacement_min: params.append(displacement_min); query += f" AND displacement_cc >= ${len(params)}"
    if displacement_max: params.append(displacement_max); query += f" AND displacement_cc <= ${len(params)}"

    # 4. Сортировка
    if sort == "price_asc": 
        query += " ORDER BY price_won ASC"
    elif sort == "price_desc": 
        query += " ORDER BY price_won DESC"
    else: 
        query += " ORDER BY last_updated_at DESC"

    # 5. Пагинация
    params.append(limit)
    query += f" LIMIT ${len(params)}"
    
    params.append(offset)
    query += f" OFFSET ${len(params)}"

    # 6. Выполнение запроса
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        
    result = []
    for r in rows:
        d = dict(r)
        # Безопасная распаковка JSONB
        d['photos'] = json.loads(d['photos']) if d['photos'] else []
        d['standard_options'] = json.loads(d['standard_options']) if d['standard_options'] else []
        d['unique_options'] = json.loads(d['unique_options']) if d['unique_options'] else []
        result.append(d)
        
    return result

@app.get("/api/cars/{car_id}")
async def get_car(car_id: int):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM cars WHERE car_id = $1", car_id)
    if not row:
        return {"error": "Car not found"}
    d = dict(row)
    d['photos'] = json.loads(d['photos']) if d['photos'] else []
    d['standard_options'] = json.loads(d['standard_options']) if d['standard_options'] else []
    d['unique_options'] = json.loads(d['unique_options']) if d['unique_options'] else[]
    return d



# Кеш для курсов
rates_cache = {
    "data": None,
    "last_updated": 0
}

@app.get("/api/rates")
async def get_rates():
    # Проверка кеша (оставляем старую логику, чтобы не спамить банк)
    import time
    current_time = time.time()
    if rates_cache["data"] and (current_time - rates_cache["last_updated"] < 3600):
        return rates_cache["data"]

    try:
        async with httpx.AsyncClient() as client:
            # Используем parammode=2, чтобы искать по кодам USD, EUR, KRW
            # Это исключает ошибки с ID
            urls = {
                "USD": "https://api.nbrb.by/exrates/rates/USD?parammode=2",
                "EUR": "https://api.nbrb.by/exrates/rates/EUR?parammode=2",
                "KRW": "https://api.nbrb.by/exrates/rates/KRW?parammode=2"
            }
            
            results = {}
            for key, url in urls.items():
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                  
                    results[key] = data["Cur_OfficialRate"] / data["Cur_Scale"]
                else:
                    raise Exception(f"Ошибка НБРБ для {key}")

            # Добавляем дату для инфо
            results["date"] = time.strftime("%Y-%m-%d")
            
            rates_cache["data"] = results
            rates_cache["last_updated"] = current_time
            return results

    except Exception as e:
        print(f"Критическая ошибка курсов: {e}")
        # Безопасные курсы-"заглушки", если API банка недоступно
        return {
            "USD": 3.25, 
            "EUR": 3.55, 
            "KRW": 0.00245, # (Это 2.45 BYN за 1000 вон)
            "fallback": True
        }
    

    
@app.get("/api/filters")
async def get_filter_options():
    async with pool.acquire() as conn:
        # Получаем данные для вложенной карты моделей
        rows = await conn.fetch("""
            SELECT DISTINCT manufacturer, model_group, model
            FROM cars
            WHERE is_active = TRUE
              AND manufacturer IS NOT NULL AND manufacturer != ''
              AND model_group IS NOT NULL AND model_group != ''
              AND model IS NOT NULL AND model != ''
        """)
        fuel_rows = await conn.fetch("SELECT DISTINCT fuel FROM cars WHERE is_active = TRUE AND fuel != ''")
        # Строим вложенную структуру: manufacturer → model_group → [models]
        models_map = {}
        manufacturers = set()
        for r in rows:
            mfr = r['manufacturer'].strip()
            grp = r['model_group'].strip()
            model = r['model'].strip()
            manufacturers.add(mfr)
            models_map.setdefault(mfr, {}).setdefault(grp, set()).add(model)
        # Преобразуем множества в отсортированные списки
        for mfr, groups in models_map.items():
            for grp, models in groups.items():
                groups[grp] = sorted(models)
        return {
            "manufacturers": sorted(list(manufacturers)),
            "hierarchy": models_map,
            "fuels": [f['fuel'] for f in fuel_rows]
        }
