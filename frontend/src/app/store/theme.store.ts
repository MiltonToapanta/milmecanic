import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme() {
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
        get().applyTheme();
      },
      applyTheme() {
        document.documentElement.classList.toggle('dark', get().theme === 'dark');
      }
    }),
    { name: 'milmecanic-theme' }
  )
);
