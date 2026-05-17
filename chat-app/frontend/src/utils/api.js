import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL + "/api",
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("chat_token");
      localStorage.removeItem("chat_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;