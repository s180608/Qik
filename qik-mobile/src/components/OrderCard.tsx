import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, Button, Label, Muted, styles } from "./ui";
import { money, labels, steps, riderNext } from "../lib/commerce";
import type { Order } from "../lib/types";
import { useQik, riderApp } from "../context/QikContext";
export function OrderCard({
  order,
  detail = false,
}: {
  order: Order;
  detail?: boolean;
}) {
  const { transition, notify } = useQik();
  const [busy, setBusy] = useState(false);
  const next = riderApp ? riderNext(order.status) : null;
  async function update() {
    if (!next) return;
    setBusy(true);
    try {
      await transition(order.id, next);
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function cancel() {
    Alert.alert(
      "Cancel this little bag?",
      "Reserved stock will be returned. No money has been taken.",
      [
        { text: "Keep order", style: "cancel" },
        {
          text: "Cancel order",
          style: "destructive",
          onPress: () => {
            setBusy(true);
            void transition(order.id, "CANCELLED")
              .catch((error) => notify(error.message))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }
  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <View>
          <Label>{riderApp ? "Your next good deed" : "QIK order"}</Label>
          <Text style={s.orderTitle}>#{String(order.id).padStart(4, "0")}</Text>
        </View>
        <Text
          style={[
            s.badge,
            order.status === "DELIVERED" && { backgroundColor: C.lime },
            order.status === "CANCELLED" && {
              backgroundColor: "#f8eae4",
              color: C.red,
            },
          ]}
        >
          {labels[order.status]}
        </Text>
      </View>
      {order.status !== "CANCELLED" && (
        <View style={s.timeline}>
          {steps.map((step, index) => (
            <View key={step} style={s.step}>
              <View
                style={[
                  s.bar,
                  steps.indexOf(order.status) >= index && {
                    backgroundColor: "#9ccb50",
                  },
                ]}
              />
              <Text style={s.stepText}>{labels[step]}</Text>
            </View>
          ))}
        </View>
      )}
      {detail && order.status === "OUT_FOR_DELIVERY" && (
        <View style={s.map}>
          <View style={s.route} />
          <Ionicons name="storefront" size={29} color={C.ink} />
          <Ionicons name="bicycle" size={35} color={C.ink} />
          <Ionicons name="home" size={29} color="#7f9e4a" />
          <Text style={s.mapCaption}>Illustrated demo route · no live GPS</Text>
        </View>
      )}
      <View
        style={[styles.row, { alignItems: "flex-start", marginVertical: 16 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.text}>{order.address}</Text>
          <Muted>{order.postcode}</Muted>
          <Muted>
            {order.rider
              ? `Your rider: ${order.rider.firstName}`
              : "Rider assignment pending"}
          </Muted>
        </View>
        <Text style={s.price}>{money(order.total)}</Text>
      </View>
      {detail ? (
        <View>
          {order.items.map((item) => (
            <View
              key={item.productId}
              style={[styles.row, { marginVertical: 5 }]}
            >
              <Text style={[styles.text, { flex: 1 }]}>
                {item.quantity} × {item.name}
              </Text>
              <Text style={styles.text}>
                {money(Number(item.unitPrice) * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.rule} />
          <View style={styles.row}>
            <Muted>Delivery</Muted>
            <Text style={styles.text}>
              {Number(order.deliveryFee) ? money(order.deliveryFee) : "On us"}
            </Text>
          </View>
        </View>
      ) : (
        <Muted>
          {order.items.map((i) => `${i.quantity} × ${i.name}`).join(" · ")}
        </Muted>
      )}
      {next && (
        <Button
          loading={busy}
          style={{ marginTop: 20 }}
          title={
            {
              ACCEPTED: "Accept delivery →",
              OUT_FOR_DELIVERY: "Picked up · Start delivery →",
              DELIVERED: "Confirm delivered →",
            }[next as "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED"]
          }
          onPress={() => void update()}
        />
      )}
      {!riderApp && order.status === "PLACED" && (
        <Button
          secondary
          loading={busy}
          style={{ marginTop: 16 }}
          title="Cancel order"
          onPress={cancel}
        />
      )}
      {!detail && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View order ${order.id}`}
          onPress={() =>
            router.push({ pathname: "/order/[id]", params: { id: order.id } })
          }
          style={{ paddingVertical: 15 }}
        >
          <Text style={{ color: C.ink, fontWeight: "600", fontSize: 13 }}>
            View your delivery ↗
          </Text>
        </Pressable>
      )}
      <Text style={s.caption}>Simulated order · no payment taken</Text>
    </View>
  );
}
const s = StyleSheet.create({
  orderTitle: { fontSize: 20, color: C.ink, fontWeight: "600" },
  badge: {
    backgroundColor: C.sage,
    color: C.ink,
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  timeline: { flexDirection: "row", gap: 4, marginTop: 24 },
  step: { flex: 1 },
  bar: { height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 7 },
  stepText: { fontSize: 8, color: C.muted },
  price: { fontSize: 19, fontWeight: "600", color: C.ink },
  caption: { fontSize: 10, color: C.muted, marginTop: 12 },
  map: {
    height: 156,
    backgroundColor: C.sage,
    borderRadius: 17,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  route: {
    position: "absolute",
    left: 50,
    right: 50,
    top: 74,
    borderTopWidth: 3,
    borderStyle: "dashed",
    borderColor: "#abc77d",
  },
  mapCaption: {
    position: "absolute",
    bottom: 10,
    left: 15,
    color: C.muted,
    fontSize: 9,
  },
});
