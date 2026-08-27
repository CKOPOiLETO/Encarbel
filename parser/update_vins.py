import asyncio
import aiohttp
import asyncpg
import logging
from database import get_database_url

# Настраиваем логирование
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("vin_updater")

HEADERS = {
    "accept": "*/*",
    "origin": "https://fem.encar.com",
    "referer": "https://fem.encar.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
}

async def fetch_vin(session: aiohttp.ClientSession, car_id: int, sem: asyncio.Semaphore):
    """Фоновый запрос к Encar для получения VIN-кода"""
    async with sem:
        url = f"https://api.encar.com/v1/readside/vehicle/{car_id}"
        # Делаем до 3 попыток при сбоях сети
        for attempt in range(1, 4):
            try:
                async with session.get(url, headers=HEADERS, timeout=10) as r:
                    if r.status == 200:
                        data = await r.json()
                        vin = data.get("vin") or ""
                        return car_id, vin
                    elif r.status == 429:
                        await asyncio.sleep(5 * attempt)
                    elif r.status in (404, 400):
                        # Машина удалена или ID недействителен
                        return car_id, ""
            except Exception:
                await asyncio.sleep(2 * attempt)
                
        # Если все попытки провалились
        return car_id, ""

async def main():
    log.info("Подключаемся к базе данных...")
    db_url = get_database_url()
    pool = await asyncpg.create_pool(db_url, min_size=2, max_size=10)

    # 1. Ищем все машины, у которых VIN отсутствует
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT car_id FROM cars WHERE vin IS NULL")
        car_ids = [r['car_id'] for r in rows]

    if not car_ids:
        log.info("У всех машин в базе уже есть VIN-коды! Обновление не требуется.")
        await pool.close()
        return

    log.info(f"Найдено {len(car_ids)} машин без VIN-кода. Начинаем загрузку...")

    # Настройки параллельности (10 потоков оптимально, чтобы не получить бан)
    sem = asyncio.Semaphore(10)
    connector = aiohttp.TCPConnector(limit=10)
    
    async with aiohttp.ClientSession(connector=connector) as session:
        batch_size = 500 # Сохраняем в базу порциями по 500 машин
        
        for i in range(0, len(car_ids), batch_size):
            batch_ids = car_ids[i : i + batch_size]
            
            # Запускаем асинхронный сбор VIN
            tasks = [fetch_vin(session, cid, sem) for cid in batch_ids]
            results = await asyncio.gather(*tasks)

            # Формируем данные для пакетного обновления (vin, car_id)
            update_data = [(vin, cid) for cid, vin in results]

            # Массовое обновление (Upsert) в базе
            if update_data:
                async with pool.acquire() as conn:
                    # executemany - самый быстрый способ обновить тысячи строк
                    await conn.executemany(
                        "UPDATE cars SET vin = $1 WHERE car_id = $2",
                        update_data
                    )
            
            log.info(f"Прогресс: обновлено {min(i + batch_size, len(car_ids))} / {len(car_ids)} авто")

    await pool.close()
    log.info("✅ Обновление VIN-кодов успешно завершено!")

if __name__ == "__main__":
    asyncio.run(main())