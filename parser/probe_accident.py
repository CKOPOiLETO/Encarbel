import urllib.request, json
from urllib.parse import quote

HEADERS = {
    "accept": "*/*",
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
        body = b""
        try: body = e.read(500)
        except: pass
        return e.code, body.decode(errors="replace")
    except Exception as e:
        return 0, str(e)

carid = 41819641

# Сначала получаем vehicleNo из vehicle
print("=== vehicle ===")
s, v = get(f"https://api.encar.com/v1/readside/vehicle/{carid}")
print(f"HTTP {s}")
if s == 200:
    vehicle_no = v.get("vehicleNo") or ""
    vin        = v.get("vin") or ""
    print(f"vehicleNo: {vehicle_no}")
    print(f"vin:       {vin}")
    cond = v.get("condition", {})
    print(f"condition: {json.dumps(cond, ensure_ascii=False)}")

    # Пробуем record/open
    print(f"\n=== record/open с vehicleNo={vehicle_no} ===")
    s2, d2 = get(f"https://api.encar.com/v1/readside/record/vehicle/{carid}/open?vehicleNo={quote(vehicle_no)}")
    print(f"HTTP {s2}")
    print(json.dumps(d2, ensure_ascii=False, indent=2) if isinstance(d2, (dict,list)) else d2[:300])

    # Пробуем с VIN
    if vin:
        print(f"\n=== record/open с vin={vin} ===")
        s3, d3 = get(f"https://api.encar.com/v1/readside/record/vehicle/{carid}/open?vehicleNo={quote(vin)}")
        print(f"HTTP {s3}")
        print(json.dumps(d3, ensure_ascii=False, indent=2) if isinstance(d3, (dict,list)) else d3[:200])

    # Пробуем другие варианты endpoint
    print(f"\n=== Другие варианты ===")
    for url in [
        f"https://api.encar.com/v1/readside/record/vehicle/{carid}/open",
        f"https://api.encar.com/v1/readside/accident/vehicle/{carid}",
        f"https://api.encar.com/v1/vehicle/resume/{carid}",
    ]:
        s4, d4 = get(url)
        short = url.replace("https://api.encar.com", "")
        if s4 == 200:
            print(f"✅ {short}")
            print(f"   {json.dumps(d4, ensure_ascii=False)[:200]}")
        else:
            print(f"❌ {s4} {short}")

