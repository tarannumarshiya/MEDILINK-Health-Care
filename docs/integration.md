# integration Suite Report

**Generated:** 2026-08-10T13:45:27.029Z

| Total | Passed | Failed | Pending | Skipped |
|---|---|---|---|---|
| 14 | 14 | 0 | 0 | 0 |

## C:/Users/DELL/Downloads/Medi link Testing/tests/integration/episodes.test.ts

> **Duration:** n/as — passed

- `PASS` Episode 1 — doctor consultation, prescription, auto-invoice and payment moves a booked appointment through consult → prescription → invoice → paid
- `PASS` Episode 1 — doctor consultation, prescription, auto-invoice and payment rejects a payment amount that does not match the invoice (422)
- `PASS` Episode 1 — doctor consultation, prescription, auto-invoice and payment requires a DOCTOR role for prescription endpoints
- `PASS` Episode 1 — doctor consultation, prescription, auto-invoice and payment leaves an audit trail for consultation actions
- `PASS` Episode 2 — lab collection, report upload and verification collects a sample, uploads a report and links it to the appointment
- `PASS` Episode 2 — lab collection, report upload and verification verifies a lab report and marks the test VERIFIED
- `PASS` Episode 2 — lab collection, report upload and verification rejects an invalid lab status transition value
- `PASS` Episode 2 — lab collection, report upload and verification requires a LAB role for lab endpoints
- `PASS` Episode 3 — public pharmacy order placed, priced server-side and paid computes order price server-side from the medicines catalog
- `PASS` Episode 3 — public pharmacy order placed, priced server-side and paid rejects a client-supplied price override by looking up authoritative price
- `PASS` Episode 3 — public pharmacy order placed, priced server-side and paid rejects an unavailable medicine
- `PASS` Episode 3 — public pharmacy order placed, priced server-side and paid tracks an order back from a public reference
- `PASS` Episode 3 — public pharmacy order placed, priced server-side and paid pays for an order and confirms it via the pharmacy_order payment purpose
- `PASS` Cross-route access guards blocks a patient from doctor queue, lab queue and admin routes (403)

