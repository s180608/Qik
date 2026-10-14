import { View, Text } from "react-native";
import { router, Redirect } from "expo-router";
import {
  C,
  BrandHeader,
  Button,
  Empty,
  Illustration,
  Label,
  Muted,
  ScrollPage,
  Title,
  styles,
} from "../../components/ui";
import { useQik, riderApp } from "../../context/QikContext";
import { basketLines, basketTotals, money } from "../../lib/commerce";
export default function Bag() {
  const { cart, products, adjust, user } = useQik();
  if (riderApp) return <Redirect href="/" />;
  const lines = basketLines(cart, products),
    total = basketTotals(cart, products);
  return (
    <ScrollPage>
      <BrandHeader />
      <Label>Good things inside</Label>
      <Title>Your little bag.</Title>
      {!lines.length ? (
        <Empty
          title="A little room for good things."
          detail="Add a few favourites to get started."
          action="Explore the shop →"
          onPress={() => router.push("/")}
          icon="bag-handle-outline"
        />
      ) : (
        <>
          <View style={{ marginTop: 14 }}>
            {lines.map(({ product: p, quantity }) => (
              <View
                key={p.id}
                style={[styles.panel, styles.row, { padding: 13 }]}
              >
                <Illustration
                  name={p.imageUrl?.match(/\/assets\/([a-z-]+)\.svg$/)?.[1]}
                  width={58}
                  height={66}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.text, { fontWeight: "600", fontSize: 12 }]}
                  >
                    {p.name}
                  </Text>
                  <Muted>{money(p.price)} each</Muted>
                  <Text style={{ fontSize: 10, color: C.muted }}>
                    {p.stockQuantity < quantity
                      ? "Stock changed. Reduce this quantity."
                      : ""}
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Button
                    secondary
                    title="+"
                    onPress={() => adjust(p, 1)}
                    style={{ width: 44 }}
                  />
                  <Text style={{ textAlign: "center", color: C.ink }}>
                    {quantity}
                  </Text>
                  <Button
                    secondary
                    title="−"
                    onPress={() => adjust(p, -1)}
                    style={{ width: 44 }}
                  />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.panel}>
            <View style={styles.row}>
              <Muted>Subtotal</Muted>
              <Text style={styles.text}>{money(total.subtotal)}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Muted>Delivery</Muted>
              <Text style={styles.text}>
                {total.deliveryFee ? money(total.deliveryFee) : "On us"}
              </Text>
            </View>
            <View style={styles.rule} />
            <View style={styles.row}>
              <Text style={styles.heading}>Total</Text>
              <Text style={styles.heading}>{money(total.total)}</Text>
            </View>
            <Muted>
              {total.subtotal < 25
                ? `${money(25 - total.subtotal)} away from free delivery.`
                : "A good shop deserves free delivery."}
            </Muted>
          </View>
          <Button
            title={user ? "Continue to checkout →" : "Sign in to checkout →"}
            onPress={() => router.push(user ? "/checkout" : "/auth")}
          />
          <View style={{ marginTop: 16 }}>
            <Muted>
              Simulated shopping. No payment is taken. Final prices and stock
              are checked by QIK at checkout.
            </Muted>
          </View>
        </>
      )}
    </ScrollPage>
  );
}
