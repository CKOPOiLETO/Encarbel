import urllib.request
import json
from urllib.parse import quote

# ВПИШИ СЮДА ID ПРОБЛЕМНОЙ МАШИНЫ
CAR_ID = 42125652

HEADERS = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "ko-KR,ko;q=0.9",
    "origin": "https://fem.encar.com",
    "referer": "https://fem.encar.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.request.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except: return e.code, str(e.read())
    except Exception as e:
        return 0, str(e)

print(f"🔎 ИССЛЕДУЕМ МАШИНУ: {CAR_ID}")

# 1. Получаем номер машины (он может быть нужен для доступа к страховке)
s, v = get(f"https://api.encar.com/v1/readside/vehicle/{CAR_ID}")
vehicle_no = v.get("vehicleNo", "") if isinstance(v, dict) else ""
print(f"Гос. номер: {vehicle_no}")

# 2. Список эндпоинтов для проверки
urls = [
    # 1. То, как мы делаем сейчас
    f"https://api.encar.com/v1/readside/record/vehicle/{CAR_ID}/open",
    
    # 2. То, как делали раньше (с передачей номера)
    f"https://api.encar.com/v1/readside/record/vehicle/{CAR_ID}/open?vehicleNo={quote(vehicle_no)}",
    
    # 3. Закрытый эндпоинт (без /open)
    f"https://api.encar.com/v1/readside/record/vehicle/{CAR_ID}",
    
    # 4. Эндпоинт производительности (иногда страховки прячут туда)
    f"https://api.encar.com/v1/readside/inspection/vehicle/{CAR_ID}"
]

for url in urls:
    print(f"\n🌐 GET {url.replace('https://api.encar.com', '')}")
    status, data = get(url)
    print(f"HTTP {status}")
    
    if isinstance(data, dict):
        keys = list(data.keys())
        print(f"Ключи: {keys}")
        if "openData" in data:
            print(f"openData: {data['openData']}")
        if "myAccidentCnt" in data:
            print(f"Аварий (своя вина): {data['myAccidentCnt']}")
        if "accidentCnt" in data:
            print(f"Всего аварий: {data['accidentCnt']}")
        if "accidents" in data and isinstance(data["accidents"], list):
            print(f"Массив accidents: {len(data['accidents'])} шт.")
    else:
        print("Ответ не является JSON словарем.")