import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: { email: boolean; push: boolean };
  language: 'en' | 'id';
  currency: 'IDR' | 'USD' | 'EUR';
  timezone: string;
  autoLogout: number; // minutes
  twoFactor: boolean;
}

interface SettingsState {
  settings: AppSettings;
}

interface SettingsActions {
  setSettings: (settings: AppSettings) => void;
  resetDefaults: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  notifications: { email: true, push: true },
  language: 'en',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  autoLogout: 30,
  twoFactor: false,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (settings) => set({ settings }),
      resetDefaults: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'settings-storage',
    }
  )
);



