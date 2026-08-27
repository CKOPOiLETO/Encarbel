"""
Монитор новых объявлений Encar.

Два режима:
  python monitor.py                  # live-мониторинг каждые 5 минут
  python monitor.py --initial-load   # первичная загрузка всех ~227k авто
  python monitor.py --check-removed  # разовая проверка удалённых объявлений
  python monitor.py --interval 60    # мониторинг каждую минуту
  python monitor.py --stats          # показать статистику БД
"""

import argparse
import asyncio
import logging
import time
from datetime import datetime

from database import Database
from encar_parser import EncarParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("encar")

VEHICLE_URL  = "https://api.encar.com/v1/readside/vehicle/{id}"
HEADERS_DETAIL = {
    "accept": "*/*",
    "accept-language": "ko-KR,ko;q=0.9",
    "origin": "https://fem.encar.com",
    "referer": "https://fem.encar.com/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
}


# ── Режим 1: Initial Load ──────────────────────────────────────────────────────

async def initial_load(db: Database, parser: EncarParser, batch: int = 200):
    """
    Первичная загрузка всех объявлений с Encar.
    Работает батчами — можно прерывать и продолжать (пропускает уже загруженные).
    """
    log.info("=== INITIAL LOAD ===")

    # Узнаём сколько всего авто на сайте
    import aiohttp
    session = await parser._get_session()
    url = "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.A.)&sr=%7CModifiedDate%7C0%7C1"
    async with session.get(url, headers={
        "accept": "application/json, text/javascript, */*; q=0.01",
        "origin": "https://www.encar.com",
        "referer": "https://www.encar.com/",
        "user-agent": "Mozilla/5.0",
    }) as r:
        data = await r.json(content_type=None)
        total_on_site = data.get("Count", 0)

    log.info(f"Всего на сайте: {sitotal_on_te:,} объявлений")

    # Уже загруженные ID — пропускаем
    known_ids  = await db.get_known_ids()
    log.info(f"Уже в БД: {len(known_ids):,}. Осталось загрузить: ~{total_on_site - len(known_ids):,}")

    offset     = 0
    page_size  = 20
    total_new  = 0
    start_time = time.time()

    while True:
        url = (
            f"https://api.encar.com/search/car/list/general"
            f"?count=true&q=(And.Hidden.N._.CarType.A.)"
            f"&sr=%7CModifiedDate%7C{offset}%7C{page_size}"
        )
        data = await parser._get(url, headers={
            "accept": "application/json, text/javascript, */*; q=0.01",
            "origin": "https://www.encar.com",
            "referer": "https://www.encar.com/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        if not data:
            break

        results = data.get("SearchResults") or []
        if not results:
            break

        # Фильтруем уже известные
        new_ids = [int(r["Id"]) for r in results if int(r["Id"]) not in known_ids]

        if new_ids:
            cars = []
            for car_id in new_ids:
                car = await parser.fetch_car(car_id)
                if car:
                    cars.append(car)

            if cars:
                stats = await db.upsert_many(cars)
                total_new += stats["inserted"]
                known_ids.update(new_ids)

        elapsed  = time.time() - start_time
        speed    = total_new / elapsed * 3600 if elapsed > 0 else 0
        log.info(
            f"offset={offset:,} | загружено={total_new:,} | "
            f"скорость={speed:.0f} авто/час"
        )

        if len(results) < page_size:
            break

        offset += page_size

    log.info(f"=== Initial load завершён: {total_new:,} новых авто ===")


# ── Режим 2: Live Monitor ──────────────────────────────────────────────────────

async def live_monitor(db: Database, parser: EncarParser, interval: int = 300):
    """
    Постоянный мониторинг новых объявлений.
    Каждые interval секунд проверяет первые страницы и сохраняет новые.
    """
    log.info(f"=== LIVE MONITOR (интервал: {interval}с) ===")

    # Загружаем известные ID в память для быстрой проверки
    known_ids = await db.get_known_ids()
    log.info(f"Загружено {len(known_ids):,} известных ID из БД")

    cycle = 0
    while True:
        cycle += 1
        start = time.time()
        new_count     = 0
        updated_count = 0

        try:
            # Проверяем первые 3 страницы (2000 авто) — там все свежие
            ids = await parser.fetch_ids(total=2000)

            for car_id in ids:
                if car_id not in known_ids:
                    # Новое объявление
                    car = await parser.fetch_car(car_id)
                    if car:
                        result = await db.upsert_car(car)
                        if result == "inserted":
                            known_ids.add(car_id)
                            new_count += 1
                            log.info(f"  🆕 Новое: [{car_id}] {car.title} | {car.price_won:,}₩")
                else:
                    # Известное — проверяем изменение цены
                    car = await parser.fetch_car(car_id)
                    if car:
                        result = await db.upsert_car(car)
                        if result == "updated":
                            updated_count += 1

            elapsed = time.time() - start
            stats   = await db.count()
            log.info(
                f"Цикл #{cycle} за {elapsed:.1f}с | "
                f"+{new_count} новых, ~{updated_count} обновлено | "
                f"В БД: {stats['active']:,} активных"
            )

        except Exception as e:
            log.error(f"Ошибка в цикле мониторинга: {e}")

        # Ждём до следующего цикла
        sleep_time = max(0, interval - (time.time() - start))
        await asyncio.sleep(sleep_time)


# ── Режим 3: Check Removed ────────────────────────────────────────────────────

async def check_removed(db: Database, parser: EncarParser, batch_size: int = 50):
    """
    Проверяем все активные объявления — удалённые помечаем как is_active=FALSE.
    Запускать раз в день.
    """
    log.info("=== CHECK REMOVED ===")

    active_ids = await db.get_active_ids()
    log.info(f"Проверяем {len(active_ids):,} активных объявлений...")

    removed    = []
    checked    = 0
    session    = await parser._get_session()

    for car_id in active_ids:
        try:
            async with session.get(
                VEHICLE_URL.format(id=car_id),
                headers=HEADERS_DETAIL,
                timeout=__import__("aiohttp").ClientTimeout(total=10),
            ) as r:
                if r.status == 404:
                    removed.append(car_id)
                    log.debug(f"  Удалено: {car_id}")
        except Exception:
            pass

        checked += 1
        if checked % 500 == 0:
            log.info(f"  Проверено: {checked:,}/{len(active_ids):,}, удалено: {len(removed)}")

        # Сохраняем батчами
        if len(removed) >= batch_size:
            await db.mark_removed(removed)
            removed = []

        await asyncio.sleep(0.3)

    if removed:
        await db.mark_removed(removed)

    log.info(f"=== Check removed завершён: помечено удалёнными {len(removed):,} ===")


# ── Точка входа ────────────────────────────────────────────────────────────────

async def main(args):
    db     = Database()
    parser = EncarParser(
        concurrency=5,
        delay_min=0.8,
        delay_max=1.5,
        translate=not args.no_translate,
    )

    try:
        await db.connect()
        await parser._get_session()
        parser._option_map = await parser.load_option_map()

        if args.stats:
            stats = await db.count()
            print(f"\n📊 Статистика БД:")
            print(f"  Всего записей:   {stats['total']:,}")
            print(f"  Активных:        {stats['active']:,}")
            print(f"  Добавлено сегодня: {stats['new_today']:,}")

        elif args.initial_load:
            await initial_load(db, parser)

        elif args.check_removed:
            await check_removed(db, parser)

        else:
            # Live monitor по умолчанию
            await live_monitor(db, parser, interval=args.interval)

    finally:
        await parser.close()
        await db.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Encar Monitor")
    p.add_argument("--interval",      type=int,  default=300,    help="Интервал мониторинга (с)")
    p.add_argument("--initial-load",  action="store_true",       help="Первичная загрузка всех авто")
    p.add_argument("--check-removed", action="store_true",       help="Проверить удалённые объявления")
    p.add_argument("--stats",         action="store_true",       help="Показать статистику БД")
    p.add_argument("--no-translate",  action="store_true",       help="Без перевода на английский")
    args = p.parse_args()
    asyncio.run(main(args))
