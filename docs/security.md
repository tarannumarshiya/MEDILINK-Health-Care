# security Suite Report

**Generated:** 2026-08-10T13:45:22.148Z

| Total | Passed | Failed |
|---|---|---|
| 23 | 23 | 0 |

## — Medicine Reminder API

| Status | Test |
|---|---|
| PASS | `GET / unauthenticated returns 401` |
| PASS | `GET / patient A sees only their own reminders` |
| PASS | `GET / patient B cannot read patient A's reminders` |
| PASS | `POST / unauthenticated still works (public pharmacy flow)` |
| PASS | `POST / cannot attach another user's profile via body` |
| PASS | `PUT /:id unauthenticated returns 401` |
| PASS | `PUT /:id cross-patient (A on B's) returns 403 (IDOR)` |
| PASS | `PUT /:id on an unowned anonymous reminder returns 403` |
| PASS | `PUT /:id on own reminder returns 200` |
| PASS | `DELETE /:id unauthenticated returns 401` |
| PASS | `DELETE /:id cross-patient (B on A's) returns 403 (IDOR)` |
| PASS | `DELETE /:id own reminder returns 200` |

## Public appointment tracking

| Status | Test |
|---|---|
| PASS | `track returns only the allowed minimal fields` |
| PASS | `track never leaks prescription/lab/PII` |
| PASS | `track without reference returns 400` |
| PASS | `track by phone number returns 404 (prevents enumeration)` |

## Consent workflow

| Status | Test |
|---|---|
| PASS | `consent unauthenticated returns 401` |
| PASS | `cross-patient consent (B on A's) returns 403` |
| PASS | `owner consent returns 200, simulated flag + audit entry` |
| PASS | `active staff consent without PIN returns 400` |
| PASS | `active staff consent with wrong PIN returns 403` |
| PASS | `active staff consent with correct PIN returns 200 simulated` |
| PASS | `inactive staff consent is rejected with 403` |

