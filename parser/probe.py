import asyncio

from encar_parser import EncarParser, HEADERS_DETAIL
##не рабочий
# VEHICLE_ID = 42196711
# VEHICLE_NO = "188다1859"

##рабочий
VEHICLE_ID = 42194740
VEHICLE_NO = "188다1859"

async def main():
    parser = EncarParser(
        concurrency=1,
        delay_min=0,
        delay_max=0,
        translate=False,
    )

    try:
        await parser._get_session()
        url = (
            f"https://api.encar.com/v1/readside/record/vehicle/"
            f"{VEHICLE_ID}/open?vehicleNo={VEHICLE_NO}"
        )

        print("URL =", url)

        async with parser._session.get(
            url,
            headers=HEADERS_DETAIL,
        ) as r:

            print("STATUS =", r.status)

            text = await r.text()

            print(text[:5000])

    finally:
        await parser.close()


asyncio.run(main())