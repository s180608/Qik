import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const key = "qik-native-token";
// Web is a QA preview only. Phone credentials use Keychain / Keystore.
export const tokenStore = {
  get: async () =>
    Platform.OS === "web"
      ? sessionStorage.getItem(key)
      : SecureStore.getItemAsync(key),
  set: async (value: string) => {
    if (Platform.OS === "web") sessionStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  remove: async () => {
    if (Platform.OS === "web") sessionStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
