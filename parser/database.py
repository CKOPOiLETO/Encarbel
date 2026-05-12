"""
Модуль работы с PostgreSQL.

Установка зависимостей:
    pip install asyncpg python-dotenv

Настройка:
    Скопируй .env.example в .env и заполни DATABASE_URL
"""

import asyncio
import asyncpg
import json
import logging
import os
from pathlib import Path
from typing import Optional

log = logging.getLogger("encar")


def get_database_url() -> str:
    """Берём URL из .env файла или переменной окружения."""
    current_dir = Path(__file__).resolve().parent
    
    # Поднимаемся на один уровень выше — в корень проекта (Encarbel)
    root_dir = current_dir.parent
    env_file = root_dir / ".env"

    # Если нашли файл в корне — загружаем его
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())
    else:
        log.warning(f"Файл .env не найден по пути: {env_file}")

    url = os.environ.get("DATABASE_URL")

    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL не найден.\n"
            "Создайте файл .env со строкой:\n"
            "DATABASE_URL=postgresql://postgres:password@localhost:5432/encar"
        )
    return url


# ── SQL схема ──────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS cars (
    car_id              BIGINT          PRIMARY KEY,
    url                 TEXT,
    title               TEXT,
    manufacturer        TEXT,
    model               TEXT,
    model_group         TEXT,
    grade               TEXT,
    year                INT,
    mileage             INT,
    price_won           BIGINT,
    displacement_cc     INT,
    fuel                TEXT,
    transmission        TEXT,
    color               TEXT,
    body_type           TEXT,
    standard_options    JSONB           DEFAULT '[]',
    unique_options      JSONB           DEFAULT '[]',
    photos              JSONB           DEFAULT '[]',
    first_seen_at       TIMESTAMPTZ     DEFAULT NOW(),
    last_updated_at     TIMESTAMPTZ     DEFAULT NOW(),
    is_active           BOOLEAN         DEFAULT TRUE
);

-- Индексы для быстрых выборок
CREATE INDEX IF NOT EXISTS idx_cars_manufacturer  ON cars (manufacturer);
CREATE INDEX IF NOT EXISTS idx_cars_year          ON cars (year);
CREATE INDEX IF NOT EXISTS idx_cars_price_won     ON cars (price_won);
CREATE INDEX IF NOT EXISTS idx_cars_mileage       ON cars (mileage);
CREATE INDEX IF NOT EXISTS idx_cars_is_active     ON cars (is_active);
CREATE INDEX IF NOT EXISTS idx_cars_last_updated  ON cars (last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cars_first_seen    ON cars (first_seen_at DESC);
"""


# ── Класс базы данных ──────────────────────────────────────────────────────────

class Database:
    def __init__(self, url: str = None):
        self._url:  str                       = url or get_database_url()
        self._pool: Optional[asyncpg.Pool]    = None

    async def connect(self):
        """Создаём пул соединений и инициализируем схему."""
        self._pool = await asyncpg.create_pool(
            self._url,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        async with self._pool.acquire() as conn:
            await conn.execute(SCHEMA)
        log.info("БД подключена, схема инициализирована")

    async def close(self):
        if self._pool:
            await self._pool.close()

    # ── Запись ────────────────────────────────────────────────────────────────

    async def upsert_car(self, car) -> str:
        """
        Вставляем авто или обновляем если уже есть.
        Возвращает 'inserted' или 'updated'.
        """
        async with self._pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT car_id, price_won, mileage FROM cars WHERE car_id = $1",
                car.car_id,
            )

            if existing is None:
                # Новое объявление
                await conn.execute("""
                    INSERT INTO cars (
                        car_id, url, title, manufacturer, model, model_group, grade,
                        year, mileage, price_won, displacement_cc,
                        fuel, transmission, color, body_type,
                        standard_options, unique_options, photos,
                        is_active
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                """,
                    car.car_id, car.url, car.title, car.manufacturer,
                    car.model, car.model_group, car.grade,
                    car.year, car.mileage, car.price_won, car.displacement_cc,
                    car.fuel, car.transmission, car.color, car.body_type,
                    json.dumps(car.standard_options, ensure_ascii=False),
                    json.dumps(car.unique_options,   ensure_ascii=False),
                    json.dumps(car.photos,           ensure_ascii=False),
                    True,
                )
                return "inserted"

            else:
                # Обновляем только если изменились цена или пробег
                if (existing["price_won"] != car.price_won or
                        existing["mileage"] != car.mileage):
                    await conn.execute("""
                        UPDATE cars SET
                            price_won       = $2,
                            mileage         = $3,
                            title           = $4,
                            unique_options  = $5,
                            photos          = $6,
                            is_active       = TRUE,
                            last_updated_at = NOW()
                        WHERE car_id = $1
                    """,
                        car.car_id, car.price_won, car.mileage, car.title,
                        json.dumps(car.unique_options, ensure_ascii=False),
                        json.dumps(car.photos,         ensure_ascii=False),
                    )
                    return "updated"
                else:
                    # Просто обновляем метку активности
                    await conn.execute(
                        "UPDATE cars SET is_active = TRUE, last_updated_at = NOW() WHERE car_id = $1",
                        car.car_id,
                    )
                    return "unchanged"

    async def upsert_many(self, cars: list) -> dict:
        """Пакетный upsert списка авто. Возвращает статистику."""
        stats = {"inserted": 0, "updated": 0, "unchanged": 0}
        for car in cars:
            result = await self.upsert_car(car)
            stats[result] += 1
        return stats

    # ── Чтение ────────────────────────────────────────────────────────────────

    async def get_active_ids(self) -> list[int]:
        """Все активные car_id (для проверки удалённых)."""
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("SELECT car_id FROM cars WHERE is_active = TRUE")
        return [r["car_id"] for r in rows]

    async def get_known_ids(self) -> set[int]:
        """Все известные car_id (для пропуска при initial load)."""
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("SELECT car_id FROM cars")
        return {r["car_id"] for r in rows}

    async def mark_removed(self, car_ids: list[int]):
        """Помечаем объявления как удалённые."""
        if not car_ids:
            return
        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE cars SET is_active = FALSE, last_updated_at = NOW() "
                "WHERE car_id = ANY($1::bigint[])",
                car_ids,
            )
        log.info(f"Помечено как удалённые: {len(car_ids)} объявлений")

    async def count(self) -> dict:
        """Статистика по БД."""
        async with self._pool.acquire() as conn:
            total   = await conn.fetchval("SELECT COUNT(*) FROM cars")
            active  = await conn.fetchval("SELECT COUNT(*) FROM cars WHERE is_active = TRUE")
            today   = await conn.fetchval(
                "SELECT COUNT(*) FROM cars WHERE first_seen_at >= CURRENT_DATE"
            )
        return {"total": total, "active": active, "new_today": today}
