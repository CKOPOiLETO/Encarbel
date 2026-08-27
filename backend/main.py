import os
import json
import time
import httpx
import re
import asyncpg
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# Ищем .env в корне проекта (на уровень выше папки backend)
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
pool = None

# Глобальный кеш для курсов валют
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
async def get_encar_vehicle_no(car_id: int) -> str | None:
    """Делает быстрый запрос к Encar, чтобы узнать реальный госномер машины по любому ID (даже дубликату)."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.encar.com/v1/readside/vehicle/{car_id}",
                headers={"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
                timeout=3.0
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("vehicleNo")
    except:
        pass
    return None

# --- ЭНДПОИНТ ДЛЯ ЗАЯВОК (ЛИДОВ) ---
# Модель для получения заявки
class LeadRequest(BaseModel):
    name: str
    phone: str
    comment: str = ""
    car_name: str = "" # Отдельно марка/модель
    car_id: str = ""   # Отдельно ID

@app.post("/api/lead")
async def submit_lead(lead: LeadRequest):
    print(f"🔥 НОВАЯ ЗАЯВКА! Имя: {lead.name} | Тел: {lead.phone} | Авто: {lead.car_name} | ID: {lead.car_id}")
    
    # Ссылка на вебхук от заказчика
    webhook_url = "https://ep.morekit.io/dd38aecbcd49cebf406f80020d783e24"
    
    # Формируем данные для отправки (JSON разделен на ключи)
    payload = {
        "name": lead.name,
        "phone": lead.phone,
        "comment": lead.comment,
        "car_name": lead.car_name,
        "car_id": lead.car_id
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json=payload, timeout=10.0)
            if resp.status_code in (200, 201):
                print("✅ Заявка успешно отправлена на вебхук!")
            else:
                print(f"⚠️ Ошибка вебхука: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Критическая ошибка при отправке на вебхук: {e}")

    return {"status": "success", "message": "Заявка успешно получена"}

# --- ЭНДПОИНТ КУРСОВ ВАЛЮТ (BITHUMB + НБРБ) ---
@app.get("/api/rates")
async def get_rates():
    current_time = time.time()
    if rates_cache["data"] and (current_time - rates_cache["last_updated"] < 1800): # Кеш на 30 минут
        return rates_cache["data"]

    try:
        async with httpx.AsyncClient() as client:
            res_usd = await client.get("https://api.nbrb.by/exrates/rates/USD?parammode=2")
            res_eur = await client.get("https://api.nbrb.by/exrates/rates/EUR?parammode=2")
            
            d_usd = res_usd.json()
            d_eur = res_eur.json()
            
            usd_rate = d_usd["Cur_OfficialRate"] / d_usd["Cur_Scale"]
            eur_rate = d_eur["Cur_OfficialRate"] / d_eur["Cur_Scale"]

            bithumb_resp = await client.get("https://api.bithumb.com/public/ticker/USDT_KRW", timeout=5.0)
            bithumb_data = bithumb_resp.json()
            
            if bithumb_data.get("status") == "0000":
                raw_krw_rate = float(bithumb_data["data"]["closing_price"])
                real_krw_rate = raw_krw_rate - 20
            else:
                raise Exception("Bithumb API error status")

            results = {
                "USD": usd_rate,
                "EUR": eur_rate,
                "KRW_BITHUMB": real_krw_rate, 
                "date": time.strftime("%Y-%m-%d")
            }
            
            rates_cache["data"] = results
            rates_cache["last_updated"] = current_time
            return results

    except Exception as e:
        print(f"Ошибка получения курса с Bithumb: {e}, используем фолбэк")
        return {
            "USD": 3.25, 
            "EUR": 3.55, 
            "KRW_BITHUMB": 1435.0,
            "fallback": True
        }


# --- ЭНДПОИНТ ФИЛЬТРОВ ---
@app.get("/api/filters")
async def get_filter_options(is_history: bool = False):
    # Если история - ищем проданные. Если каталог - активные.
    if is_history:
        condition = "is_active = FALSE AND EXTRACT(YEAR FROM manufacture_date) >= 2020"
    else:
        condition = "is_active = TRUE AND EXTRACT(YEAR FROM manufacture_date) >= 2012"

    async with pool.acquire() as conn:
        rows = await conn.fetch(f"""
            SELECT manufacturer, model_group, model,
                   MIN(EXTRACT(YEAR FROM manufacture_date)) as year_from,
                   MAX(EXTRACT(YEAR FROM manufacture_date)) as year_to
            FROM cars
            WHERE {condition} 
              AND manufacturer IS NOT NULL AND manufacturer != ''
              AND model_group IS NOT NULL AND model_group != ''
              AND model IS NOT NULL AND model != ''
            GROUP BY manufacturer, model_group, model
        """)
        fuel_rows = await conn.fetch(f"SELECT DISTINCT fuel FROM cars WHERE {condition} AND fuel != ''")
        
        # ИСПРАВЛЕНО: Вернули выборку ЦВЕТОВ вместо кузовов
        color_rows = await conn.fetch(f"SELECT DISTINCT color FROM cars WHERE {condition} AND color IS NOT NULL AND color != ''")

    hierarchy = {}
    for r in rows:
        m = r['manufacturer'].strip()
        mg = r['model_group'].strip()
        md = r['model'].strip()
        
        yf = int(r['year_from']) if r['year_from'] else None
        yt = int(r['year_to']) if r['year_to'] else None
        
        if yf and yt:
            label = f"{md} ({yf})" if yf == yt else f"{md} ({yf} - {yt})"
        else:
            label = md

        if m not in hierarchy: hierarchy[m] = {}
        if mg not in hierarchy[m]: hierarchy[m][mg] = []
        hierarchy[m][mg].append({"value": md, "label": label})

    for m in hierarchy:
        for mg in hierarchy[m]:
            hierarchy[m][mg].sort(key=lambda x: x["label"])

    return {
        "manufacturers": sorted(list(hierarchy.keys())),
        "hierarchy": hierarchy,
        "fuels": sorted([f['fuel'] for f in fuel_rows]),
        "colors": sorted([c['color'] for c in color_rows]) # <--- ВОЗВРАЩАЕМ ЦВЕТА
    }


# НОВЫЙ ЭНДПОИНТ ДЛЯ ИСТОРИИ (БЕЗ ТАМОЖНИ)
@app.get("/api/history")
async def get_history(
    manufacturer: str = None, model_group: str = None, model: str = None,
    body_type: str = None, year_min: int = None, year_max: int = None,
    price_min: int = None, price_max: int = None, mileage_min: int = None,
    mileage_max: int = None, displacement_min: int = None, displacement_max: int = None,
    fuel: str = None, search: str = None, sort: str = "newest", limit: int = 30, offset: int = 0
):
        # Строго неактивные авто от 2020 года
    query = "SELECT * FROM cars WHERE is_active = FALSE AND EXTRACT(YEAR FROM manufacture_date) >= 2020"
    params = []
    
    rates = rates_cache.get("data", {})
    krw_bithumb = rates.get("KRW_BITHUMB", 1435.0)
    
    # Считаем голую цену в долларах (+2% комиссии) без растаможки
    usd_price = f"((COALESCE(price_won, 0) / {krw_bithumb}) * 1.02)"

    if search:
        params.append(f"%{search.lower()}%")
        query += f" AND (LOWER(title) LIKE ${len(params)} OR LOWER(manufacturer) LIKE ${len(params)} OR LOWER(model_group) LIKE ${len(params)} OR LOWER(vin) LIKE ${len(params)})"
    if manufacturer: params.append(manufacturer); query += f" AND manufacturer ILIKE ${len(params)}"
    if model_group: params.append(model_group); query += f" AND model_group ILIKE ${len(params)}"
    if model: params.append(model); query += f" AND model ILIKE ${len(params)}"
    if body_type: params.append(body_type); query += f" AND body_type = ${len(params)}"
    if year_min is not None: params.append(year_min); query += f" AND EXTRACT(YEAR FROM manufacture_date) >= ${len(params)}"
    if year_max is not None: params.append(year_max); query += f" AND EXTRACT(YEAR FROM manufacture_date) <= ${len(params)}"
    
    if price_min is not None: params.append(price_min); query += f" AND {usd_price} >= ${len(params)}"
    if price_max is not None: params.append(price_max); query += f" AND {usd_price} <= ${len(params)}"
    
    if mileage_min: params.append(mileage_min); query += f" AND mileage >= ${len(params)}"
    if mileage_max: params.append(mileage_max); query += f" AND mileage <= ${len(params)}"
    if fuel: params.append(fuel); query += f" AND fuel = ${len(params)}"
    if displacement_min: params.append(displacement_min); query += f" AND displacement_cc >= ${len(params)}"
    if displacement_max: params.append(displacement_max); query += f" AND displacement_cc <= ${len(params)}"

    count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
    
    async with pool.acquire() as conn:
        total_count = await conn.fetchval(count_query, *params)

    if sort == "price_asc": query += f" ORDER BY {usd_price} ASC, car_id DESC"
    elif sort == "price_desc": query += f" ORDER BY {usd_price} DESC, car_id DESC"
    elif sort == "mileage_asc": query += " ORDER BY COALESCE(mileage, 9999999) ASC, car_id DESC"
    elif sort == "mileage_desc": query += " ORDER BY COALESCE(mileage, 0) DESC, car_id DESC"
    elif sort == "year_asc": query += " ORDER BY manufacture_date ASC NULLS LAST, car_id DESC"
    elif sort == "year_desc": query += " ORDER BY manufacture_date DESC NULLS LAST, car_id DESC"
    else: query += " ORDER BY last_updated_at DESC, car_id DESC"

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
        d['accidents'] = json.loads(d['accidents']) if d.get('accidents') else []
        result.append(d)
        
    # ВОЗВРАЩАЕМ И МАССИВ МАШИН, И ОБЩУЮ ЦИФРУ!
    return {
        "items": result,
        "total": total_count
    }


# --- ЭНДПОИНТ КАТАЛОГА АВТО ---
@app.get("/api/cars")
async def get_cars(
    manufacturer: str = None,
    model_group: str = None,
    model: str = None,
    color: str = None,
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
    hide_lease: bool = False,
    offset: int = 0
):
    query = "SELECT * FROM cars WHERE is_active = TRUE"
    params = []
    
    # Скрываем все машины старше 2012 года
    query += " AND EXTRACT(YEAR FROM manufacture_date) >= 2012"
    
    current_time = time.time()
    if not rates_cache.get("data") or (current_time - rates_cache.get("last_updated", 0) >= 3600):
        try:
            async with httpx.AsyncClient() as client:
                urls = {"USD": "https://api.nbrb.by/exrates/rates/USD?parammode=2", "EUR": "https://api.nbrb.by/exrates/rates/EUR?parammode=2", "KRW": "https://api.nbrb.by/exrates/rates/KRW?parammode=2"}
                fresh = {}
                for key, url in urls.items():
                    resp = await client.get(url)
                    data = resp.json()
                    fresh[key] = data["Cur_OfficialRate"] / data["Cur_Scale"]
                
                bithumb_resp = await client.get("https://api.bithumb.com/public/ticker/USDT_KRW", timeout=5.0)
                if bithumb_resp.status_code == 200:
                    b_data = bithumb_resp.json()
                    if b_data.get("status") == "0000":
                        fresh["KRW_BITHUMB"] = float(b_data["data"]["closing_price"]) - 20
                rates_cache["data"] = fresh
                rates_cache["last_updated"] = current_time
        except:
            if not rates_cache.get("data"):
                rates_cache["data"] = {"USD": 3.25, "EUR": 3.55, "KRW_BITHUMB": 1435.0}

    rates = rates_cache["data"]
    usd, eur = rates.get("USD", 3.25), rates.get("EUR", 3.55)
    krw_bithumb = rates.get("KRW_BITHUMB", 1435.0)

    usd_price = f"((COALESCE(price_won, 0) / {krw_bithumb}) * 1.02)"
    byn_price = f"({usd_price} * {usd})"
    eur_price = f"({byn_price} / {eur})"

    turnkey_sql = f"""
    (
        {byn_price} 
        + (6000 * {usd}) 
        + 1550 
        + (CASE WHEN manufacture_date > CURRENT_DATE - INTERVAL '3 years' THEN 624.92 ELSE 1282.02 END) 
        + (
            (
                CASE 
                    WHEN fuel = 'Electric' OR fuel = '전기' THEN 0
                    WHEN manufacture_date > CURRENT_DATE - INTERVAL '3 years' THEN 
                        CASE 
                            WHEN ({eur_price}) <= 8500 THEN GREATEST(({eur_price}) * 0.54, COALESCE(displacement_cc, 1600) * 2.5)
                            WHEN ({eur_price}) <= 16700 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 3.5)
                            WHEN ({eur_price}) <= 42300 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 5.5)
                            WHEN ({eur_price}) <= 84500 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 7.5)
                            WHEN ({eur_price}) <= 169000 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 15.0)
                            ELSE GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 20.0)
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

    # 2. Глобальный поиск (с авто-разрешением дубликатов Encar)
    if search:
        car_id_match = re.search(r'(\d{8,9})', search)
        if car_id_match:
            car_id_val = int(car_id_match.group(1))
            
                        # Узнаем госномер этого ID с корейского сайта
            vno = await get_encar_vehicle_no(car_id_val)
            
            if vno:
                # Ищем в нашей базе ЛИБО по номеру авто, ЛИБО по оригинальному ID
                params.append(vno)
                params.append(car_id_val)
                query += f" AND (vehicle_no = ${len(params)-1} OR car_id = ${len(params)})"
            else:
                params.append(car_id_val)
                query += f" AND car_id = ${len(params)}"
        else:
            params.append(f"%{search.lower()}%")
            query += f" AND (LOWER(title) LIKE ${len(params)} OR LOWER(manufacturer) LIKE ${len(params)} OR LOWER(model_group) LIKE ${len(params)} OR LOWER(vin) LIKE ${len(params)})"
    
    if manufacturer: params.append(manufacturer); query += f" AND manufacturer ILIKE ${len(params)}"
    if model_group: params.append(model_group); query += f" AND model_group ILIKE ${len(params)}"
    if model: params.append(model); query += f" AND model ILIKE ${len(params)}"
    if color: params.append(color); query += f" AND color = ${len(params)}"

    if year_min is not None:
        params.append(year_min)
        query += f" AND EXTRACT(YEAR FROM manufacture_date) >= ${len(params)}"

    if year_max is not None:
        params.append(year_max)
        query += f" AND EXTRACT(YEAR FROM manufacture_date) <= ${len(params)}"
        
    if price_min is not None:
        params.append(price_min * usd)
        query += f" AND {turnkey_sql} >= ${len(params)}"
        
    if price_max is not None:
        params.append(price_max * usd)
        query += f" AND {turnkey_sql} <= ${len(params)}"

    if mileage_min is not None: params.append(mileage_min); query += f" AND mileage >= ${len(params)}"
    if mileage_max is not None: params.append(mileage_max); query += f" AND mileage <= ${len(params)}"
    if fuel: params.append(fuel); query += f" AND fuel = ${len(params)}"
    if displacement_min is not None: params.append(displacement_min); query += f" AND displacement_cc >= ${len(params)}"
    if displacement_max is not None: params.append(displacement_max); query += f" AND displacement_cc <= ${len(params)}"
    if hide_lease: query += " AND is_lease = FALSE" 
    
    count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
    
    async with pool.acquire() as conn:
        total_count = await conn.fetchval(count_query, *params)

    if sort == "price_asc":
        query += f" ORDER BY is_lease ASC, {turnkey_sql} ASC, car_id DESC"
    elif sort == "price_desc":
        query += f" ORDER BY is_lease ASC, {turnkey_sql} DESC, car_id DESC"
    elif sort == "mileage_asc":
        query += " ORDER BY COALESCE(mileage, 9999999) ASC, car_id DESC"
    elif sort == "mileage_desc":
        query += " ORDER BY COALESCE(mileage, 0) DESC, car_id DESC"
    elif sort == "year_asc":
        query += " ORDER BY manufacture_date ASC NULLS LAST, car_id DESC"
    elif sort == "year_desc":
        query += " ORDER BY manufacture_date DESC NULLS LAST, car_id DESC"
    elif sort == "random":
        query += " ORDER BY RANDOM()"
    else:
        query += " ORDER BY last_updated_at DESC, car_id DESC"

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
        d['accidents'] = json.loads(d['accidents']) if d.get('accidents') else []
        result.append(d)
        
    # ВОЗВРАЩАЕМ И МАССИВ МАШИН, И ОБЩУЮ ЦИФРУ!
    return {
        "items": result,
        "total": total_count
    }



# --- ЭНДПОИНТ КОНКРЕТНОГО АВТО (ОБЫЧНЫЙ API) ---
@app.get("/api/cars/{car_id}")
async def get_car(car_id: int):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM cars WHERE car_id = $1", car_id)
        
        # ЕСЛИ МАШИНА НЕ НАЙДЕНА (Возможно, это дубликат)
        if not row:
            vno = await get_encar_vehicle_no(car_id)
            if vno:
                # Ищем оригинал по госномеру!
                row = await conn.fetchrow("SELECT * FROM cars WHERE vehicle_no = $1 LIMIT 1", vno)

    if not row:
        return {"error": "Car not found"}
        
    d = dict(row)
    d['photos'] = json.loads(d['photos']) if d['photos'] else []
    d['standard_options'] = json.loads(d['standard_options']) if d['standard_options'] else []
    d['unique_options'] = json.loads(d['unique_options']) if d['unique_options'] else []
    d['accidents'] = json.loads(d['accidents']) if d.get('accidents') else [] 
    return d


# --- ПРОКСИ ДЛЯ ТЕХОСМОТРА ENCAR ---
@app.get("/api/real-id/{car_id}")
async def get_real_id(car_id: int):
    """Фоновый запрос для получения истинного vehicleId и VIN-кода"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.encar.com/v1/readside/vehicle/{car_id}",
                headers={
                    "accept": "*/*",
                    "origin": "https://fem.encar.com",
                    "referer": "https://fem.encar.com/",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                timeout=10.0
            )
            
            if resp.status_code == 200:
                data = resp.json()
                real_id = data.get("vehicleId") or car_id
                # Извлекаем VIN-код (иногда корейцы скрывают последние цифры звездочками, это нормально)
                vin = data.get("vin") or "" 
                
                return {"vehicleId": real_id, "vin": vin}
            else:
                return {"vehicleId": car_id, "vin": ""}
                
    except Exception as e:
        print(f"Ошибка получения real-id для {car_id}: {e}")
        return {"vehicleId": car_id, "vin": ""}





@app.get("/catalog/{make}")
@app.get("/catalog/{make}/{model}")
async def serve_seo_catalog(make: str, model: str = None):
    """SEO-оптимизированная отдача посадочных страниц для Марки и Модели"""
    index_path = "/root/Encarbel/frontend/dist/index.html"
    
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
    except FileNotFoundError:
        return HTMLResponse("Site updating...", status_code=500)

    # 1. Узнаем у базы данных правильное написание бренда и модели (чтобы 'bmw' стало 'BMW')
    async with pool.acquire() as conn:
        real_make = await conn.fetchval("SELECT manufacturer FROM cars WHERE manufacturer ILIKE $1 LIMIT 1", make)
        make_clean = real_make if real_make else make.capitalize()
        
        if model:
            real_model = await conn.fetchval("SELECT model_group FROM cars WHERE manufacturer ILIKE $1 AND model_group ILIKE $2 LIMIT 1", make, model)
            model_clean = real_model if real_model else model.upper()

    if model:
        title = f"Купить {make_clean} {model_clean} из Кореи в Беларусь с доставкой"
        desc = f"Автомобили {make_clean} {model_clean} из Кореи в Беларусь. Подбор, доставка, сопровождение под ключ. Проверка перед покупкой."
        url = f"https://encarbel.by/catalog/{make.lower()}/{model.lower()}"
    else:
        title = f"Купить {make_clean} из Кореи в Беларусь с доставкой"
        desc = f"Автомобили {make_clean} из Кореи в Беларусь. Подбор, доставка, сопровождение под ключ. Проверка перед покупкой."
        url = f"https://encarbel.by/catalog/{make.lower()}"

    # 3. Внедряем SEO теги
    html = re.sub(r'<title[^>]*>.*?</title>', f'<title>{title}</title>', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<meta name="description"[^>]*>', f'<meta name="description" content="{desc}">', html, flags=re.IGNORECASE)
    
    # Open Graph (для мессенджеров)
    og_tags = f"""
    <link rel="canonical" href="{url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{desc}" />
    <meta property="og:image" content="https://encarbel.by/logo.PNG" />
    """
    
    if "</head>" in html:
        html = html.replace("</head>", f"{og_tags}\n</head>")
        
    # Внедряем невидимый текст для поисковиков (H1 заголовок крайне важен для SEO)
    seo_content = f"""
    <div id="root"></div>
    <h1 style="display:none; visibility:hidden;">{title}</h1>
    <p style="display:none; visibility:hidden;">{desc}</p>
    """
    html = html.replace('<div id="root"></div>', seo_content)
    
    return HTMLResponse(content=html)




# --- SITEMAP ИНДЕКС ---
@app.get("/sitemap.xml")
async def get_sitemap_index():
    DOMAIN = "https://encarbel.by"
    async with pool.acquire() as conn:
        total_cars = await conn.fetchval("SELECT COUNT(*) FROM cars WHERE is_active = TRUE")
        
    limit_per_sitemap = 20000
    num_sitemaps = (total_cars // limit_per_sitemap) + 1
    
    sitemap_nodes = []
    for i in range(1, num_sitemaps + 1):
        sitemap_nodes.append(f"""
        <sitemap>
            <loc>{DOMAIN}/sitemap_{i}.xml</loc>
            <lastmod>{time.strftime("%Y-%m-%d")}</lastmod>
        </sitemap>""")
        
    nodes_str = "".join(sitemap_nodes)
    index_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{nodes_str}
</sitemapindex>""".strip()
    
    return Response(content=index_xml, media_type="application/xml")


# --- SITEMAP ПОД-КАРТЫ ---
@app.get("/sitemap_{page}.xml")
async def get_sitemap_page(page: int):
    DOMAIN = "https://encarbel.by"
    limit_per_sitemap = 20000
    offset = (page - 1) * limit_per_sitemap
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT car_id, last_updated_at 
            FROM cars 
            WHERE is_active = TRUE 
            ORDER BY last_updated_at DESC
            LIMIT $1 OFFSET $2
        """, limit_per_sitemap, offset)
        
    url_list = []
    if page == 1:
        url_list.extend([
            f"<url><loc>{DOMAIN}/</loc><priority>1.0</priority></url>",
            f"<url><loc>{DOMAIN}/calculator</loc><priority>0.9</priority></url>",
            f"<url><loc>{DOMAIN}/about</loc><priority>0.9</priority></url>",
            f"<url><loc>{DOMAIN}/contacts</loc><priority>0.9</priority></url>"
        ])
        
    for r in rows:
        lastmod = r['last_updated_at'].strftime("%Y-%m-%d")
        url_list.append(f"<url><loc>{DOMAIN}/car/{r['car_id']}</loc><lastmod>{lastmod}</lastmod><priority>0.8</priority></url>")
        
    urls_str = "\n".join(url_list)
    sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls_str}
</urlset>""".strip()
    
    return Response(content=sitemap_xml, media_type="application/xml")


# --- SEO РЕНДЕР ДЛЯ РОБОТОВ И ТЕЛЕГРАМА ---
@app.get("/car/{car_id}")
async def serve_seo_car(car_id: int):
    """SEO-оптимизированная отдача страницы автомобиля с уникальным Description и Open Graph"""
    
    # 1. ОБНОВЛЯЕМ КУРСЫ ВАЛЮТ
    import time
    current_time = time.time()
    if not rates_cache.get("data") or (current_time - rates_cache.get("last_updated", 0) >= 3600):
        try:
            async with httpx.AsyncClient() as client:
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
                rates_cache["data"] = {"USD": 3.25, "EUR": 3.55, "KRW_BITHUMB": 1435.0}

    rates = rates_cache.get("data")
    usd = rates.get("USD", 3.25)
    eur = rates.get("EUR", 3.55)
    krw_bithumb = rates.get("KRW_BITHUMB", 1435.0)

    # 2. ФОРМУЛЫ РАСЧЕТА ДЛЯ БАЗЫ ДАННЫХ
    usd_price = f"((COALESCE(price_won, 0) / {krw_bithumb}) * 1.02)"
    byn_price = f"({usd_price} * {usd})"
    eur_price = f"({byn_price} / {eur})"

    turnkey_sql = f"""
    (
        {byn_price} 
        + (6000 * {usd}) 
        + 1550 
        + (CASE WHEN manufacture_date > CURRENT_DATE - INTERVAL '3 years' THEN 624.92 ELSE 1282.02 END) 
        + (
            (
                CASE 
                    WHEN fuel = 'Electric' OR fuel = '전기' THEN 0
                    WHEN manufacture_date > CURRENT_DATE - INTERVAL '3 years' THEN 
                        CASE 
                            WHEN ({eur_price}) <= 8500 THEN GREATEST(({eur_price}) * 0.54, COALESCE(displacement_cc, 1600) * 2.5)
                            WHEN ({eur_price}) <= 16700 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 3.5)
                            WHEN ({eur_price}) <= 42300 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 5.5)
                            WHEN ({eur_price}) <= 84500 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 7.5)
                            WHEN ({eur_price}) <= 169000 THEN GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 15.0)
                            ELSE GREATEST(({eur_price}) * 0.48, COALESCE(displacement_cc, 1600) * 20.0)
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

    async with pool.acquire() as conn:
        query = f"SELECT *, {turnkey_sql} AS total_byn FROM cars WHERE car_id = $1"
        row = await conn.fetchrow(query, car_id)
        
        # ЕСЛИ МАШИНА НЕ НАЙДЕНА (Защита от дубликатов для SEO и Telegram)
        if not row:
            vno = await get_encar_vehicle_no(car_id)
            if vno:
                query_fallback = f"SELECT *, {turnkey_sql} AS total_byn FROM cars WHERE vehicle_no = $1 LIMIT 1"
                row = await conn.fetchrow(query_fallback, vno)
        
    index_path = "/root/Encarbel/frontend/dist/index.html"
    
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
    except FileNotFoundError:
        return HTMLResponse("Site updating...", status_code=500)

    if not row:
        return HTMLResponse(content=html)
        
    car = dict(row)
    
    # 3. ПОДГОТАВЛИВАЕМ ДАННЫЕ ДЛЯ SEO / ТЕЛЕГРАМА
    manufacturer = car.get("manufacturer") or ""
    model = car.get("model") or ""
    
    # Год (Берем из manufacture_date, если нет - из year)
    m_date = car.get("manufacture_date")
    year = m_date.strftime("%Y") if m_date else str(car.get("year") or "")
    
    mileage_val = car.get("mileage")
    mileage = f"{mileage_val:,} км".replace(",", " ") if mileage_val else "Не указан"
    
    vin = car.get("vin") or ""
    vin_text = f" VIN: {vin}." if vin else ""
    
    fuel_raw = car.get("fuel") or ""
    FUEL_RU_MAP = {
        'Gasoline': 'Бензин', 'Diesel': 'Дизель', 'Electric': 'Электро',
        'Gasoline+Electric (Hybrid)': 'Гибрид (Бензин)', 'Diesel+Electric (Hybrid)': 'Гибрид (Дизель)', 'LPG': 'Газ (LPG)'
    }
    fuel = FUEL_RU_MAP.get(fuel_raw, fuel_raw)
    
    # ИТОГОВАЯ ЦЕНА ПОД КЛЮЧ (Из базы данных!)
    is_lease = car.get("is_lease", False)
    if is_lease:
        price_str = "Цена по запросу (Лизинг)"
    else:
        total_byn = car.get("total_byn") or 0
        # Превращаем Decimal в float перед делением
        total_usd = round(float(total_byn) / usd) if usd else 0
        price_str = f"≈ ${total_usd:,} Под ключ в Минске".replace(",", " ") if total_usd > 0 else "Цена по запросу"

    # 4. Формируем уникальные SEO-теги
    title = f"Купить {manufacturer} {model} {year} из Кореи | EncarBel"
    desc = f"Заказать {manufacturer} {model} {year} г.в. Пробег: {mileage}.{vin_text} Топливо: {fuel}. Цена: {price_str}."
    
    current_url = f"https://encarbel.by/car/{car_id}"

    try:
        photos = json.loads(car['photos']) if car.get('photos') else []
    except:
        photos = []
        
    og_image = photos[0] if photos else "https://encarbel.by/logo.PNG"

    html = re.sub(r'<title[^>]*>.*?</title>', f'<title>{title}</title>', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<meta name="description"[^>]*>', f'<meta name="description" content="{desc}">', html, flags=re.IGNORECASE)
    
    og_tags = f"""
    <link rel="canonical" href="{current_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{current_url}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{desc}" />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{desc}" />
    <meta name="twitter:image" content="{og_image}" />
    """

    if "</head>" in html:
        html = html.replace("</head>", f"{og_tags}\n</head>")

    # Визуальный HTML скелет для поисковиков
    seo_content = f"""
    <div id="root">
        <div style="max-width: 800px; margin: 40px auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333;">
            <div style="background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #f3f4f6;">
                {f'<div style="width: 100%; height: 400px; background: #f9fafb;"><img src="{og_image}" alt="{title}" style="width: 100%; height: 100%; object-fit: cover;" /></div>' if og_image else ''}
                <div style="padding: 30px;">
                    <span style="background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;">EncarBel • Авто из Кореи</span>
                    <h1 style="font-size: 26px; font-weight: 900; color: #111827; margin: 15px 0 10px 0;">{title}</h1>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5; margin-bottom: 20px;">{desc}</p>
                    <div style="display: flex; gap: 15px; background: #f3f4f6; padding: 15px; border-radius: 12px; font-size: 14px; font-weight: 600; color: #374151;">
                       <span>📅 Год: {year}</span>
                       <span>⚙️ Объем: {car.get('displacement_cc') or '-'} см³</span>
                       <span>⛽ Топливо: {fuel}</span>
                       <span>🛣 Пробег: {mileage}</span>
                       {f'<span>🏷 VIN: {vin}</span>' if vin else ''}
                    </div>
                    <div style="margin-top: 25px; text-align: right;">
                        <span style="font-size: 22px; font-weight: 900; color: #dc2626;">{price_str}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    """
    
    html = html.replace('<div id="root"></div>', seo_content)
    return HTMLResponse(content=html)



