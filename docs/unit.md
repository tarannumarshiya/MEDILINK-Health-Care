# unit Suite Report

**Generated:** 2026-08-10T13:45:17.058Z

| Total | Passed | Failed | Pending | Skipped |
|---|---|---|---|---|
| 72 | 72 | 0 | 0 | 0 |

## C:/Users/DELL/Downloads/Medi link Testing/tests/unit/logic.test.ts

> **Duration:** n/as — passed

- `PASS` backend: ID generators patient code matches PAT-YYYY-XXXXXX
- `PASS` backend: ID generators appointment code matches APT-YYYY-XXXXXX
- `PASS` backend: ID generators invoice code matches INV-YYYY-XXXXXX
- `PASS` backend: ID generators codes are unique across calls (no collisions)
- `PASS` backend: role helpers hasRole returns true when role is allowed, false otherwise
- `PASS` backend: role helpers isAdmin true for every admin role, false for PATIENT/DOCTOR
- `PASS` backend: role helpers isStaff true for all staff roles, false for PATIENT
- `PASS` backend: role helpers all admin roles are a subset of staff roles
- `PASS` backend: role helpers role constants are non-empty unique strings
- `PASS` backend: error hierarchy AppError stores statusCode, isOperational and message
- `PASS` backend: error hierarchy each subclass carries the correct HTTP status
- `PASS` backend: error hierarchy instanceof works across the hierarchy (prototype chain intact)
- `PASS` backend: error hierarchy custom messages are forwarded
- `PASS` validateBDPhone (positive cases) accepts "01712345678"
- `PASS` validateBDPhone (positive cases) accepts "01312345678"
- `PASS` validateBDPhone (positive cases) accepts "01912345678"
- `PASS` validateBDPhone (positive cases) accepts "+8801712345678"
- `PASS` validateBDPhone (positive cases) accepts "8801712345678"
- `PASS` validateBDPhone (positive cases) accepts "+880 1712 345678"
- `PASS` validateBDPhone (positive cases) accepts "018-12345678"
- `PASS` validateBDPhone (positive cases) accepts "  01612345678  "
- `PASS` validateBDPhone (positive cases) accepts "01312345678"
- `PASS` validateBDPhone (positive cases) accepts "01412345678"
- `PASS` validateBDPhone (positive cases) accepts "01512345678"
- `PASS` validateBDPhone (negative cases) rejects ""
- `PASS` validateBDPhone (negative cases) rejects "0171234567"
- `PASS` validateBDPhone (negative cases) rejects "017123456789"
- `PASS` validateBDPhone (negative cases) rejects "01212345678"
- `PASS` validateBDPhone (negative cases) rejects "02012345678"
- `PASS` validateBDPhone (negative cases) rejects "91123456789"
- `PASS` validateBDPhone (negative cases) rejects "1712345678"
- `PASS` validateBDPhone (negative cases) rejects "phone"
- `PASS` validateBDPhone (negative cases) rejects "01712345a78"
- `PASS` validateBDPhone (negative cases) rejects "+88011712345678"
- `PASS` validateAppointmentForm returns empty error string for a valid form
- `PASS` validateAppointmentForm rejects a blank name
- `PASS` validateAppointmentForm rejects a one-character name
- `PASS` validateAppointmentForm rejects an invalid phone
- `PASS` validateAppointmentForm rejects age below 1
- `PASS` validateAppointmentForm rejects age above 120
- `PASS` validateAppointmentForm rejects non-numeric age
- `PASS` validateAppointmentForm rejects missing department
- `PASS` validateAppointmentForm rejects missing preferred date
- `PASS` validateAppointmentForm rejects a past date
- `PASS` validateContactForm accepts a valid contact form
- `PASS` validateContactForm accepts an empty phone
- `PASS` validateContactForm rejects an invalid email
- `PASS` validateContactForm rejects a short subject
- `PASS` validateContactForm rejects a short message
- `PASS` validateContactForm rejects an invalid optional phone
- `PASS` validateLoginForm accepts a valid email+password
- `PASS` validateLoginForm rejects a blank email
- `PASS` validateLoginForm rejects an invalid email
- `PASS` validateLoginForm rejects a missing password
- `PASS` validateLoginForm rejects a password under 6 chars
- `PASS` validateRegisterForm accepts a valid registration
- `PASS` validateRegisterForm rejects a name containing digits
- `PASS` validateRegisterForm rejects an over-long name
- `PASS` validateRegisterForm rejects an invalid email
- `PASS` validateRegisterForm rejects a bad phone
- `PASS` validateRegisterForm rejects out-of-range age
- `PASS` validateRegisterForm rejects missing gender
- `PASS` validateRegisterForm rejects a password shorter than 8
- `PASS` validateRegisterForm rejects a password without a number
- `PASS` frontend workflow data getWorkflow returns a workflow for known slugs
- `PASS` frontend workflow data getWorkflow returns undefined for an unknown slug
- `PASS` frontend workflow data every workflow has bookDept, steps and conditions
- `PASS` frontend workflow data deptSlugMap resolves a department name to a slug
- `PASS` frontend role labels every defined role has a human-readable label
- `PASS` frontend constants lists 12 departments incl. emergency and pharmacy
- `PASS` frontend constants exposes hospital info
- `PASS` frontend constants public navigation links all have hrefs starting with /

