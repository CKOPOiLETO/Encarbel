"""
Точка запуска парсера Encar с аргументами командной строки.

Примеры:
  python run.py                          # 100 авто
  python run.py --total 5000            # 5000 авто
  python run.py --total 500 --workers 10 --output ./data
  python run.py --total 200 --delay-min 1.0 --delay-max 3.0  # аккуратнее
"""

import argparse
import asyncio
import logging
from encar_parser import EncarParser


def parse_args():
    p = argparse.ArgumentParser(description="Парсер Encar.com")
    p.add_argument("--total",     type=int,   default=100,   help="Сколько авто собрать")
    p.add_argument("--workers",   type=int,   default=5,     help="Параллельных запросов (5-10)")
    p.add_argument("--delay-min", type=float, default=0.5,   help="Мин. задержка между запросами (с)")
    p.add_argument("--delay-max", type=float, default=1.5,   help="Макс. задержка между запросами (с)")
    p.add_argument("--output",    type=str,   default="output", help="Папка для результатов")
    p.add_argument("--verbose",   action="store_true",        help="Подробный лог")
    return p.parse_args()


async def run(args):
    if args.verbose:
        logging.getLogger("encar").setLevel(logging.DEBUG)

    parser = EncarParser(
        concurrency=args.workers,
        delay_min=args.delay_min,
        delay_max=args.delay_max,
        output_dir=args.output,
    )
    try:
        cars = await parser.fetch_all(total=args.total)
        if cars:
            parser.save_json(cars, "encar_cars.json")
            parser.save_csv(cars,  "encar_cars.csv")
            print(f"\n✅ Готово! Собрано {len(cars)} авто → {args.output}/")
        else:
            print("⚠️  Данные не получены.")
    finally:
        await parser.close()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(run(args))
