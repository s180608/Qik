import type { Cart, Product, OrderStatus } from "./types.ts";
export const steps: OrderStatus[] = [
  "PLACED",
  "PICKING",
  "READY",
  "ACCEPTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
export const labels: Record<OrderStatus, string> = {
  PLACED: "Order in",
  PICKING: "Picking",
  READY: "Packed",
  ACCEPTED: "Rider ready",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
export function money(value: number) {
  return `£${Number(value).toFixed(2)}`;
}
export function validPostcode(value: string) {
  return /^(?:GIR ?0AA|[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})$/i.test(
    value.trim(),
  );
}
export function basketLines(cart: Cart, products: Product[]) {
  return Object.entries(cart).flatMap(([id, quantity]) => {
    const product = products.find((p) => p.id === Number(id));
    return product && Number.isInteger(quantity) && quantity > 0
      ? [{ product, quantity }]
      : [];
  });
}
export function basketTotals(cart: Cart, products: Product[]) {
  const subtotalPence = basketLines(cart, products).reduce(
    (total, line) =>
      total + Math.round(Number(line.product.price) * 100) * line.quantity,
    0,
  );
  const deliveryPence = subtotalPence === 0 || subtotalPence >= 2500 ? 0 : 199;
  return {
    subtotal: subtotalPence / 100,
    deliveryFee: deliveryPence / 100,
    total: (subtotalPence + deliveryPence) / 100,
  };
}
export function changeQuantity(
  cart: Cart,
  product: Product,
  delta: number,
): Cart {
  const quantity = (cart[product.id] || 0) + delta;
  if (quantity > Math.min(99, product.stockQuantity))
    throw new Error("That’s all we have available right now.");
  const next = { ...cart };
  if (quantity <= 0) delete next[product.id];
  else next[product.id] = quantity;
  return next;
}
export function restoreBasket(raw: string | null): Cart {
  try {
    const value = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([id, quantity]) =>
          /^\d+$/.test(id) &&
          typeof quantity === "number" &&
          Number.isInteger(quantity) &&
          quantity > 0 &&
          quantity <= 99,
      ),
    ) as Cart;
  } catch {
    return {};
  }
}
export function riderNext(status: OrderStatus): OrderStatus | null {
  return (
    (
      {
        READY: "ACCEPTED",
        ACCEPTED: "OUT_FOR_DELIVERY",
        OUT_FOR_DELIVERY: "DELIVERED",
      } as Partial<Record<OrderStatus, OrderStatus>>
    )[status] || null
  );
}
