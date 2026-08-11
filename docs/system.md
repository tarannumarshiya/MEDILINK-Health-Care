# system Suite Report

**Generated:** 2026-08-10T13:45:30.634Z

| Total | Passed | Failed | Pending | Skipped |
|---|---|---|---|---|
| 5 | 5 | 0 | 0 | 0 |

## C:/Users/DELL/Downloads/Medi link Testing/tests/system/config.test.ts

> **Duration:** n/as — passed

- `PASS` System — startup configuration is fail-closed boots in mock mode only when DEMO_MODE=true and not production
- `PASS` System — startup configuration is fail-closed refuses mock mode in production even with DEMO_MODE=true
- `PASS` System — startup configuration is fail-closed refuses mock mode without DEMO_MODE=true
- `PASS` System — startup configuration is fail-closed fails closed (no silent mock) when PAYMENT_MODE is unset
- `PASS` System — startup configuration is fail-closed accepts razorpay mode and requires razorpay keys at startup

