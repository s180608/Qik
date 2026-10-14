import { test } from "node:test";
import assert from "node:assert/strict";
import {
  basketTotals,
  basketLines,
  changeQuantity,
  restoreBasket,
  validPostcode,
  riderNext,
} from "../src/lib/commerce.ts";
import type { Product } from "../src/lib/types.ts";
const milk: Product = {
  id: 1,
  name: "Oat milk",
  price: 1.85,
  stockQuantity: 3,
  category: { id: 1, name: "Dairy", active: true },
};
test("a two-unit basket matches the backend GBP delivery rule", () => {
  assert.deepEqual(basketTotals({ "1": 2 }, [milk]), {
    subtotal: 3.7,
    deliveryFee: 1.99,
    total: 5.69,
  });
});
test("free delivery begins at exactly £25 and an empty basket has no fee", () => {
  const product = { ...milk, price: 12.5 };
  assert.equal(basketTotals({ "1": 2 }, [product]).deliveryFee, 0);
  assert.equal(basketTotals({}, [milk]).total, 0);
  assert.equal(basketTotals({ "1": 1 }, [product]).deliveryFee, 1.99);
});
test("pence arithmetic avoids accumulated decimal rounding", () => {
  assert.equal(
    basketTotals({ "1": 3 }, [{ ...milk, price: 0.1 }]).subtotal,
    0.3,
  );
});
test("quantity controls cannot reserve more than available stock", () => {
  assert.throws(() => changeQuantity({ "1": 3 }, milk, 1), /available/);
  assert.deepEqual(changeQuantity({ "1": 1 }, milk, -1), {});
  assert.deepEqual(changeQuantity({}, milk, 1), { "1": 1 });
});
test("corrupt or tampered saved baskets recover safely", () => {
  assert.deepEqual(restoreBasket("invalid"), {});
  assert.deepEqual(restoreBasket("[]"), {});
  assert.deepEqual(restoreBasket('{"1":2,"2":0,"3":100,"bad":1,"4":"2"}'), {
    "1": 2,
  });
});
test("unavailable products are excluded from checkout lines", () => {
  assert.deepEqual(
    basketLines({ "1": 2, "99": 1 }, [milk]).map((l) => l.product.id),
    [1],
  );
});
test("UK postcode form accepts common shapes and rejects incomplete input", () => {
  for (const value of ["SW1A 1AA", "M1 1AE", "BS1 5TL", "GIR 0AA"])
    assert.equal(validPostcode(value), true);
  for (const value of ["London", "SW1A", "12345"])
    assert.equal(validPostcode(value), false);
});
test("rider buttons follow the API state contract and final orders have no action", () => {
  assert.equal(riderNext("READY"), "ACCEPTED");
  assert.equal(riderNext("ACCEPTED"), "OUT_FOR_DELIVERY");
  assert.equal(riderNext("OUT_FOR_DELIVERY"), "DELIVERED");
  for (const value of ["PLACED", "PICKING", "DELIVERED", "CANCELLED"] as const)
    assert.equal(riderNext(value), null);
});
