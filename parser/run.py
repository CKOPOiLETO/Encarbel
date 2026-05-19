import argparse
import asyncio
import logging
from encar_parser import EncarParser
from database import Database

# 1. Инициализируем логгер, чтобы ошибка "log is not defined" исчезла
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("encar")

def parse_args():
    p = argparse.ArgumentParser(description="Массовый импорт авто Encar в БД")
    p.add_argument("--total",     type=int,   default=100,   help="Сколько авто собрать")
    p.add_argument("--workers",   type=int,   default=5,     help="Параллельных запросов (рекомендуется 5)")
    p.add_argument("--delay-min", type=float, default=0.5,   help="Мин. задержка (с)")
    p.add_argument("--delay-max", type=float, default=1.5,   help="Макс. задержка (с)")
    p.add_argument("--output",    type=str,   default="output", help="Папка (не используется для БД)")
    p.add_argument("--verbose",   action="store_true",        help="Подробный лог")
    return p.parse_args()

async def run(args):
    if args.verbose:
        log.setLevel(logging.DEBUG)

    # 2. Подключаемся к БД
    db = Database()
    await db.connect()

    # 3. Инициализируем парсер
    parser = EncarParser(
        concurrency=args.workers,
        delay_min=args.delay_min,
        delay_max=args.delay_max,
        output_dir=args.output,
    )
    
    try:
        log.info(f"Запуск сбора {args.total} автомобилей...")
        
        # Собираем данные из API Encar
        cars = await parser.fetch_all(total=args.total)
        
        if cars:
            # ЗАПИСЫВАЕМ СРАЗУ В БАЗУ ДАННЫХ
            log.info(f"Записываем {len(cars)} авто в базу данных...")
            stats = await db.upsert_many(cars)
            
            print(f"\n" + "="*30)
            print(f"✅ ЗАГРУЗКА ЗАВЕРШЕНА")
            print(f"Добавлено новых: {stats['inserted']}")
            print(f"Обновлено:      {stats['updated']}")
            print(f"Без изменений:  {stats['unchanged']}")
            print("="*30)
        else:
            log.warning("⚠️ Данные не получены. Проверьте соединение или наличие LibreTranslate.")
            
    except Exception as e:
        log.error(f"Критическая ошибка в процессе run: {e}", exc_info=True)
        
    finally:
        await parser.close()
        await db.close()

if __name__ == "__main__":
    args = parse_args()
    asyncio.run(run(args))