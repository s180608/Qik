import { Platform } from "react-native";
const configured = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = (
  configured ||
  (Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080")
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  token?: string | null,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data: { message?: string } = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      /* HTML/proxy errors use the fallback. */
    }
    if (!response.ok)
      throw new ApiError(
        data.message ||
          (response.status === 401
            ? "Please sign in again."
            : response.status === 403
              ? "This account cannot perform that action."
              : `Something paused (${response.status}). Try again.`),
        response.status,
      );
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "We couldn’t reach QIK. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}
