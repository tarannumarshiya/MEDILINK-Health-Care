# functional Suite Report

**Generated:** 2026-08-10T13:45:23.578Z

| Total | Passed | Failed | Pending | Skipped |
|---|---|---|---|---|
| 45 | 45 | 0 | 0 | 0 |

## C:/Users/DELL/Downloads/Medi link Testing/tests/functional/appointments.test.ts

> **Duration:** n/as — passed

- `PASS` POST /api/appointments/create — positive scenarios books a valid appointment successfully
- `PASS` POST /api/appointments/create — positive scenarios creates a new patient record for a first-time caller
- `PASS` POST /api/appointments/create — positive scenarios reuses an existing patient matched by phone (no duplicate row)
- `PASS` POST /api/appointments/create — positive scenarios reuses an existing patient matched by email
- `PASS` POST /api/appointments/create — positive scenarios creates a telemedicine session when booking the Telemedicine department
- `PASS` POST /api/appointments/create — negative scenarios rejects missing required fields
- `PASS` POST /api/appointments/create — negative scenarios rejects a name containing HTML/script characters
- `PASS` POST /api/appointments/create — negative scenarios rejects a phone that is too short
- `PASS` POST /api/appointments/create — negative scenarios rejects a phone that is too long
- `PASS` POST /api/appointments/create — negative scenarios rejects a non-numeric phone
- `PASS` POST /api/appointments/create — negative scenarios rejects an unparseable date
- `PASS` POST /api/appointments/create — negative scenarios rejects a past preferred date
- `PASS` POST /api/appointments/create — negative scenarios rejects a malformed time (non HH:MM)
- `PASS` POST /api/appointments/create — negative scenarios rejects a nonexistent department
- `PASS` POST /api/appointments/create — negative scenarios rejects GET requests on the create route (405)
- `PASS` POST /api/appointments/track — public appointment status returns the minimal public fields for a valid code
- `PASS` POST /api/appointments/track — public appointment status never leaks PII, symptoms, prescriptions or lab URLs
- `PASS` POST /api/appointments/track — public appointment status rejects a blank reference
- `PASS` POST /api/appointments/track — public appointment status returns 404 for an unknown appointment code
- `PASS` POST /api/appointments/track — public appointment status does not allow lookup by phone (anti-enumeration)
- `PASS` POST /api/appointments/:id/consent — ownership & permissions returns 401 when unauthenticated
- `PASS` POST /api/appointments/:id/consent — ownership & permissions allows the owner patient to accept and advances the status
- `PASS` POST /api/appointments/:id/consent — ownership & permissions routes to LAB_REQUESTED when the appointment requires lab
- `PASS` POST /api/appointments/:id/consent — ownership & permissions blocks a patient consenting to another patient's appointment (403)
- `PASS` POST /api/appointments/:id/consent — ownership & permissions rejects consent on an appointment that is not pending approval
- `PASS` POST /api/appointments/:id/consent — ownership & permissions requests a staff PIN from staff consenting on a patient's behalf
- `PASS` POST /api/appointments/:id/consent — ownership & permissions rejects a staff member with a wrong PIN
- `PASS` POST /api/appointments/:id/consent — ownership & permissions accepts staff with the correct PIN
- `PASS` POST /api/appointments/:id/consent — ownership & permissions rejects an inactive staff member (403)
- `PASS` POST /api/appointments/:id/consent — ownership & permissions records an audit log entry for each consent action
- `PASS` POST /api/appointments/:id/consent — ownership & permissions declines consent, completes the appointment and cancels lab/prescriptions

## C:/Users/DELL/Downloads/Medi link Testing/tests/functional/core-flows.test.ts

> **Duration:** n/as — passed

- `PASS` POST /api/contact — public contact form submits a valid message
- `PASS` POST /api/contact — public contact form rejects missing message body
- `PASS` POST /api/contact — public contact form rejects a missing subject
- `PASS` POST /api/contact — public contact form rejects invalid email format
- `PASS` POST /api/contact — public contact form stores the message with NEW status for staff review
- `PASS` POST /api/contact — public contact form does not expose GET on the contact route
- `PASS` POST /api/patients/register — public patient registration registers a new patient with a generated code
- `PASS` POST /api/patients/register — public patient registration rejects missing name/age/phone
- `PASS` POST /api/patients/register — public patient registration rejects an HTML-injected name
- `PASS` POST /api/patients/register — public patient registration rejects a short phone
- `PASS` POST /api/patients/register — public patient registration rejects a non-numeric phone
- `PASS` POST /api/patients/register — public patient registration rejects a non-integer age
- `PASS` POST /api/patients/register — public patient registration rejects an out-of-range age
- `PASS` POST /api/patients/register — public patient registration method not allowed on GET

