import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import artwork from "../lib/illustrations.json";
import { useQik, riderApp } from "../context/QikContext";
export const C = {
  ink: "#183b2d",
  paper: "#faf9f5",
  lime: "#cbf278",
  muted: "#728075",
  line: "#e6e9e0",
  white: "#ffffff",
  sage: "#edf1e5",
  red: "#a33333",
};
export const serif = Platform.OS === "ios" ? "Georgia" : "serif";
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: Platform.OS !== "web",
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: Platform.OS !== "web",
          }).start()
        }
        style={[
          styles.button,
          secondary && styles.secondary,
          (disabled || loading) && { opacity: 0.55 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={secondary ? C.ink : C.white} />
        ) : (
          <Text style={[styles.buttonText, secondary && { color: C.ink }]}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
export function Label({ children }: React.PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Title({ children }: React.PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}
export function Muted({ children }: React.PropsWithChildren) {
  return <Text style={styles.muted}>{children}</Text>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#97a18c"
        style={styles.field}
        {...props}
      />
    </View>
  );
}
export function Illustration({
  name = "tote",
  width = 160,
  height = 140,
}: {
  name?: string;
  width?: number;
  height?: number;
}) {
  const xml = (artwork as Record<string, string>)[name] || artwork.tote;
  return (
    <View accessible={false} pointerEvents="none">
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  );
}
export function FloatingTote() {
  const [drift] = useState(() => new Animated.Value(0));
  const [reduce, setReduce] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (reduce) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: -7,
          duration: 2800,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [reduce, drift]);
  return (
    <Animated.View style={{ transform: [{ translateY: drift }] }}>
      <Illustration width={270} height={205} />
    </Animated.View>
  );
}
export function Screen({ children }: React.PropsWithChildren) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}
export function ScrollPage({ children }: React.PropsWithChildren) {
  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}
export function BrandHeader() {
  return (
    <View style={styles.brandHeader}>
      <Text style={styles.logo}>
        qik<Text style={{ color: "#8fac4b" }}>.</Text>
      </Text>
      <Text style={styles.headerTag}>
        {riderApp ? "NEIGHBOURHOOD RIDER" : "YOUR EVERYDAY, SORTED"}
      </Text>
    </View>
  );
}
export function Empty({
  title,
  detail,
  action,
  onPress,
  icon = "leaf-outline",
}: {
  title: string;
  detail: string;
  action?: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color="#90a565" />
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {title}
      </Text>
      <Muted>{detail}</Muted>
      {action && onPress && (
        <Button style={{ marginTop: 22 }} title={action} onPress={onPress} />
      )}
    </View>
  );
}
export function Notice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <View style={styles.notice}>
      <Text
        accessibilityRole="alert"
        style={{ color: C.red, fontSize: 13, lineHeight: 20 }}
      >
        {message}
      </Text>
      {retry && (
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ color: C.ink, fontWeight: "700" }}>Try again ↻</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Toast() {
  const { toast } = useQik();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progress, {
      toValue: toast ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [toast, progress]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: C.white, fontSize: 13, textAlign: "center" }}
      >
        {toast}
      </Text>
    </Animated.View>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  page: { padding: 24, paddingBottom: 38 },
  brandHeader: {
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontWeight: "900", fontSize: 42, letterSpacing: -2.4, color: C.ink },
  headerTag: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: C.muted,
    fontWeight: "700",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.ink,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 35,
    fontWeight: "600",
    letterSpacing: -1.7,
    lineHeight: 39,
    color: C.ink,
    marginBottom: 12,
  },
  muted: { fontSize: 13, lineHeight: 21, color: C.muted },
  button: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.ink,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  buttonText: { fontSize: 14, fontWeight: "700", color: C.white },
  secondary: { backgroundColor: C.sage },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.ink,
    marginBottom: 8,
  },
  field: {
    minHeight: 51,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    backgroundColor: C.white,
    color: C.ink,
    fontSize: 15,
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 22,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: -0.8,
    color: C.ink,
    textAlign: "center",
    marginTop: 14,
  },
  notice: {
    backgroundColor: "#f8eae4",
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
  },
  toast: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: C.ink,
    borderRadius: 18,
    padding: 16,
    elevation: 6,
    shadowColor: "#102a1c",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  panel: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 18 },
  heading: {
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: -0.7,
    color: C.ink,
    marginBottom: 9,
  },
  text: { color: C.ink, fontSize: 14, lineHeight: 22 },
});
