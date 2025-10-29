import { create } from 'zustand';
import type { Income, CreateIncomeData, UpdateIncomeData } from '@/types';
import { useBalanceStore } from '@/stores/balanceStore';

interface IncomeState {
  incomes: Income[];
  isLoading: boolean;
  error: string | null;
}

interface IncomeActions {
  fetchIncomes: () => Promise<void>;
  createIncome: (data: CreateIncomeData) => Promise<void>;
  updateIncome: (id: string, data: UpdateIncomeData) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

export const useIncomeStore = create<IncomeState & IncomeActions>()((set, get) => ({
  incomes: [],
  isLoading: false,
  error: null,

  fetchIncomes: async () => {
    set({ isLoading: true, error: null });
    try {
      // dummy generation
      const names = ['Sales Revenue','Service Income','Consulting Fees','Interest Income','Other Income'];
      const list: Income[] = Array.from({ length: 8 }, (_, i) => ({
        id: `inc-${i}`,
        date: new Date(Date.now() - Math.floor(Math.random()*90)*86400000),
        amount: 500000 + Math.floor(Math.random()*5000000),
        category: names[i % names.length],
        description: 'Dummy income',
        createdBy: 'admin-uid',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      }));
      set({ incomes: list, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch incomes', isLoading: false });
    }
  },

  createIncome: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const item: Income = {
        id: `inc-${Date.now()}`,
        date: data.date,
        amount: data.amount,
        category: data.category,
        description: data.description,
        createdBy: 'admin-uid',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      set(state => ({ incomes: [item, ...state.incomes], isLoading: false }));
      useBalanceStore.getState().applyIncomeDelta(item.amount);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to create income', isLoading: false });
    }
  },

  updateIncome: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const prev = get().incomes.find(i => i.id === id);
      set(state => ({ incomes: state.incomes.map(i => i.id === id ? { ...i, ...data, updatedAt: new Date() } : i), isLoading: false }));
      if (prev && typeof data.amount === 'number' && prev.isActive !== false) {
        const delta = data.amount - prev.amount;
        if (delta !== 0) useBalanceStore.getState().applyIncomeDelta(delta);
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update income', isLoading: false });
    }
  },

  deleteIncome: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const prev = get().incomes.find(i => i.id === id);
      set(state => ({ incomes: state.incomes.filter(i => i.id !== id), isLoading: false }));
      if (prev) useBalanceStore.getState().applyIncomeDelta(-prev.amount);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to delete income', isLoading: false });
    }
  },
}));


