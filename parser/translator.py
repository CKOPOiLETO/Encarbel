"""
Модуль перевода корейских данных на английский.

Стратегия:
  - Словари: марка, топливо, КПП, цвет (мгновенно, офлайн)
  - LibreTranslate (локальный): опции и названия моделей (без лимитов)
  - Кэш: переведённые строки сохраняются в translation_cache.json

Запуск LibreTranslate:
  pip install libretranslate
  libretranslate --load-only ko,en
  # Сервер будет на http://localhost:5000
"""

import asyncio
import aiohttp
import json
import logging
from pathlib import Path

log = logging.getLogger("encar")

# ── Словари ───────────────────────────────────────────────────────────────────

MANUFACTURER_MAP = {
    "현대": "Hyundai",
    "기아": "Kia",
    "제네시스": "Genesis",
    "쉐보레(GM대우)": "Chevrolet (GM Daewoo)",
    "쉐보레": "Chevrolet",
    "르노코리아(삼성)": "Renault Korea (Samsung)",
    "KG모빌리티(쌍용)": "KG Mobility (Ssangyong)",
    "BMW": "BMW",
    "벤츠": "Mercedes-Benz",
    "아우디": "Audi",
    "볼보": "Volvo",
    "폭스바겐": "Volkswagen",
    "포르쉐": "Porsche",
    "테슬라": "Tesla",
    "렉서스": "Lexus",
    "도요타": "Toyota",
    "혼다": "Honda",
    "닛산": "Nissan",
    "미니": "Mini",
    "랜드로버": "Land Rover",
    "재규어": "Jaguar",
    "포드": "Ford",
    "링컨": "Lincoln",
    "캐딜락": "Cadillac",
    "지프": "Jeep",
    "크라이슬러": "Chrysler",
    "마세라티": "Maserati",
    "페라리": "Ferrari",
    "람보르기니": "Lamborghini",
    "벤틀리": "Bentley",
    "롤스로이스": "Rolls-Royce",
    "맥라렌": "McLaren",
    "푸조": "Peugeot",
    "시트로엥/DS": "Citroen/DS",
    "피아트": "Fiat",
    "알파 로메오": "Alfa Romeo",
    "BYD": "BYD",
    "폴스타": "Polestar",
    "GMC": "GMC",
    "인피니티": "Infiniti",
    "기타 수입차": "Other Imports",
    "기타 제조사": "Other",
}

FUEL_MAP = {
    "가솔린": "Gasoline",
    "디젤": "Diesel",
    "전기": "Electric",
    "가솔린+전기": "Gasoline+Electric (Hybrid)",
    "디젤+전기": "Diesel+Electric (Hybrid)",
    "LPG(일반인 구입)": "LPG",
    "LPG+전기": "LPG+Electric",
    "가솔린+LPG": "Gasoline+LPG",
    "수소": "Hydrogen",
    "가솔린+CNG": "Gasoline+CNG",
    "CNG": "CNG",
    "기타": "Other",
}

TRANSMISSION_MAP = {
    "오토": "Automatic",
    "수동": "Manual",
    "세미오토": "Semi-Automatic",
    "CVT": "CVT",
    "기타": "Other",
}

COLOR_MAP = {
    "흰색": "White",
    "검정색": "Black",
    "은색": "Silver",
    "쥐색": "Gray",
    "청색": "Blue",
    "빨간색": "Red",
    "갈색": "Brown",
    "노란색": "Yellow",
    "녹색": "Green",
    "진주색": "Pearl White",
    "하늘색": "Sky Blue",
    "주황색": "Orange",
    "보라색": "Purple",
    "분홍색": "Pink",
    "연두색": "Light Green",
    "금색": "Gold",
    "담녹색": "Dark Green",
    "자주색": "Maroon",
    "은하색": "Galaxy Silver",
    "연금색": "Light Gold",
    "명은색": "Bright Silver",
    "청옥색": "Teal",
    "갈대색": "Reed Brown",
    "흰색투톤": "White Two-Tone",
    "검정투톤": "Black Two-Tone",
    "은색투톤": "Silver Two-Tone",
    "진주투톤": "Pearl Two-Tone",
    "기타": "Other",
}


BODY_TYPE_MAP = {
    "경차":    "Minicar",
    "소형차":  "Subcompact",
    "준중형차": "Compact",
    "중형차":  "Mid-size",
    "대형차":  "Full-size",
    "스포츠카": "Sports car",
    "SUV":    "SUV",
    "RV":     "RV",
    "경승합차": "Mini van",
    "승합차":  "Van",
    "화물차":  "Truck",
    "기타":    "Other",
}


def translate_static(value: str, mapping: dict) -> str:
    """Переводим через словарь, если нет — возвращаем оригинал."""
    return mapping.get(value, value)


# ── Словарь уникальных опций ──────────────────────────────────────────────────
# Машинный перевод плохо справляется с автомобильными брендовыми названиями.
# Этот словарь применяется первым; всё что не найдено — идёт в LibreTranslate.

UNIQUE_OPTIONS_MAP = {
    # ── Крыша ─────────────────────────────────────────────────────────────────
    "파노라마 선루프":              "Panoramic sunroof",
    "세이프티 선루프":              "Safety sunroof",
    "와이드 선루프":                "Wide sunroof",
    "솔라루프":                     "Solar roof",
    "비전루프":                     "Vision roof",

    # ── Цвет кузова ───────────────────────────────────────────────────────────
    "스노우 화이트 펄 (SWP)":       "Snow White Pearl (SWP)",
    "스노우 화이트 펄":             "Snow White Pearl",
    "클라우드 펄 외장 컬러":        "Cloud Pearl exterior color",
    "White Pearl(백진주색)":        "White Pearl",
    "백진주색":                     "White Pearl",
    "투톤 익스테리어 패키지":       "Two-tone exterior package",
    "스타일":                       "Style package",

    # ── Пакеты ────────────────────────────────────────────────────────────────
    "컨비니언스 패키지":            "Convenience package",
    "하이테크 패키지":              "High-tech package",
    "빌트인 캠 패키지":             "Built-in cam package",
    "렉시콘 사운드 패키지":         "Lexicon sound package",
    "드라이빙 어시스턴스 패키지 Ⅰ": "Driving Assistance Package I",
    "드라이빙 어시스턴스 패키지 I": "Driving Assistance Package I",
    "드라이빙 어시스턴스 패키지 II": "Driving Assistance Package II",
    "드라이빙 어시스턴스 패키지 Ⅱ": "Driving Assistance Package II",
    "드라이빙 어시스턴스 패키지":   "Driving Assistance Package",
    "스포츠 패키지":                "Sport package",
    "파퓰러 패키지":                "Popular package",
    "파퓰러 패키지 I":              "Popular Package I",
    "파퓰러 패키지 II":             "Popular Package II",
    "파퓰러 컬렉션 패키지":         "Popular Collection package",
    "컴포트 패키지":                "Comfort package",
    "컴포트":                       "Comfort package",
    "2열 컴포트 패키지 I":          "2nd Row Comfort Package I",
    "2열 컴포트 패키지 II":         "2nd Row Comfort Package II",
    "뒷좌석 VIP 패키지":            "Rear VIP package",
    "딥 컨트롤 패키지":             "Deep Control package",
    "주행 보조 시스템 팩":          "Driver Assistance System Pack",
    "K-LOOK 스포티 인테리어 팩":    "K-Look Sporty Interior Pack",

    # ── Дизайн-селекции (Genesis / Hyundai / Kia) ─────────────────────────────
    "시그니쳐 디자인 셀렉션 I":     "Signature Design Selection I",
    "시그니쳐 디자인 셀렉션 II":    "Signature Design Selection II",
    "시그니쳐 디자인 셀렉션 III":   "Signature Design Selection III",
    "시그니쳐 디자인 셀렉션":       "Signature Design Selection",
    "스포츠 디자인 셀렉션 I":       "Sport Design Selection I",
    "스포츠 디자인 셀렉션 II":      "Sport Design Selection II",
    "스포츠 디자인 셀렉션":         "Sport Design Selection",
    "쿠페 디자인 셀렉션 I":         "Coupe Design Selection I",
    "쿠페 디자인 셀렉션 II":        "Coupe Design Selection II",
    "스킬스 디자인 셀렉션 I":       "Skills Design Selection I",

    # ── Системы помощи водителю ───────────────────────────────────────────────
    "드라이브 와이즈":              "Drive Wise (ADAS package)",
    "헤드업 디스플레이":            "Head-up display (HUD)",
    "프리뷰 전자제어 서스펜션":     "Preview Electronic Control Suspension",
    "능동형 후륜 조향":             "Active Rear Steering",
    "멀티 챔버 에어 서스펜션":      "Multi-Chamber Air Suspension",

    # ── Мультимедиа / навигация ───────────────────────────────────────────────
    "스마트 커넥트":                "Smart Connect",
    "KRELL 프리미엄 사운드":        "KRELL Premium Sound",
    "렉시콘 사운드":                "Lexicon Sound",
    "뒷좌석 듀얼 모니터":           "Rear dual monitor",
    "8인치 스마트 i 내비게이션":    "8-inch Smart i Navigation",
    "9인치 HD 스마트 미러링 내비게이션": "9-inch HD Smart Mirroring Navigation",
    "8인치 스마트 미러링 패키지":   "8-inch Smart Mirroring Package",
    "7인치 멀티 내비게이션":        "7-inch Multi Navigation",
    "10.25인치 UVO 내비게이션":     "10.25-inch UVO Navigation",
    "인포콘 커넥티비티 패키지Ⅰ":   "Infocon Connectivity Package I",
    "블레이즈 클러스터 패키지":     "Blaze Cluster Package",
    "EASY LIFE 인포테인먼트 팩Ⅱ":  "Easy Life Infotainment Pack II",

    # ── Сиденья ───────────────────────────────────────────────────────────────
    "프리미엄 나파(NAPA) 가죽시트": "Premium Nappa leather seats",
    "천연 가죽시트":                "Natural leather seats",
    "7인승":                        "7-seat configuration",
    "6인승":                        "6-seat configuration",

    # ── Безопасность ──────────────────────────────────────────────────────────
    "커튼 에어백":                  "Curtain airbag",
    "사이드 & 커튼 에어백":         "Side & curtain airbag",
    "운전석 무릎 에어백":           "Driver knee airbag",
    "ABS":                          "ABS (Anti-lock Braking System)",
    "ESP(전동식 파워스티어링)":      "ESP (Electronic Power Steering)",
    "매직 테일게이트 + 사각지대 경보 시스템(BSW)": "Magic tailgate + Blind Spot Warning (BSW)",

    # ── Прочее ────────────────────────────────────────────────────────────────
    "무선시동 리모컨키(A/T 선택시)": "Remote start key (for automatic)",
    "핸즈프리":                     "Hands-free",
    "LED 도어 스팟 램프":           "LED door spot lamp",
    "14인치 알로이 휠":             "14-inch alloy wheels",
    "에어컨 & 콤비필터":            "A/C & combination filter",
    "ETCS(하이패스) & ECM 룸미러":  "ETCS (Hi-Pass) & ECM mirror",
    "하이패스 시스템(ETCS + ECM 룸미러)": "Hi-Pass system (ETCS + ECM mirror)",
    "FULL LED 헤드램프":            "Full LED headlamps",
    "4단 자동변속기 & 후드 인슐레이션": "4-speed automatic & hood insulation",

    # ── Модели ───────────────────────────────────────────────────────────
    "싼타페": "Santa Fe",
    "쏘렌토": "Sorento",
    "스포티지": "Sportage",
    "그랜저": "Grandeur",
    "아반떼": "Avante (Elantra)",
    "코나": "Kona",
    "팰리세이드": "Palisade",
    "렉스턴": "Rexton",
    "코란도": "Korando",
    "티볼리": "Tivoli",
    "카니발": "Carnival",
    "봉고": "Bongo",
    "스타리아": "Staria",
    

}


# ── Словарь уникальных опций ──────────────────────────────────────────────────
# Машинный перевод плохо справляется с автомобильными брендовыми названиями.
# Этот словарь покрывает самые частые опции — остальное уходит в LibreTranslate.

UNIQUE_OPTIONS_MAP = {
    # Крыши
    "파노라마 선루프":          "Panoramic Sunroof",
    "세이프티 선루프":           "Safety Sunroof",
    "와이드 선루프":             "Wide Sunroof",
    "솔라루프":                 "Solar Roof",
    "비전루프":                  "Vision Roof",

    # Пакеты помощи водителю
    "드라이브 와이즈":           "Drive Wise (ADAS Package)",
    "드라이빙 어시스턴스 패키지 Ⅰ":  "Driving Assistance Package I",
    "드라이빙 어시스턴스 패키지 I":   "Driving Assistance Package I",
    "드라이빙 어시스턴스 패키지 II":  "Driving Assistance Package II",
    "드라이빙 어시스턴스 패키지 Ⅱ":  "Driving Assistance Package II",
    "드라이빙 어시스턴스 패키지":     "Driving Assistance Package",
    "주행 보조 시스템 팩":        "Driver Assistance System Pack",

    # Удобства
    "컨비니언스 패키지":          "Convenience Package",
    "컴포트 패키지":             "Comfort Package",
    "컴포트":                   "Comfort Package",
    "2열 컴포트 패키지 I":        "2nd Row Comfort Package I",
    "2열 컴포트 패키지 II":       "2nd Row Comfort Package II",
    "뒷좌석 VIP 패키지":          "Rear VIP Package",
    "딥 컨트롤 패키지":           "Deep Control Package",

    # Технологии / HUD / навигация
    "헤드업 디스플레이":          "Head-Up Display (HUD)",
    "하이테크 패키지":            "Hi-Tech Package",
    "빌트인 캠 패키지":           "Built-in Cam Package",
    "스마트 커넥트":             "Smart Connect",
    "8인치 스마트 i 내비게이션":   "8-inch Smart i Navigation",
    "9인치 HD 스마트 미러링 내비게이션": "9-inch HD Smart Mirroring Navigation",
    "8인치 스마트 미러링 패키지":   "8-inch Smart Mirroring Package",
    "7인치 멀티 내비게이션":       "7-inch Multi Navigation",

    # Звук
    "렉시콘 사운드 패키지":        "Lexicon Sound Package",
    "KRELL 프리미엄 사운드":       "KRELL Premium Sound",
    "뱅앤올룹슨 사운드 패키지":    "Bang & Olufsen Sound Package",

    # Подвеска
    "프리뷰 전자제어 서스펜션":    "Preview Electronic Control Suspension",
    "멀티 챔버 에어 서스펜션":     "Multi-Chamber Air Suspension",
    "전자제어 서스펜션":          "Electronic Control Suspension (ECS)",

    # Дизайн / интерьер
    "시그니쳐 디자인 셀렉션 I":    "Signature Design Selection I",
    "시그니쳐 디자인 셀렉션 II":   "Signature Design Selection II",
    "스포츠 패키지":             "Sports Package",
    "파퓰러 패키지":             "Popular Package",
    "파퓰러 컬렉션 패키지":       "Popular Collection Package",
    "투톤 익스테리어 패키지":      "Two-Tone Exterior Package",
    "K-LOOK 스포티 인테리어 팩":   "K-LOOK Sporty Interior Pack",

    # Цвета / колёса
    "스노우 화이트 펄 (SWP)":     "Snow White Pearl (SWP)",
    "스노우 화이트 펄":           "Snow White Pearl",
    "클라우드 펄 외장 컬러":       "Cloud Pearl Exterior Color",
    "White Pearl(백진주색)":      "White Pearl",
    "백진주색":                  "White Pearl",
    "14인치 알로이 휠":           "14-inch Alloy Wheels",

    # Сиденья / мониторы
    "프리미엄 나파(NAPA) 가죽시트": "Premium Nappa Leather Seats",
    "천연 가죽시트":             "Natural Leather Seats",
    "뒷좌석 듀얼 모니터":         "Rear Dual Monitor",

    # Безопасность
    "커튼 에어백":               "Curtain Airbag",
    "사이드 & 커튼 에어백":       "Side & Curtain Airbag",
    "운전석 무릎 에어백":         "Driver Knee Airbag",
    "ESP(전동식 파워스티어링)":    "ESP (Electronic Power Steering)",
    "ABS":                      "ABS",

    # Трансмиссия / прочее
    "4단 자동변속기 & 후드 인슐레이션": "4-Speed Automatic & Hood Insulation",
    "7인승":                     "7-Seat Configuration",
    "6인승":                     "6-Seat Configuration",
    "핸즈프리":                  "Hands-Free",
    "스타일":                    "Style Package",
    "무선시동 리모컨키(A/T 선택시)": "Remote Start Key (A/T only)",
    "LED 도어 스팟 램프":          "LED Door Spot Lamp",
    "매직 테일게이트 + 사각지대 경보 시스템(BSW)": "Magic Tailgate + Blind Spot Warning (BSW)",
    "ETCS(하이패스) & ECM 룸미러": "ETCS (Hi-Pass) & ECM Mirror",
    "하이패스 시스템(ETCS + ECM 룸미러)": "Hi-Pass System (ETCS + ECM Mirror)",
    "에어컨 & 콤비필터":          "Air Conditioner & Combi Filter",
    "FULL LED 헤드램프":          "Full LED Headlamps",
    
    ######################################################
    "싼타페": "Santa Fe",
    "쏘렌토": "Sorento",
    "스포티지": "Sportage",
    "그랜저": "Grandeur",
    "아반떼": "Avante (Elantra)",
    "코나": "Kona",
    "팰리세이드": "Palisade",
    "렉스턴": "Rexton",
    "코란도": "Korando",
    "티볼리": "Tivoli",
    "카니발": "Carnival",
    "봉고": "Bongo",
    "스타리아": "Staria",
}


def translate_option(name: str) -> str | None:
    """
    Переводим название опции через словарь.
    Возвращает None если опция не найдена — тогда нужен машинный перевод.
    """
    return UNIQUE_OPTIONS_MAP.get(name)


# ── LibreTranslate ─────────────────────────────────────────────────────────────

LIBRETRANSLATE_URL = "http://localhost:5000/translate"
CACHE_FILE         = Path("translation_cache.json")


class Translator:
    """
    Переводчик через локальный LibreTranslate с персистентным кэшем.

    Установка LibreTranslate:
        pip install libretranslate
        libretranslate --load-only ko,en

    Кэш сохраняется в translation_cache.json — при повторных запусках
    уже переведённые строки не запрашиваются снова.
    """

    def __init__(
        self,
        session:    aiohttp.ClientSession,
        url:        str  = LIBRETRANSLATE_URL,
        cache_file: Path = CACHE_FILE,
    ):
        self._session    = session
        self._url        = url
        self._cache_file = cache_file
        self._cache: dict = self._load_cache()
        self._lock        = asyncio.Lock()
        self._available   = True   # становится False если сервер недоступен

    def _load_cache(self) -> dict:
        if self._cache_file.exists():
            try:
                return json.loads(self._cache_file.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {}

    def _save_cache(self):
        try:
            self._cache_file.write_text(
                json.dumps(self._cache, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            log.warning(f"Не удалось сохранить кэш: {e}")

    async def check_available(self) -> bool:
        """Проверяем что LibreTranslate запущен."""
        try:
            async with self._session.get(
                self._url.replace("/translate", "/languages"),
                timeout=aiohttp.ClientTimeout(total=3),
            ) as r:
                self._available = r.status == 200
        except Exception:
            self._available = False

        if not self._available:
            log.warning(
                "LibreTranslate недоступен на %s\n"
                "  Запустите: libretranslate --load-only ko,en\n"
                "  Данные будут сохранены на корейском.",
                self._url,
            )
        else:
            log.info("LibreTranslate подключён: %s", self._url)

        return self._available

    async def translate(self, text: str) -> str:
        """Переводим одну строку ko→en. Результат кэшируется."""
        if not text or not text.strip():
            return text

        # Если текст уже латиница — не переводим
        if all(ord(c) < 128 for c in text.replace(" ", "").replace("-", "")):
            return text

        # Сначала словарь — точный и мгновенный
        if text in UNIQUE_OPTIONS_MAP:
            return UNIQUE_OPTIONS_MAP[text]

        # Из кэша
        if text in self._cache:
            return self._cache[text]

        # Если сервер недоступен — возвращаем оригинал
        if not self._available:
            return text

        try:
            async with self._session.post(
                self._url,
                json={"q": text, "source": "ko", "target": "en", "format": "text"},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as r:
                if r.status == 200:
                    data  = await r.json(content_type=None)
                    translated = data.get("translatedText") or text
                else:
                    log.debug(f"LibreTranslate HTTP {r.status} для: {text}")
                    return text
        except Exception as e:
            log.debug(f"LibreTranslate ошибка: {e}")
            return text

        async with self._lock:
            self._cache[text] = translated
            self._save_cache()

        return translated

    async def translate_list(self, items: list[str]) -> list[str]:
        """
        Переводим список строк.
        LibreTranslate локальный — задержка не нужна, идём параллельно.
        """
        tasks = [self.translate(item) for item in items]
        return await asyncio.gather(*tasks)


# ── Словарь уникальных опций ───────────────────────────────────────────────────
# Приоритет над машинным переводом. Покрывает ~90% самых частых опций.
# Ключ — корейское название, значение — правильный английский перевод.

UNIQUE_OPTION_MAP = {
    # ── Sunroof ──────────────────────────────────────────────────────────────
    "파노라마 선루프": "Panoramic Sunroof",
    "세이프티 선루프": "Safety Sunroof",
    "와이드 선루프": "Wide Sunroof",
    "솔라루프": "Solar Roof",
    "비전루프": "Vision Roof",

    # ── Display / HUD ─────────────────────────────────────────────────────────
    "헤드업 디스플레이": "Head-Up Display (HUD)",
    "헤드업 디스플레이(HUD)": "Head-Up Display (HUD)",

    # ── Driver Assistance ─────────────────────────────────────────────────────
    "드라이브 와이즈": "Drive Wise (ADAS Package)",
    "드라이빙 어시스턴스 패키지 Ⅰ": "Driving Assistance Package I",
    "드라이빙 어시스턴스 패키지 I": "Driving Assistance Package I",
    "드라이빙 어시스턴스 패키지 II": "Driving Assistance Package II",
    "드라이빙 어시스턴스 패키지 Ⅱ": "Driving Assistance Package II",
    "드라이빙 어시스턴스 패키지": "Driving Assistance Package",
    "주행 보조 시스템 팩": "Driving Assistance System Pack",
    "프리뷰 전자제어 서스펜션": "Preview Electronic Control Suspension (ECS)",

    # ── Convenience / Comfort ─────────────────────────────────────────────────
    "컨비니언스 패키지": "Convenience Package",
    "컴포트 패키지": "Comfort Package",
    "컴포트 패키지 I": "Comfort Package I",
    "컴포트 패키지 II": "Comfort Package II",
    "컴포트": "Comfort Package",
    "2열 컴포트 패키지 I": "2nd Row Comfort Package I",
    "2열 컴포트 패키지 II": "2nd Row Comfort Package II",
    "뒷좌석 VIP 패키지": "Rear VIP Package",
    "뒷좌석 듀얼 모니터": "Rear Dual Monitor",
    "딥 컨트롤 패키지": "Deep Control Package",

    # ── Sound ─────────────────────────────────────────────────────────────────
    "렉시콘 사운드 패키지": "Lexicon Premium Sound Package",
    "KRELL 프리미엄 사운드": "KRELL Premium Sound System",
    "뱅앤올룹슨 사운드 패키지": "Bang & Olufsen Sound Package",

    # ── Camera / Safety ───────────────────────────────────────────────────────
    "빌트인 캠 패키지": "Built-in Dashcam Package",
    "매직 테일게이트 + 사각지대 경보 시스템(BSW)": "Magic Tailgate + Blind Spot Warning (BSW)",
    "커튼 에어백": "Curtain Airbag",
    "사이드 & 커튼 에어백": "Side & Curtain Airbag",
    "운전석 무릎 에어백": "Driver Knee Airbag",

    # ── Connectivity ──────────────────────────────────────────────────────────
    "스마트 커넥트": "Smart Connect",
    "핸즈프리": "Hands-Free",
    "무선시동 리모컨키(A/T 선택시)": "Remote Start Key (Auto Transmission)",

    # ── Tech Package ──────────────────────────────────────────────────────────
    "하이테크 패키지": "High-Tech Package",
    "파퓰러 패키지": "Popular Package",
    "파퓰러 컬렉션 패키지": "Popular Collection Package",
    "스포츠 패키지": "Sports Package",
    "투톤 익스테리어 패키지": "Two-Tone Exterior Package",

    # ── Seats ─────────────────────────────────────────────────────────────────
    "7인승": "7-Seat Configuration",
    "6인승": "6-Seat Configuration",
    "프리미엄 나파(NAPA) 가죽시트": "Premium Napa Leather Seats",
    "천연 가죽시트": "Natural Leather Seats",

    # ── Navigation ────────────────────────────────────────────────────────────
    "8인치 스마트 i 내비게이션": "8-inch Smart Navigation",
    "9인치 HD 스마트 미러링 내비게이션": "9-inch HD Smart Mirroring Navigation",
    "7인치 멀티 내비게이션": "7-inch Multi Navigation",
    "8인치 스마트 미러링 패키지": "8-inch Smart Mirroring Package",

    # ── Exterior Colors ───────────────────────────────────────────────────────
    "스노우 화이트 펄 (SWP)": "Snow White Pearl (SWP)",
    "스노우 화이트 펄": "Snow White Pearl",
    "클라우드 펄 외장 컬러": "Cloud Pearl Exterior Color",
    "White Pearl(백진주색)": "White Pearl",
    "백진주색": "White Pearl",

    # ── Design Selection (Genesis / Hyundai) ──────────────────────────────────
    "시그니쳐 디자인 셀렉션 I": "Signature Design Selection I",
    "시그니쳐 디자인 셀렉션 II": "Signature Design Selection II",
    "시그니쳐 디자인 셀렉션 III": "Signature Design Selection III",
    "스포츠 디자인 셀렉션 I": "Sport Design Selection I",
    "스포츠 디자인 셀렉션 II": "Sport Design Selection II",
    "스킬즈 디자인 셀렉션 I": "Skills Design Selection I",

    # ── Lighting ──────────────────────────────────────────────────────────────
    "FULL LED 헤드램프": "Full LED Headlamps",
    "LED 도어 스팟 램프": "LED Door Spot Lamp",

    # ── Misc ──────────────────────────────────────────────────────────────────
    "스타일": "Style Package",
    "ABS": "ABS (Anti-lock Braking System)",
    "ESP(전동식 파워스티어링)": "ESP (Electronic Power Steering)",
    "ETCS(하이패스) & ECM 룸미러": "ETCS (Hi-Pass) & ECM Auto-Dimming Mirror",
    "하이패스 시스템(ETCS + ECM 룸미러)": "Hi-Pass System (ETCS + ECM Mirror)",
    "14인치 알로이 휠": "14-inch Alloy Wheels",
    "에어컨 & 콤비필터": "Air Conditioning & Combination Filter",
    "K-LOOK 스포티 인테리어 팩": "K-Look Sporty Interior Pack",
}


def translate_option(name_ko: str) -> str:
    """
    Переводим название опции:
    1. Сначала ищем в словаре (точное совпадение)
    2. Если нет — возвращаем оригинал (LibreTranslate обработает позже)
    """
    return UNIQUE_OPTION_MAP.get(name_ko.strip(), None)
