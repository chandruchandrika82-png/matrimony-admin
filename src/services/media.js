import { API_URL } from "./api";
export function memberMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, new URL(API_URL).origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
