# Delivery verification

Verified on 13 October 2026 using Java 17, Spring Boot 4.1.1 and a separate temporary PostgreSQL 16.15 database. No existing user database or synced project reference files were modified.

## Passed

- Maven `verify`: **9 tests, 0 failures, 0 errors**; executable Spring Boot JAR produced.
- Eight commerce integration tests plus the original application context test. Coverage includes real JWT login, fixed CUSTOMER registration, role restrictions, ownership checks, stock transactions and rollback, retry keys and concurrent retries, delivery state transitions, historical prices, free delivery, disabled/role-changed accounts and inactive categories.
- All three Flyway migrations applied and Hibernate schema validation passed against actual PostgreSQL.
- HTTP smoke test against PostgreSQL: registration/login, search, role denial, checkout, repeated request returning the same order, stock deducted once, rider assignment and completion of all delivery states.
- Browser: customer sign-in, search, bag quantity changes, checkout and persisted order; admin sign-in, picking, assignment, packing and product creation; rider sign-in, acceptance, pickup and delivered confirmation.
- Browser-created product verified in PostgreSQL and archived using the admin API.
- Shopping layout checked at 1280px and 390px widths. At 390px, document width and scroll width were both 390px (no horizontal page overflow).
- JavaScript syntax check; all 16 SVG files parse as XML; Mac shell scripts pass syntax checks; Docker Compose configuration validates.

## Verification limits

- Docker Desktop was not running, so a complete Docker image/Compose startup was not executed. The equivalent Java application, migration and API paths were tested locally; the Dockerfile uses the verified Maven build command.
- Render configuration was prepared but not applied to a hosting account. No live URL has been provisioned, no hosting plan purchased, and no public deployment claimed.
- Existing-database baseline migration is documented, but cannot be verified against the user's original database because only its backend source ZIP was supplied.
- H2 concurrency tests and the PostgreSQL smoke test are functional checks, not a production load test. Payments, actual GPS, native mobile packages and real fulfilment are outside the implemented simulation.

Preview screenshots are available alongside the project in `artifacts/` in this workspace. They are omitted from the source ZIP and Git by default.
