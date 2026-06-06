import { create } from 'zustand';

export const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  theme: 'light',
  notifications: [],

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => { localStorage.setItem('token', token); set({ token, isAuthenticated: true }); },
  logout: () => { localStorage.removeItem('token'); set({ user: null, token: null, isAuthenticated: false }); },
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  addNotification: (notification) => set(state => ({ notifications: [...state.notifications, notification] })),
  clearNotifications: () => set({ notifications: [] }),
}));