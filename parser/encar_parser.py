"""
Encar.com Parser — production-ready (май 2026)

Эндпоинты:
  Поиск:      /search/car/list/general                           (origin: www.encar.com)
  Справочник: /search/car/list/general?inav   (1 раз при старте, маппинг code→name)
  Данные:     /v1/readside/vehicle/{id}                          (origin: fem.encar.com)
  Уник. опции:/v1/readside/vehicles/car/{vehicleId}/options/choice
  Страховка:  /v1/readside/record/vehicle/{id}/open?vehicleNo={no}
"""

import asyncio
import aiohttp
import json
import logging
import random
from dataclasses import dataclass, field, asdict
from datetime import date
from typing import Optional
from pathlib import Path
from urllib.parse import quote

from translator import Translator, translate_static, MANUFACTURER_MAP, FUEL_MAP, TRANSMISSION_MAP, COLOR_MAP, BODY_TYPE_MAP

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("encar")

SEARCH_URL    = "https://api.encar.com/search/car/list/general"
VEHICLE_URL   = "https://api.encar.com/v1/readside/vehicle/{id}"
CHOICE_URL    = "https://api.encar.com/v1/readside/vehicles/car/{vehicle_id}/options/choice"
RECORD_URL = "https://api.encar.com/v1/readside/record/vehicle/{id}/open"
DETAIL_PAGE   = "https://fem.encar.com/cars/detail/{id}"
PHOTO_BASE    = "https://ci.encar.com"

HEADERS_SEARCH = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "ko-KR,ko;q=0.9",
    "origin": "https://www.encar.com",
    "referer": "https://www.encar.com/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
}

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


@dataclass
class CarData:
    car_id:           int
    vehicle_no:       str            = ""
    url:              str            = ""
    title:            str            = ""
    manufacturer:     str            = ""
    model:            str            = ""   # модель + поколение: "X5 (G05)"
    model_group:      str            = ""   # базовая модель: "X5"
    grade:            str            = ""
    year:             Optional[int]  = None
    manufacture_date: Optional[date] = None
    mileage:          Optional[int]  = None
    price_won:        Optional[int]  = None
    displacement_cc:  Optional[int]  = None
    fuel:             str            = ""
    transmission:     str            = ""
    color:            str            = ""
    body_type:        str            = ""
    is_lease:         bool           = False
    # ── Страховая история ─────────────────────────────────────────────────────
    owner_changes:        Optional[int] = None  # количество владельцев
    my_accident_cnt:      Optional[int] = None  # аварий по своей вине
    other_accident_cnt:   Optional[int] = None  # аварий по чужой вине
    my_accident_cost:     Optional[int] = None  # выплаты по своей вине (вон)
    other_accident_cost:  Optional[int] = None  # выплаты по чужой вине (вон)
    total_loss_cnt:       Optional[int] = None  # полная гибель
    flood_cnt:            Optional[int] = None  # затопление
    accidents:            list = field(default_factory=list)  # список аварий
    # ── Опции и фото ──────────────────────────────────────────────────────────
    standard_options: list = field(default_factory=list)
    unique_options:   list = field(default_factory=list)
    photos:           list = field(default_factory=list)

    def to_dict(self):
        d = asdict(self)
        # date → строка для JSON/CSV
        if d.get("manufacture_date"):
            d["manufacture_date"] = str(d["manufacture_date"])
        return d


# ── Парсинг ────────────────────────────────────────────────────────────────────

def parse_vehicle(data: dict, car: CarData, option_map: dict) -> tuple[Optional[int], str, str]:
    car.vehicle_no = data.get("vehicleNo") or ""
    cat = data.get("category") or {}

    manufacturer_ko = cat.get("manufacturerName")     or ""
    model_ko        = cat.get("modelName")             or cat.get("modelGroupName") or ""
    model_group_en  = cat.get("modelGroupEnglishName") or ""
    model_group_ko  = cat.get("modelGroupName")        or ""
    grade_ko        = cat.get("gradeName")             or ""
    grade_detail_ko = cat.get("gradeDetailName")       or ""
    grade_en        = cat.get("gradeEnglishName")      or ""

    car.manufacturer = translate_static(manufacturer_ko, MANUFACTURER_MAP)
    car.model        = model_ko
    car.model_group  = model_group_en or model_group_ko
    car.grade        = grade_en or " ".join(filter(None, [grade_ko, grade_detail_ko]))

    raw_year = cat.get("formYear")
    car.year = int(raw_year) if raw_year else None

    raw_ym = cat.get("yearMonth") or ""
    car.manufacture_date = date(int(raw_ym[:4]), int(raw_ym[4:]), 1) if len(raw_ym) == 6 else None

    adv = data.get("advertisement") or {}
    ad_type      = adv.get("advertisementType") or "NORMAL"
    car.is_lease  = ad_type != "NORMAL"
    car.price_won = int(adv.get("price") or 0) * 10_000

    spec = data.get("spec") or {}
    car.mileage         = spec.get("mileage")
    car.displacement_cc = spec.get("displacement") or None
    car.fuel            = translate_static(spec.get("fuelName")         or "", FUEL_MAP)
    car.transmission    = translate_static(spec.get("transmissionName") or "", TRANSMISSION_MAP)
    car.color           = translate_static(spec.get("colorName")        or "", COLOR_MAP)
    car.body_type       = translate_static(spec.get("bodyName")         or "", BODY_TYPE_MAP)

    opts = data.get("options") or {}
    car.standard_options = [
        option_map[c] for c in (opts.get("standard") or []) if c in option_map
    ]

    photos_raw = data.get("photos") or []
    def photo_sort_key(p):
        type_order = {"OUTER": 0, "INNER": 1, "OPTION": 2}
        return (type_order.get(p.get("type"), 9), p.get("code", "999"))
    car.photos = [
        PHOTO_BASE + p["path"]
        for p in sorted(photos_raw, key=photo_sort_key)
        if p.get("path")
    ]

    return data.get("vehicleId"), model_ko, model_group_ko


def parse_choice(items: list) -> list:
    result = []
    for item in items:
        name  = item.get("optionName") or ""
        price = item.get("price")
        if name:
            result.append({
                "name_ko":      name,
                "price_man_won": int(price) if price else None,
            })
    return result


def parse_insurance(data: dict, car: CarData):
    """Страховая история из /record/vehicle/{id}/open"""
    
    # ВАЖНО: Никаких проверок на openData! Проверяем только наличие данных о владельцах.
    # Используем `is None`, так как значение может быть нулем (0 владельцев)
    if not data or data.get("ownerChangeCnt") is None:
        return

    car.owner_changes       = data.get("ownerChangeCnt") or 0
    car.my_accident_cnt     = data.get("myAccidentCnt") or 0
    car.other_accident_cnt  = data.get("otherAccidentCnt") or 0
    car.my_accident_cost    = data.get("myAccidentCost") or 0
    car.other_accident_cost = data.get("otherAccidentCost") or 0
    car.total_loss_cnt      = data.get("totalLossCnt") or 0

    flood_total = data.get("floodTotalLossCnt") or 0
    flood_part  = data.get("floodPartLossCnt") or 0
    car.flood_cnt = flood_total + flood_part

    car.accidents = [
        {
            "date":     a.get("date"),
            "cost":     a.get("insuranceBenefit"),
            "parts":    a.get("partCost"),
            "labor":    a.get("laborCost"),
            "paint":    a.get("paintingCost"),
            "at_fault": str(a.get("type")) == "1",  # 1 = своя вина, остальное чужая
        }
        for a in (data.get("accidents") or [])
    ]

# ── Основной класс ─────────────────────────────────────────────────────────────

class EncarParser:
    def __init__(
        self,
        concurrency:  int   = 5,
        delay_min:    float = 0.5,
        delay_max:    float = 1.5,
        output_dir:   str   = "output",
        translate:    bool  = True,
    ):
        self.concurrency  = concurrency
        self.delay_min    = delay_min
        self.delay_max    = delay_max
        self.output_dir   = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.translate    = translate
        self._session:    Optional[aiohttp.ClientSession] = None
        self._translator: Optional[Translator] = None
        self._option_map: dict = {}

    async def _get_session(self) -> aiohttp.ClientSession:
        if not self._session or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=20),
                connector=aiohttp.TCPConnector(limit=self.concurrency),
            )
            if self.translate:
                self._translator = Translator(self._session)
        return self._session

    async def _get(self, url: str, headers: dict, retries: int = 3):
        session = await self._get_session()
        for attempt in range(1, retries + 1):
            try:
                async with session.get(url, headers=headers) as r:
                    if r.status == 200:
                        return await r.json(content_type=None)
                    elif r.status == 429:
                        wait = 10 * attempt
                        log.warning(f"Rate limit (429), жду {wait}с...")
                        await asyncio.sleep(wait)
                    elif r.status in (400, 401, 403, 404):
                        log.debug(f"HTTP {r.status}: {url}")
                        return None
                    else:
                        await asyncio.sleep(2 * attempt)
            except Exception as e:
                if attempt == retries:
                    log.warning(f"Ошибка: {e}")
                await asyncio.sleep(2 * attempt)
        return None

    async def load_option_map(self) -> dict:
        url = (
            f"{SEARCH_URL}"
            f"?count=true"
            f"&q=(And.Hidden.N._.CarType.A.)"
            f"&inav=%7CMetadata%7CSort"
        )
        data = await self._get(url, headers=HEADERS_SEARCH)
        mapping = {}
        if not data:
            return mapping
        nodes = data.get("iNav", {}).get("Nodes", [])
        for node in nodes:
            if node.get("Name") == "Options":
                for facet in node.get("Facets", []):
                    name  = facet.get("DisplayValue") or ""
                    codes = facet.get("Metadata", {}).get("Code") or []
                    for code in codes:
                        mapping[str(code)] = name
                break
        log.info(f"Справочник опций: {len(mapping)} позиций")
        return mapping

    async def fetch_ids(self, total: int) -> list[int]:
        ids       = []
        offset    = 0
        page_size = 20
        log.info(f"Сбор ID. Цель: {total}")

        while len(ids) < total:
            url = (
                f"{SEARCH_URL}"
                f"?count=true"
                f"&q=(And.Hidden.N._.CarType.A.)"
                f"&sr=%7CModifiedDate%7C{offset}%7C{page_size}"
            )
            data = await self._get(url, headers=HEADERS_SEARCH)
            if not data:
                break
            results = data.get("SearchResults") or []
            if not results:
                break
            for item in results:
                cid = item.get("Id")
                if cid:
                    ids.append(int(cid))
            log.info(f"  ID собрано: {len(ids)}/{total}  (offset={offset})")
            if len(results) < page_size:
                break
            offset += page_size
            await asyncio.sleep(random.uniform(self.delay_min, self.delay_max))

        return ids[:total]

    async def fetch_car(self, car_id: int) -> Optional[CarData]:
        car = CarData(car_id=car_id, url=DETAIL_PAGE.format(id=car_id))

        # 1. Основные данные
        vehicle = await self._get(VEHICLE_URL.format(id=car_id), headers=HEADERS_DETAIL)
        if not vehicle:
            return None
        vehicle_id, model_ko, model_group_ko = parse_vehicle(vehicle, car, self._option_map)

        # 2. Уникальные опции с ценами
        vid        = vehicle_id or car_id
        choice_raw = await self._get(CHOICE_URL.format(vehicle_id=vid), headers=HEADERS_DETAIL)
        choice_items = parse_choice(choice_raw) if choice_raw and isinstance(choice_raw, list) else []

        # 3. Страховая история (vehicleNo берём из ответа vehicle)
        insurance = await self._get(
            RECORD_URL.format(id=car_id),
            headers=HEADERS_DETAIL,
        )
        parse_insurance(insurance, car)

        # 4. Перевод
        if self.translate and self._translator:
            car.model = await self._translator.translate(model_ko)

            if car.model_group and not all(ord(c) < 128 for c in car.model_group.replace(" ", "")):
                car.model_group = await self._translator.translate(car.model_group)

            car.title = " ".join(filter(None, [car.manufacturer, car.model, car.grade]))

            if car.standard_options:
                car.standard_options = await self._translator.translate_list(car.standard_options)

            unique_translated = []
            for item in choice_items:
                name_en = await self._translator.translate(item["name_ko"])
                price   = item["price_man_won"]
                if price:
                    unique_translated.append(f"{name_en} — {price}만원 ({price * 10_000:,}₩)")
                else:
                    unique_translated.append(name_en)
            car.unique_options = unique_translated
        else:
            car.title = " ".join(filter(None, [car.manufacturer, car.model, car.grade]))
            car.unique_options = [
                f"{i['name_ko']} — {i['price_man_won']}만원" if i['price_man_won'] else i['name_ko']
                for i in choice_items
            ]

        await asyncio.sleep(random.uniform(self.delay_min, self.delay_max))
        return car

    async def fetch_all(self, total: int = 100) -> list[CarData]:
        self._option_map = await self.load_option_map()
        if self.translate and self._translator:
            await self._translator.check_available()
        car_ids = await self.fetch_ids(total=total)
        log.info(f"Получено {len(car_ids)} ID. Собираем детали...")

        sem     = asyncio.Semaphore(self.concurrency)
        results = []
        errors  = 0

        async def one(car_id: int, idx: int):
            nonlocal errors
            async with sem:
                car = await self.fetch_car(car_id)
                if car:
                    results.append(car)
                    if idx % 25 == 0 or idx == len(car_ids):
                        log.info(f"  Прогресс: {idx}/{len(car_ids)}")
                else:
                    errors += 1

        await asyncio.gather(*[one(cid, i) for i, cid in enumerate(car_ids, 1)])
        log.info(f"Готово. Собрано: {len(results)}, ошибок: {errors}")
        return results

    def save_json(self, cars: list[CarData], filename: str = "encar_cars.json"):
        path = self.output_dir / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump([c.to_dict() for c in cars], f, ensure_ascii=False, indent=2)
        log.info(f"JSON → {path}  ({len(cars)} авто)")

    def save_csv(self, cars: list[CarData], filename: str = "encar_cars.csv"):
        import csv
        path = self.output_dir / filename
        if not cars:
            return
        fieldnames = [
            "car_id", "url", "title", "manufacturer", "model", "model_group", "grade",
            "manufacture_date", "mileage", "price_won", "displacement_cc",
            "fuel", "transmission", "color", "body_type", "is_lease",
            "owner_changes", "my_accident_cnt", "other_accident_cnt",
            "my_accident_cost", "other_accident_cost", "total_loss_cnt", "flood_cnt",
            "standard_options", "unique_options", "photos",
        ]
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            w.writeheader()
            for car in cars:
                row = car.to_dict()
                row["standard_options"] = " | ".join(row["standard_options"])
                row["unique_options"]   = " | ".join(row["unique_options"])
                row["photos"]           = " | ".join(row["photos"])
                w.writerow(row)
        log.info(f"CSV  → {path}  ({len(cars)} авто)")

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()


async def main(total: int = 100, output_dir: str = "output", translate: bool = True):
    parser = EncarParser(
        concurrency=5,
        delay_min=0.5,
        delay_max=1.2,
        output_dir=output_dir,
        translate=translate,
    )
    try:
        cars = await parser.fetch_all(total=total)
        if cars:
            parser.save_json(cars)
            parser.save_csv(cars)
            s = cars[0]
            print(f"\n─── Пример ───")
            print(f"Авто:          {s.title}")
            print(f"Производство:  {s.manufacture_date}")
            print(f"Пробег:        {s.mileage:,} км" if s.mileage else "Пробег: —")
            print(f"Цена:          {s.price_won:,} вон" if s.price_won else "Цена: —")
            print(f"Лизинг:        {'да' if s.is_lease else 'нет'}")
            print(f"Владельцев:    {s.owner_changes}")
            print(f"Аварий (своя): {s.my_accident_cnt}")
            print(f"Выплаты:       {s.my_accident_cost:,} вон" if s.my_accident_cost else "Выплаты: —")
            print(f"Фото:          {len(s.photos)} шт")
        else:
            log.warning("Данные не получены.")
    finally:
        await parser.close()


if __name__ == "__main__":
    import sys
    total     = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    translate = "--no-translate" not in sys.argv
    asyncio.run(main(total=total, translate=translate))