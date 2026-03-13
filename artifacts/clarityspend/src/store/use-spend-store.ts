import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExpenseCategory = 'Food' | 'Transportation' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

interface SpendState {
  budget: number | null;
  expenses: Expense[];
  setBudget: (amount: number) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  removeExpense: (id: string) => void;
  clearExpenses: () => void;
}

export const useSpendStore = create<SpendState>()(
  persist(
    (set) => ({
      budget: null,
      expenses: [],
      
      setBudget: (amount) => set({ budget: amount }),
      
      addExpense: (expense) => set((state) => ({
        expenses: [
          {
            ...expense,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
          },
          ...state.expenses,
        ],
      })),
      
      removeExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      })),
      
      clearExpenses: () => set({ expenses: [] }),
    }),
    {
      name: 'clarityspend-storage',
    }
  )
);
