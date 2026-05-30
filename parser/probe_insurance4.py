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

carid    = 41861691
vehicleNo = "131루8394"  # из URL (декодированный)

print(f"=== valid ===")
s, d = get(f"https://api.encar.com/v1/vehicle/resume/valid?vehicleNo={quote(vehicleNo)}")
print(f"HTTP {s}")
print(json.dumps(d, ensure_ascii=False, indent=2) if isinstance(d, (dict,list)) else d)

print(f"\n=== open (страховая история) ===")
s, d = get(f"https://api.encar.com/v1/readside/record/vehicle/{carid}/open?vehicleNo={quote(vehicleNo)}")
print(f"HTTP {s}")
print(json.dumps(d, ensure_ascii=False, indent=2) if isinstance(d, (dict,list)) else d[:500])

