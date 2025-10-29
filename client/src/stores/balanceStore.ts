import { create } from 'zustand';
import type { BalanceSnapshot, Income, Reimbursement } from '@/types';

interface BalanceState extends BalanceSnapshot {}

interface BalanceActions {
  applyIncomeDelta: (amount: number) => void; // + when add active income, - when deactivate/edit reduce
  applyReimbursementDelta: (amount: number) => void; // - when paid, + when rollback from paid
  recalculate: (incomes: Income[], reimbursements: Reimbursement[]) => void;
}

export const useBalanceStore = create<BalanceState & BalanceActions>()((set, get) => ({
  openingBalance: 0,
  currentBalance: 0,
  lastUpdatedAt: new Date(),

  applyIncomeDelta: (amount) => {
    set({ currentBalance: get().currentBalance + amount, lastUpdatedAt: new Date() });
  },

  applyReimbursementDelta: (amount) => {
    set({ currentBalance: get().currentBalance + amount, lastUpdatedAt: new Date() });
  },

  recalculate: (incomes, reimbursements) => {
    const incomeSum = incomes.filter(i => i.isActive).reduce((s, i) => s + i.amount, 0);
    const paidSum = reimbursements.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
    set({ currentBalance: get().openingBalance + incomeSum - paidSum, lastUpdatedAt: new Date() });
  },
}));


