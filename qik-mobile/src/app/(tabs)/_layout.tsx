import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../components/ui";
import { riderApp, useQik } from "../../context/QikContext";
export default function TabLayout() {
  const { cart } = useQik();
  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.paper, borderTopColor: C.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: riderApp ? "Deliveries" : "Shop",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name={riderApp ? "bicycle-outline" : "storefront-outline"}
              color={color}
              size={23}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Bag",
          href: riderApp ? null : undefined,
          tabBarBadge: count || undefined,
          tabBarBadgeStyle: { backgroundColor: C.lime, color: C.ink },
          tabBarIcon: ({ color }) => (
            <Ionicons name="bag-handle-outline" color={color} size={23} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          href: riderApp ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt-outline" color={color} size={23} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={23} />
          ),
        }}
      />
    </Tabs>
  );
}
