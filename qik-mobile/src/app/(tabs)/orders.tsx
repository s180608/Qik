import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router, Redirect } from "expo-router";
import {
  BrandHeader,
  Empty,
  Label,
  Muted,
  Notice,
  Screen,
  Title,
  styles,
  C,
} from "../../components/ui";
import { OrderCard } from "../../components/OrderCard";
import { useQik, riderApp } from "../../context/QikContext";
export default function Orders() {
  const { user, orders, ordersError, refreshOrders } = useQik();
  const [refreshing, setRefreshing] = useState(false);
  if (riderApp) return <Redirect href="/" />;
  async function refresh() {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={C.ink}
          />
        }
      >
        <BrandHeader />
        <Label>From our shelf to your doorstep</Label>
        <Title>Your little deliveries.</Title>
        <Muted>Follow every good thing, from picking to arrival.</Muted>
        {!user ? (
          <Empty
            title="Your deliveries live here."
            detail="Sign in to see your bags on their way."
            action="Sign in →"
            onPress={() => router.push("/auth")}
          />
        ) : (
          <>
            {Boolean(ordersError) && (
              <Notice message={ordersError} retry={() => void refresh()} />
            )}
            <ScrollView
              scrollEnabled={false}
              contentContainerStyle={{ paddingTop: 24 }}
            >
              {orders.length ? (
                orders.map((o) => <OrderCard key={o.id} order={o} />)
              ) : (
                <Empty
                  title="Your first QIK moment awaits."
                  detail="Make a little bag of everyday favourites."
                  action="Explore the shop →"
                  onPress={() => router.push("/")}
                />
              )}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
