import { create } from "zustand";
import api from "../utils/api";
import { initSocket, disconnectSocket } from "../utils/socket";

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("chat_user") || "null"),
  token: localStorage.getItem("chat_token") || null,
  isLoading: false,
  error: null,

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("chat_token", data.token);
      localStorage.setItem("chat_user", JSON.stringify(data.user));
      initSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || "Register failed", isLoading: false });
      return { success: false };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("chat_token", data.token);
      localStorage.setItem("chat_user", JSON.stringify(data.user));
      initSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || "Login failed", isLoading: false });
      return { success: false };
    }
  },

  logout: () => {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateUser: (user) => {
    localStorage.setItem("chat_user", JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
