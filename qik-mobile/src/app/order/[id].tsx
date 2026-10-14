import { RefreshControl, ScrollView } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  Button,
  Empty,
  Label,
  Notice,
  Title,
  styles,
} from "../../components/ui";
import { OrderCard } from "../../components/OrderCard";
import { useQik } from "../../context/QikContext";
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, user, refreshOrders, ordersError } = useQik();
  const [refreshing, setRefreshing] = useState(false);
  const order = orders.find((o) => o.id === Number(id));
  async function refresh() {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
        />
      }
    >
      <Label>From our shelf to your doorstep</Label>
      <Title>Your good things.</Title>
      {Boolean(ordersError) && (
        <Notice message={ordersError} retry={() => void refresh()} />
      )}
      {order ? (
        <OrderCard order={order} detail />
      ) : (
        <Empty
          title={
            user
              ? "This bag is taking a little moment."
              : "Your QIK space awaits."
          }
          detail={
            user
              ? "Pull down to refresh your orders."
              : "Sign in to view this delivery."
          }
          action={user ? "Refresh orders" : "Sign in →"}
          onPress={() => (user ? void refresh() : router.push("/auth"))}
        />
      )}
      <Button
        secondary
        title="Back to QIK →"
        onPress={() => router.replace("/")}
      />
    </ScrollView>
  );
}
