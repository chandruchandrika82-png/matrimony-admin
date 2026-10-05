import axios from "axios";
export const API_URL = process.env.REACT_APP_API_URL || "https://matrimony-backend-1-ri82.onrender.com/api";
const api = axios.create({ baseURL: API_URL, timeout: 30000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
