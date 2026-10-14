import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { request, ApiError } from "../lib/api";
import { tokenStore } from "../lib/storage";
import { changeQuantity, restoreBasket, basketLines } from "../lib/commerce";
import type {
  Product,
  Category,
  Cart,
  User,
  Order,
  OrderStatus,
} from "../lib/types";
export const riderApp =
  process.env.EXPO_PUBLIC_APP_VARIANT === "rider" ||
  (process.env.EXPO_PUBLIC_APP_VARIANT !== "customer" &&
    Constants.expoConfig?.extra?.variant === "rider");
interface QikState {
  ready: boolean;
  user: User | null;
  products: Product[];
  categories: Category[];
  cart: Cart;
  orders: Order[];
  demo: boolean;
  catalogError: string;
  ordersError: string;
  toast: string;
  notify: (message: string) => void;
  adjust: (product: Product, delta: number) => void;
  refreshCatalog: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  checkout: (address: string, postcode: string) => Promise<Order>;
  transition: (id: number, status: OrderStatus) => Promise<void>;
}
const Context = createContext<QikState | null>(null);
export function QikProvider({ children }: React.PropsWithChildren) {
  const [ready, setReady] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [products, setProducts] = useState<Product[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [cart, setCart] = useState<Cart>({}),
    [orders, setOrders] = useState<Order[]>([]),
    [demo, setDemo] = useState(false),
    [catalogError, setCatalogError] = useState(""),
    [ordersError, setOrdersError] = useState(""),
    [toast, setToast] = useState("");
  const token = useRef<string | null>(null),
    checkoutKey = useRef<string | null>(null),
    checkoutBusy = useRef(false),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);
  const invalidate = useCallback(async () => {
    token.current = null;
    setUser(null);
    setOrders([]);
    await tokenStore.remove();
  }, []);
  const call = useCallback(
    async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
      try {
        return await request<T>(path, token.current, method, body);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          token.current
        ) {
          await invalidate();
          notify("Your session ended. Please sign in again.");
        }
        throw error;
      }
    },
    [invalidate, notify],
  );
  const refreshCatalog = useCallback(async () => {
    try {
      const [ps, cs, config] = await Promise.all([
        request<Product[]>("/api/products"),
        request<Category[]>("/api/categories"),
        request<{ demo: boolean }>("/api/config"),
      ]);
      setProducts(ps);
      setCategories(cs);
      setDemo(config.demo);
      setCatalogError("");
    } catch (error) {
      setCatalogError((error as Error).message);
    }
  }, []);
  const refreshOrders = useCallback(async () => {
    if (!token.current) {
      setOrders([]);
      return;
    }
    try {
      setOrders(
        await call<Order[]>(riderApp ? "/api/rider/orders" : "/api/orders"),
      );
      setOrdersError("");
    } catch (error) {
      setOrdersError((error as Error).message);
    }
  }, [call]);
  useEffect(() => {
    let live = true;
    async function boot() {
      try {
        const [saved, bag, key] = await Promise.all([
          tokenStore.get(),
          AsyncStorage.getItem("qik-native-bag"),
          AsyncStorage.getItem("qik-checkout-key"),
        ]);
        checkoutKey.current = key;
        if (!live) return;
        setCart(restoreBasket(bag));
        token.current = saved;
        if (saved) {
          try {
            const me = await call<User>("/api/me");
            if (me.role !== (riderApp ? "RIDER" : "CUSTOMER"))
              await invalidate();
            else if (live) setUser(me);
          } catch (error) {
            if (error instanceof ApiError && error.status === 0)
              notify("Connect to QIK, then sign in to resume.");
          }
        }
        await refreshCatalog();
      } catch {
        notify("Couldn’t restore your session. Please sign in.");
      } finally {
        if (live) setReady(true);
      }
    }
    void boot();
    return () => {
      live = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [call, invalidate, notify, refreshCatalog]);
  useEffect(() => {
    if (ready)
      void AsyncStorage.setItem("qik-native-bag", JSON.stringify(cart)).catch(
        () => notify("Your bag could not be saved on this device."),
      );
  }, [cart, ready, notify]);
  useEffect(() => {
    if (!user) return;
    void refreshOrders();
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refreshOrders();
    }, 12000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refreshOrders();
        void refreshCatalog();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [user, refreshOrders, refreshCatalog]);
  const adjust = useCallback(
    (p: Product, delta: number) => {
      setCart((current) => {
        try {
          const next = changeQuantity(current, p, delta);
          checkoutKey.current = null;
          void AsyncStorage.removeItem("qik-checkout-key");
          return next;
        } catch (error) {
          queueMicrotask(() => notify((error as Error).message));
          return current;
        }
      });
      void Haptics.selectionAsync().catch(() => {});
    },
    [notify],
  );
  const signIn = useCallback(
    async (email: string, password: string) => {
      const login = await request<{ accessToken: string }>(
        "/api/auth/login",
        null,
        "POST",
        { email: email.trim(), password },
      );
      const me = await request<User>("/api/me", login.accessToken);
      if (me.role !== (riderApp ? "RIDER" : "CUSTOMER"))
        throw new Error(
          riderApp
            ? "Please use a rider account. Customers use the QIK shopping app."
            : "Please use a customer account. Staff use QIK Rider or the admin dashboard.",
        );
      await tokenStore.set(login.accessToken);
      token.current = login.accessToken;
      setUser(me);
      notify(`Welcome, ${me.firstName}.`);
    },
    [notify],
  );
  const register = useCallback(
    async (
      firstName: string,
      lastName: string,
      email: string,
      password: string,
    ) => {
      await request("/api/auth/register", null, "POST", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      await signIn(email, password);
    },
    [signIn],
  );
  const signOut = useCallback(async () => {
    await invalidate();
    notify("See you soon.");
  }, [invalidate, notify]);
  const checkout = useCallback(
    async (address: string, postcode: string) => {
      if (!user || user.role !== "CUSTOMER")
        throw new Error("Sign in with a customer account first.");
      if (checkoutBusy.current)
        throw new Error("Your order is already being submitted.");
      const lines = basketLines(cart, products);
      if (!lines.length)
        throw new Error("Add something good to your bag first.");
      checkoutBusy.current = true;
      checkoutKey.current ??= Crypto.randomUUID();
      try {
        await AsyncStorage.setItem("qik-checkout-key", checkoutKey.current);
        const order = await call<Order>("/api/orders", "POST", {
          address: address.trim(),
          postcode: postcode.trim().toUpperCase(),
          requestKey: checkoutKey.current,
          items: lines.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        });
        setCart({});
        checkoutKey.current = null;
        await AsyncStorage.multiRemove(["qik-checkout-key", "qik-native-bag"]);
        await Promise.all([refreshOrders(), refreshCatalog()]);
        notify("Your order is in. Good things are on their way.");
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        return order;
      } finally {
        checkoutBusy.current = false;
      }
    },
    [user, cart, products, call, refreshOrders, refreshCatalog, notify],
  );
  const transition = useCallback(
    async (id: number, status: OrderStatus) => {
      await call(`/api/orders/${id}/status`, "PATCH", { status });
      await Promise.all([refreshOrders(), refreshCatalog()]);
      notify(
        status === "DELIVERED"
          ? "A little delivery. A big difference."
          : "Order updated.",
      );
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    },
    [call, refreshOrders, refreshCatalog, notify],
  );
  return (
    <Context.Provider
      value={{
        ready,
        user,
        products,
        categories,
        cart,
        orders,
        demo,
        catalogError,
        ordersError,
        toast,
        notify,
        adjust,
        refreshCatalog,
        refreshOrders,
        signIn,
        register,
        signOut,
        checkout,
        transition,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useQik() {
  const value = useContext(Context);
  if (!value) throw new Error("QikProvider missing");
  return value;
}
