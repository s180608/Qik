import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  BrandHeader,
  Button,
  Empty,
  Label,
  Muted,
  ScrollPage,
  Title,
  styles,
} from "../../components/ui";
import { useQik, riderApp } from "../../context/QikContext";
export default function Account() {
  const { user, demo, signOut, notify } = useQik();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await signOut();
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollPage>
      <BrandHeader />
      <Label>Your QIK space</Label>
      <Title>
        {user ? `Hello, ${user.firstName}.` : "Make yourself at home."}
      </Title>
      {user ? (
        <View style={[styles.panel, { marginTop: 20 }]}>
          <Text style={styles.text}>{user.email}</Text>
          <Muted>{riderApp ? "Neighbourhood rider" : "Customer account"}</Muted>
          <View style={styles.rule} />
          <Button
            secondary
            title="Sign out"
            loading={busy}
            onPress={() => void logout()}
          />
        </View>
      ) : (
        <Empty
          title={
            riderApp
              ? "Good deliveries start here."
              : "A good shop starts here."
          }
          detail={
            riderApp
              ? "Sign in with a rider account created by your admin."
              : "Sign in or create your customer account."
          }
          action="Sign in →"
          onPress={() => router.push("/auth")}
          icon="person-outline"
        />
      )}
      <View style={{ marginTop: 25 }}>
        <Text style={styles.heading}>A little about QIK.</Text>
        <Muted>
          Everyday essentials. A little quicker. This version uses simulated
          orders and deliveries: no payment, real dispatch or GPS tracking.
        </Muted>
        {demo && (
          <View style={{ marginTop: 20 }}>
            <Muted>
              {riderApp
                ? "Demo login: rider@qik.demo"
                : "Demo login: customer@qik.demo"}
              . Use your configured demo password.
            </Muted>
          </View>
        )}
      </View>
    </ScrollPage>
  );
}
