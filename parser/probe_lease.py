"""
python probe_lease.py
Смотрим структуру данных для лизинговых авто.
"""
import urllib.request, json

HEADERS_WWW = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "ko-KR,ko;q=0.9",
    "origin": "https://www.encar.com",
    "referer": "https://www.encar.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}
HEADERS_FEM = {
    "accept": "*/*",
    "accept-language": "ko-KR,ko;q=0.9",
    "origin": "https://fem.encar.com",
    "referer": "https://fem.encar.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

def get(url, headers=HEADERS_FEM):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"ERROR: {e}")
        return None

# Ищем лизинговые авто через фильтр SellType=리스
print("=== Лизинговые авто (리스) ===")
from urllib.parse import quote
data = get(
    "https://api.encar.com/search/car/list/general?count=true"
    f"&q=(And.Hidden.N._.CarType.A._.SellType.{quote('리스')}.)"
    "&sr=%7CModifiedDate%7C0%7C3",
    HEADERS_WWW
)
results = (data or {}).get("SearchResults", [])
print(f"Найдено: {len(results)}\n")

for item in results[:2]:
    carid = item["Id"]
    print(f"--- car_id={carid} ---")
    print(f"SearchResult keys: {list(item.keys())}")
    
    v = get(f"https://api.encar.com/v1/readside/vehicle/{carid}")
    if not v:
        continue
    
    adv  = v.get("advertisement", {})
    spec = v.get("spec", {})
    cat  = v.get("category", {})
    prtn = v.get("partnership", {})
    
    print(f"\nadvertisement:")
    for k, val in adv.items():
        if val is not None and val != [] and val != {}:
            print(f"  {k}: {val}")
    
    print(f"\nspec.tradeType: {spec.get('tradeType')}")
    print(f"\npartnership.lease: {prtn.get('lease')}")
    print(f"partnership.rent:  {prtn.get('rent')}")
    print()

# Также проверим обычное авто для сравнения
print("\n=== Обычное авто для сравнения ===")
data2 = get(
    "https://api.encar.com/search/car/list/general?count=true"
    f"&q=(And.Hidden.N._.CarType.A._.SellType.{quote('일반')}.)"
    "&sr=%7CModifiedDate%7C0%7C1",
    HEADERS_WWW
)
results2 = (data2 or {}).get("SearchResults", [])
if results2:
    carid = results2[0]["Id"]
    v = get(f"https://api.encar.com/v1/readside/vehicle/{carid}")
    if v:
        adv  = v.get("advertisement", {})
        spec = v.get("spec", {})
        prtn = v.get("partnership", {})
        print(f"car_id={carid}")
        print(f"advertisement.price: {adv.get('price')}")
        print(f"spec.tradeType: {spec.get('tradeType')}")
        print(f"partnership.lease: {prtn.get('lease')}")
        print(f"partnership.rent:  {prtn.get('rent')}")

