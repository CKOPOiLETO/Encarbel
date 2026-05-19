import os
import json
import time
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from dotenv import load_dotenv
from pathlib import Path

# Ищем .env в корне проекта (на уровень выше папки backend)
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
pool = None

# Глобальный кеш для курсов валют (чтобы и поиск, и калькулятор брали одни цифры)
rates_cache = {
    "data": None,
    "last_updated": 0
}

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
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/cars")
async def get_cars(
    manufacturer: str = None,
    model_group: str = None,
    model: str = None,
    body_type: str = None,
    year_min: int = None,
    year_max: int = None,
    price_min: int = None,
    price_max: int = None,
    mileage_min: int = None,
    mileage_max: int = None,
    displacement_min: int = None,
    displacement_max: int = None,
    fuel: str = None,
    search: str = None,
    sort: str = "newest",
    limit: int = 30,
    offset: int = 0
):
    query = "SELECT * FROM cars WHERE is_active = TRUE"
    params = []
    
    # 1. ОБНОВЛЯЕМ КУРСЫ ВАЛЮТ
    current_time = time.time()
    if not rates_cache.get("data") or (current_time - rates_cache.get("last_updated", 0) >= 3600):
        async with httpx.AsyncClient() as client:
            try:
                urls = {
                    "USD": "https://api.nbrb.by/exrates/rates/USD?parammode=2",
                    "EUR": "https://api.nbrb.by/exrates/rates/EUR?parammode=2",
                    "KRW": "https://api.nbrb.by/exrates/rates/KRW?parammode=2"
                }
                fresh = {}
                for key, url in urls.items():
                    resp = await client.get(url)
                    data = resp.json()
                    fresh[key] = data["Cur_OfficialRate"] / data["Cur_Scale"]
                rates_cache["data"] = fresh
                rates_cache["last_updated"] = current_time
            except:
                if not rates_cache.get("data"):
                    rates_cache["data"] = {"USD": 3.25, "EUR": 3.55, "KRW": 0.00245}

    rates = rates_cache["data"]
    krw, usd, eur = rates["KRW"], rates["USD"], rates["EUR"]

    # 2. SQL-ФОРМУЛА ИТОГОВОЙ ЦЕНЫ (Под Ключ в BYN)
    # Используем manufacture_date вместо year
    turnkey_sql = f"""
    (
        (COALESCE(price_won, 0) * {krw}) 
        + (6600 * {usd}) 
        + 1650 
        + (CASE WHEN manufacture_date > CURRENT_DATE - INTERVAL '3 years' THEN 150 ELSE 220 END) 
        + (
            (
                CASE 
                    WHEN fuel ILIKE '%Electric%' OR fuel ILIKE '%전기%' THEN 0
                    WHEN manufacture_date > CURRENT_DATE - INTERVAL '3 years' THEN 
                        CASE 
                            WHEN ((COALESCE(price_won,0) * {krw}) / {eur}) <= 8500 THEN GREATEST(((COALESCE(price_won,0) * {krw}) / {eur}) * 0.54, COALESCE(displacement_cc, 1600) * 2.5)
                            WHEN ((COALESCE(price_won,0) * {krw}) / {eur}) <= 16700 THEN GREATEST(((COALESCE(price_won,0) * {krw}) / {eur}) * 0.48, COALESCE(displacement_cc, 1600) * 3.5)
                            WHEN ((COALESCE(price_won,0) * {krw}) / {eur}) <= 42300 THEN GREATEST(((COALESCE(price_won,0) * {krw}) / {eur}) * 0.48, COALESCE(displacement_cc, 1600) * 5.5)
                            WHEN ((COALESCE(price_won,0) * {krw}) / {eur}) <= 84500 THEN GREATEST(((COALESCE(price_won,0) * {krw}) / {eur}) * 0.48, COALESCE(displacement_cc, 1600) * 7.5)
                            WHEN ((COALESCE(price_won,0) * {krw}) / {eur}) <= 169000 THEN GREATEST(((COALESCE(price_won,0) * {krw}) / {eur}) * 0.48, COALESCE(displacement_cc, 1600) * 15.0)
                            ELSE GREATEST(((COALESCE(price_won,0) * {krw}) / {eur}) * 0.48, COALESCE(displacement_cc, 1600) * 20.0)
                        END * 0.5
                    WHEN manufacture_date > CURRENT_DATE - INTERVAL '5 years' THEN 
                        CASE 
                            WHEN COALESCE(displacement_cc, 1600) <= 1000 THEN COALESCE(displacement_cc, 1600) * 1.5
                            WHEN COALESCE(displacement_cc, 1600) <= 1500 THEN COALESCE(displacement_cc, 1600) * 1.7
                            WHEN COALESCE(displacement_cc, 1600) <= 1800 THEN COALESCE(displacement_cc, 1600) * 2.5
                            WHEN COALESCE(displacement_cc, 1600) <= 2300 THEN COALESCE(displacement_cc, 1600) * 2.7
                            WHEN COALESCE(displacement_cc, 1600) <= 3000 THEN COALESCE(displacement_cc, 1600) * 3.0
                            ELSE COALESCE(displacement_cc, 1600) * 3.6
                        END * 0.5
                    ELSE 
                        CASE 
                            WHEN COALESCE(displacement_cc, 1600) <= 1000 THEN COALESCE(displacement_cc, 1600) * 3.0
                            WHEN COALESCE(displacement_cc, 1600) <= 1500 THEN COALESCE(displacement_cc, 1600) * 3.2
                            WHEN COALESCE(displacement_cc, 1600) <= 1800 THEN COALESCE(displacement_cc, 1600) * 3.5
                            WHEN COALESCE(displacement_cc, 1600) <= 2300 THEN COALESCE(displacement_cc, 1600) * 4.8
                            WHEN COALESCE(displacement_cc, 1600) <= 3000 THEN COALESCE(displacement_cc, 1600) * 5.0
                            ELSE COALESCE(displacement_cc, 1600) * 5.7
                        END * 0.5
                END
                + 40
            ) * {eur}
        )
    )
    """

    # 3. ПРИМЕНЯЕМ ФИЛЬТРЫ
    if search:
        params.append(f"%{search.lower()}%")
        query += f" AND (LOWER(title) LIKE ${len(params)} OR LOWER(manufacturer) LIKE ${len(params)} OR LOWER(model_group) LIKE ${len(params)})"
    
    if manufacturer: 
        params.append(manufacturer); query += f" AND manufacturer = ${len(params)}"
    
    if model_group: 
        params.append(model_group); query += f" AND model_group = ${len(params)}"
    
    if model: 
        params.append(model); query += f" AND model = ${len(params)}"
    
    if body_type: 
        params.append(body_type); query += f" AND body_type = ${len(params)}"

    # ИСПРАВЛЕННЫЙ ФИЛЬТР ПО ГОДУ (через EXTRACT)
    if year_min:
        params.append(year_min)
        query += f" AND EXTRACT(YEAR FROM manufacture_date) >= ${len(params)}"
        
    if year_max:
        params.append(year_max)
        query += f" AND EXTRACT(YEAR FROM manufacture_date) <= ${len(params)}"

    if price_min is not None:
        params.append(price_min); query += f" AND {turnkey_sql} >= ${len(params)}"
    
    if price_max is not None:
        params.append(price_max); query += f" AND {turnkey_sql} <= ${len(params)}"

    if mileage_min: 
        params.append(mileage_min); query += f" AND mileage >= ${len(params)}"
    
    if mileage_max: 
        params.append(mileage_max); query += f" AND mileage <= ${len(params)}"
        
    if fuel: 
        params.append(fuel); query += f" AND fuel = ${len(params)}"
        
    if displacement_min: 
        params.append(displacement_min); query += f" AND displacement_cc >= ${len(params)}"
    
    if displacement_max: 
        params.append(displacement_max); query += f" AND displacement_cc <= ${len(params)}"

    # 4. СОРТИРОВКА
    if sort == "price_asc": 
        query += f" ORDER BY {turnkey_sql} ASC"
    elif sort == "price_desc": 
        query += f" ORDER BY {turnkey_sql} DESC"
    else: 
        query += " ORDER BY last_updated_at DESC"

    # 5. ПАГИНАЦИЯ
    params.append(limit); query += f" LIMIT ${len(params)}"
    params.append(offset); query += f" OFFSET ${len(params)}"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        
    result = []
    for r in rows:
        d = dict(r)
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
    d['unique_options'] = json.loads(d['unique_options']) if d['unique_options'] else []
    return d


@app.get("/api/rates")
async def get_rates():
    current_time = time.time()
    if rates_cache["data"] and (current_time - rates_cache["last_updated"] < 3600):
        return rates_cache["data"]

    try:
        async with httpx.AsyncClient() as client:
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

            results["date"] = time.strftime("%Y-%m-%d")
            
            rates_cache["data"] = results
            rates_cache["last_updated"] = current_time
            return results

    except Exception as e:
        print(f"Критическая ошибка курсов: {e}")
        return {
            "USD": 3.25, 
            "EUR": 3.55, 
            "KRW": 0.00245,
            "fallback": True
        }
    

@app.get("/api/filters")
async def get_filter_options():
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DISTINCT manufacturer, model_group, model
            FROM cars
            WHERE is_active = TRUE
              AND manufacturer IS NOT NULL AND manufacturer != ''
              AND model_group IS NOT NULL AND model_group != ''
              AND model IS NOT NULL AND model != ''
        """)
        fuel_rows = await conn.fetch("SELECT DISTINCT fuel FROM cars WHERE is_active = TRUE AND fuel != ''")
        body_rows = await conn.fetch("SELECT DISTINCT body_type FROM cars WHERE is_active = TRUE AND body_type != ''")

    models_map = {}
    for r in rows:
        mfr = r['manufacturer'].strip()
        grp = r['model_group'].strip()
        model = r['model'].strip()
        
        if mfr not in models_map: models_map[mfr] = {}
        if grp not in models_map[mfr]: models_map[mfr][grp] = []
        if model not in models_map[mfr][grp]: models_map[mfr][grp].append(model)

    for mfr in models_map:
        for grp in models_map[mfr]:
            models_map[mfr][grp].sort()

    return {
        "manufacturers": sorted(list(models_map.keys())),
        "hierarchy": models_map,
        "fuels": sorted([f['fuel'] for f in fuel_rows]),
        "body_types": sorted([b['body_type'] for b in body_rows])
    }