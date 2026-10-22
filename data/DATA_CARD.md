# Synthetic sales history: data card

The training data has two synthetic datasets, used together (U-19). Every row in both is team-created synthetic data (PRD §6.1, compliance C-08), with no real sales, customers, suppliers or businesses.

| Dataset | SKUs | Days per SKU | Dates |
| --- | --- | --- | --- |
| Generated fixture: `sales_history.csv` | `DEMO-CUP-01` … `DEMO-SYR-05` | 168 | 2026-05-06 to 2026-10-20 |
| Team history: `estock_sales_daily_5sku_2020-01-01_to_2026-01-01.csv` | `SYN-001` … `SYN-005` | 2,193 | 2020-01-01 to 2026-01-01 |

## Generated fixture

`data/sales_history.csv` is produced by `data/generate_history.py`.

| Item | Value |
| --- | --- |
| Rows | 840 (5 SKUs × 168 days) |
| Dates | 2026-05-06 to 2026-10-20; the last day is the cutoff used by the landing-page fixture |
| Seed | 20261021 |
| SHA-256 | `1f844e0ef85670899f759e3dfdb1315d7d5324547f02c246cba8fd2e554d80ea` (file written with LF line endings) |
| Columns | PRD §6.3 history columns: `source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag` |
| Regenerate | `python data/generate_history.py` (Python 3.10 or newer, standard library only) |

### SKUs and patterns

Daily quantities are Poisson draws around each day's rate. Weekday factors, Monday to Sunday: 0.9, 0.9, 0.95, 1.0, 1.1, 1.3, 1.25.

| SKU | Suggested product name | Pattern | Daily rate |
| --- | --- | --- | --- |
| DEMO-CUP-01 | Paper cups | Weekday pattern, busier Friday to Sunday | 10 × weekday factor |
| DEMO-LID-02 | Cup lids | Weekday pattern | 9 × weekday factor |
| DEMO-NAP-03 | Napkins | Linear upward trend | 8 rising to 14 |
| DEMO-STR-04 | Straws | Stable, low volume | 4 |
| DEMO-SYR-05 | Syrup bottles | Slow and intermittent; 91 of 168 days have zero sales | 0.6 |

The generator writes SKUs only. Product names, units, suppliers and replenishment policies belong to the application fixture.

## Team history

Three files cover the same sales. Only the daily file is used for training; the weekly and monthly files are totals of it, and the per-SKU totals match across all three.

| File | Rows | SHA-256 |
| --- | --- | --- |
| `estock_sales_daily_5sku_2020-01-01_to_2026-01-01.csv` | 10,965 | `cde5b8da146517ada8ccdb64d05f23019313a4b87b3b90527f373a6f244f16ed` |
| `estock_sales_weekly_5sku_2020-01-01_to_2026-01-01.csv` | 1,570 | `482858dc328f00bee7779a62f3e3331f540f0449cec6bb849dbe7f9af7c08bf1` |
| `estock_sales_monthly_5sku_2020-01-01_to_2026-01-01.csv` | 365 | `6939dae2741abbc94b9c9a45ede6537f4e0f259d9d753538b56358789bbe6357` |

The daily file uses the PRD §6.3 columns. A profile on 21 October 2026 found no date gaps, no duplicate records, every day complete and no stockout flags. Sales peak on Fridays and Saturdays, single days spike well above the mean (up to 75 units for `SYN-001`, whose mean is about 13), trends are mild, and `SYN-003` is intermittent with 462 zero-sale days.

**Provenance: pending.** A teammate on the app track provided these files and will record the generator, seed and author here and in the tools declaration before submission.

## Evaluation split (PRD §8.4)

Offsets count back from each series' own last day, so series of different lengths and end dates are evaluated together. Validation forecasts start 110 and 96 days before the end, and the final test covers the last 44 days. Every forecast covers 44 days, the largest horizon the PRD allows. For the 168-day fixture this is exactly the PRD split: validation after days 58 (2026-07-02) and 72 (2026-07-16), test on days 125–168 (2026-09-07 to 2026-10-20). For the team history, the test covers 2025-11-19 to 2026-01-01.

## Limitations

- In both datasets every day is complete and no day is flagged as a stockout, so there is no censored demand.
- The two datasets end on different dates (2026-01-01 and 2026-10-20). The application's demo clock must match whichever dataset a screen uses.
- There are no promotions, holidays or one-off events.
- Poisson noise around a smooth rate is simpler than real store sales.
- Accuracy on this data says nothing about real businesses (PRD §8.5). Report it as synthetic evaluation only.