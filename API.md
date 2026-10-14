# QIK API

Use `Content-Type: application/json` for JSON bodies and `Authorization: Bearer <accessToken>` for authenticated requests. Original auth/catalogue routes remain available.

| Method / path | Access | Purpose |
| --- | --- | --- |
| POST /api/auth/register | Public | firstName, lastName, email, password (8+), phoneNumber; always CUSTOMER |
| POST /api/auth/login | Public | email, password → accessToken, tokenType, expiresIn |
| GET /api/health | Public | Startup/host health |
| GET /api/config | Public | Demo/simulation flags, GBP |
| GET /api/me | Signed in | Own account; no password |
| GET /api/categories | Public | Active categories |
| GET /api/products?categoryId=… | Public | Active products in active categories |
| GET /api/products/search?keyword=… | Public | Case-insensitive name search |
| GET /api/products/{id} | Public | Active product |
| GET /api/admin/products | ADMIN | All products including archived |
| POST /api/admin/products | ADMIN | name, description, price, imageUrl, stockQuantity, categoryId |
| PUT /api/admin/products/{id} | ADMIN | Same product body |
| PATCH /api/admin/products/{id}/stock | ADMIN | stockQuantity |
| DELETE /api/admin/products/{id} | ADMIN | Archive without deleting historical data |
| GET /api/admin/categories | ADMIN | All categories |
| POST /api/admin/categories | ADMIN | name, description, imageUrl |
| PUT /api/admin/categories/{id} | ADMIN | name, description, active |
| GET /api/admin/users | ADMIN | Customers and staff; no passwords |
| POST /api/admin/users | ADMIN | firstName, lastName, email, password (12+), role |
| PATCH /api/admin/users/{id} | ADMIN | role, active; cannot modify own access |
| POST /api/orders | CUSTOMER | Checkout body below |
| GET /api/orders | Signed in | Own customer orders |
| PATCH /api/orders/{id}/status | Role/ownership checked | status |
| GET /api/admin/orders | ADMIN | All orders |
| PATCH /api/admin/orders/{id}/rider | ADMIN | riderId (active RIDER) |
| GET /api/rider/orders | RIDER | Assigned orders only |

```json
{
  "address": "12 Example Street",
  "postcode": "SW1A 1AA",
  "requestKey": "unique-uuid-per-checkout",
  "items": [{"productId": 1, "quantity": 2}]
}
```

Reuse the requestKey only when retrying the same checkout. The key is unique per customer; a retry returns the already-created order. Checkout ignores client prices, rejects duplicate product lines, permits 1–99 per line and up to 50 lines, and reserves stock atomically. All money uses GBP decimal values. Simulated orders are flagged `simulated: true`.

Allowed state transitions:

```text
CUSTOMER: PLACED → CANCELLED (own order only)
ADMIN:    PLACED → PICKING → READY
ADMIN:    PLACED / PICKING / READY → CANCELLED
RIDER:    READY → ACCEPTED → OUT_FOR_DELIVERY → DELIVERED (assigned rider only)
```

Admin can assign/reassign a rider only before acceptance. Cancellation returns reserved stock once. Delivered and cancelled orders are final. Item names and prices are captured at checkout so catalogue changes do not rewrite history.

Responses: 400 invalid input; 401 unauthenticated/expired/disabled/role-changed account; 403 wrong role/ownership; 404 missing product/order; 409 stock, duplicate-record or state conflict. Validation and domain errors have a `message` field. No CORS is required because frontend and backend share an origin.
