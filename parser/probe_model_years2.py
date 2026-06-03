import urllib.request, json
from urllib.parse import quote

HEADERS_WWW = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "ko-KR,ko;q=0.9",
    "origin": "https://www.encar.com",
    "referer": "https://www.encar.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

def get(url):
    req = urllib.request.Request(url, headers=HEADERS_WWW)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except Exception as e:
        return 0, str(e)

# Точный URL из браузера — фильтр по BMW + 3시리즈
url = (
    "https://api.encar.com/search/car/list/general"
    "?count=false"
    f"&q=(And.Hidden.N._.(C.CarType.A._.Manufacturer.BMW._.Model.{quote('3시리즈.')}))"
    "&inav=%7CMetadata%7CSort"
)
status, data = get(url)
print(f"HTTP {status}\n")

if status == 200 and isinstance(data, dict):
    nodes = data.get("iNav", {}).get("Nodes", [])
    for node in nodes:
        name = node.get("Name")
        # Ищем узлы связанные с моделью/годом
        if name in ("Model", "Year", "Badge", "ModelYear"):
            print(f"=== Node: {name} ===")
            facets = node.get("Facets", [])
            for f in facets[:10]:
                print(f"  {f.get('DisplayValue')} | count={f.get('Count')} | action={f.get('Action','')[:60]}")
                meta = f.get("Metadata", {})
                if meta:
                    print(f"    metadata: {json.dumps(meta, ensure_ascii=False)[:150]}")
            print()

    # Также ищем узел с поколениями (Model содержит G20, E90 и т.д.)
    print("=== Все узлы iNav ===")
    for node in nodes:
        facets = node.get("Facets", [])
        print(f"  {node.get('Name')}: {len(facets)} facets, first={facets[0].get('DisplayValue') if facets else '-'}")

