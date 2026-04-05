import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "https://api.loza.local",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
