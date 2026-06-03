"""
python probe_model_years.py
Ищем API который возвращает годы производства для поколений.
"""
import urllib.request, json
from urllib.parse import quote

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
            return r.status, json.loads(r.read())
    except urllib.request.HTTPError as e:
        body = b""
        try: body = e.read(300)
        except: pass
        return e.code, body.decode(errors="replace")
    except Exception as e:
        return 0, str(e)

# BMW 3 Series: manufacturerCd=012, modelGroupCd=003, modelCd=066 (G20)
# Из пробы ранее: manufacturerCd=012, modelCd=066 для X5 G05

# 1. Пробуем category API который видели в DevTools
print("=== category API ===")
tests = [
    "https://api.encar.com/v1/readside/category?manufacturerCd=012&modelCd=066",
    "https://api.encar.com/v1/readside/category/model?manufacturerCd=012",
    "https://api.encar.com/v1/readside/category/grade?manufacturerCd=012&modelCd=066",
    # fem API
    "https://fem.encar.com/api/category?manufacturerCd=012&modelCd=066",
    # www API
    "https://www.encar.com/dc/dc_carsearchlist.do?carType=for&method=getModelList&manufacturerCd=012",
]

for url in tests:
    status, data = get(url, HEADERS_FEM)
    short = url.replace("https://", "").split("/", 1)[-1][:70]
    if status == 200:
        keys = list(data.keys()) if isinstance(data, dict) else f"list[{len(data)}]"
        print(f"✅ {short}")
        print(f"   {json.dumps(data, ensure_ascii=False)[:300]}")
    else:
        print(f"❌ {status} {short}")

# 2. Смотрим что возвращает category из DevTools (видели его раньше)
print("\n=== category?manufacturerCd=012&modelCd=066 (из DevTools) ===")
status, data = get(
    "https://api.encar.com/v1/readside/category?manufacturerCd=012&modelCd=066",
    HEADERS_FEM
)
print(f"HTTP {status}")
print(json.dumps(data, ensure_ascii=False, indent=2) if isinstance(data, (dict,list)) else data[:300])

# 3. Пробуем через iNav — там были поля Price.Min/Max по годам
print("\n=== iNav с фильтром по модели ===")
status, data = get(
    f"https://api.encar.com/search/car/list/general?count=true"
    f"&q=(And.Hidden.N._.Manufacturer.BMW._.Model.{quote('3시리즈 (G20)')}.)"
    f"&inav=%7CMetadata%7CSort",
    HEADERS_WWW
)
if status == 200 and isinstance(data, dict):
    nodes = data.get("iNav", {}).get("Nodes", [])
    for node in nodes:
        if node.get("Name") == "Year":
            print(f"Year node: {json.dumps(node, ensure_ascii=False)[:500]}")
            break
    print(f"Count: {data.get('Count')}")
else:
    print(f"HTTP {status}: {str(data)[:200]}")

