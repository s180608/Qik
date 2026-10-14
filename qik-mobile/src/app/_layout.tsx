import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QikProvider } from "../context/QikContext";
import { C, Toast } from "../components/ui";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QikProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.paper },
            headerTintColor: C.ink,
            headerShadowVisible: false,
            headerBackTitle: "Back",
            contentStyle: { backgroundColor: C.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth"
            options={{ title: "Your QIK account", presentation: "modal" }}
          />
          <Stack.Screen
            name="checkout"
            options={{ title: "One last little thing" }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{ title: "Your delivery" }}
          />
        </Stack>
        <Toast />
      </QikProvider>
    </SafeAreaProvider>
  );
}
