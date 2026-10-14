# QIK — Good things. Right here.

A UK quick-commerce **simulation** built on your uploaded Java backend, with **React Native apps for iPhone and Android**: QIK for customers and QIK Rider for deliveries. The admin dashboard stays on the web. PostgreSQL persists accounts, stock and orders.

**Start with [MOBILE.md](MOBILE.md) to run the phone apps or build installation files.** The Docker steps below start the backend and admin dashboard.

This is a complete demo shopping and delivery workflow. It does not charge cards, dispatch real riders or promise actual arrival times. A public deployment remains a demo until the real-commerce work below is implemented.

## What is included

- Your original Spring Boot 4.1.1 / Java 17 project, PostgreSQL entities, BCrypt registration, HS256 JWT login, product/category endpoints, search and stock management.
- Customer: registration/sign-in, categories, search, local saved basket, quantity controls, UK address/postcode checkout, order history, status timeline and cancellation before picking.
- Admin: products and stock, archiving, category creation/editing/availability, customer/rider/admin accounts, role and access changes, order preparation and rider assignment.
- Rider: assigned deliveries, acceptance, pickup, delivery confirmation, completed deliveries and an illustrated simulated route.
- Original QIK vector artwork, cream/ink/lime design, animated bag illustration, add-to-bag feedback, hover motion, accessible dialogs, keyboard focus and reduced-motion support.
- Transactional stock reservation; server-side GBP pricing; £1.99 delivery or free delivery from £25; checkout retry protection; historical item prices; stock returned once on cancellation.
- Flyway database migrations, integration tests, Docker, Render demo blueprint and GitHub CI.

The primary customer and rider interfaces are in `qik-mobile/`, using native React Native screens and Expo Router, secure phone token storage, haptics and distinct app IDs/icons. The backend also retains web companion interfaces at `/#shop`, `/#admin` and `/#rider`. Signed APK/AAB/IPA installation files must be generated through the documented build/signing steps; they have not been produced or submitted to stores in this workspace.

## Run on a Mac — recommended Docker route

1. Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) and start it. No Java or Node installation is needed for this route.
2. Extract the source ZIP. Open Terminal, type `cd ` (with a trailing space), drag the extracted `QIK` folder into Terminal, then press Enter. You should be inside the folder containing this README.
3. Run:

```sh
chmod +x scripts/*.sh qik-backend/mvnw
./scripts/setup.sh
docker compose up --build
```

4. Wait for the Spring Boot “Started QikBackendApplication” line. Open **http://localhost:8080**.
5. Open the local `.env` file in your editor. Its `DEMO_PASSWORD` value is the password for all three demo accounts:

| Interface | Email | URL |
| --- | --- | --- |
| Customer | customer@qik.demo | http://localhost:8080/#shop |
| Admin | admin@qik.demo | http://localhost:8080/#admin |
| Rider | rider@qik.demo | http://localhost:8080/#rider |

Use separate browser profiles or private windows for the three roles. Login is stored per browser tab session. Customer baskets are stored in that browser's local storage. Keep `.env` private; never upload it to GitHub. Setup preserves an existing `.env` and never resets existing passwords.

Stop with Ctrl+C, then `docker compose down`. The named database volume keeps data between runs. **Do not use `docker compose down -v` unless you deliberately want to delete the demo database.** If port 5432 is busy, stop your existing local database, or change the host-side database port in compose. The app uses the internal Docker port regardless.

## Run on a Mac — Java locally, database in Docker

Install a Java 17 JDK (for example Eclipse Temurin) and start Docker Desktop. From the QIK folder:

```sh
chmod +x scripts/*.sh qik-backend/mvnw
./scripts/setup.sh
docker compose up -d db
./scripts/run-mac.sh
```

Open http://localhost:8080. Maven is supplied by the wrapper; first run downloads dependencies. Check `java -version` if Java is not found. There is no `npm install` step.

For an existing native PostgreSQL installation, create a **new database and dedicated login** matching the values in `.env`, then run `./scripts/run-mac.sh` without starting the Docker database. Do not point at an existing QIK database before reading the migration section.

## Try the whole experience

1. Customer: sign in, search for milk, choose a category, add products to the bag, change quantity and continue to checkout. Enter a test address and a UK postcode such as `SW1A 1AA`. Place the demo order.
2. Admin: open Dashboard → Orders. Start picking, assign a rider, then mark the order packed.
3. Rider: open Deliveries. Accept the assigned packed order, confirm pickup, then confirm delivery.
4. Customer: My orders shows the same order progressing. Order pages refresh about every 12 seconds when visible, or use Refresh.
5. Admin: Products → Stock changes availability. Products → Add product creates a new item. Categories and People manage the catalogue and team.
6. Place another order and cancel it before picking. Its stock returns. Try an out-of-stock item or a customer account opening an admin page; the API blocks invalid operations.

Delivery states are driven by the admin/rider actions above. They do not silently advance on a timer. The animated route is an illustration, not GPS. All prices and delivery fees are demo values, with no payment processed.

## Tests

With Java 17 installed, from QIK:

```sh
./qik-backend/mvnw -f qik-backend/pom.xml verify
node --check qik-backend/src/main/resources/static/app.js
```

Node 22 is only needed for the optional JavaScript syntax check. The Java integration tests use an isolated in-memory H2 database in PostgreSQL compatibility mode; they do not connect to or modify your PostgreSQL database. Tests cover real JWT login, registration always creating CUSTOMER, role restrictions, order ownership, complete delivery transitions, free-delivery calculations, historical prices, stock rollback, cancellation, repeated checkout and concurrent retries. See `VALIDATION.md` for the actual checks completed during delivery.

To exercise a running PostgreSQL-backed demo using real HTTP requests:

```sh
QIK_BASE_URL=http://localhost:8080 DEMO_PASSWORD='your-local-demo-password' python3 scripts/smoke-test.py
```

This creates a test customer and places/fulfils a simulated order using the demo admin and rider. It consumes two units of a demo product and leaves test records. Run it against a test database, not a database with real orders.

## Preserve an existing QIK database

The uploaded ZIP contains source, not your actual PostgreSQL data. This project's default is a new `qik` database. Original endpoints and entity names are retained. Flyway now manages schema creation and Hibernate validates rather than changing tables automatically.

For an existing database created by your original backend:

1. Stop the original backend and make a `pg_dump` backup. Restore it into a **separate test database** first.
2. Compare `users`, `categories` and `products` with `qik-backend/src/main/resources/db/migration/V1__qik_schema.sql`. Ensure email/name uniqueness, stock and price constraints, and enum values are compatible. Resolve differences on the test copy.
3. On that compatible test copy only, run the app once with these additional environment variables:

```sh
export SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
export SPRING_FLYWAY_BASELINE_VERSION=1
```

This marks the existing foundation as version 1 and applies order/schema-extension migrations. Do **not** edit an already-applied migration or use baseline to hide schema mismatches. Remove the baseline variables after the first successful migration. Verify login/catalogue and new checkout on the test copy before repeating the reviewed procedure on your backed-up original database.

## Make it live — temporary free demo on Render

The included `render.yaml` deploys the entire application and a PostgreSQL database. This is the easiest public demo because all interfaces and API share one HTTPS origin.

1. Create a GitHub repository, then upload the contents of this QIK folder. Include `Dockerfile`, `render.yaml`, `qik-backend`, `scripts` and `.github`. Exclude `.env`, `target`, local database files and test artifacts. If using Git, inspect `git status` before committing.
2. Create a [Render](https://render.com) account, connect that repository, and choose **New → Blueprint**. Select this repository and review `render.yaml`.
3. When prompted, set `JWT_SECRET` to the output of `openssl rand -base64 32`. Set `DEMO_PASSWORD` to a new unique password of at least 12 characters. These are dashboard secrets, not repository files. The database host, port, name, username and password are supplied by the blueprint.
4. Apply the blueprint. Wait for the Docker build, database migration and `/api/health` check to pass. Open the web service's `https://…onrender.com` URL.
5. Test customer checkout, admin preparation, rider delivery and order history on that live URL. Give demo staff passwords only to trusted testers. Admin can change any demo account's access.
6. Keep spend limits enabled and inspect current limits before sharing broadly. Set up a custom domain in Render only if you want one; the supplied subdomain and TLS are sufficient.

As checked on **13 October 2026**, Render offers free web services and PostgreSQL, but free services sleep after 15 idle minutes, the free database expires after 30 days, and free PostgreSQL has no backups. Usage overages can incur charges if a payment method is attached. This blueprint deliberately uses the free plans and is for a temporary demo. See [official free-plan limits](https://render.com/docs/free) and [current pricing](https://render.com/pricing). Upgrade or export the database before it expires. No indefinite zero-cost hosting is promised.

For a lasting installation, choose paid web/database plans based on their current pricing and memory needs. Database storage, backups, bandwidth, a custom domain, email/SMS, payment processing and app-store accounts may add costs. No paid plan or domain has been purchased by this project.

## Deploy without demo accounts

Orders remain simulated in this code. To run a private installation with your own accounts:

- Remove `SPRING_PROFILES_ACTIVE=demo` (use `default`) and `DEMO_PASSWORD` from the hosting settings.
- On the first startup set `QIK_ADMIN_EMAIL` and a unique 12+ character `QIK_ADMIN_PASSWORD`. The bootstrap creates this admin only if that email does not already exist. It never replaces an existing account or changes its password.
- Remove the bootstrap password from hosting settings after the admin is created. Sign in and create riders through People. Customers register normally. Add categories and products through the dashboard.
- Existing demo accounts do not disappear when the profile is turned off. Disable them through People using a different admin account, or start with a new database. Disabling or changing a role immediately invalidates that account's existing JWTs.

The Docker image can also be deployed on any host that runs Java 17/Docker with reachable PostgreSQL. Set `DATABASE_URL` to a JDBC URL such as `jdbc:postgresql://host:5432/qik?sslmode=require`, with `DATABASE_USER` and `DATABASE_PASSWORD` separately. Alternatively set `DATABASE_HOST`, `DATABASE_PORT`, and `DATABASE_NAME`. Set `JWT_SECRET` and `PORT`. Terminate HTTPS at the host's proxy. The container listens on port 8080 by default and runs as a non-root user.

## Security and real-commerce work

Already implemented: BCrypt passwords; signed/expiring JWTs with issuer validation; fixed CUSTOMER registration; server-enforced admin/rider permissions; database-backed checks for disabled accounts and changed roles; ownership checks; validated checkout inputs; stock locks and transactions; retry keys; migration-managed schema; password fields omitted from JSON; same-origin requests; restrictive Content Security Policy; safe text rendering and local illustration paths; secrets supplied through the environment. Web JWTs stay in session storage, not persistent local storage. The phone apps store their token with Expo SecureStore (iOS Keychain / Android Keystore). No credentials from the uploaded configuration are shipped.

Before accepting actual public customers, complete and verify:

- Rate limiting and login abuse controls at the ingress/application; admin MFA; password reset and email verification; proper account recovery and JWT revocation on password changes. Session storage still exposes tokens to any successful same-origin script injection, so keep CSP and dependencies controlled.
- HTTPS everywhere, database TLS as required by your provider, private database access, least-privilege database users, patching, monitored backups and tested restoration. Render's blueprint disables external database access.
- A payment provider with verified webhooks, idempotent payment/order reconciliation, refunds and cancellation policy. Do not collect card data yourself. The present application has no payment API.
- Actual delivery service areas and fees, live rider location with consent, delivery proof, contact/notification services, fulfilment failure handling, pagination and production load/concurrency testing.
- Accurate prices/tax/stock, product/allergen information, UK privacy/retention/access procedures, terms and customer support. Obtain appropriate legal/operational review for real UK retail; this source does not supply those policies.

## Source layout

```text
QIK/
  qik-mobile/           Native Android/iPhone customer and rider apps
  MOBILE.md            Phone setup, APK/iPhone builds and costs
  qik-backend/          Original Java project, extended
    src/main/java/     Auth, catalogue, checkout, staff and order APIs
    src/main/resources/
      static/          Customer/admin/rider UI and original SVG artwork
      db/migration/    Versioned PostgreSQL schema
    src/test/          Integration tests and isolated test config
  scripts/             Mac setup, local run and HTTP smoke test
  Dockerfile           Maven build with tests; non-root Java runtime
  docker-compose.yml   Local application + persisted PostgreSQL
  render.yaml          Temporary free public demo configuration
  .github/workflows/   Automated Java checks
  API.md               Endpoint and state reference
  VALIDATION.md        Delivery verification record
```

Frameworks/tools are free and open source. Artwork and UI code in this project are original. Maven dependencies retain their respective upstream licences. Your original backend authorship is preserved; choose a repository licence before publicly distributing your application.
