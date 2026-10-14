import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import {
  Button,
  Field,
  Label,
  Muted,
  Notice,
  Title,
  styles,
} from "../components/ui";
import { useQik, riderApp } from "../context/QikContext";
import { basketTotals, money, validPostcode } from "../lib/commerce";
export default function Checkout() {
  const { user, cart, products, checkout } = useQik();
  const [address, setAddress] = useState(""),
    [postcode, setPostcode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (riderApp) return <Redirect href="/" />;
  if (!user) return <Redirect href="/auth" />;
  const total = basketTotals(cart, products);
  async function place() {
    setError("");
    if (!address.trim() || !validPostcode(postcode)) {
      setError("Enter your delivery address and a valid UK postcode.");
      return;
    }
    setBusy(true);
    try {
      const order = await checkout(address, postcode);
      router.replace({ pathname: "/order/[id]", params: { id: order.id } });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <Label>One last little thing</Label>
        <Title>Let’s get you sorted.</Title>
        <Muted>Your good things need somewhere to land.</Muted>
        <View style={{ marginTop: 30 }}>
          <Field
            label="Delivery address"
            placeholder="Flat and street address"
            value={address}
            onChangeText={setAddress}
            autoComplete="street-address"
            maxLength={200}
          />
          <Field
            label="UK postcode"
            placeholder="SW1A 1AA"
            value={postcode}
            onChangeText={setPostcode}
            autoCapitalize="characters"
            autoComplete="postal-code"
            maxLength={9}
          />
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
          </View>
          <Muted>
            Simulated checkout. No card needed and no money is taken. Your admin
            will prepare this bag and assign a demo rider.
          </Muted>
          {Boolean(error) && <Notice message={error} />}
          <Button
            style={{ marginTop: 25 }}
            title="Place demo order →"
            loading={busy}
            disabled={!total.subtotal}
            onPress={() => void place()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
