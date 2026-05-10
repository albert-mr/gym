# Hong Kong Observatory — 10-market validation (May 7)

**Summary:** 10 tested · ✅ 0 · ⚠ 10 · ✗ 0

All 10 markets bind to the same URL: `https://www.weather.gov.hk/en/cis/climat.htm`. The webdriver renders the page reliably (HTTP 200, ~5.5 KB), but this URL is the **Climatological Information Services index/portal**, not the Daily Extract data table. It exposes May 2026 month-to-date aggregates ("up to 7 May") but NO per-day row with the May 7 absolute min/max. The actual daily values live behind the "Daily Extract" link (separate URL). Verdict ⚠ for all: rendered fine, but the specific May 7 daily entry needed for resolution is not on this page.

| # | market_id | question (truncated) | URL probed | HTTP | bytes | May 7 daily row? | verdict |
|---|-----------|----------------------|------------|------|-------|------------------|---------|
| 1 | 2161781 | Lowest HK temp ≥ 28°C on May 7? | climat.htm | 200 | 5520 | no (only "up to 7 May" aggregate) | ⚠ |
| 2 | 2161780 | Lowest HK temp = 27°C on May 7? | climat.htm | 304 | 5520 | no | ⚠ |
| 3 | 2161771 | Lowest HK temp ≤ 18°C on May 7? | climat.htm | 200 | 5520 | no | ⚠ |
| 4 | 2161772 | Lowest HK temp = 19°C on May 7? | climat.htm | 200 | 5520 | no | ⚠ |
| 5 | 2161773 | Lowest HK temp = 20°C on May 7? | climat.htm | 304 | 5520 | no | ⚠ |
| 6 | 2161774 | Lowest HK temp = 21°C on May 7? | climat.htm | 200 | 5520 | no | ⚠ |
| 7 | 2161775 | Lowest HK temp = 22°C on May 7? | climat.htm | 200 | 5520 | no | ⚠ |
| 8 | 2161776 | Lowest HK temp = 23°C on May 7? | climat.htm | 304 | 5520 | no | ⚠ |
| 9 | 2161777 | Lowest HK temp = 24°C on May 7? | climat.htm | 200 | 5520 | no | ⚠ |
| 10 | 2161778 | Lowest HK temp = 25°C on May 7? | climat.htm | 200 | 5520 | no | ⚠ |

Threshold values per market: 28+, 27, 18-, 19, 20, 21, 22, 23, 24, 25 °C (Absolute Daily Min).

## Sample evidence (rendered text excerpt, all 10 probes identical)

```
9 May 2026 (Sat)25.2°C92%(01:50)         <- current observation widget
May 2026
(up to 7 May)
Mean Max Temp     26.9°C
Mean Temp         24.1°C
Mean Min Temp     22.3°C
Monthly Rainfall  74.7mm
Daily Extract - May 2026                  <- link, not table
So Far This Year (up to 7 May)
Absolute Max Temp 30.2°C (16 Apr)
Absolute Min Temp 10.9°C (7 Jan)
```

Temperatures present on the page: month-to-date means (Max 26.9, Mean 24.1, Min 22.3) and year-to-date extremes — all "up to 7 May" — but no row showing May 7's specific Absolute Daily Min.

## Conclusion

The webdriver renders weather.gov.hk reliably and consistently (10/10 HTTP 200/304, identical 5520-byte payload), but the description URL is a portal page; resolving these markets requires a one-hop navigation into the "Daily Extract - May 2026" link to reach the per-day Absolute Daily Min/Max table.
