from datetime import date, timedelta
from pathlib import Path
import hashlib
import random
import math
import csv


SEED = 20261021

HISTORY_DAYS = 168

CUTOFF_DATE = date(2026, 10, 20)

OUTPUT_PATH = Path(__file__).with_name("sales_history.csv")

WEEKDAY_FACTORS = (0.9, 0.9, 0.95, 1.0, 1.1, 1.3, 1.25)

PRODUCTS = (
    ("DEMO-CUP-01", 10.0, 10.0, True),
    ("DEMO-LID-02", 9.0, 9.0, True),
    ("DEMO-NAP-03", 8.0, 14.0, False),
    ("DEMO-STR-04", 4.0, 4.0, False),
    ("DEMO-SYR-05", 0.6, 0.6, False)
)



######## SYNTHETIC SALES ########

def samplePoisson(rng, rate):
    limit = math.exp(-rate)
    count = 0
    product = rng.random()
    while product > limit:
        count += 1
        product *= rng.random()

    return count


def generateRows():
    rng = random.Random(SEED)
    startDate = CUTOFF_DATE - timedelta(days=HISTORY_DAYS - 1)

    rows = []
    for sku, startRate, endRate, weekly in PRODUCTS:
        for day in range(HISTORY_DAYS):
            businessDate = startDate + timedelta(days=day)
            rate = startRate + (endRate - startRate) * day / (HISTORY_DAYS - 1)
            if weekly:
                rate *= WEEKDAY_FACTORS[businessDate.weekday()]

            rows.append(
                {
                    "source_record_id": f"SYN-{sku}-{businessDate.isoformat()}",
                    "sku": sku,
                    "business_date": businessDate.isoformat(),
                    "quantity_sold": samplePoisson(rng, rate),
                    "data_complete": "true",
                    "stockout_flag": "false"
                }
            )

    return rows



######## OUTPUT ########

def writeCsv(rows):
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    return hashlib.sha256(OUTPUT_PATH.read_bytes()).hexdigest()


if __name__ == "__main__":
    rows = generateRows()
    digest = writeCsv(rows)
    print(f"Wrote {len(rows)} rows to {OUTPUT_PATH.name} (seed {SEED}, sha256 {digest})")