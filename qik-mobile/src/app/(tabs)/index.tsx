import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  C,
  BrandHeader,
  Empty,
  FloatingTote,
  Illustration,
  Label,
  Muted,
  Notice,
  Screen,
  Title,
  styles,
  serif,
} from "../../components/ui";
import { OrderCard } from "../../components/OrderCard";
import { useQik, riderApp } from "../../context/QikContext";
import { money } from "../../lib/commerce";
import type { Product } from "../../lib/types";
export default function Home() {
  return riderApp ? <RiderHome /> : <ShopHome />;
}
function ShopHome() {
  const {
    products,
    categories,
    cart,
    adjust,
    refreshCatalog,
    catalogError,
    ready,
  } = useQik();
  const [category, setCategory] = useState<number | null>(null),
    [query, setQuery] = useState(""),
    [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const tileWidth = (width - 60) / 2;
  const filtered = products.filter(
    (p) =>
      (!category || p.category.id === category) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function refresh() {
    setRefreshing(true);
    await refreshCatalog();
    setRefreshing(false);
  }
  function productTile(p: Product) {
    const name = p.imageUrl?.match(/\/assets\/([a-z-]+)\.svg$/)?.[1] || "tote";
    const quantity = cart[p.id] || 0;
    return (
      <View style={[s.product, { width: tileWidth }]}>
        <View style={s.art}>
          <Illustration name={name} width={tileWidth - 20} height={132} />
          {p.stockQuantity === 0 && <Text style={s.tag}>BACK SOON</Text>}
        </View>
        <Text accessibilityRole="header" style={s.productName}>
          {p.name}
        </Text>
        <Text style={s.productDescription}>
          {p.description || "Everyday essential"}
        </Text>
        <View style={styles.row}>
          <Text style={s.price}>{money(p.price)}</Text>
          {quantity ? (
            <View style={s.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove one ${p.name}`}
                onPress={() => adjust(p, -1)}
                style={s.stepButton}
              >
                <Text style={s.plus}>−</Text>
              </Pressable>
              <Text style={{ color: C.ink, fontSize: 12 }}>{quantity}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add one ${p.name}`}
                onPress={() => adjust(p, 1)}
                style={s.stepButton}
              >
                <Text style={s.plus}>+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${p.name}`}
              disabled={!p.stockQuantity}
              onPress={() => adjust(p, 1)}
              style={[s.add, !p.stockQuantity && { opacity: 0.4 }]}
            >
              <Ionicons name="add" size={21} color={C.ink} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }
  return (
    <Screen>
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => productTile(item)}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        contentContainerStyle={{
          padding: 24,
          paddingTop: 0,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={C.ink}
          />
        }
        ListHeaderComponent={
          <>
            <BrandHeader />
            <View style={s.hero}>
              <Label>● A fresh take on the everyday</Label>
              <Text accessibilityRole="header" style={s.heroTitle}>
                Good things.{"\n"}
                <Text
                  style={{
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontWeight: "400",
                  }}
                >
                  Right here.
                </Text>
              </Text>
              <Text style={s.heroText}>
                Your fridge favourites and last-minute lifesavers. One little
                bag away.
              </Text>
              <View style={{ alignItems: "center", marginTop: 6 }}>
                <FloatingTote />
              </View>
              <View style={s.heroBadge}>
                <Text style={{ color: C.ink, fontWeight: "600", fontSize: 12 }}>
                  Freshly picked. Just for you.
                </Text>
              </View>
            </View>
            <View style={s.benefits}>
              <Text style={s.benefit}>♧ Freshness first</Text>
              <Text style={s.benefit}>↗ Free delivery over £25</Text>
            </View>
            <View style={{ marginTop: 27, marginBottom: 17 }}>
              <Label>A little bit of everything</Label>
              <Title>Your everyday,{"\n"}sorted.</Title>
              <Muted>The good stuff. Without the big shop.</Muted>
            </View>
            <View style={s.search}>
              <Ionicons name="search-outline" size={18} color={C.muted} />
              <TextInput
                accessibilityLabel="Search products"
                placeholder="Search your next craving…"
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
                placeholderTextColor={C.muted}
                style={{
                  flex: 1,
                  color: C.ink,
                  fontSize: 13,
                  paddingVertical: 13,
                }}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 17 }}
            >
              {[{ id: null, name: "All the good stuff" }, ...categories].map(
                (c) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === c.id }}
                    key={String(c.id)}
                    onPress={() => setCategory(c.id)}
                    style={[
                      s.chip,
                      category === c.id && {
                        backgroundColor: C.ink,
                        borderColor: C.ink,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: category === c.id ? C.white : C.ink,
                      }}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
            {Boolean(catalogError) && (
              <Notice message={catalogError} retry={() => void refresh()} />
            )}
          </>
        }
        ListEmptyComponent={
          !ready ? (
            <ActivityIndicator color={C.ink} style={{ padding: 40 }} />
          ) : !catalogError ? (
            <Empty
              title="No matches just yet."
              detail="Try another favourite or category."
            />
          ) : null
        }
        ListFooterComponent={
          <View style={s.story}>
            <Label>
              <Text style={{ color: C.lime }}>Less errands. More living.</Text>
            </Label>
            <Text
              style={{
                fontFamily: serif,
                color: C.white,
                fontSize: 24,
                marginBottom: 10,
              }}
            >
              The little shop that fits your day.
            </Text>
            <Text style={{ color: "#c9d9c9", fontSize: 12, lineHeight: 20 }}>
              Breakfast plans, dinner inspiration, or the milk you forgot. We’re
              here for the everyday moments.
            </Text>
            <Text style={{ color: "#b5c6a9", fontSize: 10, marginTop: 16 }}>
              Simulated shopping · no payment taken
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
function RiderHome() {
  const { user, orders, ordersError, refreshOrders } = useQik();
  const [refreshing, setRefreshing] = useState(false);
  const active = orders.filter(
    (o) => !["DELIVERED", "CANCELLED"].includes(o.status),
  );
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
        <Label>QIK rider</Label>
        <Title>
          Hey, {user?.firstName || "neighbour"}.{"\n"}
          <Text
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontWeight: "400",
            }}
          >
            Let’s make someone’s day.
          </Text>
        </Title>
        <Muted>Your assigned deliveries, all in one place.</Muted>
        {!user ? (
          <Empty
            title="Your next good deed awaits."
            detail="Sign in with the rider account created by your QIK admin."
            action="Rider sign in →"
            onPress={() => router.push("/auth")}
            icon="bicycle-outline"
          />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 12, marginVertical: 26 }}>
              {[
                [active.length, "Active deliveries"],
                [
                  orders.filter((o) => o.status === "DELIVERED").length,
                  "Delivered bags",
                ],
              ].map(([n, label]) => (
                <View
                  key={label}
                  style={[styles.panel, { flex: 1, marginBottom: 0 }]}
                >
                  <Text style={{ fontSize: 31, color: C.ink }}>{n}</Text>
                  <Muted>{label}</Muted>
                </View>
              ))}
            </View>
            <Text style={styles.heading}>Your route, sorted.</Text>
            {Boolean(ordersError) && (
              <Notice message={ordersError} retry={() => void refresh()} />
            )}
            {orders.length ? (
              orders.map((o) => <OrderCard order={o} key={o.id} />)
            ) : (
              <Empty
                title="A moment to catch your breath."
                detail="Your admin will assign deliveries here. Accept a packed order to begin."
                icon="bicycle-outline"
              />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
const s = StyleSheet.create({
  hero: {
    backgroundColor: C.sage,
    borderRadius: 28,
    padding: 25,
    paddingBottom: 17,
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -2.1,
    color: C.ink,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 14,
  },
  heroText: { color: "#62735d", fontSize: 13, lineHeight: 21, maxWidth: 245 },
  heroBadge: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    alignSelf: "flex-end",
    marginTop: -30,
    transform: [{ rotate: "-4deg" }],
  },
  benefits: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  benefit: { color: C.ink, fontSize: 10 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 23,
    paddingHorizontal: 17,
    minHeight: 44,
    justifyContent: "center",
  },
  product: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 19,
    padding: 10,
  },
  art: {
    backgroundColor: "#f4f5ee",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 141,
    overflow: "hidden",
  },
  tag: {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 8,
    padding: 5,
    backgroundColor: C.white,
    color: C.ink,
    borderRadius: 9,
  },
  productName: {
    color: C.ink,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 14,
    marginBottom: 4,
    minHeight: 34,
  },
  productDescription: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    minHeight: 30,
  },
  price: { fontWeight: "700", fontSize: 13, color: C.ink },
  add: {
    backgroundColor: C.lime,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.lime,
    borderRadius: 22,
  },
  stepButton: {
    height: 44,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { fontSize: 19, color: C.ink },
  story: {
    backgroundColor: C.ink,
    padding: 25,
    borderRadius: 22,
    marginTop: 25,
  },
});
