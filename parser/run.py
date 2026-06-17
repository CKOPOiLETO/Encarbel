import argparse
import asyncio
import logging
from encar_parser import EncarParser
from database import Database

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("encar")

def parse_args():
    p = argparse.ArgumentParser(description="Массовый импорт авто Encar в БД")
    p.add_argument("--total",     type=int,   default=100,   help="Сколько авто собрать")
    p.add_argument("--workers",   type=int,   default=5,     help="Параллельных запросов")
    p.add_argument("--delay-min", type=float, default=0.5,   help="Мин. задержка (с)")
    p.add_argument("--delay-max", type=float, default=1.5,   help="Макс. задержка (с)")
    p.add_argument("--batch",     type=int,   default=200,   help="Размер порции для сохранения в БД")
    p.add_argument("--verbose",   action="store_true",       help="Подробный лог")
    return p.parse_args()

async def run(args):
    if args.verbose:
        log.setLevel(logging.DEBUG)

    db = Database()
    await db.connect()

    parser = EncarParser(
        concurrency=args.workers,
        delay_min=args.delay_min,
        delay_max=args.delay_max,
        output_dir="output",
    )
    
    try:
        # 0. ОБЯЗАТЕЛЬНО загружаем справочник опций и проверяем переводчик
        parser._option_map = await parser.load_option_map()
        if parser.translate and parser._translator:
            await parser._translator.check_available()

        log.info(f"Запуск сбора {args.total} автомобилей...")
        
        # 1. Сверяемся с БД
        known_ids = await db.get_known_ids()
        known_vnos = await db.get_known_vehicle_nos() # <--- Загружаем известные номера
        log.info(f"В базе уже есть {len(known_ids)} машин.")
        
        all_ids_on_site = await parser.fetch_ids(total=args.total)
        
        # Оставляем только те ID, которых нет в БД
        new_ids = [cid for cid in all_ids_on_site if cid not in known_ids]
        
        if not new_ids:
            log.info("Все эти машины уже есть в базе. Новых объявлений не найдено.")
            return

        total_new = len(new_ids)
        log.info(f"Найдено {total_new} новых ID объявлений. Начинаем проверку и скачивание...")
        
        sem = asyncio.Semaphore(parser.concurrency)
        total_stats = {"inserted": 0, "updated": 0, "unchanged": 0}
        
        # 2. СКАЧИВАЕМ И СОХРАНЯЕМ БАТЧАМИ
        for i in range(0, total_new, args.batch):
            chunk_ids = new_ids[i : i + args.batch]
            cars_chunk = []
            
            async def fetch_one(car_id: int):
                async with sem:
                    car = await parser.fetch_car(car_id)
                    if car:
                        # --- ЛОГИКА АНТИ-ДУБЛИКАТА ---
                        # Если номер авто (госномер) уже есть в нашем наборе - пропускаем!
                        if car.vehicle_no and car.vehicle_no in known_vnos:
                            # log.debug(f"Дубликат отсеян: {car.vehicle_no}") # Можно раскомментировать для проверки
                            return
                        
                        # Если номера не было, добавляем его в память, чтобы не пустить дубль в этом же батче
                        if car.vehicle_no:
                            known_vnos.add(car.vehicle_no)
                            
                        cars_chunk.append(car)

            await asyncio.gather(*[fetch_one(cid) for cid in chunk_ids])
            
            if cars_chunk:
                stats = await db.upsert_many(cars_chunk)
                total_stats["inserted"] += stats["inserted"]
                total_stats["updated"]  += stats["updated"]
                total_stats["unchanged"]+= stats["unchanged"]
                
            log.info(f"  Прогресс: обработано {min(i + args.batch, total_new)} / {total_new}")
            
        print(f"\n" + "="*30)
        print(f"✅ ЗАГРУЗКА ЗАВЕРШЕНА")
        print(f"Добавлено новых: {total_stats['inserted']}")
        print(f"Обновлено:      {total_stats['updated']}")
        print(f"Без изменений:  {total_stats['unchanged']}")
        print("="*30)
            
    except Exception as e:
        log.error(f"Критическая ошибка в процессе run: {e}", exc_info=True)
        
    finally:
        await parser.close()
        await db.close()

if __name__ == "__main__":
    args = parse_args()
    asyncio.run(run(args))